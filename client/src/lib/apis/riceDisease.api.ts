import { httpClient } from "../axios/httpClinet";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface IProbabilityItem {
  class: string;
  displayName: string;
  displayNameBn: string;
  confidence: number;
  percentage: string;
  rank: number;
}

export interface IRiceDiseasePrediction {
  class: string;
  displayName: string;
  displayNameBn: string;
  confidence: number;
  category: "Bacterial" | "Fungal" | "Viral" | "Pest" | "Healthy";
  severity: "Low" | "Medium" | "High" | "Critical" | "None";
  isHealthy: boolean;
}

export interface IDiseaseDetails {
  scientificName?: string;
  description: string;
  symptoms: string[];
  cause: string;
  favorableConditions: string[];
  preventions: string[];
  treatment: {
    cultural: string[];
    chemical: string[];
    organic: string[];
  };
}

export interface IRiceDiseasePredictionResult {
  prediction: IRiceDiseasePrediction;
  probabilities: IProbabilityItem[];
  diseaseDetails: IDiseaseDetails;
  model: {
    name: string;
    architecture: string;
    version: string;
    runtime: string;
  };
  image: {
    originalName?: string;
    fileSizeBytes: number;
    format: string;
    dimensions: {
      originalWidth: number;
      originalHeight: number;
      processedWidth: number;
      processedHeight: number;
    };
  };
  processingTimeMs: number;
  timestamp: string;
  savedRecordId?: string;
}

export interface IModelHealth {
  model: string;
  status: "ready" | "initializing" | "error";
  runtime: string;
  classes: number;
  modelPath: string;
  inferenceCount: number;
  averageInferenceTimeMs: number;
  uptimeSeconds: number;
}

export interface IModelInfo {
  modelName: string;
  architecture: string;
  version: string;
  numClasses: number;
  classes: Array<{
    index: number;
    className: string;
    displayName: string;
    displayNameBn: string;
    category: string;
    severity: string;
  }>;
  inputDimensions: {
    channels: number;
    width: number;
    height: number;
    layout: string;
  };
  normalization: {
    mean: number[];
    std: number[];
    colorSpace: string;
  };
  runtime: string;
  status: string;
  reportedValidationMetrics: {
    accuracy: number;
    macroF1: number;
    macroPrecision: number;
    macroRecall: number;
    totalValidationImages: number;
    classF1Scores: Record<string, number>;
  };
}

export interface IPredictionHistoryItem {
  id: string;
  userId?: string | null;
  predictedClass: string;
  displayName: string;
  confidence: number;
  probabilities: IProbabilityItem[];
  originalName?: string;
  fileSizeBytes?: number;
  processingTimeMs: number;
  modelVersion: string;
  recommendations?: IDiseaseDetails;
  createdAt: string;
  updatedAt: string;
}

export interface IHistoryResponse {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: IPredictionHistoryItem[];
}

/**
 * Predict rice disease from leaf image file or blob
 */
export async function predictRiceDisease(
  file: File | Blob,
  filename?: string
): Promise<IRiceDiseasePredictionResult> {
  const formData = new FormData();
  formData.append("image", file, filename || (file instanceof File ? file.name : "leaf_capture.jpg"));

  const response = await httpClient.post<{
    success: boolean;
    message: string;
    data: IRiceDiseasePredictionResult;
  }>("/rice-disease/predict", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 30000,
  });

  return response.data;
}

/**
 * Fetch model health
 */
export async function getRiceDiseaseHealth(): Promise<IModelHealth> {
  const response = await httpClient.get<{
    success: boolean;
    message: string;
    data: IModelHealth;
  }>("/rice-disease/health");
  return response.data;
}

/**
 * Fetch model metadata & reported metrics
 */
export async function getRiceDiseaseModelInfo(): Promise<IModelInfo> {
  const response = await httpClient.get<{
    success: boolean;
    message: string;
    data: IModelInfo;
  }>("/rice-disease/model-info");
  return response.data;
}

/**
 * Fetch prediction history
 */
export async function getRiceDiseaseHistory(
  page: number = 1,
  limit: number = 20,
  disease?: string
): Promise<IHistoryResponse> {
  const params: Record<string, any> = { page, limit };
  if (disease) params.disease = disease;

  const response = await httpClient.get<{
    success: boolean;
    message: string;
    data: IHistoryResponse;
  }>("/rice-disease/history", { params });
  return response.data;
}

/**
 * Delete a prediction history record
 */
export async function deleteRiceDiseaseHistory(id: string): Promise<void> {
  await httpClient.delete(`/rice-disease/history/${id}`);
}

/**
 * React Query Hooks
 */
export function useRiceDiseasePredict() {
  return useMutation({
    mutationFn: ({ file, filename }: { file: File | Blob; filename?: string }) =>
      predictRiceDisease(file, filename),
  });
}

export function useRiceDiseaseHealth() {
  return useQuery({
    queryKey: ["rice-disease-health"],
    queryFn: getRiceDiseaseHealth,
    refetchInterval: 30000,
  });
}

export function useRiceDiseaseModelInfo() {
  return useQuery({
    queryKey: ["rice-disease-model-info"],
    queryFn: getRiceDiseaseModelInfo,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useRiceDiseaseHistory(page: number = 1, limit: number = 20, disease?: string) {
  return useQuery({
    queryKey: ["rice-disease-history", page, limit, disease],
    queryFn: () => getRiceDiseaseHistory(page, limit, disease),
  });
}

