import { envVars } from "../../../config/env.js";
import { openRouterKeyPool } from "./openrouter-keys.js";

interface OpenRouterEmbeddingResponse {
  data?: Array<{
    embedding: number[];
    index?: number;
  }>;
}

function generateDeterministicVector(text: string, dim: number = 2048): number[] {
  const vec = new Array(dim).fill(0);
  const clean = (text || "").toLowerCase().trim();
  if (clean.length === 0) {
    vec[0] = 1;
    return vec;
  }
  for (let i = 0; i < clean.length; i++) {
    const c1 = clean.charCodeAt(i);
    const c2 = clean.charCodeAt((i + 1) % clean.length);
    const c3 = clean.charCodeAt((i + 2) % clean.length);
    const idx = Math.abs((c1 * 31 + c2 * 17 + c3 * 7) ^ (i * 13)) % dim;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

export class EmbeddingService {
  private apiUrl: string = "https://openrouter.ai/api/v1";
  private embeddingModel: string;

  constructor() {
    this.embeddingModel =
      envVars.RAG.OPENROUTER_EMBEDDING_MODEL ||
      "nvidia/llama-nemotron-embed-vl-1b-v2:free";
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const keys = openRouterKeyPool.getKeys();
    if (keys.length === 0) {
      return generateDeterministicVector(text, 2048);
    }

    const totalKeys = keys.length;
    for (let attempt = 0; attempt < totalKeys; attempt++) {
      const activeKey = openRouterKeyPool.getActiveKey();
      try {
        const response = await fetch(`${this.apiUrl}/embeddings`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: text,
            model: this.embeddingModel,
          }),
          signal: AbortSignal.timeout(3500),
        });

        if (!response.ok) {
          if (response.status === 429 || response.status === 402 || response.status === 401) {
            openRouterKeyPool.rotateKey(activeKey, `HTTP ${response.status}`);
            continue;
          }
          return generateDeterministicVector(text, 2048);
        }

        const data = (await response.json()) as OpenRouterEmbeddingResponse;
        if (!data.data || data.data.length === 0 || !Array.isArray(data.data[0].embedding)) {
          return generateDeterministicVector(text, 2048);
        }

        return data.data[0].embedding;
      } catch {
        if (attempt < totalKeys - 1) {
          openRouterKeyPool.rotateKey(activeKey, "timeout/error");
        }
      }
    }

    return generateDeterministicVector(text, 2048);
  }
}
