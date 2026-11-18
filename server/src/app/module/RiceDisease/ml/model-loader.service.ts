import * as ort from "onnxruntime-node";
import path from "path";
import fs from "fs";

export class ModelLoaderService {
  private static instance: ModelLoaderService;
  private session: ort.InferenceSession | null = null;
  private isInitializing = false;
  private initializationError: Error | null = null;
  private modelPath: string;
  private totalInferences = 0;
  private totalInferenceTimeMs = 0;
  private readonly initStartTime = Date.now();

  private constructor() {
    // Check multiple candidate locations for resilience (local module path vs root models path)
    const primaryPath = path.resolve(process.cwd(), "src/app/module/RiceDisease/ml/model/rice_leaf_efficientnet_b0.onnx");
    const fallbackPath = path.resolve(process.cwd(), "models/rice_leaf_efficientnet_b0.onnx");

    if (fs.existsSync(primaryPath)) {
      this.modelPath = primaryPath;
    } else if (fs.existsSync(fallbackPath)) {
      this.modelPath = fallbackPath;
    } else {
      this.modelPath = primaryPath;
    }
  }

  public static getInstance(): ModelLoaderService {
    if (!ModelLoaderService.instance) {
      ModelLoaderService.instance = new ModelLoaderService();
    }
    return ModelLoaderService.instance;
  }

  public async initialize(): Promise<ort.InferenceSession> {
    if (this.session) {
      return this.session;
    }

    if (this.isInitializing) {
      // Wait until initialization completes
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (this.session) return this.session;
      if (this.initializationError) throw this.initializationError;
    }

    this.isInitializing = true;
    this.initializationError = null;

    try {
      if (!fs.existsSync(this.modelPath)) {
        throw new Error(`ONNX model file not found at expected location: ${path.basename(this.modelPath)}`);
      }

      const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: ["cpu"],
        graphOptimizationLevel: "all",
      };

      console.log(`[RiceDisease] Loading ONNX session from: ${this.modelPath}...`);
      const session = await ort.InferenceSession.create(this.modelPath, sessionOptions);
      this.session = session;
      console.log(`[RiceDisease] ONNX session initialized successfully. Inputs: ${session.inputNames.join(", ")}, Outputs: ${session.outputNames.join(", ")}`);
      return session;
    } catch (err: any) {
      this.initializationError = err;
      console.error("[RiceDisease] Failed to initialize ONNX session:", err);
      throw new Error(`Model initialization failed: ${err.message}`);
    } finally {
      this.isInitializing = false;
    }
  }

  public async getSession(): Promise<ort.InferenceSession> {
    if (!this.session) {
      return await this.initialize();
    }
    return this.session;
  }

  public isReady(): boolean {
    return this.session !== null && !this.isInitializing;
  }

  public getStatus(): "ready" | "initializing" | "error" {
    if (this.session) return "ready";
    if (this.isInitializing) return "initializing";
    return "error";
  }

  public recordInference(durationMs: number): void {
    this.totalInferences += 1;
    this.totalInferenceTimeMs += durationMs;
  }

  public getStats() {
    return {
      modelName: "EfficientNet-B0",
      status: this.getStatus(),
      runtime: "onnxruntime-node",
      classes: 10,
      totalInferences: this.totalInferences,
      averageInferenceTimeMs: this.totalInferences > 0 ? +(this.totalInferenceTimeMs / this.totalInferences).toFixed(2) : 0,
      uptimeSeconds: Math.floor((Date.now() - this.initStartTime) / 1000),
      modelFileName: path.basename(this.modelPath),
    };
  }
}

