import { Router } from "express";
import multer from "multer";
import { optionalAuth } from "../../../middleware/checkAuth.js";
import { RiceDiseaseController } from "./riceDisease.controller.js";
import { ALLOWED_IMAGE_MIMES, MAX_IMAGE_SIZE_BYTES } from "./riceDisease.constant.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP.`));
    }
  },
});

const router = Router();

// Model status and introspection endpoints
router.get("/health", RiceDiseaseController.getHealth);
router.get("/model-info", RiceDiseaseController.getModelInfo);

// Main disease diagnosis endpoint
router.post("/predict", upload.single("image"), optionalAuth(), RiceDiseaseController.predict);

// Diagnosis history endpoints
router.get("/history", optionalAuth(), RiceDiseaseController.getHistory);
router.get("/history/:id", optionalAuth(), RiceDiseaseController.getHistoryById);
router.delete("/history/:id", optionalAuth(), RiceDiseaseController.deleteHistory);

export const RiceDiseaseRoute = router;

