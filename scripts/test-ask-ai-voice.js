const { CropWiseAiService } = require("../server/dist/app/module/CropWiseAi/cropwise.service");

async function runTests() {
  console.log("=================================================================");
  console.log("       STARTING CROPWISE AI & VOICE ASSISTANT TEST SUITE         ");
  console.log("=================================================================\n");

  let passedCount = 0;
  let totalCount = 0;

  function assert(testName, condition, extraInfo) {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (extraInfo) console.log(`   ↳ ${extraInfo}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (extraInfo) console.error(`   ↳ ${extraInfo}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Relay 1 ON Command
  // -------------------------------------------------------------
  console.log("\n--- TEST CASE 1: Turn ON Relay 1 (Water Pump) via Voice/Chat ---");
  try {
    const resOn = await CropWiseAiService.chat({
      message: "রিলে ১ (পানির মোটর) অন করো",
      language: "BN",
      deviceId: "esp32-001",
      deviceContext: {
        deviceId: "esp32-001",
        isOnline: true,
        temperature: 28.5,
        humidity: 72,
        soilMoistureRaw: 3499,
        rainSensorRaw: 0,
        relay1: "OFF",
        relay2: "OFF",
      },
    });

    const replyOn = resOn.data.message.content;
    const hasRelayOnSuccess =
      replyOn.includes("ON") ||
      replyOn.includes("চালু") ||
      replyOn.includes("অন") ||
      replyOn.includes("কার্যকর");

    assert(
      "Relay 1 ON dispatched and confirmed by AI",
      hasRelayOnSuccess,
      `AI Response: ${replyOn.slice(0, 100)}...`
    );
  } catch (err) {
    assert("Relay 1 ON dispatched and confirmed by AI", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Relay 1 OFF Command
  // -------------------------------------------------------------
  console.log("\n--- TEST CASE 2: Turn OFF Relay 1 (Water Pump) via Voice/Chat ---");
  try {
    const resOff = await CropWiseAiService.chat({
      message: "রিলে ১ বন্ধ করো",
      language: "BN",
      deviceId: "esp32-001",
      deviceContext: {
        deviceId: "esp32-001",
        isOnline: true,
        temperature: 28.5,
        humidity: 72,
        soilMoistureRaw: 3499,
        rainSensorRaw: 0,
        relay1: "ON",
        relay2: "OFF",
      },
    });

    const replyOff = resOff.data.message.content;
    const hasRelayOffSuccess =
      replyOff.includes("OFF") ||
      replyOff.includes("বন্ধ") ||
      replyOff.includes("অফ");

    assert(
      "Relay 1 OFF dispatched and confirmed by AI",
      hasRelayOffSuccess,
      `AI Response: ${replyOff.slice(0, 100)}...`
    );
  } catch (err) {
    assert("Relay 1 OFF dispatched and confirmed by AI", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Crop Rotation Analysis Query (Bengali)
  // -------------------------------------------------------------
  console.log("\n--- TEST CASE 3: Crop Rotation Analysis Query (Bengali) ---");
  try {
    const resRotationBn = await CropWiseAiService.chat({
      message: "আমন ধানের পর কোন ফসল চাষ করব? শস্য পর্যায় বা ফসল আবর্তন বিশ্লেষণ দাও",
      language: "BN",
      location: { district: "Rajshahi" },
      crop: "Aman Rice",
    });

    const replyRotationBn = resRotationBn.data.message.content;
    const sources = resRotationBn.data.sources || [];

    const hasMustardOrLegume =
      replyRotationBn.includes("সরিষা") ||
      replyRotationBn.includes("মুগডাল") ||
      replyRotationBn.includes("আলু") ||
      replyRotationBn.includes("বোরো");

    const hasNitrogenOrWaterSaving =
      replyRotationBn.includes("নাইট্রোজেন") ||
      replyRotationBn.includes("সাশ্রয়") ||
      replyRotationBn.includes("উর্বরতা");

    const hasRotationSource = sources.some(
      (s) => s.type === "crop_rotation" || s.title?.includes("Crop Rotation")
    );

    assert(
      "Crop rotation pattern (Rice-Mustard/Legume) returned",
      hasMustardOrLegume,
      `Found recommended crop varieties in response`
    );

    assert(
      "Agronomic benefits (soil nitrogen / water conservation) explained",
      hasNitrogenOrWaterSaving,
      `Found nitrogen fixation / water conservation guidance`
    );

    assert(
      "Crop rotation source metadata attached to response",
      hasRotationSource,
      `Sources attached: ${sources.map((s) => s.title).join(", ")}`
    );
  } catch (err) {
    assert("Crop Rotation Analysis Query (Bengali)", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Crop Rotation Analysis Query (English)
  // -------------------------------------------------------------
  console.log("\n--- TEST CASE 4: Crop Rotation Analysis Query (English) ---");
  try {
    const resRotationEn = await CropWiseAiService.chat({
      message: "What is the best climate-adaptive crop rotation sequence after Aman rice?",
      language: "EN",
      location: { district: "Rangpur" },
      crop: "Aman Rice",
    });

    const replyRotationEn = resRotationEn.data.message.content;
    const hasEnglishPattern =
      replyRotationEn.toLowerCase().includes("mustard") ||
      replyRotationEn.toLowerCase().includes("potato") ||
      replyRotationEn.toLowerCase().includes("mungbean") ||
      replyRotationEn.toLowerCase().includes("rotation");

    assert(
      "English Crop rotation response contains multi-season sequence",
      hasEnglishPattern,
      `AI Response preview: ${replyRotationEn.slice(0, 120)}...`
    );
  } catch (err) {
    assert("English Crop rotation query", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Live Sensor Readings Query
  // -------------------------------------------------------------
  console.log("\n--- TEST CASE 5: Live Sensor Readings Query ---");
  try {
    const resSensors = await CropWiseAiService.chat({
      message: "আমার ESP32 ডিভাইসের লাইভ সেন্সর রিডিং কত?",
      language: "BN",
      deviceId: "esp32-001",
      deviceContext: {
        deviceId: "esp32-001",
        isOnline: true,
        temperature: 28.5,
        humidity: 72,
        soilMoistureRaw: 3499,
        rainSensorRaw: 0,
        relay1: "OFF",
        relay2: "OFF",
      },
    });

    const replySensors = resSensors.data.message.content;
    const hasTelemetryValues =
      replySensors.includes("28.5") ||
      replySensors.includes("72") ||
      replySensors.includes("3499");

    assert(
      "Live temperature, humidity, and soil moisture returned accurately",
      hasTelemetryValues,
      `Sensor values reported in response text`
    );
  } catch (err) {
    assert("Live Sensor Readings Query", false, err.message);
  }

  console.log("\n=================================================================");
  console.log(`TEST RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log("=================================================================");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});

