"use client";

import React, { useState, useRef, useEffect } from "react";
import { script } from "@/lib/fonts";
import {
  Bot,
  Send,
  Paperclip,
  ChevronDown,
  RefreshCw,
  Pencil,
  MapPin,
  Leaf,
  Target,
  BookOpen,
  Droplet,
  CloudRain,
  RotateCw,
  BarChart3,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  History,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TransparentNavSlot } from "../../header-context";
import { useAnalysis } from "@/lib/analysis-context";
import { useAuth } from "@/lib/auth-context";
import { useDevice } from "@/context/device-context";
import {
  sendCropWiseChatMessage,
  getUserConversationsApi,
  getConversationMessagesApi,
  deleteConversationApi,
  ICropWiseConversationItem,
} from "@/lib/apis/analyzeAi";
import UserAvatar from "@/Components/common/UserAvatar";

const voicePrompts = [
  {
    icon: RotateCw,
    text: "আমন ধানের পর কোন ফসল চাষ করব?",
    enText: "Which crop to plant after Aman rice?",
    tag: "Crop Rotation",
  },
  {
    icon: Droplet,
    text: "রিলে ১ (পানির মোটর) অন করো",
    enText: "Turn on Relay 1 (Water Pump)",
    tag: "IoT Relay ON",
  },
  {
    icon: Droplet,
    text: "রিলে ১ (পানির মোটর) বন্ধ করো",
    enText: "Turn off Relay 1 (Water Pump)",
    tag: "IoT Relay OFF",
  },
  {
    icon: Radio,
    text: "আমার ESP32 ডিভাইসের লাইভ সেন্সর রিডিং কত?",
    enText: "What are the live ESP32 sensor readings?",
    tag: "Live Sensors",
  },
  {
    icon: CloudRain,
    text: "আমার সংরক্ষিত Climate Analysis অনুযায়ী রোপণের সময় কবে?",
    enText: "What is my recommended planting window?",
    tag: "Monsoon Shift",
  },
];

const suggestions = [
  "আমার ESP32 ডিভাইসের বর্তমান অবস্থা কী?",
  "আমন ধানের পর কোন ফসল চাষ করব?",
  "আমার আগের Climate Analysis অনুযায়ী এখন কী করা উচিত?",
  "মাটির বর্তমান আর্দ্রতা ও তাপমাত্রা কত?",
  "রিলে ১ (পানির মোটর) অন করো",
  "কম পানিতে কোন ফসল ভালো হবে?",
];

const resources = [
  { label: "Aman Rice Farming Guide", icon: BookOpen, tone: "bg-primary-50 text-primary-600" },
  { label: "Water Saving Techniques", icon: Droplet, tone: "bg-rose-50 text-rose-500" },
  { label: "Understanding Rainfall Patterns", icon: CloudRain, tone: "bg-sky-50 text-sky-500" },
  { label: "Crop Rotation Basics", icon: RotateCw, tone: "bg-amber-50 text-amber-500" },
];

interface Message {
  from: "bot" | "user";
  text: string;
  time: string;
  showChartsCta?: boolean;
  sources?: Array<{
    type: string;
    title: string;
    timestamp?: string;
    details?: any;
  }>;
}

const initialMessages: Message[] = [
  {
    from: "bot",
    time: "Just now",
    text:
      "Hello! I'm CropWise AI 🌱\nI am your context-aware agricultural assistant powered by NASA Earth observations, your saved climate analyses, and connected ESP32 field sensors.\n\nYou can speak or type in বাংলা, Banglish, or English:\n• আমন ধানের পর কোন ফসল চাষ করব? (Crop Rotation)\n• রিলে ১ অন বা বন্ধ করো (IoT Water Pump Control)\n• আমার ডিভাইসের বর্তমান অবস্থা ও sensor reading কী?\n• বৃষ্টির onset পরিবর্তনের প্রভাব ব্যাখ্যা করো।",
  },
];

// "•" দিয়ে শুরু হওয়া লাইনগুলো গ্রিন ডট বুলেট হিসেবে রেন্ডার হবে
const renderText = (text: string) =>
  text.split("\n").map((line, i) =>
    line.startsWith("•") ? (
      <div key={i} className="flex gap-2.5">
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
        <span>{line.slice(1).trim()}</span>
      </div>
    ) : line ? (
      <p key={i}>{line}</p>
    ) : (
      <div key={i} className="h-2" />
    )
  );

export default function AskAiPage() {
  const router = useRouter();
  const { activeAnalysis } = useAnalysis();
  const { user } = useAuth();
  const { device, isOnline, telemetry, statusInfo, relays, toggleRelay, refreshData } = useDevice();

  const [location] = useState(activeAnalysis?.location?.district || "Rajshahi");
  const [crop] = useState(activeAnalysis?.crop?.cropType === "aman_rice" ? "Aman Rice" : (activeAnalysis?.crop?.cropType || "Aman Rice"));
  const [priority] = useState("Save Water");

  // Chat & History State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationHistory, setConversationHistory] = useState<ICropWiseConversationItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"history" | "actions">("history");

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lang, setLang] = useState<"BN" | "EN">("BN");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Assistant States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const [autoVoiceReply, setAutoVoiceReply] = useState(true);
  const recognitionRef = useRef<any>(null);

  const storageKey = `cropwise_chat_cache_${user?.id || "guest"}`;

  const timeNow = () =>
    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, isListening]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // 1. Restore cached chat from browser localStorage when returning from other routes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          if (parsed.conversationId) {
            setConversationId(parsed.conversationId);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to read chat cache from localStorage:", err);
    }
  }, [storageKey]);

  // Helper to persist to localStorage
  const persistChatToCache = (convId: string | null, msgs: Message[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          conversationId: convId,
          messages: msgs,
          updatedAt: Date.now(),
        })
      );
    } catch (err) {
      console.warn("Failed to cache chat in localStorage:", err);
    }
  };

  // 2. Fetch User's Conversation History from Database
  const fetchHistory = async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const res = await getUserConversationsApi(user.id);
      if (res && res.success && Array.isArray(res.data)) {
        setConversationHistory(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch conversation history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  // Switch to a previous conversation from history
  const selectConversation = async (conv: ICropWiseConversationItem) => {
    if (conv.id === conversationId) return;
    try {
      setIsSending(true);
      const res = await getConversationMessagesApi(conv.id, user?.id);
      if (res && res.success && res.data && Array.isArray(res.data.messages)) {
        const mappedMessages: Message[] = res.data.messages.map((m) => ({
          from: m.role === "user" ? "user" : "bot",
          text: m.content,
          time: new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          sources: m.sources as any,
        }));

        const newMsgList = mappedMessages.length > 0 ? mappedMessages : initialMessages;
        setConversationId(conv.id);
        setMessages(newMsgList);
        persistChatToCache(conv.id, newMsgList);
      }
    } catch (err) {
      console.warn("Failed to load conversation messages:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Start a fresh new chat
  const startNewChat = () => {
    setConversationId(null);
    setMessages(initialMessages);
    persistChatToCache(null, initialMessages);
  };

  // Delete a conversation from history
  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      lang === "BN" ? "আপনি কি এই কথোপকথনটি মুছে ফেলতে চান?" : "Are you sure you want to delete this chat?"
    );
    if (!confirmed) return;

    try {
      await deleteConversationApi(convId, user?.id);
      setConversationHistory((prev) => prev.filter((c) => c.id !== convId));
      if (conversationId === convId) {
        startNewChat();
      }
    } catch (err) {
      console.warn("Failed to delete conversation:", err);
    }
  };

  // Text-To-Speech (TTS) Read Aloud
  const speakText = (text: string, msgIdx: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    if (speakingMsgIdx === msgIdx) {
      setSpeakingMsgIdx(null);
      return;
    }

    const cleanText = text
      .replace(/[*#_`]/g, "")
      .replace(/•/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === "BN" ? "bn-BD" : "en-US";
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeakingMsgIdx(msgIdx);
    utterance.onend = () => setSpeakingMsgIdx(null);
    utterance.onerror = () => setSpeakingMsgIdx(null);
    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text (STT) Voice Recognition
  const startListening = () => {
    if (typeof window === "undefined") return;

    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        lang === "BN"
          ? "আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থিত নয়। দয়া করে Chrome অথবা Edge ব্রাউজার ব্যবহার করুন।"
          : "Speech Recognition is not supported by your browser. Please use Chrome or Edge."
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = lang === "BN" ? "bn-BD" : "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      let finalCapturedText = "";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript(lang === "BN" ? "শুনছি... আপনার প্রশ্ন বলুন..." : "Listening... Speak now...");
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setVoiceTranscript(transcript);
        setInput(transcript);
        finalCapturedText = transcript;
      };

      recognition.onend = () => {
        setIsListening(false);
        if (finalCapturedText && finalCapturedText.trim() && !finalCapturedText.includes("শুনছি")) {
          send(finalCapturedText.trim(), true);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const send = async (text: string, fromVoice = false) => {
    if (!text.trim() || isSending) return;
    const userMsg = text.trim();
    setInput("");
    setVoiceTranscript("");

    const userMessageItem: Message = { from: "user", text: userMsg, time: timeNow() };
    const updatedMessagesWithUser = [...messages, userMessageItem];
    setMessages(updatedMessagesWithUser);
    persistChatToCache(conversationId, updatedMessagesWithUser);
    setIsSending(true);

    try {
      const lower = userMsg.toLowerCase();
      const hasRelay =
        lower.includes("relay") ||
        lower.includes("রিলে") ||
        lower.includes("pump") ||
        lower.includes("পাম্প") ||
        lower.includes("motor") ||
        lower.includes("মোটর") ||
        lower.includes("valve") ||
        lower.includes("ভালভ") ||
        lower.includes("ভাল্ব");

      const hasOn =
        lower.includes("on") ||
        lower.includes("start") ||
        lower.includes("চালু") ||
        lower.includes("চালাও") ||
        lower.includes("অন");

      const hasOff =
        lower.includes("off") ||
        lower.includes("stop") ||
        lower.includes("বন্ধ") ||
        lower.includes("অফ");

      if (hasRelay && (hasOn || hasOff)) {
        const targetRelay =
          lower.includes("2") ||
          lower.includes("valve") ||
          lower.includes("ভালভ") ||
          lower.includes("ভাল্ব")
            ? 2
            : 1;
        const targetState = hasOn && !hasOff;
        // Directly trigger hardware via device-context (which calls UPSTREAM_IOT_URL/api/device/relay)
        toggleRelay(targetRelay, targetState).catch(() => {});
      }

      const effectiveDeviceId = device?.deviceId || "esp32-001";
      const devContext = {
        deviceId: effectiveDeviceId,
        isOnline: isOnline ?? (statusInfo?.status === "online"),
        temperature: telemetry?.temperature != null ? Number(telemetry.temperature) : undefined,
        humidity: telemetry?.humidity != null ? Number(telemetry.humidity) : undefined,
        soilMoistureRaw: telemetry?.soilMoistureRaw != null ? Number(telemetry.soilMoistureRaw) : undefined,
        rainSensorRaw: telemetry?.rainSensorRaw != null ? Number(telemetry.rainSensorRaw) : undefined,
        relay1: (statusInfo?.relay1 || (relays?.relay1 ? "ON" : "OFF")) as "ON" | "OFF",
        relay2: (statusInfo?.relay2 || (relays?.relay2 ? "ON" : "OFF")) as "ON" | "OFF",
        lastSeen: statusInfo?.lastSeen || undefined,
      };

      const res = await sendCropWiseChatMessage({
        conversationId: conversationId || undefined,
        message: userMsg,
        userId: user?.id,
        deviceId: effectiveDeviceId,
        deviceContext: devContext,
        location: { district: location },
        crop,
        language: lang,
      });

      // Synchronize live telemetry and relays
      refreshData(true).catch(() => {});

      if (res && res.success && res.data) {
        const newConvId = res.data.conversationId || conversationId;
        if (newConvId && newConvId !== conversationId) {
          setConversationId(newConvId);
        }

        const isClimateQuestion =
          userMsg.toLowerCase().includes("climate") ||
          userMsg.toLowerCase().includes("analysis") ||
          userMsg.toLowerCase().includes("বৃষ্টি") ||
          userMsg.toLowerCase().includes("রোপণ");

        const replyContent = res.data.message.content;

        const botMessageItem: Message = {
          from: "bot",
          time: timeNow(),
          text: replyContent,
          sources: res.data.sources,
          showChartsCta: isClimateQuestion || (res.data.sources && res.data.sources.some((s) => s.type === "climate_analysis")),
        };

        const finalMessages = [...updatedMessagesWithUser, botMessageItem];
        setMessages(finalMessages);
        persistChatToCache(newConvId, finalMessages);

        // Refresh user conversation history so new title appears
        fetchHistory();

        if ((fromVoice || autoVoiceReply) && replyContent) {
          setTimeout(() => speakText(replyContent, finalMessages.length - 1), 200);
        }
      } else {
        const errorItem: Message = {
          from: "bot",
          time: timeNow(),
          text: "দুঃখিত, কোনো উত্তর পাওয়া যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
        };
        const finalMessages = [...updatedMessagesWithUser, errorItem];
        setMessages(finalMessages);
        persistChatToCache(conversationId, finalMessages);
      }
    } catch (err: any) {
      const errItem: Message = {
        from: "bot",
        time: timeNow(),
        text: `সংযোগ ত্রুটি: ${err?.message || "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।"}`,
      };
      const finalMessages = [...updatedMessagesWithUser, errItem];
      setMessages(finalMessages);
      persistChatToCache(conversationId, finalMessages);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-send query passed from Home or other pages via ?q=...
  const initialQueryHandled = useRef(false);

  useEffect(() => {
    if (initialQueryHandled.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") || params.get("query") || params.get("message");
    if (initialQuery && initialQuery.trim()) {
      initialQueryHandled.current = true;
      window.history.replaceState({}, "", "/dashboard/ask-ai");
      send(initialQuery.trim());
    }
  }, []);

  return (
    <div className="pb-6 sm:pb-4">
      <TransparentNavSlot />

      {/* ================= COMPACT SLEEK HERO ================= */}
      <section className="relative min-h-[140px] overflow-hidden bg-[#fbfcfa] sm:min-h-[160px]">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-[center_60%]"
            style={{
              backgroundImage:
                "url('https://i.ibb.co.com/23cWFG8j/Chat-GPT-Image-Sep-24-2026-05-53-43-PM.png')",
            }}
          />
          {/* Desktop: left fade */}
          <div className="absolute inset-y-0 left-0 hidden w-[45%] bg-gradient-to-r from-[#fbfcfa]/100 to-transparent sm:block" />
          {/* Mobile: dark overlay jeno white text pora jay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/45 sm:hidden" />
          {/* Top fade for navbar */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent" />
          {/* Desktop: bottom blend */}
          <div className="absolute inset-x-0 bottom-0 hidden h-[35%] bg-gradient-to-t from-[#f5f7f5]/90 to-transparent sm:block" />
          <div className="absolute bottom-0 right-0 hidden h-[30%] w-[20%] bg-gradient-to-tl from-[#f5f7f5]/90 to-transparent sm:block" />
        </div>

        <div className="relative px-6 pb-8 pt-16 sm:px-10 sm:pb-10 sm:pt-16">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold leading-tight text-white drop-shadow sm:text-3xl sm:font-semibold sm:text-slate-900 sm:drop-shadow-none">
                Ask CropWise AI
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 backdrop-blur-xs border border-emerald-400/40 sm:bg-emerald-50 sm:text-emerald-700">
                <Mic className="h-3 w-3 animate-pulse text-emerald-600" /> Voice Ready
              </span>
            </div>

            <p className="mt-1 hidden text-xs leading-relaxed text-slate-600 sm:block">
              Talk or type in Bangla or English. Your chat history is permanently saved in cloud and cached in browser.
            </p>
          </div>

          <p
            className={`${script.className} absolute right-6 top-14 hidden -rotate-2 text-xl leading-6 text-white drop-shadow sm:right-10 sm:block sm:top-16`}
          >
            Your Farming
            <br />
            Companion, Just Speak.
          </p>
        </div>
      </section>

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 -mt-4 px-4 sm:-mt-6 sm:px-6">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2.2fr_1fr]">
          {/* Chat panel: viewport-relative pinned bottom chat layout */}
          <div className="flex h-[calc(100dvh-175px)] min-h-[580px] max-h-[820px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {/* Chat header voice bar & new chat action */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                <span>Hands-Free Voice Assistant Active</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500 hover:text-slate-700">
                  <input
                    type="checkbox"
                    checked={autoVoiceReply}
                    onChange={(e) => setAutoVoiceReply(e.target.checked)}
                    className="h-3 w-3 rounded accent-primary-600"
                  />
                  <span>Auto Read-Aloud</span>
                </label>

                <button
                  type="button"
                  onClick={startNewChat}
                  title="Start a new chat"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                >
                  <Plus className="h-3 w-3 text-primary-600" />
                  <span>{lang === "BN" ? "নতুন চ্যাট" : "New Chat"}</span>
                </button>
              </div>
            </div>

            {/* Message Area: flex-1 takes all space with smooth scrolling */}
            <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8 ${
                      m.from === "bot" ? "bg-primary-100 text-primary-700" : "bg-primary-800 text-white"
                    }`}
                  >
                    {m.from === "bot" ? (
                      <>
                        <Leaf className="h-4 w-4 sm:hidden" />
                        <Bot className="hidden h-4 w-4 sm:block" />
                      </>
                    ) : (
                      <UserAvatar user={user} size="sm" />
                    )}
                  </span>

                  <div className={`flex min-w-0 max-w-[88%] flex-col sm:max-w-[80%] ${m.from === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`relative space-y-0.5 rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.from === "bot"
                          ? "bg-primary-50/70 text-slate-700 sm:bg-slate-50"
                          : "bg-primary-800 text-white"
                      }`}
                    >
                      {/* Read Aloud Button for Bot message */}
                      {m.from === "bot" && (
                        <button
                          type="button"
                          onClick={() => speakText(m.text, i)}
                          title={speakingMsgIdx === i ? "Stop speaking" : "Read aloud"}
                          className={`absolute right-2.5 top-2.5 rounded-full p-1 transition ${
                            speakingMsgIdx === i
                              ? "bg-primary-600 text-white animate-pulse"
                              : "text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
                          }`}
                        >
                          {speakingMsgIdx === i ? (
                            <VolumeX className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}

                      <div className="pr-5">{renderText(m.text)}</div>

                      {/* Source references */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200/60 pt-2.5">
                          {m.sources.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-2xs border border-slate-200/70"
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  s.type.includes("device")
                                    ? "bg-emerald-500"
                                    : s.type.includes("crop_rotation")
                                    ? "bg-amber-500"
                                    : "bg-primary-500"
                                }`}
                              />
                              {s.title}
                            </span>
                          ))}
                        </div>
                      )}

                      {m.showChartsCta && (
                        <button
                          onClick={() => router.push("/dashboard/why-this-result")}
                          className="mt-3 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                          <BarChart3 className="h-3.5 w-3.5 text-primary-600" /> Show data and charts
                        </button>
                      )}
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-slate-400">{m.time}</span>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 sm:h-8 sm:w-8">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-600" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-600 [animation-delay:0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-600 [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Listening Banner when active */}
            {isListening && (
              <div className="shrink-0 flex items-center justify-between border-t border-emerald-200 bg-emerald-50 px-4 py-2 transition">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <p className="text-xs font-medium text-emerald-900">
                    {voiceTranscript || (lang === "BN" ? "শুনছি... আপনার প্রশ্ন বলুন..." : "Listening... Speak your command...")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-200 transition"
                >
                  Stop
                </button>
              </div>
            )}

            {/* Input bar: STRICTLY PINNED TO BOTTOM */}
            <div className="shrink-0 sticky bottom-0 z-20 border-t border-slate-100 bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1 transition-all focus-within:border-primary-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary-600/20">
                <button
                  type="button"
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send(input)}
                  placeholder={
                    isListening
                      ? lang === "BN" ? "কথা বলুন..." : "Speak now..."
                      : lang === "BN" ? "মুখে বলুন বা লিখুন (যেমন: রিলে ১ অন করো, শস্য পর্যায়...)" : "Speak or type anything about your farm..."
                  }
                  className="min-w-0 flex-1 bg-transparent py-1 text-xs text-slate-700 placeholder-slate-400 outline-none sm:text-sm"
                />

                {/* Voice Assistant Mic Button */}
                <button
                  type="button"
                  onClick={startListening}
                  title={isListening ? "Stop listening" : "Speak with Voice Assistant"}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    isListening
                      ? "bg-rose-600 text-white animate-pulse shadow-md"
                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-50"
                >
                  {lang} <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => send(input)}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-800 text-white transition hover:bg-primary-900"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="pb-0.5 pt-1.5 text-center text-[10px] text-slate-400">
                CropWise AI responds grounded in NASA Satellite Observations & Live IoT Hardware.
              </p>
            </div>
          </div>

          {/* Right rail: Matched height with chat panel and tabbed view */}
          <div className="h-[calc(100dvh-175px)] min-h-[580px] max-h-[820px] overflow-y-auto space-y-3 pr-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
            {/* Tab Switcher: Chat History vs Tools */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setSidebarTab("history")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                  sidebarTab === "history"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="h-3.5 w-3.5 text-primary-600" />
                <span>{lang === "BN" ? "চ্যাট হিস্ট্রি" : "Chat History"}</span>
                {conversationHistory.length > 0 && (
                  <span className="rounded-full bg-primary-100 px-1.5 py-0.2 text-[10px] font-bold text-primary-800">
                    {conversationHistory.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab("actions")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                  sidebarTab === "actions"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>{lang === "BN" ? "ভয়েস ও অ্যাকশন" : "Voice & Tools"}</span>
              </button>
            </div>

            {/* TAB 1: Chat History */}
            {sidebarTab === "history" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <MessageSquare className="h-3.5 w-3.5 text-primary-600" />
                      <span>{lang === "BN" ? "সংরক্ষিত কথোপকথনসমূহ" : "Saved Conversations"}</span>
                    </p>
                    <button
                      type="button"
                      onClick={startNewChat}
                      className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-1 text-[11px] font-semibold text-primary-700 hover:bg-primary-100 transition"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{lang === "BN" ? "নতুন চ্যাট" : "New"}</span>
                    </button>
                  </div>

                  {isLoadingHistory ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <RefreshCw className="h-4 w-4 mx-auto animate-spin text-primary-600 mb-1" />
                      <span>লোড হচ্ছে...</span>
                    </div>
                  ) : conversationHistory.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                      <Bot className="h-6 w-6 mx-auto text-slate-300" />
                      <p className="font-medium text-slate-500">
                        {lang === "BN" ? "কোনো সংরক্ষিত চ্যাট নেই" : "No saved chats yet"}
                      </p>
                      <p className="text-[11px]">
                        {lang === "BN" ? "কথা বলা শুরু করলেই এখানে স্বয়ংক্রিয়ভাবে সেভ হবে।" : "Start a chat and it will automatically be saved here."}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2.5 space-y-1.5">
                      {conversationHistory.map((conv) => {
                        const isSelected = conv.id === conversationId;
                        const dateStr = conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "";

                        return (
                          <div
                            key={conv.id}
                            onClick={() => selectConversation(conv)}
                            className={`group relative flex items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer ${
                              isSelected
                                ? "border-primary-500 bg-primary-50/50 shadow-2xs"
                                : "border-slate-100 bg-slate-50/60 hover:border-slate-300 hover:bg-white"
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isSelected ? "bg-primary-600" : "bg-slate-300"}`} />
                                <p className="truncate text-xs font-medium text-slate-800">
                                  {conv.title || "Agriculture Chat"}
                                </p>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{dateStr}</span>
                                {conv._count?.messages ? (
                                  <>
                                    <span>•</span>
                                    <span>{conv._count.messages} messages</span>
                                  </>
                                ) : null}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteConversation(e, conv.id)}
                              title="Delete conversation"
                              className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Current Context Mini Card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-3.5">
                  <div className="flex items-center justify-between pb-1.5">
                    <p className="text-xs font-semibold text-slate-900">Current Context</p>
                    <button className="flex items-center gap-1 text-[11px] font-medium text-primary-700">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500"><MapPin className="h-3.5 w-3.5" /> Location <span className="ml-auto font-medium text-slate-800">{location}</span></div>
                    <div className="flex items-center gap-2 text-slate-500"><Leaf className="h-3.5 w-3.5" /> Crop <span className="ml-auto font-medium text-slate-800">{crop}</span></div>
                    <div className="flex items-center gap-2 text-slate-500"><Target className="h-3.5 w-3.5" /> Priority <span className="ml-auto font-medium text-slate-800">{priority}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Voice & Assistant Actions */}
            {sidebarTab === "actions" && (
              <div className="space-y-3">
                {/* Quick Voice Assistant Spoken Actions Card */}
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                      <Mic className="h-3.5 w-3.5 text-emerald-600" /> Spoken Voice Actions
                    </p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Tap to speak
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {voicePrompts.map((vp, idx) => (
                      <button
                        key={idx}
                        onClick={() => send(lang === "BN" ? vp.text : vp.enText, true)}
                        className="flex w-full items-center justify-between rounded-lg border border-emerald-200/70 bg-white/90 p-2 text-left text-xs font-medium text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 transition"
                      >
                        <div className="flex items-center gap-2">
                          <vp.icon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span className="line-clamp-1">{lang === "BN" ? vp.text : vp.enText}</span>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {vp.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* General Suggested Questions */}
                <div className="rounded-2xl border border-slate-100 bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                      <Bot className="h-3.5 w-3.5 text-primary-600" /> Suggested Questions
                    </p>
                    <RefreshCw className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-2.5 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 transition"
                      >
                        <span className="line-clamp-1">{s}</span>
                        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 -rotate-90 text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Helpful Resources */}
                <div className="rounded-2xl border border-slate-100 bg-white p-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <p className="text-xs font-semibold text-slate-900">Helpful Resources</p>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-primary-700">
                      View All <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {resources.map((r) => (
                      <div key={r.label} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md ${r.tone}`}>
                          <r.icon className="h-3 w-3" />
                        </span>
                        <span className="truncate">{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
