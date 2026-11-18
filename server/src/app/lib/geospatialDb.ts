import "dotenv/config";
import pkg from "pg";
const { Pool, types } = pkg;

// Ensure PostgreSQL DATE type (OID 1082) is parsed directly as "YYYY-MM-DD" string
types.setTypeParser(1082, (val: string) => val);

export interface IDistrictRow {
  id: number;
  name: string;
  division: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_deg: number;
  aspect_deg: number;
  erosion_slope_index: number;
  soil_ph_0_5cm: number;
  soil_clay_pct: number;
  soil_sand_pct: number;
  soil_silt_pct: number;
  soil_soc_g_kg: number;
  soil_nitrogen_g_kg: number;
  canopy_height_m: number | null;
  biomass_density_mg_ha: number | null;
  created_at?: Date;
}

export interface IDailyRecordRow {
  id: number;
  district_id?: number;
  district_name: string;
  date: string;
  year: number;
  month: number;
  day: number;
  day_of_year: number;
  latitude: number;
  longitude: number;
  ndvi: number;
  evi: number;
  evapotranspiration_mm: number;
  potential_et_mm: number;
  water_deficit_index: number;
  surface_temperature_celsius: number;
  precipitation_mm: number;
  soil_moisture_pct: number;
  vegetation_condition_index: number;
  thermal_stress_index: number;
  created_at?: Date;
}

export interface IDistrictAnalyticsSummary {
  total_days_recorded: number;
  mean_ndvi: number;
  max_ndvi: number;
  min_ndvi: number;
  mean_evi: number;
  cumulative_et_mm: number;
  total_precipitation_mm: number;
  mean_water_deficit_index: number;
  mean_surface_temperature_c: number;
  max_surface_temperature_c: number;
  mean_soil_moisture_pct: number;
  extreme_heat_days_count: number;
  severe_water_stress_days_count: number;
}

const DEFAULT_GEOSPATIAL_DB_URL =
  "postgresql://neondb_owner:npg_5JbCaleG3AYj@ep-damp-field-bem9ck9e-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require";

const connectionString =
  process.env.GEOSPATIAL_DATABASE_URL ||
  process.env.DATABASE_URL_GEOSPATIAL ||
  DEFAULT_GEOSPATIAL_DB_URL;

export const geospatialPool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export class GeospatialDb {
  /**
   * Retrieves all 18 districts with static baseline soil, terrain, and forest metrics
   */
  static async getDistricts(): Promise<IDistrictRow[]> {
    const query = `
      SELECT 
        id,
        name,
        division,
        latitude,
        longitude,
        elevation_m,
        slope_deg,
        aspect_deg,
        erosion_slope_index,
        soil_ph_0_5cm,
        soil_clay_pct,
        soil_sand_pct,
        soil_silt_pct,
        soil_soc_g_kg,
        soil_nitrogen_g_kg,
        canopy_height_m,
        biomass_density_mg_ha,
        created_at
      FROM districts
      ORDER BY name ASC;
    `;
    const res = await geospatialPool.query<IDistrictRow>(query);
    return res.rows;
  }

  /**
   * Finds a district by name (case-insensitive)
   */
  static async getDistrictByName(districtName: string): Promise<IDistrictRow | null> {
    const query = `
      SELECT 
        id,
        name,
        division,
        latitude,
        longitude,
        elevation_m,
        slope_deg,
        aspect_deg,
        erosion_slope_index,
        soil_ph_0_5cm,
        soil_clay_pct,
        soil_sand_pct,
        soil_silt_pct,
        soil_soc_g_kg,
        soil_nitrogen_g_kg,
        canopy_height_m,
        biomass_density_mg_ha,
        created_at
      FROM districts
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1;
    `;
    const res = await geospatialPool.query<IDistrictRow>(query, [districtName.trim()]);
    return res.rows[0] || null;
  }

  /**
   * Finds the closest district to a given latitude and longitude using the Haversine formula
   */
  static async getNearestDistrict(lat: number, lon: number): Promise<IDistrictRow | null> {
    const query = `
      SELECT 
        id,
        name,
        division,
        latitude,
        longitude,
        elevation_m,
        slope_deg,
        aspect_deg,
        erosion_slope_index,
        soil_ph_0_5cm,
        soil_clay_pct,
        soil_sand_pct,
        soil_silt_pct,
        soil_soc_g_kg,
        soil_nitrogen_g_kg,
        canopy_height_m,
        biomass_density_mg_ha,
        created_at,
        (6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance_km
      FROM districts
      ORDER BY distance_km ASC
      LIMIT 1;
    `;
    const res = await geospatialPool.query<IDistrictRow>(query, [lat, lon]);
    return res.rows[0] || null;
  }

  /**
   * Retrieves continuous daily environmental records for a district within a date range
   */
  static async getDailyRecords(params: {
    districtName: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<IDailyRecordRow[]> {
    const { districtName, dateFrom = "2024-01-01", dateTo = "2025-12-31" } = params;

    const query = `
      SELECT 
        id,
        district_id,
        district_name,
        date,
        year,
        month,
        day,
        day_of_year,
        latitude,
        longitude,
        ndvi,
        evi,
        evapotranspiration_mm,
        potential_et_mm,
        water_deficit_index,
        surface_temperature_celsius,
        precipitation_mm,
        soil_moisture_pct,
        vegetation_condition_index,
        thermal_stress_index,
        created_at
      FROM daily_environmental_records
      WHERE LOWER(district_name) = LOWER($1)
        AND date >= $2
        AND date <= $3
      ORDER BY date ASC;
    `;

    const res = await geospatialPool.query<IDailyRecordRow>(query, [
      districtName.trim(),
      dateFrom,
      dateTo,
    ]);
    return res.rows;
  }

  /**
   * Retrieves paginated daily records with optional district and date filters
   */
  static async getDailyDataPaginated(params: {
    district?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    source: string;
    total: number;
    limit: number;
    offset: number;
    data: IDailyRecordRow[];
  }> {
    const { district, dateFrom, dateTo, limit = 100, offset = 0 } = params;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (district) {
      conditions.push(`LOWER(district_name) = LOWER($${paramIndex++})`);
      values.push(district.trim());
    }
    if (dateFrom) {
      conditions.push(`date >= $${paramIndex++}`);
      values.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`date <= $${paramIndex++}`);
      values.push(dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*)::int AS count FROM daily_environmental_records ${whereClause};`;
    const countRes = await geospatialPool.query<{ count: number }>(countQuery, values);
    const total = countRes.rows[0]?.count || 0;

    const safeLimit = Math.max(1, Math.min(1000, limit));
    const safeOffset = Math.max(0, offset);

    const dataQuery = `
      SELECT 
        id,
        district_id,
        district_name,
        date,
        year,
        month,
        day,
        day_of_year,
        latitude,
        longitude,
        ndvi,
        evi,
        evapotranspiration_mm,
        potential_et_mm,
        water_deficit_index,
        surface_temperature_celsius,
        precipitation_mm,
        soil_moisture_pct,
        vegetation_condition_index,
        thermal_stress_index,
        created_at
      FROM daily_environmental_records
      ${whereClause}
      ORDER BY date ASC, district_name ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const dataRes = await geospatialPool.query<IDailyRecordRow>(dataQuery, [
      ...values,
      safeLimit,
      safeOffset,
    ]);

    return {
      source: "Neon PostgreSQL - Bangladesh Geospatial Intelligence Suite",
      total,
      limit: safeLimit,
      offset: safeOffset,
      data: dataRes.rows,
    };
  }

  /**
   * Pre-computes comprehensive summary analytics for a district across a given period
   */
  static async getDistrictSummary(
    districtName: string,
    dateFrom = "2024-01-01",
    dateTo = "2025-12-31"
  ): Promise<{
    source: string;
    district: string;
    period: { date_from: string; date_to: string };
    baseline_context: IDistrictRow;
    two_year_analytics: IDistrictAnalyticsSummary;
  }> {
    const district = await this.getDistrictByName(districtName);
    if (!district) {
      throw new Error(`District '${districtName}' not found in Bangladesh geospatial database`);
    }

    const query = `
      SELECT 
        COUNT(*)::int AS total_days_recorded,
        COALESCE(ROUND(AVG(ndvi)::numeric, 4)::float, 0) AS mean_ndvi,
        COALESCE(ROUND(MAX(ndvi)::numeric, 4)::float, 0) AS max_ndvi,
        COALESCE(ROUND(MIN(ndvi)::numeric, 4)::float, 0) AS min_ndvi,
        COALESCE(ROUND(AVG(evi)::numeric, 4)::float, 0) AS mean_evi,
        COALESCE(ROUND(SUM(evapotranspiration_mm)::numeric, 2)::float, 0) AS cumulative_et_mm,
        COALESCE(ROUND(SUM(precipitation_mm)::numeric, 2)::float, 0) AS total_precipitation_mm,
        COALESCE(ROUND(AVG(water_deficit_index)::numeric, 4)::float, 0) AS mean_water_deficit_index,
        COALESCE(ROUND(AVG(surface_temperature_celsius)::numeric, 2)::float, 0) AS mean_surface_temperature_c,
        COALESCE(ROUND(MAX(surface_temperature_celsius)::numeric, 2)::float, 0) AS max_surface_temperature_c,
        COALESCE(ROUND(AVG(soil_moisture_pct)::numeric, 2)::float, 0) AS mean_soil_moisture_pct,
        COUNT(CASE WHEN surface_temperature_celsius >= 35.0 THEN 1 END)::int AS extreme_heat_days_count,
        COUNT(CASE WHEN water_deficit_index > 0.5 OR soil_moisture_pct < 18.0 THEN 1 END)::int AS severe_water_stress_days_count
      FROM daily_environmental_records
      WHERE LOWER(district_name) = LOWER($1)
        AND date >= $2
        AND date <= $3;
    `;

    const res = await geospatialPool.query<IDistrictAnalyticsSummary>(query, [
      district.name,
      dateFrom,
      dateTo,
    ]);

    const analytics = res.rows[0] || {
      total_days_recorded: 0,
      mean_ndvi: 0,
      max_ndvi: 0,
      min_ndvi: 0,
      mean_evi: 0,
      cumulative_et_mm: 0,
      total_precipitation_mm: 0,
      mean_water_deficit_index: 0,
      mean_surface_temperature_c: 0,
      max_surface_temperature_c: 0,
      mean_soil_moisture_pct: 0,
      extreme_heat_days_count: 0,
      severe_water_stress_days_count: 0,
    };

    return {
      source: "Neon PostgreSQL - Bangladesh Geospatial Intelligence Suite",
      district: district.name,
      period: { date_from: dateFrom, date_to: dateTo },
      baseline_context: district,
      two_year_analytics: analytics,
    };
  }
}

