/* eslint-disable @typescript-eslint/no-explicit-any */
import { envVars } from "../../../config/env.js";
import { openRouterKeyPool } from "./openrouter-keys.js";

export class LLMService {
  private apiUrl: string = "https://openrouter.ai/api/v1";
  private model: string;

  constructor() {
    this.model =
      envVars.RAG.OPENROUTER_LLM_MODEL ||
      "nvidia/nemotron-3-ultra-550b-a55b:free";
  }

  async generateResponse(
    prompt: string,
    context: string[] = [],
    asJson: boolean = false,
    customSystemPrompt?: string
  ): Promise<string> {
    const keys = openRouterKeyPool.getKeys();
    if (keys.length === 0) {
      throw new Error("OpenRouter API key is missing. Please set OPENROUTER_API_KEY in .env");
    }

    try {
      // Build context-grounded augmented prompt for RAG
      let fullPrompt = "";
      if (context.length > 0) {
        fullPrompt = `=== CONTEXT INFORMATION ===\n${context.join(
          "\n\n---\n\n"
        )}\n\n=== USER QUESTION ===\n${prompt}\n\nPlease answer the question thoroughly and accurately based on the context above. If the context does not contain enough information, explain what is known and clarify what is missing without inventing facts.`;
      } else {
        fullPrompt = `=== USER QUESTION ===\n${prompt}\n\nPlease provide an accurate, clear, and comprehensive answer.`;
      }

      if (asJson) {
        fullPrompt += `\n\nReturn ONLY a valid JSON object matching this structure:
{
  "summary": "Direct, concise answer to the question",
  "details": "Detailed explanation or analysis based on the context",
  "keyPoints": ["Key takeaway 1", "Key takeaway 2"],
  "topics": ["Relevant topic or mission 1", "Relevant topic or mission 2"],
  "confidence": "high"
}
Do NOT include markdown fences like \`\`\`json. Return pure JSON only.`;
      }

      const defaultSystemMessage = asJson
        ? "You are an expert AI research assistant for the NASA Space Apps platform. Analyze the provided context and respond ONLY with a valid JSON object. Do not include markdown code blocks or additional conversational text."
        : "You are an expert AI research assistant for the NASA Space Apps platform. Provide accurate, insightful, and well-grounded answers based on the provided scientific and project context. If the provided context is insufficient, state it clearly.";

      const systemMessage = customSystemPrompt || defaultSystemMessage;

      const bodyPayload: any = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      };

      if (
        asJson &&
        (this.model.includes("gpt") || this.model.includes("openai"))
      ) {
        bodyPayload.response_format = { type: "json_object" };
      }

      const candidateModels = [
        this.model,
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "nvidia/nemotron-3-ultra-550b-a55b",
        "nvidia/nemotron-3.5-lightning:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        "poolside/laguna-s-2.1:free",
        "nvidia/nemotron-3.5-super-vl:free",
        "meta-llama/llama-3.3-70b-instruct:free",
      ].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i && !m.includes("mistral-7b") && !m.includes("gemma-4"));

      let lastError: any = null;

      // Outer loop: Iterate through candidate models
      for (const currentModel of candidateModels) {
        bodyPayload.model = currentModel;

        // Inner loop: Try each API key in the pool if rate limited or payment required
        const totalKeys = keys.length;
        for (let keyAttempt = 0; keyAttempt < totalKeys; keyAttempt++) {
          const activeKey = openRouterKeyPool.getActiveKey();

          try {
            const response = await fetch(`${this.apiUrl}/chat/completions`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${activeKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nasa-space-app.local",
                "X-Title": "NASA Space Apps RAG Service",
              },
              body: JSON.stringify(bodyPayload),
              signal: AbortSignal.timeout(12000),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => null);
              const errorMsg = errorData?.error?.message || response.statusText || "unknown error";
              const status = response.status;

              // Check if rate limited, out of credits, or unauthorized
              const isRateOrAuthError =
                status === 429 ||
                status === 402 ||
                status === 401 ||
                errorMsg.toLowerCase().includes("rate limit") ||
                errorMsg.toLowerCase().includes("credit") ||
                errorMsg.toLowerCase().includes("quota");

              if (isRateOrAuthError && totalKeys > 1) {
                openRouterKeyPool.rotateKey(activeKey, `HTTP ${status}: ${errorMsg}`);
                // Retry same model with next key
                continue;
              }

              lastError = new Error(`OpenRouter API error (${currentModel}): ${status} - ${errorMsg}`);
              break; // Try next model
            }

            const data = (await response.json()) as any;
            if (!Array.isArray(data.choices) || data.choices.length === 0) {
              lastError = new Error(`No response choices returned by ${currentModel}`);
              break;
            }

            const content = data.choices[0]?.message?.content;
            if (typeof content !== "string" || content.trim().length === 0) {
              lastError = new Error(`Empty response from ${currentModel}`);
              break;
            }

            return content;
          } catch (fetchErr: any) {
            lastError = fetchErr;
            // On timeout or fetch error, try rotating key once
            if (totalKeys > 1 && keyAttempt < totalKeys - 1) {
              openRouterKeyPool.rotateKey(activeKey, fetchErr?.message || "fetch failure");
            }
          }
        }
      }

      throw lastError || new Error("All LLM candidate models and API keys failed");
    } catch (error) {
      console.error("Error generating LLM response:", error);
      throw error;
    }
  }
}
