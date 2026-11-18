"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  ChevronRight,
  Volume2,
  VolumeX,
  ExternalLink,
  BotMessageSquare,
  Clock,
  Layers,
  ArrowRight,
  Maximize2,
  Check,
  X,
  Bug,
  Sprout,
  Leaf,
  Activity,
  History,
  FileImage,
  SwitchCamera,
} from "lucide-react";
import { TransparentNavSlot } from "../../header-context";
import { useLanguage } from "@/lib/language-context";
import {
  predictRiceDisease,
  useRiceDiseaseHealth,
  useRiceDiseaseModelInfo,
  useRiceDiseaseHistory,
  IRiceDiseasePredictionResult,
} from "@/lib/apis/riceDisease.api";

export default function RiceDiseasePage() {
  const { lang } = useLanguage();
  const isBn = lang === "BN";

  // Tab: 'camera' | 'upload'
  const [activeInputTab, setActiveInputTab] = useState<"upload" | "camera">("upload");

  // State for image handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<IRiceDiseasePredictionResult | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"treatment" | "symptoms" | "prevention" | "probabilities">("treatment");

  // Speech / TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Queries
  const { data: healthData } = useRiceDiseaseHealth();
  const { data: modelInfoData } = useRiceDiseaseModelInfo();
  const { data: historyData, refetch: refetchHistory } = useRiceDiseaseHistory(1, 5);

  // Clean up media stream on unmount
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopCamera]);

  // Start Camera
  const startCamera = async (mode: "environment" | "user" = facingMode) => {
    setCameraError(null);
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        isBn
          ? "ক্যামেরা এক্সেস করা যায়নি। দয়া করে ব্রাউজার ক্যামেরা পারমিশন চেক করুন অথবা ছবি আপলোড অপশনটি ব্যবহার করুন।"
          : "Could not access camera. Please allow camera permissions or upload an image file instead."
      );
      setIsCameraActive(false);
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          stopCamera();
          // Auto-run analysis on snap
          handleAnalyzeBlob(blob, "leaf_camera_capture.jpg");
        }
      },
      "image/jpeg",
      0.92
    );
  };

  // File Picker Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setAnalysisError(null);
    setResult(null);
    setSelectedFile(file);
    setCapturedBlob(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Drag and Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processSelectedFile(file);
    }
  };

  // Analyze Action
  const handleAnalyzeBlob = async (blob: Blob | File, filename?: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await predictRiceDisease(blob, filename);
      setResult(response);
      refetchHistory();
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      setAnalysisError(
        err?.message || (isBn ? "বিশ্লেষণ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।" : "Diagnosis failed. Please try again.")
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartAnalysis = () => {
    if (capturedBlob) {
      handleAnalyzeBlob(capturedBlob, "leaf_camera_capture.jpg");
    } else if (selectedFile) {
      handleAnalyzeBlob(selectedFile, selectedFile.name);
    }
  };

  // Reset image and result
  const handleReset = () => {
    setSelectedFile(null);
    setCapturedBlob(null);
    setPreviewUrl(null);
    setResult(null);
    setAnalysisError(null);
    stopCamera();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Quick Sample Leaf Selector
  const loadSampleLeaf = async (samplePath: string, name: string) => {
    handleReset();
    setIsAnalyzing(true);
    try {
      const res = await fetch(samplePath);
      const blob = await res.blob();
      const file = new File([blob], name, { type: blob.type || "image/png" });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      const diagnosis = await predictRiceDisease(file, name);
      setResult(diagnosis);
      refetchHistory();
    } catch (err: any) {
      setAnalysisError(err?.message || "Failed to load sample image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Text to Speech
  const toggleTTS = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!result) return;
    const { prediction, diseaseDetails } = result;
    const textToSpeak = isBn
      ? `শনাক্ত রোগ: ${prediction.displayNameBn}। নির্ভুলতা: ${(prediction.confidence * 100).toFixed(0)} শতাংশ। সারসংক্ষেপ: ${diseaseDetails.description}। মূল চিকিৎসা: ${diseaseDetails.treatment.chemical[0] || diseaseDetails.treatment.cultural[0] || ""}`
      : `Diagnosis: ${prediction.displayName}. Confidence: ${(prediction.confidence * 100).toFixed(0)} percent. Symptoms: ${diseaseDetails.description}. Primary Treatment: ${diseaseDetails.treatment.chemical[0] || diseaseDetails.treatment.cultural[0] || ""}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Severity style helper
  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-slate-800 pb-20">
      <TransparentNavSlot />

      {/* ─────────────────────────────────────────────────────────────
          HERO BANNER
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-900/90 via-emerald-800/80 to-transparent pt-28 pb-16 px-4 md:px-8">
        <div className="absolute inset-0 -z-10 opacity-25">
          <Image
            src="/hero-bg.jpg"
            alt="Paddy Field"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                <span>EfficientNet-B0 Deep Learning Vision Engine</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                {isBn ? "ধানের পাতা রোগ নির্ণয়" : "Rice Leaf Disease Detection"}
              </h1>
              <p className="mt-2 text-sm md:text-base text-emerald-100/90 max-w-2xl leading-relaxed">
                {isBn
                  ? "সরাসরি ক্যামেরা দিয়ে ছবি তুলুন অথবা পাতার ছবি আপলোড করুন। এআই মডেল ৯৫% নির্ভুলতায় রোগ শনাক্ত করবে এবং প্রতিকারমূলক পরামর্শ প্রদান করবে।"
                  : "Click a live photo with your camera or upload a leaf image. Our in-house trained EfficientNet-B0 model diagnoses 10 rice diseases with 95.05% reported accuracy."}
              </p>
            </div>

            {/* Model Health Pill */}
            <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-white shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <div className="text-left">
                  <div className="text-xs font-semibold tracking-wide uppercase text-emerald-200">
                    {healthData?.status === "ready" ? (isBn ? "মডেল প্রস্তুত" : "Model Operational") : (isBn ? "লোড হচ্ছে..." : "Loading...")}
                  </div>
                  <div className="text-[11px] text-white/80">
                    ONNX Native • 10 Classes • ~25ms Latency
                  </div>
                </div>
              </div>
              <div className="hidden sm:block h-6 w-px bg-white/20" />
              <div className="hidden sm:block text-right">
                <div className="text-[11px] text-emerald-200 font-medium">Validation Accuracy</div>
                <div className="text-xs font-bold text-white">95.05% Macro F1</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT CONTAINER
         ───────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ══════════════════════════════════════════════════════════
              LEFT COLUMN: Photo Input & Scanner (lg:col-span-5)
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80">

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveInputTab("upload");
                    stopCamera();
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                    activeInputTab === "upload"
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span>{isBn ? "ছবি আপলোড করুন" : "Upload Photo"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveInputTab("camera");
                    startCamera();
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                    activeInputTab === "camera"
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span>{isBn ? "ক্যামেরা দিয়ে তুলুন" : "Live Camera"}</span>
                </button>
              </div>

              {/* TAB 1: LIVE CAMERA VIEW */}
              {activeInputTab === "camera" && (
                <div className="space-y-4">
                  {cameraError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">{isBn ? "ক্যামেরা ত্রুটি" : "Camera Access Issue"}</p>
                          <p className="mt-1 text-slate-600">{cameraError}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => startCamera()}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700"
                        >
                          {isBn ? "পুনরায় চেষ্টা" : "Retry Camera"}
                        </button>
                        <label className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium cursor-pointer hover:bg-slate-50">
                          <span>{isBn ? "গ্যালারি থেকে নিন" : "Pick from Gallery"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : !previewUrl ? (
                    <div className="relative overflow-hidden rounded-2xl bg-black aspect-[4/3] flex items-center justify-center border-2 border-emerald-500/40">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Camera Overlay Guide */}
                      <div className="absolute inset-4 rounded-xl border-2 border-dashed border-white/50 pointer-events-none flex flex-col justify-between p-3">
                        <div className="flex justify-between items-center">
                          <span className="bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur">
                            {isBn ? "পাতার ক্ষত চিহ্নে ফোকাস করুন" : "Align Leaf Lesion in Frame"}
                          </span>
                          <button
                            type="button"
                            onClick={toggleFacingMode}
                            className="pointer-events-auto h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                            title="Flip Camera"
                          >
                            <SwitchCamera className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex justify-center pb-2 pointer-events-auto">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="h-16 w-16 rounded-full border-4 border-white bg-emerald-500 shadow-xl flex items-center justify-center active:scale-95 transition hover:bg-emerald-600"
                            title="Snap Photo"
                          >
                            <Camera className="h-7 w-7 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* TAB 2: UPLOAD PHOTO VIEW */}
              {activeInputTab === "upload" && !previewUrl && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="group relative rounded-2xl border-2 border-dashed border-emerald-400/60 bg-emerald-50/40 p-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50/80"
                >
                  <input
                    type="file"
                    id="leaf-upload-input"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="leaf-upload-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition shadow-inner">
                      <FileImage className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {isBn ? "পাতার ছবি টেনে আনুন বা ক্লিক করুন" : "Drag & Drop leaf photo or click to browse"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        JPEG, PNG, WebP up to 10 MB
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{isBn ? "ছবি সিলেক্ট করুন" : "Select Image"}</span>
                    </span>
                  </label>
                </div>
              )}

              {/* IMAGE PREVIEW & SCANNER OVERLAY */}
              {previewUrl && (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl bg-slate-900 aspect-[4/3] flex items-center justify-center border border-slate-200">
                    <Image
                      src={previewUrl}
                      alt="Rice Leaf Preview"
                      fill
                      className="object-contain"
                    />

                    {/* Scanning Animation */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none flex flex-col justify-between">
                        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_15px_#34d399]" />
                        <div className="p-3 bg-black/60 backdrop-blur text-white text-center text-xs font-medium">
                          <span className="inline-flex items-center gap-2">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                            {isBn ? "এআই মডেল বিশ্লেষণ করছে..." : "Running EfficientNet-B0 inference..."}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Floating Controls */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="h-8 w-8 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition"
                        title="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur px-2.5 py-1 text-[11px] font-mono text-emerald-300">
                        <Layers className="h-3 w-3" />
                        <span>Ready (224x224 RGB)</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={handleStartAnalysis}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>{isBn ? "শনাক্ত করা হচ্ছে..." : "Diagnosing Leaf..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>{isBn ? "রোগ নির্ণয় করুন" : "Analyze Leaf Disease"}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition"
                    >
                      {isBn ? "রিসেট" : "Reset"}
                    </button>
                  </div>
                </div>
              )}

              {/* Sample Images Quick Test */}
              <div className="pt-5 mt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{isBn ? "দ্রুত টেস্ট করতে নমুনা ছবি" : "Quick Test Sample Leaves"}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => loadSampleLeaf("/Leaf.png", "Sample_Leaf_1.png")}
                    className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition text-left text-xs font-medium text-slate-700"
                  >
                    <div className="h-8 w-8 relative rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <Image src="/Leaf.png" alt="Sample 1" fill className="object-cover" />
                    </div>
                    <span className="truncate">Field Leaf Specimen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadSampleLeaf("/Green Leaf.png", "Sample_Green_Leaf.png")}
                    className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition text-left text-xs font-medium text-slate-700"
                  >
                    <div className="h-8 w-8 relative rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <Image src="/Green Leaf.png" alt="Sample 2" fill className="object-cover" />
                    </div>
                    <span className="truncate">Healthy Specimen</span>
                  </button>
                </div>
              </div>

              {/* Error display */}
              {analysisError && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{analysisError}</span>
                </div>
              )}
            </div>

            {/* Model Class Reference Card */}
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span>{isBn ? "সনাক্তযোগ্য ধানের ১০টি রোগ" : "Detectable 10 Disease Classes"}</span>
                <span className="text-emerald-700 font-mono text-[11px]">10/10 Classes</span>
              </h3>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
                {[
                  { en: "Bacterial Leaf Blight", bn: "পাতা পোড়া রোগ" },
                  { en: "Bacterial Leaf Streak", bn: "পাতার ডোরা রোগ" },
                  { en: "Bacterial Panicle Blight", bn: "শীষ পোড়া রোগ" },
                  { en: "Rice Blast", bn: "ব্লাস্ট রোগ" },
                  { en: "Brown Spot", bn: "ব্রাউন স্পট" },
                  { en: "Dead Heart (Stem Borer)", bn: "মাজরা পোকা" },
                  { en: "Downy Mildew", bn: "ডাউনি মিলডিউ" },
                  { en: "Rice Hispa", bn: "পামরী পোকা" },
                  { en: "Healthy Rice Leaf", bn: "সুস্থ পাতা" },
                  { en: "Rice Tungro", bn: "টুংরো রোগ" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 p-1 rounded-md hover:bg-slate-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="truncate">{isBn ? item.bn : item.en}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT COLUMN: Diagnosis Results & Advisory (lg:col-span-7)
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            {!result ? (
              <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-200/80 flex flex-col items-center justify-center min-h-[460px]">
                <div className="h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
                  <Sprout className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isBn ? "কোন রোগ বিশ্লেষণ এখনও শুরু হয়নি" : "No Diagnosis Performed Yet"}
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  {isBn
                    ? "বাম পাশের ক্যামেরা দিয়ে ধান পাতার ছবি তুলুন অথবা আপলোড করে 'রোগ নির্ণয় করুন' বাটনে চাপ দিন।"
                    : "Snap a photo using your camera or upload a rice leaf image to generate an instant diagnosis and treatment plan."}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInputTab("camera");
                      startCamera();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{isBn ? "ক্যামেরা চালু করুন" : "Open Camera"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleLeaf("/Leaf.png", "Sample_Leaf_1.png")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{isBn ? "নমুনা দিয়ে চেষ্টা করুন" : "Try Sample Leaf"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* ── TOP PREDICTION CARD ── */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-50 rounded-full blur-2xl -z-0 pointer-events-none" />

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityBadge(result.prediction.severity)}`}>
                          {result.prediction.severity} Severity
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {result.prediction.category}
                        </span>
                        {result.prediction.isHealthy && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Healthy
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {isBn ? result.prediction.displayNameBn : result.prediction.displayName}
                      </h2>
                      <div className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-2">
                        <span>{isBn ? result.prediction.displayName : result.prediction.displayNameBn}</span>
                        {result.diseaseDetails.scientificName && (
                          <>
                            <span>•</span>
                            <span className="italic">{result.diseaseDetails.scientificName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Confidence Meter */}
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-extrabold text-emerald-700 font-mono">
                          {(result.prediction.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Confidence Score</span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Zap className="h-3 w-3" />
                        <span>{result.processingTimeMs} ms</span>
                      </span>
                    </div>
                  </div>

                  {/* Summary & Voice Button */}
                  <p className="mt-4 text-xs md:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {result.diseaseDetails.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleTTS}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          isSpeaking
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5" />
                            <span>{isBn ? "পড়া বন্ধ করুন" : "Stop Reading"}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5" />
                            <span>{isBn ? "পড়ে শোনান" : "Read Aloud"}</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/dashboard/ask-ai?q=${encodeURIComponent(
                          isBn
                            ? `আমার ধানক্ষেতে ${result.prediction.displayNameBn} দেখা গেছে। কিভাবে দমন করব?`
                            : `My rice leaf has ${result.prediction.displayName}. What is the step-by-step treatment plan?`
                        )}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
                      >
                        <BotMessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                        <span>{isBn ? "এআই-এর সাথে কথা বলুন" : "Ask CropWise AI"}</span>
                      </Link>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Image: {result.image.dimensions.originalWidth}x{result.image.dimensions.originalHeight} ({Math.round(result.image.fileSizeBytes / 1024)} KB)
                    </div>
                  </div>
                </div>

                {/* ── INTERACTIVE ADVISORY TABS ── */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto">
                    {[
                      { id: "treatment", label: isBn ? "চিকিৎসা ও প্রতিকার" : "Treatment & Action Plan", icon: ShieldCheck },
                      { id: "symptoms", label: isBn ? "লক্ষণ ও কারণ" : "Symptoms & Cause", icon: AlertTriangle },
                      { id: "prevention", label: isBn ? "প্রতিরোধ ও সতর্কতা" : "Prevention Measures", icon: Sprout },
                      { id: "probabilities", label: isBn ? "সম্ভাব্যতা বিন্যাস (১০টি রোগ)" : "10-Class Probabilities", icon: Activity },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeDetailTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveDetailTab(tab.id as any)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                            isActive
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB 1: TREATMENT & ACTION PLAN */}
                  {activeDetailTab === "treatment" && (
                    <div className="space-y-4">
                      {/* Cultural practices */}
                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide mb-2">
                          <Sprout className="h-4 w-4 text-amber-700" />
                          <span>{isBn ? "কৃষিতাত্ত্বিক ব্যবস্থাপনা (Cultural Control)" : "Agronomic & Cultural Actions"}</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                          {result.diseaseDetails.treatment.cultural.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Chemical controls */}
                      {result.diseaseDetails.treatment.chemical.length > 0 && (
                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wide mb-2">
                            <ShieldAlert className="h-4 w-4 text-emerald-700" />
                            <span>{isBn ? "রাসায়নিক প্রতিকার ও ডোজ (Chemical Spraying)" : "Chemical Control & Dosage"}</span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                            {result.diseaseDetails.treatment.chemical.map((item, i) => (
                              <li key={i} className="font-medium text-emerald-950">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Organic remedies */}
                      {result.diseaseDetails.treatment.organic.length > 0 && (
                        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80">
                          <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wide mb-2">
                            <Leaf className="h-4 w-4 text-teal-700" />
                            <span>{isBn ? "জৈব ও ভেষজ দমন পদ্ধতি (Bio-Control)" : "Organic & Bio-Control Remedies"}</span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                            {result.diseaseDetails.treatment.organic.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: SYMPTOMS & CAUSE */}
                  {activeDetailTab === "symptoms" && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                          {isBn ? "দৃশ্যমান লক্ষণসমূহ (Field Symptoms)" : "Field Symptoms Checklist"}
                        </h4>
                        <div className="space-y-2">
                          {result.diseaseDetails.symptoms.map((symptom, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-100">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{symptom}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                          {isBn ? "অনুকূল পরিবেশ (Favorable Climatic Conditions)" : "Favorable Climatic Conditions"}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {result.diseaseDetails.favorableConditions.map((cond, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs text-amber-900">
                              • {cond}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 text-xs text-slate-600">
                        <span className="font-semibold">{isBn ? "সংক্রমণের কারণ: " : "Root Cause: "}</span>
                        {result.diseaseDetails.cause}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PREVENTION */}
                  {activeDetailTab === "prevention" && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        {isBn ? "ভবিষ্যৎ প্রতিরোধমূলক ব্যবস্থা" : "Preventive Farm Strategies"}
                      </h4>
                      {result.diseaseDetails.preventions.map((prev, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-950">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{prev}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 4: ALL 10 PROBABILITIES */}
                  {activeDetailTab === "probabilities" && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                        <span>Class Name</span>
                        <span>Confidence Distribution</span>
                      </div>
                      {result.probabilities.map((item) => (
                        <div key={item.class} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800">
                              #{item.rank} {isBn ? item.displayNameBn : item.displayName}
                            </span>
                            <span className="font-mono text-emerald-700 font-semibold">
                              {item.percentage}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${Math.max(2, item.confidence * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
