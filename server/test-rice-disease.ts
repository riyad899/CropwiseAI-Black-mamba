import fs from "fs";
import path from "path";
import { RiceDiseaseService } from "./src/app/module/RiceDisease/riceDisease.service.js";
import { PreprocessingService } from "./src/app/module/RiceDisease/ml/preprocessing.service.js";

async function runTests() {
  console.log("=================================================");
  console.log(" Rice Disease Model & API Automated Test Suite ");
  console.log("=================================================\n");

  // TEST 1: Health Check
  console.log("--- TEST 1: Model Health & Initialization ---");
  const health = await RiceDiseaseService.getHealth();
  console.log("Health Response:", JSON.stringify(health, null, 2));
  if (health.status !== "ready") {
    throw new Error(`Health check failed: status is ${health.status}`);
  }
  if (health.classes !== 10) {
    throw new Error(`Expected 10 classes, got ${health.classes}`);
  }
  console.log("✔ Model Health: PASSED\n");

  // TEST 2: Model Metadata Introspection
  console.log("--- TEST 2: Model Info & Class Verification ---");
  const modelInfo = await RiceDiseaseService.getModelInfo();
  console.log(`Model: ${modelInfo.modelName} (Architecture: ${modelInfo.architecture})`);
  console.log(`Reported Validation Accuracy: ${(modelInfo.reportedValidationMetrics.accuracy * 100).toFixed(2)}%`);
  console.log(`Reported Macro F1-score: ${(modelInfo.reportedValidationMetrics.macroF1 * 100).toFixed(2)}%`);
  console.log("Registered Classes (10):");
  modelInfo.classes.forEach((c) => {
    console.log(`  [${c.index}] ${c.className.padEnd(25)} -> ${c.displayName} (${c.displayNameBn})`);
  });
  if (modelInfo.classes.length !== 10) {
    throw new Error(`Expected 10 classes, got ${modelInfo.classes.length}`);
  }
  console.log("✔ Model Info: PASSED\n");

  // TEST 3: Preprocessing & Real Leaf Image Prediction
  console.log("--- TEST 3: End-to-End Prediction on Real Image ---");
  const testImagePath = path.resolve(process.cwd(), "../client/public/Leaf.png");
  if (!fs.existsSync(testImagePath)) {
    throw new Error(`Test image not found at: ${testImagePath}`);
  }
  const imageBuffer = fs.readFileSync(testImagePath);
  console.log(`Loaded test image: ${testImagePath} (${imageBuffer.length} bytes)`);

  const { tensor, metadata } = await PreprocessingService.preprocess(imageBuffer);
  console.log(`Tensor shape: [${tensor.dims.join(", ")}], data type: ${tensor.type}`);
  console.log(`Image metadata:`, metadata);

  const prediction = await RiceDiseaseService.analyzeLeaf(imageBuffer, "Leaf.png");
  console.log("\nPrediction Result:");
  console.log(`  Top Class:    ${prediction.prediction.class} (${prediction.prediction.displayName})`);
  console.log(`  Bengali Name: ${prediction.prediction.displayNameBn}`);
  console.log(`  Confidence:   ${(prediction.prediction.confidence * 100).toFixed(2)}%`);
  console.log(`  Category:     ${prediction.prediction.category}`);
  console.log(`  Severity:     ${prediction.prediction.severity}`);
  console.log(`  Processing:   ${prediction.processingTimeMs} ms`);

  console.log("\nTop 5 Probabilities:");
  prediction.probabilities.slice(0, 5).forEach((p) => {
    console.log(`  #${p.rank} ${p.class.padEnd(25)}: ${p.percentage} (${p.displayName})`);
  });

  // Verify probabilities
  const sumProb = prediction.probabilities.reduce((acc, p) => acc + p.confidence, 0);
  console.log(`\nProbability sum (approx 1.0): ${sumProb.toFixed(4)}`);
  if (sumProb < 0.98 || sumProb > 1.02) {
    throw new Error(`Probability sum out of expected bounds: ${sumProb}`);
  }
  if (prediction.probabilities.length !== 10) {
    throw new Error(`Expected 10 class probabilities, got ${prediction.probabilities.length}`);
  }
  console.log("✔ Leaf Analysis: PASSED\n");

  // TEST 4: Concurrency Stress Test
  console.log("--- TEST 4: Concurrency Test (5 Parallel Inferences) ---");
  const startConcurrent = performance.now();
  const parallelPromises = Array.from({ length: 5 }).map((_, i) =>
    RiceDiseaseService.analyzeLeaf(imageBuffer, `leaf_test_${i}.png`)
  );
  const results = await Promise.all(parallelPromises);
  const durationConcurrent = Math.round(performance.now() - startConcurrent);
  console.log(`Processed 5 concurrent requests in ${durationConcurrent} ms (avg: ${(durationConcurrent / 5).toFixed(1)} ms/request)`);
  results.forEach((r, idx) => {
    console.log(`  Request #${idx + 1}: ${r.prediction.class} (${(r.prediction.confidence * 100).toFixed(2)}%) in ${r.processingTimeMs} ms`);
  });
  console.log("✔ Concurrency Test: PASSED\n");

  console.log("=================================================");
  console.log(" ALL TESTS PASSED SUCCESSFULLY! (100% OPERATIONAL) ");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});

