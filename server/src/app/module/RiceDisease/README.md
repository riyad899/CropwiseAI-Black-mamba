# CropWise AI — Rice Leaf Disease Detection Backend Module

This production module integrates the trained **EfficientNet-B0** Rice Leaf Disease Classification model directly into the Express.js + TypeScript backend using **ONNX Runtime Node.js (`onnxruntime-node`)** and **Sharp**.

---

## 1. Architecture Overview

```
                      +---------------------------------------+
                      |       Next.js / Client / IoT          |
                      +-------------------+-------------------+
                                          | multipart/form-data ('image')
                                          v
                      +---------------------------------------+
                      |         Express.js Router             |
                      |   /api/v1/rice-disease/predict        |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |         Image Validation              |
                      |   Sharp: Magic Bytes, Format, EXIF    |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       Image Preprocessing             |
                      |   Resize 224x224 -> RGB Float32       |
                      |   Normalize (ImageNet Mean & Std)     |
                      |   Tensor Shape: [1, 3, 224, 224] NCHW |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       ONNX Runtime Node.js            |
                      |   EfficientNet-B0 (10 Classes)        |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |     Softmax Probabilities & Rank      |
                      |   Top-1 Class + All 10 Class Probs    |
                      |   Farmer-friendly English & Bengali   |
                      |   Agronomic & Treatment Guidelines    |
                      +-------------------+-------------------+
                                          |
                         +----------------+----------------+
                         |                                 |
                         v                                 v
        +---------------------------------+   +-------------------------+
        |   Neon PostgreSQL Database      |   |   JSON Response         |
        |   rice_disease_prediction      |   |   HTTP 200 OK           |
        +---------------------------------+   +-------------------------+
```

---

## 2. Model Specifications & Verified Class Indices

- **Architecture:** `efficientnet_b0`
- **Number of Classes:** 10
- **Input Dimensions:** `[1, 3, 224, 224]` (Batch x Channels x Height x Width)
- **Color Ordering:** RGB
- **Normalization Mean:** `[0.485, 0.456, 0.406]`
- **Normalization Std:** `[0.229, 0.224, 0.225]`
- **Model Checkpoint Source:** `server/models/best_model.pth`
- **ONNX Model Artifact:** `server/src/app/module/RiceDisease/ml/model/rice_leaf_efficientnet_b0.onnx` (~16.0 MB)

### Class Mapping (0–9)

| Index | Class Identifier | English Display Name | Bengali Display Name | Category | Reported F1 |
|:---:|:---|:---|:---|:---:|:---:|
| `0` | `bacterial_leaf_blight` | Bacterial Leaf Blight | ব্যাকটেরিয়াল লিফ ব্লাইট (পাতা পোড়া রোগ) | Bacterial | 94% |
| `1` | `bacterial_leaf_streak` | Bacterial Leaf Streak | ব্যাকটেরিয়াল লিফ স্ট্রিক (পাতার ডোরা রোগ) | Bacterial | 92% |
| `2` | `bacterial_panicle_blight` | Bacterial Panicle Blight | ব্যাকটেরিয়াল প্যানিকল ব্লাইট (শীষ পোড়া রোগ) | Bacterial | 97% |
| `3` | `blast` | Rice Blast | ধানের ব্লাস্ট রোগ (পাতা/শীষ ব্লাস্ট) | Fungal | 95% |
| `4` | `brown_spot` | Brown Spot | বাদামী দাগ রোগ (ব্রাউন স্পট) | Fungal | 95% |
| `5` | `dead_heart` | Dead Heart (Stem Borer) | মাজরা পোকার আক্রমণ (ডেড হার্ট) | Pest | 99% |
| `6` | `downy_mildew` | Downy Mildew | ডাউনি মিলডিউ রোগ | Fungal | 91% |
| `7` | `hispa` | Rice Hispa | ধানের পামরী পোকা (হিসপা) | Pest | 94% |
| `8` | `normal` | Healthy Rice Leaf | সুস্থ ধানের পাতা (রোগমুক্ত) | Healthy | 97% |
| `9` | `tungro` | Rice Tungro Disease | টুংরো রোগ (হলুদ হওয়া রোগ) | Viral | 93% |

### Reported Validation Metrics (2,082 Validation Images)
- **Accuracy:** 95.05%
- **Macro F1-score:** 94.56%
- **Macro Precision:** 93.78%
- **Macro Recall:** 95.50%

---

## 3. API Endpoints

All endpoints are available under `/api/v1/rice-disease` (and aliased at `/api/rice-disease`).

### A. Health Check
`GET /api/v1/rice-disease/health`

**Response:**
```json
{
  "success": true,
  "message": "Rice Disease model is loaded and ready",
  "data": {
    "model": "EfficientNet-B0",
    "status": "ready",
    "runtime": "onnxruntime-node",
    "classes": 10,
    "modelPath": "rice_leaf_efficientnet_b0.onnx",
    "inferenceCount": 6,
    "averageInferenceTimeMs": 35.2,
    "uptimeSeconds": 120
  }
}
```

### B. Model Information & Metrics
`GET /api/v1/rice-disease/model-info`

**Response:**
```json
{
  "success": true,
  "message": "Rice disease classification model metadata retrieved successfully",
  "data": {
    "modelName": "EfficientNet-B0 Rice Leaf Disease Classifier",
    "architecture": "efficientnet_b0",
    "version": "1.0",
    "numClasses": 10,
    "classes": [ ... ],
    "inputDimensions": {
      "channels": 3,
      "width": 224,
      "height": 224,
      "layout": "NCHW [1, 3, 224, 224]"
    },
    "normalization": {
      "mean": [0.485, 0.456, 0.406],
      "std": [0.229, 0.224, 0.225],
      "colorSpace": "RGB"
    },
    "runtime": "onnxruntime-node",
    "status": "ready",
    "reportedValidationMetrics": {
      "accuracy": 0.9505,
      "macroF1": 0.9456,
      "macroPrecision": 0.9378,
      "macroRecall": 0.955,
      "totalValidationImages": 2082,
      "classF1Scores": { ... }
    }
  }
}
```

### C. Predict Rice Disease
`POST /api/v1/rice-disease/predict`
- **Content-Type:** `multipart/form-data`
- **Field:** `image` (binary file: JPG, JPEG, PNG, or WebP; max 10MB)

**Response:**
```json
{
  "success": true,
  "message": "Rice leaf analysis completed successfully",
  "data": {
    "prediction": {
      "class": "hispa",
      "displayName": "Rice Hispa",
      "displayNameBn": "ধানের পামরী পোকা (হিসপা)",
      "confidence": 0.2686,
      "category": "Pest",
      "severity": "High",
      "isHealthy": false
    },
    "probabilities": [
      {
        "class": "hispa",
        "displayName": "Rice Hispa",
        "displayNameBn": "ধানের পামরী পোকা (হিসপা)",
        "confidence": 0.2686,
        "percentage": "26.86%",
        "rank": 1
      },
      {
        "class": "bacterial_leaf_blight",
        "displayName": "Bacterial Leaf Blight",
        "displayNameBn": "ব্যাকটেরিয়াল লিফ ব্লাইট (পাতা পোড়া রোগ)",
        "confidence": 0.1521,
        "percentage": "15.21%",
        "rank": 2
      }
      // ... all 10 classes sorted descending
    ],
    "diseaseDetails": {
      "scientificName": "Dicladispa armigera",
      "description": "Spiny beetle pest whose adults scrape the upper epidermis and larvae mine between leaf layers...",
      "symptoms": [ ... ],
      "cause": "...",
      "favorableConditions": [ ... ],
      "preventions": [ ... ],
      "treatment": {
        "cultural": [ ... ],
        "chemical": [ ... ],
        "organic": [ ... ]
      }
    },
    "model": {
      "name": "EfficientNet-B0 Rice Leaf Disease Classifier",
      "architecture": "efficientnet_b0",
      "version": "1.0",
      "runtime": "onnxruntime-node"
    },
    "image": {
      "originalName": "Leaf.png",
      "fileSizeBytes": 875975,
      "format": "png",
      "dimensions": {
        "originalWidth": 1159,
        "originalHeight": 1356,
        "processedWidth": 224,
        "processedHeight": 224
      }
    },
    "processingTimeMs": 24,
    "timestamp": "2026-11-18T04:29:48.000Z",
    "savedRecordId": "d0d4ef9e-f439-48c6-9f51-5c38521dfaef"
  }
}
```

### D. Prediction History
`GET /api/v1/rice-disease/history?page=1&limit=20&disease=blast`

### E. Single Diagnosis Detail
`GET /api/v1/rice-disease/history/:id`

### F. Delete Diagnosis Record
`DELETE /api/v1/rice-disease/history/:id`

---

## 4. cURL Testing Examples

```bash
# 1. Health check
curl -X GET http://localhost:5000/api/v1/rice-disease/health

# 2. Model info
curl -X GET http://localhost:5000/api/v1/rice-disease/model-info

# 3. Analyze leaf image
curl -X POST http://localhost:5000/api/v1/rice-disease/predict \
  -F "image=@/path/to/rice_leaf.jpg"
```

