import { PreprocessingService } from "./preprocessing.service.js";
import { InferenceService } from "./inference.service.js";
import { getClassInfo } from "./class-mapping.js";
import { PredictionResult } from "../riceDisease.interface.js";
import { MODEL_VALIDATION_METRICS } from "../riceDisease.constant.js";

export class PredictionService {
  /**
   * Complete end-to-end prediction pipeline for a single rice leaf image buffer
   */
  public static async predict(
    imageBuffer: Buffer,
    originalName?: string
  ): Promise<PredictionResult> {
    const pipelineStart = performance.now();

    // 1. Image preprocessing
    const { tensor, metadata } = await PreprocessingService.preprocess(imageBuffer);

    // 2. ONNX inference
    const inferenceOutput = await InferenceService.runInference(tensor);

    const totalProcessingTimeMs = Math.round(performance.now() - pipelineStart);

    // 3. Agronomic details for top prediction
    const diseaseInfo = getClassInfo(inferenceOutput.predictedClass);

    return {
      prediction: {
        class: diseaseInfo.className,
        displayName: diseaseInfo.displayName,
        displayNameBn: diseaseInfo.displayNameBn,
        confidence: inferenceOutput.confidence,
        category: diseaseInfo.category,
        severity: diseaseInfo.severity,
        isHealthy: diseaseInfo.className === "normal",
      },
      probabilities: inferenceOutput.probabilities,
      diseaseDetails: {
        scientificName: diseaseInfo.scientificName,
        description: diseaseInfo.description,
        symptoms: diseaseInfo.symptoms,
        cause: diseaseInfo.cause,
        favorableConditions: diseaseInfo.favorableConditions,
        preventions: diseaseInfo.preventions,
        treatment: diseaseInfo.treatment,
      },
      model: {
        name: MODEL_VALIDATION_METRICS.model_name,
        architecture: MODEL_VALIDATION_METRICS.architecture,
        version: MODEL_VALIDATION_METRICS.version,
        runtime: "onnxruntime-node",
      },
      image: {
        originalName,
        fileSizeBytes: metadata.sizeBytes,
        format: metadata.format,
        dimensions: {
          originalWidth: metadata.originalWidth,
          originalHeight: metadata.originalHeight,
          processedWidth: metadata.processedWidth,
          processedHeight: metadata.processedHeight,
        },
      },
      processingTimeMs: totalProcessingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }
}

