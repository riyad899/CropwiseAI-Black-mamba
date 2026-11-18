import { DiseaseInfo } from "./riceDisease.constant.js";

export interface ProbabilityItem {
  class: string;
  displayName: string;
  displayNameBn: string;
  confidence: number;
  percentage: string;
  rank: number;
}

export interface PredictionResult {
  prediction: {
    class: string;
    displayName: string;
    displayNameBn: string;
    confidence: number;
    category: string;
    severity: string;
    isHealthy: boolean;
  };
  probabilities: ProbabilityItem[];
  diseaseDetails: {
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
  };
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
}

export interface ModelHealthStatus {
  model: string;
  status: "ready" | "initializing" | "error";
  runtime: string;
  classes: number;
  modelPath: string;
  inferenceCount: number;
  averageInferenceTimeMs: number;
  uptimeSeconds: number;
}

export interface ModelInfoDetails {
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

export interface HistoryQueryFilters {
  page?: number;
  limit?: number;
  disease?: string;
  startDate?: string;
  endDate?: string;
}

