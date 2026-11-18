import { openRouterKeyPool } from "./src/app/module/Rag/openrouter-keys.js";
import { LLMService } from "./src/app/module/Rag/llm.service.js";

async function main() {
  console.log("Pool keys count:", openRouterKeyPool.getKeys().length);
  openRouterKeyPool.getKeys().forEach((k, idx) => {
    console.log(`Key #${idx + 1}: ${k.slice(0, 16)}...`);
  });
  console.log("Current active key:", openRouterKeyPool.getActiveKey().slice(0, 16) + "...");

  const llm = new LLMService();
  console.log("Sending test prompt to LLM via OpenRouter...");
  const reply = await llm.generateResponse("Reply with the word SUCCESS in one word.", [], false);
  console.log("LLM Reply:", reply);
}

main().catch((err) => {
  console.error("Test error:", err);
});

