# ✨ Features & Agricultural Decision Support

[← Back to Main README](../README.md)

---

CropWise AI translates scientific data into five interconnected modules designed to guide agricultural planning, mitigate climate vulnerabilities, and boost yield security.

---

## 🌟 Feature Breakdown

### 1. 🌡️ Climate Intelligence
- **Long-term Meteorological Analysis:** Tracks daily trends in precipitation, land surface temperature (LST), and solar radiation.
- **Water Deficit Index (WDI):** Calculates the real-time balance between actual evapotranspiration ($ET$) and potential evapotranspiration ($PET$).
- **Vulnerability Indices:** Displays the Vegetation Condition Index (VCI) and Thermal Stress Index (TSI) for every monitored district.

### 2. 🗺️ Geospatial Environmental Analysis
- **Dynamic Map Canvas:** Integrated Mapbox GL / Google Maps mapping interface supporting custom polygon overlays.
- **Multispectral Layers:** Toggle between Landsat 30m NDVI vegetation vigor, NDWI surface moisture, and ECOSTRESS thermal heat signatures.
- **Topographic Context:** Visualizes NASADEM slope gradients and terrain erosion risk factors.

### 3. 🛡️ Environmental Risk Intelligence
Identifies composite hazards by synthesizing environmental indicators:
- **Heat Wave & Thermal Stress:** Flags temperatures exceeding physiological thresholds for staple crops.
- **Precipitation Deficit:** Highlights deviations from historical rainfall baselines to forecast drought stress.
- **Root-zone Water Saturation:** Alerts farmers to waterlogging risks or depleted soil moisture.
- **Soil Degradation Vulnerability:** Assesses organic carbon levels and soil texture risks across depth strata ($0–30\text{ cm}$).

### 4. 🤖 AI-Powered Agronomic Assistant
- **RAG Architecture:** Retrieval-Augmented Generation grounded directly in verified NASA satellite observations, SoilGrids records, and local IoT logs.
- **Plain-Language Explanations:** Translates complex statistical regression and anomaly models into farmer-friendly recommendations.
- **Bilingual Support:** Understands and generates recommendations in both English and Bengali.

### 5. 🌾 Climate-Smart Crop Rotation & Recommendations
- **Dynamic Agronomic Matching:** Evaluates farm coordinates against historical moisture regimes, temperature extremes, and soil nutrients.
- **Multi-Season Planning:** Recommends optimal sowing windows for Aus, Aman, Boro rice, pulses, and winter vegetables.
- **Actionable Decision Guides:** Outlines exact seedbed preparations, irrigation timing, and fertilizer schedules based on real-time field status.

### 6. 🌿 Computer Vision Rice Leaf Disease Diagnosis
- **Deep Convolutional Neural Network (EfficientNet-B0):** Real-time image-based pathogen classification trained on 10 major rice diseases with **95.05% validation accuracy** and **94.56% Macro F1**.
- **Native ONNX Runtime Inference:** In-process CPU inference engine running within Express.js + Node.js (sub-25ms latency, no Python server required).
- **Dual Capture Methods:** Supports instant live camera capture (via WebRTC/getUserMedia with rear/selfie switching) or photo upload (JPG/PNG/WebP).
- **Multi-Tiered Agronomic Advisory:** Generates structured action plans across **Cultural Management**, **Chemical Controls (with dosages)**, and **Organic Bio-Control Remedies**.
- **Speech Synthesis (TTS) & AI Integration:** Reads diagnoses aloud in English or Bengali, with 1-click handoff to the conversational AI Assistant.
- [Detailed Disease Detection Technical Guide →](CROP_DISEASE_DETECTION.md)

---

[← Back to Main README](../README.md) • [Next: Workflow & Limitations →](WORKFLOW_AND_LIMITATIONS.md)

