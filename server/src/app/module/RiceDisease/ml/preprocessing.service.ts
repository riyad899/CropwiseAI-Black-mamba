import sharp, { Metadata } from "sharp";
import * as ort from "onnxruntime-node";
import { MODEL_VALIDATION_METRICS } from "../riceDisease.constant.js";

export interface PreprocessedImage {
  tensor: ort.Tensor;
  metadata: {
    format: string;
    originalWidth: number;
    originalHeight: number;
    processedWidth: number;
    processedHeight: number;
    channels: number;
    sizeBytes: number;
  };
}

export class PreprocessingService {
  private static readonly TARGET_SIZE = MODEL_VALIDATION_METRICS.preprocessing.image_size; // 224
  private static readonly MEAN = MODEL_VALIDATION_METRICS.preprocessing.mean; // [0.485, 0.456, 0.406]
  private static readonly STD = MODEL_VALIDATION_METRICS.preprocessing.std; // [0.229, 0.224, 0.225]

  /**
   * Validates image buffer content and inspects format and metadata.
   */
  public static async validateImage(buffer: Buffer): Promise<Metadata> {
    if (!buffer || buffer.length === 0) {
      throw new Error("Empty image buffer received");
    }

    try {
      const metadata = await sharp(buffer).metadata();
      const validFormats = ["jpeg", "png", "webp"];
      if (!metadata.format || !validFormats.includes(metadata.format.toLowerCase())) {
        throw new Error(`Unsupported image format: ${metadata.format || "unknown"}. Only JPEG, PNG, and WebP are supported.`);
      }

      if (!metadata.width || !metadata.height || metadata.width < 10 || metadata.height < 10) {
        throw new Error("Image dimensions are invalid or too small to analyze.");
      }

      return metadata;
    } catch (err: any) {
      if (err.message.includes("Unsupported image format") || err.message.includes("dimensions are invalid")) {
        throw err;
      }
      throw new Error(`Invalid or corrupted image file: ${err.message}`);
    }
  }

  /**
   * Preprocesses raw image buffer to ONNX float32 CHW tensor [1, 3, 224, 224]
   * matches PyTorch torchvision.transforms:
   * Resize((224, 224)) -> ToTensor() -> Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
   */
  public static async preprocess(buffer: Buffer): Promise<PreprocessedImage> {
    const rawMeta = await this.validateImage(buffer);

    // Extract raw RGB pixels resized to 224x224
    const { data, info } = await sharp(buffer)
      .rotate() // auto-orient based on EXIF
      .resize(this.TARGET_SIZE, this.TARGET_SIZE, {
        fit: "cover",
        position: "center",
      })
      .removeAlpha() // ensure 3 channels RGB
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const pixelCount = width * height; // 224 * 224 = 50,176

    // Planar CHW tensor [1, 3, 224, 224]
    const float32Data = new Float32Array(3 * pixelCount);

    const [meanR, meanG, meanB] = this.MEAN;
    const [stdR, stdG, stdB] = this.STD;

    // Sharp raw format gives interleaved RGB (R0, G0, B0, R1, G1, B1, ...)
    for (let i = 0; i < pixelCount; i++) {
      const r = data[i * 3];
      const g = data[i * 3 + 1];
      const b = data[i * 3 + 2];

      // Channel 0 (Red)
      float32Data[i] = (r / 255.0 - meanR) / stdR;
      // Channel 1 (Green)
      float32Data[pixelCount + i] = (g / 255.0 - meanG) / stdG;
      // Channel 2 (Blue)
      float32Data[2 * pixelCount + i] = (b / 255.0 - meanB) / stdB;
    }

    const tensor = new ort.Tensor("float32", float32Data, [1, 3, height, width]);

    return {
      tensor,
      metadata: {
        format: rawMeta.format || "jpeg",
        originalWidth: rawMeta.width || width,
        originalHeight: rawMeta.height || height,
        processedWidth: width,
        processedHeight: height,
        channels: 3,
        sizeBytes: buffer.length,
      },
    };
  }
}
