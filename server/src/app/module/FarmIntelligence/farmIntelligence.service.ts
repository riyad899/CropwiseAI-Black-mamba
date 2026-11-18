// ─── Farm Intelligence Service ──────────────────────────────────────
// Directly queries the 2-year continuous environmental & satellite database
// (Neon PostgreSQL) and computes risk indicators from the returned data.

import type {
    IDistrictSummary,
    IFarmIntelligenceOverview,
    ITimeseriesResponse,
    IDistrictBaseline,
    IDailyRecord,
} from "./farmIntelligence.interface.js";
import { GeospatialDb } from "../../lib/geospatialDb.js";

// ─── Risk scoring helpers ───────────────────────────────────────────

function computeDroughtRisk(wdi: number, soilMoisture: number): "low" | "moderate" | "high" | "extreme" {
    const score = wdi * 60 + (1 - soilMoisture / 100) * 40;
    if (score > 65) return "extreme";
    if (score > 45) return "high";
    if (score > 25) return "moderate";
    return "low";
}

function computeWaterStress(wdi: number, precipMm: number): "low" | "moderate" | "high" | "extreme" {
    // Low precip + high WDI = stress
    const annualPrecipNorm = precipMm / 730; // rough daily avg
    if (wdi > 0.5 && annualPrecipNorm < 4) return "extreme";
    if (wdi > 0.35 && annualPrecipNorm < 5) return "high";
    if (wdi > 0.2) return "moderate";
    return "low";
}

function computeHeatStress(maxTemp: number, extremeDays: number): "low" | "moderate" | "high" | "extreme" {
    if (extremeDays > 30 || maxTemp > 42) return "extreme";
    if (extremeDays > 15 || maxTemp > 39) return "high";
    if (extremeDays > 5 || maxTemp > 36) return "moderate";
    return "low";
}

function computeVegetationHealth(meanNdvi: number): "poor" | "fair" | "good" | "excellent" {
    if (meanNdvi >= 0.6) return "excellent";
    if (meanNdvi >= 0.45) return "good";
    if (meanNdvi >= 0.3) return "fair";
    return "poor";
}

function computeSoilHealth(pH: number, soc: number, nitrogen: number): "poor" | "fair" | "good" | "excellent" {
    let score = 0;
    // pH: ideal 6.0–7.0
    if (pH >= 6.0 && pH <= 7.0) score += 40;
    else if (pH >= 5.5 && pH <= 7.5) score += 25;
    else score += 10;

    // SOC: higher is better
    if (soc > 20) score += 30;
    else if (soc > 12) score += 20;
    else score += 10;

    // Nitrogen
    if (nitrogen > 1.5) score += 30;
    else if (nitrogen > 1.0) score += 20;
    else score += 10;

    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "fair";
    return "poor";
}

function riskToNumber(risk: string): number {
    const map: Record<string, number> = {
        low: 85, moderate: 60, high: 35, extreme: 15,
        excellent: 90, good: 70, fair: 45, poor: 20,
    };
    return map[risk] ?? 50;
}

function computeNdviTrend(data: Array<{ ndvi: number }>): "declining" | "stable" | "improving" {
    if (data.length < 60) return "stable";
    const firstQ = data.slice(0, Math.floor(data.length / 4));
    const lastQ = data.slice(-Math.floor(data.length / 4));
    const avgFirst = firstQ.reduce((s, d) => s + d.ndvi, 0) / firstQ.length;
    const avgLast = lastQ.reduce((s, d) => s + d.ndvi, 0) / lastQ.length;
    const diff = avgLast - avgFirst;
    if (diff > 0.03) return "improving";
    if (diff < -0.03) return "declining";
    return "stable";
}

function computePrecipTrend(data: Array<{ precipitation_mm: number }>): "below_normal" | "normal" | "above_normal" {
    const total = data.reduce((s, d) => s + d.precipitation_mm, 0);
    const dailyAvg = total / data.length;
    // Bangladesh avg ~6-7mm/day
    if (dailyAvg > 7.5) return "above_normal";
    if (dailyAvg < 4.5) return "below_normal";
    return "normal";
}

function computeTempTrend(data: Array<{ surface_temperature_celsius: number }>): "cooling" | "stable" | "warming" {
    if (data.length < 60) return "stable";
    const firstQ = data.slice(0, Math.floor(data.length / 4));
    const lastQ = data.slice(-Math.floor(data.length / 4));
    const avgFirst = firstQ.reduce((s, d) => s + d.surface_temperature_celsius, 0) / firstQ.length;
    const avgLast = lastQ.reduce((s, d) => s + d.surface_temperature_celsius, 0) / lastQ.length;
    const diff = avgLast - avgFirst;
    if (diff > 1.0) return "warming";
    if (diff < -1.0) return "cooling";
    return "stable";
}

// ─── Public Service Methods ──────────────────────────────────────────

async function getOverview(district: string, dateFrom = "2024-01-01", dateTo = "2025-12-31"): Promise<IFarmIntelligenceOverview> {
    const [summary, records] = await Promise.all([
        GeospatialDb.getDistrictSummary(district, dateFrom, dateTo),
        GeospatialDb.getDailyRecords({ districtName: district, dateFrom, dateTo }),
    ]);

    const a = summary.two_year_analytics;
    const b = summary.baseline_context;

    const droughtRisk = computeDroughtRisk(a.mean_water_deficit_index, a.mean_soil_moisture_pct);
    const waterStress = computeWaterStress(a.mean_water_deficit_index, a.total_precipitation_mm);
    const heatStress = computeHeatStress(a.max_surface_temperature_c, a.extreme_heat_days_count);
    const vegetationHealth = computeVegetationHealth(a.mean_ndvi);
    const soilHealth = computeSoilHealth(b.soil_ph_0_5cm, b.soil_soc_g_kg, b.soil_nitrogen_g_kg);

    const scores = [droughtRisk, waterStress, heatStress, vegetationHealth, soilHealth].map(riskToNumber);
    const overallScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

    return {
        summary: summary as unknown as IDistrictSummary,
        riskIndicators: {
            droughtRisk,
            waterStress,
            heatStress,
            vegetationHealth,
            soilHealth,
            overallScore,
        },
        recentTrends: {
            ndviTrend: computeNdviTrend(records),
            precipTrend: computePrecipTrend(records),
            tempTrend: computeTempTrend(records),
        },
    };
}

async function getTimeseries(district: string, dateFrom = "2024-01-01", dateTo = "2025-12-31"): Promise<ITimeseriesResponse> {
    const records = await GeospatialDb.getDailyRecords({
        districtName: district,
        dateFrom,
        dateTo,
    });

    return {
        source: "Neon PostgreSQL - 2-Year Continuous Dataset (2024–2025)",
        district,
        date_from: dateFrom,
        date_to: dateTo,
        period: { date_from: dateFrom, date_to: dateTo },
        total_days: records.length,
        total_records: records.length,
        timeseries: records as unknown as IDailyRecord[],
        data: records as unknown as IDailyRecord[],
    };
}

async function getDistricts(): Promise<{ source: string; total_districts: number; data: IDistrictBaseline[] }> {
    const districts = await GeospatialDb.getDistricts();
    return {
        source: "Neon PostgreSQL - Bangladesh Geospatial Intelligence Suite",
        total_districts: districts.length,
        data: districts as unknown as IDistrictBaseline[],
    };
}

async function getDailyData(params: {
    district?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
}): Promise<unknown> {
    return GeospatialDb.getDailyDataPaginated(params);
}

async function getSatelliteData(params: {
    lat: number;
    lon: number;
    dateFrom?: string;
    dateTo?: string;
    dataset?: string;
}): Promise<unknown> {
    const { lat, lon, dateFrom = "2024-01-01", dateTo = "2025-12-31", dataset = "all" } = params;

    const nearest = await GeospatialDb.getNearestDistrict(lat, lon);
    if (!nearest) {
        throw new Error("No district found near the provided coordinates");
    }

    const records = await GeospatialDb.getDailyRecords({
        districtName: nearest.name,
        dateFrom,
        dateTo,
    });

    return {
        source: "Neon PostgreSQL - 2-Year Continuous Dataset",
        dataset,
        matched_district: nearest.name,
        district_coordinates: { latitude: nearest.latitude, longitude: nearest.longitude },
        query_coordinates: { latitude: lat, longitude: lon },
        baseline: nearest,
        total_records: records.length,
        records,
    };
}

export const FarmIntelligenceService = {
    getOverview,
    getTimeseries,
    getDistricts,
    getDailyData,
    getSatelliteData,
};
