import * as ort from "onnxruntime-node";
import { ModelLoaderService } from "./model-loader.service.js";
import { ORDERED_CLASS_NAMES, getClassInfo } from "./class-mapping.js";
import { DEFAULT_INFERENCE_TIMEOUT_MS } from "../riceDisease.constant.js";
import { ProbabilityItem } from "../riceDisease.interface.js";

export interface InferenceRawOutput {
  predictedClass: string;
  confidence: number;
  probabilities: ProbabilityItem[];
  rawLogits: number[];
  inferenceDurationMs: number;
}

export class InferenceService {
  /**
   * Numerically stable Softmax calculation
   */
  public static softmax(logits: number[] | Float32Array): number[] {
    let max = -Infinity;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i] > max) max = logits[i];
    }

    let sum = 0;
    const exps = new Array(logits.length);
    for (let i = 0; i < logits.length; i++) {
      const exp = Math.exp(logits[i] - max);
      exps[i] = exp;
      sum += exp;
    }

    const probs = new Array(logits.length);
    for (let i = 0; i < logits.length; i++) {
      probs[i] = exps[i] / sum;
    }

    return probs;
  }

  /**
   * Executes inference on the input tensor with timeout protection
   */
  public static async runInference(
    tensor: ort.Tensor,
    timeoutMs: number = DEFAULT_INFERENCE_TIMEOUT_MS
  ): Promise<InferenceRawOutput> {
    const modelLoader = ModelLoaderService.getInstance();
    const session = await modelLoader.getSession();

    const inputName = session.inputNames[0] || "input";
    const feeds: Record<string, ort.Tensor> = {
      [inputName]: tensor,
    };

    const startTime = performance.now();

    // Wrap session.run with timeout
    const runPromise = session.run(feeds);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Inference timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const results = await Promise.race([runPromise, timeoutPromise]);
    const durationMs = Math.round(performance.now() - startTime);
    modelLoader.recordInference(durationMs);

    const outputName = session.outputNames[0] || "output";
    const outputTensor = results[outputName];
    if (!outputTensor || !outputTensor.data) {
      throw new Error(`Model did not produce expected output tensor: ${outputName}`);
    }

    const rawData = outputTensor.data as Float32Array;
    const logits = Array.from(rawData);

    if (logits.length !== ORDERED_CLASS_NAMES.length) {
      throw new Error(`Expected ${ORDERED_CLASS_NAMES.length} output logits, but got ${logits.length}`);
    }

    const probabilities = this.softmax(logits);

    // Build probability items with metadata
    const items: ProbabilityItem[] = probabilities.map((prob, idx) => {
      const className = ORDERED_CLASS_NAMES[idx];
      const info = getClassInfo(className);
      return {
        class: className,
        displayName: info.displayName,
        displayNameBn: info.displayNameBn,
        confidence: +prob.toFixed(4),
        percentage: `${(prob * 100).toFixed(2)}%`,
        rank: 0,
      };
    });

    // Sort descending by confidence
    items.sort((a, b) => b.confidence - a.confidence);
    items.forEach((item, index) => {
      item.rank = index + 1;
    });

    const topPrediction = items[0];

    return {
      predictedClass: topPrediction.class,
      confidence: topPrediction.confidence,
      probabilities: items,
      rawLogits: logits,
      inferenceDurationMs: durationMs,
    };
  }
}

