# 🌾 AI Rice Leaf Disease Detection (Computer Vision Engine)

[← Back to Main README](../README.md)

---

## 📌 Executive Overview

Rice (*Oryza sativa*) is the primary staple food crop of Bangladesh and vast regions of South Asia, feeding over 160 million people domestically. However, fungal pathogens, bacterial blights, viral complexes, and stem-boring pests routinely inflict **15% to 40% annual yield losses** when disease symptoms go undetected or are misdiagnosed by smallholder farmers lacking immediate access to certified agronomists.

To solve this critical challenge, **CropWise AI** integrates an in-house trained **EfficientNet-B0 Deep Convolutional Neural Network (CNN)** running native in-process inference via **ONNX Runtime Node.js (`onnxruntime-node`)** inside our Express.js + TypeScript backend.

Farmers and field extension officers can point their smartphone or laptop camera directly at an affected leaf—or upload a photo—to receive an **instant diagnosis within 25 milliseconds**, accompanied by calibrated probability rankings and tailored **agronomic action plans (Cultural, Chemical, and Organic bio-control)**.

---

## 🧠 Model Architecture & Technical Specifications

```
  +----------------------------------------------------------------------------+
  |                   Image Capture (Live Camera or Upload)                    |
  |                           JPG / PNG / WebP                                 |
  +-------------------------------------+--------------------------------------+
                                        |
                                        v
  +----------------------------------------------------------------------------+
  |              Image Preprocessing & Validation Pipeline (Sharp)             |
  |       • Format verification & EXIF auto-orientation                        |
  |       • Bilinear resize to 224 x 224 pixels                                |
  |       • Channel stripping to pure 3-channel RGB                            |
  |       • ImageNet Float32 normalization:                                    |
  |             Mean: [0.485, 0.456, 0.406] | Std: [0.229, 0.224, 0.225]       |
  |       • Planar NCHW Tensor creation: [1, 3, 224, 224]                      |
  +-------------------------------------+--------------------------------------+
                                        |
                                        v
  +----------------------------------------------------------------------------+
  |                   ONNX Runtime Node.js Execution Engine                    |
  |       • Model: EfficientNet-B0 Backbone (Compound Scaling)                 |
  |       • Native C++ CPU Inference Providers                                 |
  |       • Model Artifact: rice_leaf_efficientnet_b0.onnx (16.0 MB)           |
  |       • Execution Latency: ~24 ms on standard CPU                          |
  +-------------------------------------+--------------------------------------+
                                        |
                                        v
  +----------------------------------------------------------------------------+
  |                     Softmax Probabilities & Ranking                        |
  |       • Numerically stable Softmax calculation                             |
  |       • Ranked confidence distribution across all 10 classes               |
  |       • Top-1 prediction with English and Bengali farmer display names     |
  +-------------------------------------+--------------------------------------+
                                        |
                    +-------------------+-------------------+
                    |                                       |
                    v                                       v
  +------------------------------------+   +------------------------------------+
  |      Neon PostgreSQL Storage       |   |       Client User Interface        |
  |   • Prediction audit log           |   |   • Confidence Gauge & Badges      |
  |   • User diagnosis history         |   |   • Cultural / Chemical / Organic  |
  |   • Model latency telemetry        |   |   • TTS Audio Read-Out (EN/BN)     |
  +------------------------------------+   |   • 1-Click "Ask CropWise AI"      |
                                           +------------------------------------+
```

---

## 📊 Reported Validation Metrics & Performance

The model was rigorously validated against an independent benchmark of **2,082 ground-truth rice leaf images** across all 10 target classes:

| Metric | Score |
| :--- | :---: |
| **Overall Validation Accuracy** | **95.05%** |
| **Macro F1-Score** | **94.56%** |
| **Macro Precision** | **93.78%** |
| **Macro Recall** | **95.50%** |
| **Average CPU Inference Latency** | **~24 ms** |
| **Memory Footprint** | **~16 MB (ONNX format)** |

### Class-Wise F1 Performance Breakdown

| Index | Class Identifier | English Name | Bengali Name | Category | Reported F1 |
|:---:|:---|:---|:---|:---:|:---:|
| `0` | `bacterial_leaf_blight` | Bacterial Leaf Blight | ব্যাকটেরিয়াল লিফ ব্লাইট (পাতা পোড়া রোগ) | Bacterial | **94%** |
| `1` | `bacterial_leaf_streak` | Bacterial Leaf Streak | ব্যাকটেরিয়াল লিফ স্ট্রিক (পাতার ডোরা রোগ) | Bacterial | **92%** |
| `2` | `bacterial_panicle_blight` | Bacterial Panicle Blight | ব্যাকটেরিয়াল প্যানিকল ব্লাইট (শীষ পোড়া রোগ) | Bacterial | **97%** |
| `3` | `blast` | Rice Blast | ধানের ব্লাস্ট রোগ (পাতা/শীষ ব্লাস্ট) | Fungal | **95%** |
| `4` | `brown_spot` | Brown Spot | বাদামী দাগ রোগ (ব্রাউন স্পট) | Fungal | **95%** |
| `5` | `dead_heart` | Dead Heart (Stem Borer) | মাজরা পোকার আক্রমণ (ডেড হার্ট) | Pest | **99%** |
| `6` | `downy_mildew` | Downy Mildew | ডাউনি মিলডিউ রোগ | Fungal | **91%** |
| `7` | `hispa` | Rice Hispa | ধানের পামরী পোকা (হিসপা) | Pest | **94%** |
| `8` | `normal` | Healthy Rice Leaf | সুস্থ ধানের পাতা (রোগমুক্ত) | Healthy | **97%** |
| `9` | `tungro` | Rice Tungro Disease | টুংরো রোগ (হলুদ হওয়া রোগ) | Viral | **93%** |

---

## 🛠️ Agronomic Decision Support & Treatment Library

Every diagnosed disease triggers a comprehensive, multi-layered agronomic advisory synthesized from verified Bangladesh Rice Research Institute (BRRI) guidelines:

1. **🚜 Cultural Management (কৃষিতাত্ত্বিক ব্যবস্থাপনা):**
   - Immediate standing water management (e.g., draining water for 3–4 days to arrest bacterial motility).
   - Nitrogen split-application stoppage and supplemental Muriate of Potash (MOP) top-dressing.
   - Alternate Wetting and Drying (AWD) adoption to expose lower tillers.

2. **🧪 Chemical Treatment (রাসায়নিক প্রতিকার):**
   - Precise active ingredient recommendations (e.g., Tricyclazole 75 WP @ 0.75g/L for Blast; Copper Oxychloride 50 WP @ 2g/L for Bacterial Blight; Cartap Hydrochloride 50 SP @ 1g/L for Stem Borer).
   - Strict safety thresholds and application timing (e.g., late afternoon spraying).

3. **🌿 Organic & Biological Remedies (জৈব ও ভেষজ দমন):**
   - Bio-control agents including *Trichoderma harzianum* foliar wash (@ 5g/L) and *Pseudomonas fluorescens* seed primers.
   - 10% Neem Seed Kernel Extract (NSKE) and fermented cow dung slurry supernatant.
   - Pheromone traps and bamboo T-perches for insectivorous birds.

4. **🛡️ Preventative Measures & Resistant Varieties:**
   - Certified resistant seed cultivar recommendations (e.g., BRRI dhan48, BRRI dhan58, BRRI dhan89).
   - Hot water seed priming (56°C for 15 minutes) and seedling tip clipping.

---

## 📱 User Interface & Client Experience

The client dashboard provides an accessible interface built in Next.js 16 and Tailwind CSS:

- **Live Camera Viewfinder:** Real-time camera feed using HTML5 `navigator.mediaDevices.getUserMedia` with rear/selfie flip controls and on-screen lesion alignment guides.
- **Drag & Drop Upload:** Accepts JPG, PNG, and WebP images up to 10 MB with dimension and resolution checks.
- **1-Click Sample Leaves:** Preloaded sample leaves allowing evaluators and farmers to test the model with one click.
- **🔊 Text-to-Speech (TTS):** Browser-native speech synthesizer that reads aloud the diagnosis and primary action plan in English or Bengali.
- **💬 Direct CropWise AI Integration:** One-click button that navigates directly to `/dashboard/ask-ai` with pre-filled conversational queries about managing the diagnosed condition.
- **Historical Scan Tracking:** Paginated history of past scans saved in Neon PostgreSQL.

---

## 🔌 API Reference & cURL Testing

### 1. Model Health
```bash
curl -X GET http://localhost:5000/api/v1/rice-disease/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model": "EfficientNet-B0",
    "status": "ready",
    "runtime": "onnxruntime-node",
    "classes": 10,
    "inferenceCount": 12,
    "averageInferenceTimeMs": 24.5,
    "uptimeSeconds": 3600
  }
}
```

### 2. Model Information & Metrics
```bash
curl -X GET http://localhost:5000/api/v1/rice-disease/model-info
```

### 3. Predict Rice Leaf Disease
```bash
curl -X POST http://localhost:5000/api/v1/rice-disease/predict \
  -F "image=@/path/to/rice_leaf.jpg"
```

---

[← Back to Main README](../README.md) • [Next: System Architecture →](SYSTEM_ARCHITECTURE.md)
