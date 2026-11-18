import { envVars } from "../../../config/env.js";

class OpenRouterKeyPool {
  private static instance: OpenRouterKeyPool;
  private keys: string[] = [];
  private activeIndex: number = 0;

  private constructor() {
    this.refreshKeys();
  }

  public static getInstance(): OpenRouterKeyPool {
    if (!OpenRouterKeyPool.instance) {
      OpenRouterKeyPool.instance = new OpenRouterKeyPool();
    }
    return OpenRouterKeyPool.instance;
  }

  public refreshKeys(): void {
    const configuredKeys = envVars.RAG.OPENROUTER_API_KEYS || [];
    const singleKey = envVars.RAG.OPENROUTER_API_KEY;

    const merged = Array.from(new Set([...configuredKeys, singleKey].filter(Boolean)));
    this.keys = merged;
    if (this.keys.length === 0) {
      console.warn("⚠️ [OpenRouterKeyPool] No OpenRouter API keys configured in environment.");
    } else {
      console.log(`🔑 [OpenRouterKeyPool] Initialized with ${this.keys.length} API key(s) in rotation pool.`);
    }
  }

  public getKeys(): string[] {
    if (this.keys.length === 0) {
      this.refreshKeys();
    }
    return [...this.keys];
  }

  public getActiveKey(): string {
    if (this.keys.length === 0) {
      this.refreshKeys();
    }
    if (this.keys.length === 0) return "";
    return this.keys[this.activeIndex % this.keys.length];
  }

  public rotateKey(failedKey?: string, reason?: string): string {
    if (this.keys.length <= 1) {
      return this.getActiveKey();
    }

    const previousIndex = this.activeIndex;
    this.activeIndex = (this.activeIndex + 1) % this.keys.length;
    const nextKey = this.keys[this.activeIndex];

    const maskedPrev = failedKey ? `${failedKey.slice(0, 12)}...` : `Index ${previousIndex}`;
    const maskedNext = `${nextKey.slice(0, 12)}...`;

    console.warn(
      `🔄 [OpenRouterKeyPool] API key ${maskedPrev} hit ${reason || "error/limit"}. Rotated to key #${this.activeIndex + 1} (${maskedNext})`
    );

    return nextKey;
  }
}

export const openRouterKeyPool = OpenRouterKeyPool.getInstance();

