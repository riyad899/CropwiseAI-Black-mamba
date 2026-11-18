import { ModelLoaderService } from "./ml/model-loader.service.js";
import { PredictionService } from "./ml/prediction.service.js";
import { ORDERED_CLASS_NAMES, getClassInfo } from "./ml/class-mapping.js";
import { MODEL_VALIDATION_METRICS } from "./riceDisease.constant.js";
import { HistoryQueryFilters, ModelHealthStatus, ModelInfoDetails, PredictionResult } from "./riceDisease.interface.js";
import { prisma } from "../../lib/prisma.js";

export class RiceDiseaseService {
  /**
   * Health check for model readiness
   */
  public static async getHealth(): Promise<ModelHealthStatus> {
    const loader = ModelLoaderService.getInstance();
    // Warm up model session if not loaded
    if (!loader.isReady()) {
      try {
        await loader.initialize();
      } catch (err) {
        // Will reflect error in status
      }
    }

    const stats = loader.getStats();
    return {
      model: stats.modelName,
      status: stats.status,
      runtime: stats.runtime,
      classes: stats.classes,
      modelPath: stats.modelFileName,
      inferenceCount: stats.totalInferences,
      averageInferenceTimeMs: stats.averageInferenceTimeMs,
      uptimeSeconds: stats.uptimeSeconds,
    };
  }

  /**
   * Comprehensive model information & reported validation metrics
   */
  public static async getModelInfo(): Promise<ModelInfoDetails> {
    const loader = ModelLoaderService.getInstance();
    const isReady = loader.isReady();

    const classes = ORDERED_CLASS_NAMES.map((name, index) => {
      const info = getClassInfo(name);
      return {
        index,
        className: name,
        displayName: info.displayName,
        displayNameBn: info.displayNameBn,
        category: info.category,
        severity: info.severity,
      };
    });

    return {
      modelName: MODEL_VALIDATION_METRICS.model_name,
      architecture: MODEL_VALIDATION_METRICS.architecture,
      version: MODEL_VALIDATION_METRICS.version,
      numClasses: MODEL_VALIDATION_METRICS.dataset.num_classes,
      classes,
      inputDimensions: {
        channels: 3,
        width: MODEL_VALIDATION_METRICS.preprocessing.image_size,
        height: MODEL_VALIDATION_METRICS.preprocessing.image_size,
        layout: "NCHW [1, 3, 224, 224]",
      },
      normalization: {
        mean: MODEL_VALIDATION_METRICS.preprocessing.mean,
        std: MODEL_VALIDATION_METRICS.preprocessing.std,
        colorSpace: "RGB",
      },
      runtime: "onnxruntime-node",
      status: isReady ? "ready" : loader.getStatus(),
      reportedValidationMetrics: {
        accuracy: MODEL_VALIDATION_METRICS.metrics.accuracy,
        macroF1: MODEL_VALIDATION_METRICS.metrics.macro_f1,
        macroPrecision: MODEL_VALIDATION_METRICS.metrics.macro_precision,
        macroRecall: MODEL_VALIDATION_METRICS.metrics.macro_recall,
        totalValidationImages: MODEL_VALIDATION_METRICS.dataset.total_images,
        classF1Scores: MODEL_VALIDATION_METRICS.metrics.class_f1_scores,
      },
    };
  }

  /**
   * Perform disease diagnosis from uploaded leaf image buffer and persist prediction history
   */
  public static async analyzeLeaf(
    imageBuffer: Buffer,
    originalName?: string,
    userId?: string
  ): Promise<PredictionResult & { savedRecordId?: string }> {
    const predictionResult = await PredictionService.predict(imageBuffer, originalName);

    let savedRecordId: string | undefined;

    // Persist to database if userId is provided or as public audit log
    try {
      const record = await prisma.riceDiseasePrediction.create({
        data: {
          userId: userId || null,
          predictedClass: predictionResult.prediction.class,
          displayName: predictionResult.prediction.displayName,
          confidence: predictionResult.prediction.confidence,
          probabilities: predictionResult.probabilities as any,
          originalName: originalName || "uploaded_leaf_image",
          fileSizeBytes: predictionResult.image.fileSizeBytes,
          processingTimeMs: predictionResult.processingTimeMs,
          modelVersion: predictionResult.model.version,
          recommendations: predictionResult.diseaseDetails as any,
        },
      });
      savedRecordId = record.id;
    } catch (dbErr: any) {
      console.warn("[RiceDisease] Could not persist prediction to database:", dbErr?.message);
    }

    return {
      ...predictionResult,
      savedRecordId,
    };
  }

  /**
   * Get history of predictions for a user
   */
  public static async getHistory(userId: string, filters: HistoryQueryFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (filters.disease) {
      where.predictedClass = filters.disease;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [total, records] = await Promise.all([
      prisma.riceDiseasePrediction.count({ where }),
      prisma.riceDiseasePrediction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: records,
    };
  }

  /**
   * Get prediction detail by ID
   */
  public static async getHistoryById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const record = await prisma.riceDiseasePrediction.findFirst({
      where,
    });
    return record;
  }

  /**
   * Delete prediction record by ID
   */
  public static async deleteHistory(id: string, userId: string) {
    const existing = await prisma.riceDiseasePrediction.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error("Prediction record not found or unauthorized");
    }

    return await prisma.riceDiseasePrediction.delete({
      where: { id },
    });
  }
}

