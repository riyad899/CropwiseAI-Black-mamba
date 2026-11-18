"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Leaf,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Satellite,
  Cpu,
  Sprout,
  Calendar,
  BarChart3,
  Layers,
  MapPin,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";

// ─── Crop Advice Data from Design Specification ─────────────────────────
interface ICropData {
  seenEn: string;
  seenBn: string;
  doEn: string;
  doBn: string;
}

const CROPS_DATA: Record<string, ICropData> = {
  Rice: {
    seenEn: "Soil moisture is high and rain is expected in the next three days.",
    seenBn: "মাটিতে প্রচুর আর্দ্রতা রয়েছে এবং আগামী তিন দিনের মধ্যে বৃষ্টির সম্ভাবনা আছে।",
    doEn: "Skip irrigation this week and clear your drainage channels before the rain.",
    doBn: "এই সপ্তাহে সেচ বন্ধ রাখুন এবং বৃষ্টির আগেই পানি নিষ্কাশনের নালাগুলো পরিষ্কার করুন।",
  },
  Jute: {
    seenEn: "Rainfall this month is above normal and the fields are wet.",
    seenBn: "চলতি মাসে বৃষ্টিপাত স্বাভাবিকের চেয়ে বেশি এবং জমি ভেজা রয়েছে।",
    doEn: "Wait for a dry spell before cutting, so the stems are easier to handle.",
    doBn: "পাট কাটার আগে কিছুদিন শুকনো আবহাওয়ার অপেক্ষা করুন, যাতে আঁশ ছাড়ানো সহজ হয়।",
  },
  Wheat: {
    seenEn: "The topsoil is drying faster than usual.",
    seenBn: "মাটির উপরিভাগের রস স্বাভাবিকের চেয়ে দ্রুত শুকিয়ে যাচ্ছে।",
    doEn: "A light irrigation this weekend will help the grains fill well.",
    doBn: "এই সাপ্তাহিক ছুটির দিনে হালকা সেচ দিলে দানার সঠিক পুষ্টি নিশ্চিত হবে।",
  },
  Potato: {
    seenEn: "Nights are cool and humidity is high.",
    seenBn: "রাতগুলো ঠান্ডা এবং বাতাসে আর্দ্রতার মাত্রা খুব বেশি।",
    doEn: "Check the leaves for spots every two days and treat only if you see them.",
    doBn: "প্রতি দুই দিন অন্তর পাতায় কোনো দাগ আছে কিনা পরীক্ষা করুন এবং লক্ষণ দেখা দিলেই ব্যবস্থা নিন।",
  },
  Tea: {
    seenEn: "Rain has been steady and the leaves are greener than last month.",
    seenBn: "নিয়মিত বৃষ্টিপাত হচ্ছে এবং পাতাগুলো গত মাসের তুলনায় বেশি সতেজ ও সবুজ।",
    doEn: "It’s a good window for plucking. Plan pruning for the next dry spell.",
    doBn: "দুটি পাতা একটি কুঁড়ি তোলার জন্য এটি উৎকৃষ্ট সময়। পরবর্তী শুকনো সময়ে ছাঁটাইয়ের পরিকল্পনা করুন।",
  },
  Maize: {
    seenEn: "Adequate soil hydration with high solar radiation flux across the canopy.",
    seenBn: "মাটিতে পর্যাপ্ত আর্দ্রতা এবং প্রচুর রোদ রয়েছে, যা ভুট্টার বৃদ্ধির অনুকূল।",
    doEn: "Side-dress nitrogen fertilizer now while root-zone moisture remains optimal.",
    doBn: "মাটির রস উপযুক্ত থাকতে থাকতেই এখনই ইউরিয়া সার প্রয়োগ সম্পন্ন করুন।",
  },
  Mustard: {
    seenEn: "Clear sunny weather with low soil water deficit index across the field.",
    seenBn: "নির্মল রৌদ্রোজ্জ্বল আবহাওয়া এবং মাটিতে পানির ঘাটতি অত্যন্ত কম।",
    doEn: "Crop is flowering. Avoid overhead irrigation to ensure uninterrupted pollination.",
    doBn: "সরিষার ফুল ফুটছে। পরাগায়ন সুরক্ষায় ওপর থেকে পানি ছিটানো থেকে বিরত থাকুন।",
  },
};

const CROP_KEYS = [
  { id: "Rice", en: "Rice", bn: "ধান" },
  { id: "Jute", en: "Jute", bn: "পাট" },
  { id: "Wheat", en: "Wheat", bn: "গম" },
  { id: "Potato", en: "Potato", bn: "আলু" },
  { id: "Tea", en: "Tea", bn: "চা" },
  { id: "Maize", en: "Maize", bn: "ভুট্টা" },
  { id: "Mustard", en: "Mustard", bn: "সরিষা" },
];

export default function HomePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const isBn = lang === "BN";

  const [query, setQuery] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("Rice");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Descent scroll rail indicator
  const descentRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!descentRef.current) return;
      const rect = descentRef.current.getBoundingClientRect();
      const h = rect.height;
      const p = Math.min(Math.max((window.innerHeight * 0.45 - rect.top) / h, 0), 1);
      setScrollPercent(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleAskSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/dashboard/ask-ai?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/dashboard/crop-rotation");
    }
  };

  const currentCrop = CROPS_DATA[selectedCrop] || CROPS_DATA.Rice;

  return (
    <div className="w-full bg-[#fbfaf7] text-[#12162b] selection:bg-emerald-100 selection:text-emerald-900">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <header className="relative text-center pt-20 sm:pt-24 lg:pt-28 overflow-hidden">
        
        {/* Subtle dot pattern */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: "radial-gradient(#12162b 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(60% 60% at 50% 30%, #000, transparent)",
            WebkitMaskImage: "radial-gradient(60% 60% at 50% 30%, #000, transparent)",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#e3e1d8] bg-white px-4 py-1.5 text-sm text-[#5d6478] shadow-2xs mb-6">
            <span className="h-2 w-2 rounded-full bg-[#2f7d5b] shadow-[0_0_0_4px_rgba(47,125,91,0.22)]" />
            <span>{isBn ? "নাসা আর্থ ডেটা দ্বারা চালিত" : "Powered by NASA Earth data"}</span>
          </div>

          {/* Heading */}
          <h1 className="font-semibold tracking-[-0.04em] text-slate-950 text-5xl sm:text-7xl md:text-8xl lg:text-[104px] leading-[0.98]">
            {isBn ? "উন্নত তথ্য" : "Better Information"}
            <span className="block text-[#2f7d5b] font-semibold mt-1">
              {isBn ? "সমৃদ্ধ ফসল" : "Brighter Harvests"}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-xl text-lg sm:text-xl text-[#5d6478] leading-relaxed">
            {isBn
              ? "ক্রপওয়াইজ এআই স্যাটেলাইটের তথ্যকে সহজ এবং কার্যকর অন্তর্দৃষ্টিতে রূপান্তর করে, যাতে কৃষকরা আত্মবিশ্বাসের সাথে পরিকল্পনা করতে এবং ফলন বাড়াতে পারেন।"
              : "CropWise AI turns satellite data into simple, practical insights so farmers can adapt, plan, and grow with confidence."}
          </p>

          {/* Search Input & Action Button */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3.5">
            <form
              onSubmit={handleAskSubmit}
              className="flex w-full max-w-[460px] items-center gap-3 rounded-full border border-[#e3e1d8] bg-white p-2 pl-6 shadow-xs focus-within:border-[#2f7d5b] focus-within:ring-2 focus-within:ring-[#2f7d5b]/20 transition"
            >
              <Leaf className="h-4 w-4 text-[#2f7d5b] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isBn ? "আজ আপনি কী জানতে চান?" : "What would you like to do today?"}
                className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder-[#5d6478] outline-none"
              />
              <button
                type="submit"
                aria-label="Go"
                className="h-10 w-10 shrink-0 rounded-full bg-[#2f7d5b]/15 text-[#2f7d5b] flex items-center justify-center transition hover:bg-[#2f7d5b] hover:text-white cursor-pointer"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <button
              type="button"
              onClick={() => router.push("/dashboard/crop-rotation")}
              className="relative overflow-hidden rounded-full bg-[#2f7d5b] px-7 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#25664a] active:scale-95 cursor-pointer"
            >
              <span>{isBn ? "✦ শুরু করুন" : "✦ Let’s try"}</span>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shine" />
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* FULL-WIDTH SCENIC BANNER (Edge-to-Edge with /hero-bg.png)                 */}
        {/* ========================================================================= */}
        <div className="relative mt-12 w-full overflow-hidden">
          <div className="relative w-full h-[260px] sm:h-[340px] md:h-[420px] lg:h-[480px] xl:h-[520px]">
            
            {/* The Original Landscape Photo */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/hero-bg.png')",
              }}
            />

            {/* Top Fade into page background */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#fbfaf7] via-[#fbfaf7]/50 to-transparent" />

            {/* Left Serif Caption & Editorial Subtitle */}
            <div className="absolute left-6 top-8 sm:left-12 sm:top-12 lg:left-16 text-left max-w-md sm:max-w-lg z-10">
              <p className="font-serif italic text-white drop-shadow-md text-2xl sm:text-3xl lg:text-4xl leading-tight">
                {isBn ? "মহাকাশের উপাত্ত থেকে" : "From space data"}
                <br />
                {isBn ? "আরও সমৃদ্ধ খামার" : "to stronger farms"}
              </p>
              <div className="mt-2.5 h-0.5 w-20 bg-emerald-400/80" />
              <p className="mt-3 text-xs sm:text-sm text-white/90 font-light leading-relaxed drop-shadow-md">
                {isBn
                  ? "কৃত্রিম বুদ্ধিমত্তা ও উপগ্রহ রিমোট সেন্সিং দিয়ে প্রতিদিন সঠিক সময়ে ফসলের সুরক্ষা ও সঠিক সেচের সিদ্ধান্ত।"
                  : "Empowering family farmers with daily orbital observations, local soil telemetry, and predictive crop guidance."}
              </p>
            </div>

            {/* Bottom Smooth Organic Wave Mask (Transition into Why CropWise AI) */}
            <div className="absolute inset-x-0 -bottom-1 w-full overflow-hidden leading-none z-10 pointer-events-none">
              <svg
                viewBox="0 0 1440 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-14 sm:h-20 lg:h-28 text-white drop-shadow-sm"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,50 C320,15 480,85 720,48 C960,12 1140,82 1440,38 L1440,100 L0,100 Z"
                  fill="currentColor"
                />
              </svg>
            </div>

          </div>
        </div>

      </header>


      {/* ========================================================================= */}
      {/* 2. FROM SPACE INSIGHTS TO FARM DECISIONS (Why CropWise AI)                  */}
      {/* ========================================================================= */}
      <section
        id="why-cropwise"
        className="relative bg-white text-slate-800 pt-4 pb-16 sm:pb-24 px-6 sm:px-10 lg:px-16 overflow-hidden"
        aria-label="Why CropWise AI"
      >
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Description, 3 Pillars & CTA Button */}
            <div className="lg:col-span-5 flex flex-col items-start font-sans">
              
           

              {/* Main Headline */}
              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-[#12162b] leading-[1.18]">
                {isBn ? (
                  <>
                    মহাকাশের উপাত্ত থেকে <br />
                    <span className="text-[#2f7d5b]">খামারের সঠিক সিদ্ধান্ত</span>
                  </>
                ) : (
                  <>
                    From Space Insights <br />
                    <span className="text-[#2f7d5b]">to Farm Decisions</span>
                  </>
                )}
              </h2>

              {/* Subtitle / Paragraph */}
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
                {isBn
                  ? "আমরা নাসার আর্থ অবজারভেশন, স্থানীয় সেন্সর ডেটা এবং কৃত্রিম বুদ্ধিমত্তার সমন্বয়ে জটিল উপগ্রহ তথ্যকে কৃষকদের জন্য সহজ ও বাস্তবসম্মত পরামর্শে রূপান্তর করি।"
                  : "We combine NASA Earth observation, local sensor data, and AI-driven analysis to turn complex environmental data into clear, practical guidance for farmers."}
              </p>

              {/* Three Feature Pillars */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full pt-2">
                
                {/* Feature 1 */}
                <div className="flex flex-col items-start">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100/70 border border-emerald-200/60 text-emerald-700 mb-3.5 shadow-sm">
                    <Satellite className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {isBn ? "স্যাটেলাইট ইন্টেলিজেন্স" : "Satellite Intelligence"}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {isBn
                      ? "নাসার উপাত্ত থেকে প্রকৃত পরিবেশগত বিশ্লেষণ"
                      : "Real environmental insights from NASA data"}
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col items-start">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100/70 border border-emerald-200/60 text-emerald-700 mb-3.5 shadow-sm">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {isBn ? "এআই ও ডেটা অ্যানালাইসিস" : "AI & Data Analysis"}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {isBn
                      ? "প্যাটার্ন, ঝুঁকি ও নতুন সুযোগ শনাক্তকরণ"
                      : "Find patterns, risks and opportunities"}
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="flex flex-col items-start">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100/70 border border-emerald-200/60 text-emerald-700 mb-3.5 shadow-sm">
                    <Sprout className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {isBn ? "কৃষকবান্ধব সঠিক পরামর্শ" : "Farmer-Friendly Guidance"}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {isBn
                      ? "সহজে বাস্তবায়নযোগ্য ফসল ও চাষাবাদের দিকনির্দেশনা"
                      : "Actionable crop and farming recommendations"}
                  </p>
                </div>

              </div>

            </div>

            {/* Right Column: 3D Multi-Layer Environmental Isometric Stack */}
            <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[640px] xl:max-w-[720px]">
                <img
                  src="/space-stack-graphic.png"
                  alt="Environmental observation layers: Temperature, Precipitation, NDVI Vegetation, and Soil Moisture over farm"
                  className="w-full h-auto transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Clean Organic Curve Transition into Altitude Descent (#0c1626) */}
        <div className="absolute inset-x-0 -bottom-1 w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg 
            viewBox="0 0 1440 60" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-12 sm:h-16 lg:h-20 text-[#0c1626] block"
            preserveAspectRatio="none"
          >
            <path 
              d="M0,35 Q180,12 360,26 T720,20 T1080,28 T1440,16 L1440,60 L0,60 Z" 
              fill="currentColor"
            />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. THE ALTITUDE DESCENT (One Continuous Storyline Section)                */}
      {/* ========================================================================= */}
      <section id="how-it-works" ref={descentRef} className="relative" aria-label="How CropWise works">
        
        {/* Continuous Left Altitude Rail and Glowing Tracking Dot */}
        <div 
          className="absolute top-0 bottom-0 left-[26px] sm:left-[calc(max(0px,(100%-960px)/2)+14px)] w-px bg-gradient-to-b from-transparent via-emerald-400/50 to-emerald-600/40 z-10"
          aria-hidden="true"
        >
          <div 
            className="absolute -left-[6px] w-[13px] h-[13px] rounded-full bg-[#2fb083] border-2 border-white shadow-[0_0_0_5px_rgba(47,176,131,0.25)] transition-all duration-100"
            style={{ top: `calc(${scrollPercent * 100}% - ${scrollPercent * 13}px)` }}
          />
        </div>

        {/* 2.1 AIR (Night Sky to Forest Atmosphere) */}
        <div className="relative bg-gradient-to-b from-[#0c1626] to-[#1b3d3b] text-[#e8eef5] pt-12 pb-16">
          
          {/* Subtle Stars Background */}
          <div 
            className="pointer-events-none absolute inset-x-0 top-0 h-[340px] opacity-75"
            style={{
              backgroundImage: "radial-gradient(1px 1px at 12% 30%, #fff9, transparent), radial-gradient(1px 1px at 38% 12%, #fff8, transparent), radial-gradient(1.5px 1.5px at 62% 40%, #fffb, transparent), radial-gradient(1px 1px at 81% 18%, #fff9, transparent), radial-gradient(1px 1px at 91% 55%, #fff7, transparent), radial-gradient(1px 1px at 25% 70%, #fff6, transparent)",
            }}
            aria-hidden="true"
          />

          <div className="max-w-[960px] mx-auto px-6 sm:px-14 pl-16 sm:pl-16">
            
            <h2 className="font-serif font-normal text-3xl sm:text-5xl lg:text-[46px] leading-[1.12] tracking-[-0.02em] max-w-[620px] mb-5">
              {isBn
                ? "প্রতিদিন স্যাটেলাইট আপনার ফসলের মাঠ পর্যবেক্ষণ করে। আমরা সেই মহাকাশের দৃষ্টি মাটিতে নামিয়ে আনি।"
                : "Every day, satellites look down at your field. We bring the view to the ground."}
            </h2>
            <p className="text-[#aebbc8] max-w-[520px] text-base sm:text-lg mb-12">
              {isBn
                ? "নিচে স্ক্রল করুন। কক্ষপথ থেকে আপনার খামার পর্যন্ত একটি রিডিং ট্র্যাক করুন।"
                : "Scroll down. Follow one reading from orbit to your farm."}
            </p>

            {/* Orbit Stop 1: 705 km */}
            <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 sm:gap-6 pt-16 pb-10 items-start">
              <div className="text-sm font-mono text-[#e8eef5]/85">
                <b className="block text-3xl sm:text-3xl font-medium tracking-tight text-emerald-300">705 km</b>
                <span>Terra satellite</span>
              </div>
              <div>
                <h3 className="font-serif font-normal text-2xl sm:text-3xl mb-2 text-white">
                  {isBn ? "ফসল কতটা সবুজ?" : "How green is it?"}
                </h3>
                <p className="text-[#e8eef5]/80 text-base max-w-[520px] mb-3 leading-relaxed">
                  {isBn
                    ? "NASA MODIS সেন্সর পাতার ক্লোরোফিল ও উদ্ভিদের ঘনত্ব মেপে বলে দেয় ফসল কতটা সতেজ।"
                    : "The MODIS sensor measures how healthy and dense your crop leaves are, field by field."}
                </p>
                <div className="text-sm text-[#e8eef5]/65 border-l-2 border-emerald-400 pl-3">
                  NASA MODIS · vegetation index
                </div>
              </div>
            </div>

            {/* Orbit Stop 2: 685 km */}
            <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 sm:gap-6 pt-16 pb-10 items-start">
              <div className="text-sm font-mono text-[#e8eef5]/85">
                <b className="block text-3xl sm:text-3xl font-medium tracking-tight text-emerald-300">685 km</b>
                <span>SMAP satellite</span>
              </div>
              <div>
                <h3 className="font-serif font-normal text-2xl sm:text-3xl mb-2 text-white">
                  {isBn ? "মাটির কতটা পানির তৃষ্ণা?" : "How thirsty is the soil?"}
                </h3>
                <p className="text-[#e8eef5]/80 text-base max-w-[520px] mb-3 leading-relaxed">
                  {isBn
                    ? "SMAP মাটির ওপরের কয়েক সেন্টিমিটারের আর্দ্রতা অনুভব করে, যাতে বোঝা যায় কখন সত্যি পানির প্রয়োজন।"
                    : "SMAP senses the moisture in the top few centimetres of ground, so you know when water is really needed."}
                </p>
                <div className="text-sm text-[#e8eef5]/65 border-l-2 border-emerald-400 pl-3">
                  NASA SMAP · soil moisture
                </div>
              </div>
            </div>

            {/* Orbit Stop 3: 407 km */}
            <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 sm:gap-6 pt-16 pb-12 items-start">
              <div className="text-sm font-mono text-[#e8eef5]/85">
                <b className="block text-3xl sm:text-3xl font-medium tracking-tight text-emerald-300">407 km</b>
                <span>GPM observatory</span>
              </div>
              <div>
                <h3 className="font-serif font-normal text-2xl sm:text-3xl mb-2 text-white">
                  {isBn ? "বৃষ্টি কি সামনে আসছে?" : "Is rain on the way?"}
                </h3>
                <p className="text-[#e8eef5]/80 text-base max-w-[520px] mb-3 leading-relaxed">
                  {isBn
                    ? "GPM মেঘমালা থেকে বৃষ্টিপাত ট্র্যাক করে, যা বীজ বপন, স্প্রে ও ফসল কাটার সময় নির্ধারণে সাহায্য করে।"
                    : "GPM tracks rainfall from above, helping you plan sowing, spraying and harvest around the weather."}
                </p>
                <div className="text-sm text-[#e8eef5]/65 border-l-2 border-emerald-400 pl-3">
                  NASA GPM · precipitation
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 2.2 GROUND (Seamless Soft Earthy Green Tone: #e7efe4) */}
        {/* Exact gradient from forest (#1b3d3b) to ground (#e7efe4) with 210px padding so text is 100% on light background */}
        <div 
          id="ask"
          className="relative text-[#12162b] pt-[200px] sm:pt-[220px] pb-24"
          style={{
            background: "linear-gradient(180deg, #1b3d3b 0px, #e7efe4 260px, #e7efe4 100%)",
          }}
        >
          <div className="max-w-[960px] mx-auto px-6 sm:px-14 pl-16 sm:pl-16">
            
            {/* Ground Stop: 0 m Your Field */}
            <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 sm:gap-6 items-start">
              
              {/* Altitude indicator: 0m */}
              <div className="text-sm font-mono text-[#12162b]/85 pt-1">
                <b className="block text-3xl sm:text-4xl font-semibold tracking-tight text-[#12162b]">0 m</b>
                <span className="text-xs font-medium text-[#5d6478]">{isBn ? "আপনার খামার" : "Your field"}</span>
              </div>

              {/* Main Content */}
              <div>
                <h3 className="font-serif font-normal text-3xl sm:text-5xl lg:text-[48px] leading-[1.1] text-[#12162b] mb-3">
                  {isBn
                    ? "তারপর এটি হয়ে ওঠে এমন এক বাক্য, যা দিয়ে আপনি সরাসরি কাজ করতে পারেন।"
                    : "Then it becomes a sentence you can act on."}
                </h3>
                
                <p className="text-[#5d6478] text-base sm:text-lg mb-6">
                  {isBn
                    ? "ক্রপওয়াইজ কী ধরনের পরামর্শ দেয় তা দেখতে নিচের যে কোনো একটি ফসল বেছে নিন:"
                    : "Pick a crop to see the kind of advice CropWise gives."}
                </p>

                {/* Crop Chips Selection */}
                <div className="flex flex-wrap gap-2.5 mb-7" role="group" aria-label="Choose a crop">
                  {CROP_KEYS.map((crop) => {
                    const isSelected = selectedCrop === crop.id;
                    return (
                      <button
                        key={crop.id}
                        type="button"
                        onClick={() => setSelectedCrop(crop.id)}
                        className={`rounded-full px-5 py-2 text-sm font-medium transition cursor-pointer ${
                          isSelected
                            ? "bg-[#12162b] text-[#fbfaf7] border border-[#12162b] shadow-xs"
                            : "bg-transparent text-[#12162b] border border-[#12162b]/25 hover:border-[#12162b] hover:bg-white/40"
                        }`}
                      >
                        {crop.en} · {crop.bn}
                      </button>
                    );
                  })}
                </div>

                {/* Elegant Actionable Advice Answer Box */}
                <div className="border-t border-[#12162b]/20 pt-5 max-w-[580px] min-h-[140px]">
                  <p className="text-[#5d6478] text-sm mb-2 font-medium">
                    {isBn ? "স্যাটেলাইটের তথ্যে পাওয়া গেছে: " : "Satellites show: "}
                    <span className="text-slate-800">{isBn ? currentCrop.seenBn : currentCrop.seenEn}</span>
                  </p>

                  <p className="font-serif font-normal text-2xl sm:text-3xl text-[#12162b] leading-[1.25] mb-3">
                    {isBn ? currentCrop.doBn : currentCrop.doEn}
                  </p>

                  <small className="text-[#5d6478] text-xs">
                    {isBn ? "উদাহরণস্বরূপ পরামর্শ, লাইভ তথ্য নয়।" : "Example advice, not live data."}
                  </small>
                </div>

              </div>

            </div>

          </div>
        </div>

      </section>


      {/* ========================================================================= */}
      {/* 3. BENTO GRID ("Everything a farmer needs to decide, in one calm place.") */}
      {/* ========================================================================= */}
      <section id="features" className="max-w-[1160px] mx-auto px-6 pt-32 pb-16">
        
        <h2 className="font-serif font-normal text-3xl sm:text-5xl lg:text-[62px] leading-[1.04] tracking-[-0.03em] max-w-[780px] mb-4 text-[#12162b]">
          {isBn
            ? "কৃষকের সিদ্ধান্ত গ্রহণের সবকিছু এক শান্ত ও সহজ জায়গায়।"
            : "Everything a farmer needs to decide, in one calm place."}
        </h2>
        <p className="text-[#5d6478] max-w-[520px] text-lg mb-12">
          {isBn
            ? "কোনো জটিল ড্যাশবোর্ড বোঝার ঝামেলা নেই। এই সপ্তাহে আপনার জমির জন্য যা দরকার শুধু সেটুকুই।"
            : "No dashboards to decode. Just the few things that matter for your field this week."}
        </p>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

          {/* Tile 1: Dual Radiometry Chart (4 cols, 2 rows) */}
          <div className="md:col-span-4 md:row-span-2 relative overflow-hidden rounded-[28px] border border-[#e3e1d8] bg-white p-7 sm:p-8 flex flex-col justify-between gap-5 min-h-[340px] group transition hover:shadow-sm">
            <span className="self-start text-xs border border-[#e3e1d8] rounded-full px-3 py-1 text-[#2f7d5b] bg-[#2f7d5b]/10 font-medium">
              Sample view
            </span>

            {/* SVG Wave Chart */}
            <svg className="w-full h-[180px] sm:h-[220px]" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="agGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f7d5b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2f7d5b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 150 C60 140 90 110 150 118 S240 70 300 80 S400 40 450 56 S540 20 600 30 V200 H0Z" fill="url(#agGrad)" />
              <path d="M0 160 C60 150 90 118 150 126 S240 78 300 90 S400 52 450 62 S540 30 600 40" fill="none" stroke="#12162b" strokeWidth="2" strokeDasharray="4 6" opacity="0.55" vectorEffect="non-scaling-stroke" />
              <path d="M0 150 C60 140 90 110 150 118 S240 70 300 80 S400 40 450 56 S540 20 600 30" fill="none" stroke="#2f7d5b" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>

            <div>
              <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-[#12162b] mb-1.5">
                {isBn ? "স্যাটেলাইট ও সেন্সর, যৌথ সত্য" : "Satellite and sensor, one truth"}
              </h3>
              <p className="text-[#5d6478] text-sm sm:text-base max-w-[420px]">
                {isBn
                  ? "ডাটা ফিউশন ইঞ্জিন স্যাটেলাইটের রিডিং (সলিড লাইন) এবং আপনার ফিল্ড সেন্সরের পরিমাপকে (ডট লাইন) একত্রিত করে।"
                  : "The Data Fusion Engine lines up satellite passes (solid) with readings from your own field sensor (dotted)."}
              </p>
            </div>
          </div>

          {/* Tile 2: Water Deficit Ring Gauge (2 cols) */}
          <div className="md:col-span-2 relative overflow-hidden rounded-[28px] border border-[#e3e1d8] bg-white p-7 flex flex-col justify-between gap-5 min-h-[260px]">
            <span className="self-start text-xs border border-[#e3e1d8] rounded-full px-3 py-1 text-[#2f7d5b] bg-[#2f7d5b]/10 font-medium">
              Sample view
            </span>

            <div className="flex items-center gap-4">
              <svg width="90" height="90" viewBox="0 0 120 120" aria-hidden="true" className="shrink-0">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e3e1d8" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#2f7d5b" strokeWidth="12" strokeLinecap="round" strokeDasharray="214 314" transform="rotate(-90 60 60)" />
              </svg>
              <b className="text-4xl sm:text-5xl font-medium tracking-tight text-[#12162b]">68%</b>
            </div>

            <div>
              <h3 className="text-xl font-medium tracking-tight text-[#12162b] mb-1">
                {isBn ? "পানির ঘাটতি (WDI)" : "Water deficit"}
              </h3>
              <p className="text-[#5d6478] text-sm">
                WDI = 1 − ET/PET. {isBn ? "ফসলের কতটা পানির টান রয়েছে তা নির্দেশ করে।" : "It shows how short of water your crop is."}
              </p>
            </div>
          </div>

          {/* Tile 3: Rainfall Bars (2 cols) */}
          <div className="md:col-span-2 relative overflow-hidden rounded-[28px] border border-[#e3e1d8] bg-white p-7 flex flex-col justify-between gap-5 min-h-[260px]">
            <span className="self-start text-xs border border-[#e3e1d8] rounded-full px-3 py-1 text-[#2f7d5b] bg-[#2f7d5b]/10 font-medium">
              Sample view
            </span>

            {/* 5 Vertical Bars */}
            <div className="flex items-end gap-2.5 h-[110px]" aria-hidden="true">
              {[
                { day: "Sat", h: 20 },
                { day: "Sun", h: 35 },
                { day: "Mon", h: 85 },
                { day: "Tue", h: 55 },
                { day: "Wed", h: 15 },
              ].map((b) => (
                <div key={b.day} className="flex-1 h-full flex flex-col justify-end gap-1.5 text-center text-xs text-[#5d6478]">
                  <i 
                    className="block rounded-lg bg-[#2f7d5b]/70 transition-all hover:bg-[#2f7d5b]" 
                    style={{ height: `${b.h}%` }}
                  />
                  <span>{b.day}</span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-xl font-medium tracking-tight text-[#12162b] mb-1">
                {isBn ? "বৃষ্টিপাত ট্র্যাকিং" : "Rainfall"}
              </h3>
              <p className="text-[#5d6478] text-sm">
                {isBn ? "NASA GPM IMERG থেকে উপগ্রহভিত্তিক বৃষ্টিপাত বিশ্লেষণ।" : "Satellite rain tracking from NASA GPM IMERG."}
              </p>
            </div>
          </div>

          {/* Tile 4: AI Explains (3 cols) */}
          <div className="md:col-span-3 relative overflow-hidden rounded-[28px] border border-[#e3e1d8] bg-white p-7 sm:p-8 flex flex-col justify-between gap-5 min-h-[260px]">
            <div className="font-serif text-3xl sm:text-5xl leading-none tracking-tight text-[#12162b]">
              {isBn ? "সহজ কথায় " : "Ask "}
              <span className="text-[#5d6478]">{isBn ? "প্রশ্ন করুন।" : "in plain words."}</span>
            </div>

            <div>
              <h3 className="text-xl font-medium tracking-tight text-[#12162b] mb-1">
                {isBn ? "কৃষি সহকারী যে বুঝিয়ে বলে" : "An assistant that explains"}
              </h3>
              <p className="text-[#5d6478] text-sm sm:text-base">
                {isBn
                  ? "একটি RAG-চালিত এআই সহকারী স্যাটেলাইট পরিসংখ্যানকে সহজ বোধগম্য পরামর্শে রূপান্তর করে।"
                  : "A RAG-powered AI assistant turns statistical models into advice you can act on."}
              </p>
            </div>
          </div>

          {/* Tile 5: Risk Scored (3 cols) */}
          <div className="md:col-span-3 relative overflow-hidden rounded-[28px] border border-[#e3e1d8] bg-white p-7 sm:p-8 flex flex-col justify-between gap-5 min-h-[260px]">
            <div className="font-serif text-3xl sm:text-5xl leading-none tracking-tight text-[#12162b]">
              {isBn ? "ঝুঁকি নির্ণয় ও " : "Risk, "}
              <span className="text-[#5d6478]">{isBn ? "পরিকল্পনা।" : "scored."}</span>
            </div>

            <div>
              <h3 className="text-xl font-medium tracking-tight text-[#12162b] mb-1">
                {isBn ? "পরবর্তী ফসলের সঠিক দিকনির্দেশনা" : "Know what to plant next"}
              </h3>
              <p className="text-[#5d6478] text-sm sm:text-base">
                {isBn
                  ? "জলবায়ু ঝুঁকি স্কোর এবং ফসল রোটেশন ইঞ্জিন আপনার পরবর্তী মৌসুমকে নিরাপদ করে।"
                  : "Climate risk scoring and a crop rotation engine guide your next season."}
              </p>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. CROPS MARQUEE ("Made for the crops Bangladesh grows.")                 */}
      {/* ========================================================================= */}
      <section id="crops" className="max-w-[960px] mx-auto px-6 sm:px-14 pt-20 pb-8 pl-16">
        <h2 className="font-serif font-normal text-2xl sm:text-4xl text-[#12162b] mb-7 leading-snug max-w-[560px]">
          {isBn ? "বাংলাদেশের আবহাওয়া ও ফসলের জন্য নিবেদিত।" : "Made for the crops Bangladesh grows."}
        </h2>

        {/* Marquee Row */}
        <div className="relative overflow-hidden mask-gradient">
          <div className="animate-marquee gap-3 py-2">
            {[
              { en: "Rice", bn: "ধান" },
              { en: "Jute", bn: "পাট" },
              { en: "Wheat", bn: "গম" },
              { en: "Maize", bn: "ভুট্টা" },
              { en: "Potato", bn: "আলু" },
              { en: "Tea", bn: "চা" },
              { en: "Lentil", bn: "মসুর" },
              { en: "Mustard", bn: "সরিষা" },
              // Duplicate once for infinite seamless loop
              { en: "Rice", bn: "ধান" },
              { en: "Jute", bn: "পাট" },
              { en: "Wheat", bn: "গম" },
              { en: "Maize", bn: "ভুট্টা" },
              { en: "Potato", bn: "আলু" },
              { en: "Tea", bn: "চা" },
              { en: "Lentil", bn: "মসুর" },
              { en: "Mustard", bn: "সরিষা" },
            ].map((c, i) => (
              <span
                key={i}
                className="border border-[#e3e1d8] bg-white rounded-full px-6 py-2.5 text-xl sm:text-2xl font-serif text-[#12162b] whitespace-nowrap shadow-2xs"
              >
                {c.en} <em className="text-[#5d6478] text-[0.7em] not-italic ml-1.5 font-sans">{c.bn}</em>
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. NINE DATA SOURCES ("Nine data sources. One clear answer.")             */}
      {/* ========================================================================= */}
      <section id="data" className="max-w-[1160px] mx-auto px-6 pt-32 pb-16">
        <h2 className="font-serif font-normal text-3xl sm:text-5xl lg:text-[62px] leading-[1.04] tracking-[-0.03em] max-w-[780px] mb-4 text-[#12162b]">
          {isBn ? "৯টি উপাত্তের উৎস। একটি স্পষ্ট সিদ্ধান্ত।" : "Nine data sources. One clear answer."}
        </h2>
        <p className="text-[#5d6478] max-w-[520px] text-lg mb-12">
          {isBn
            ? "ক্রপওয়াইজ নাসা আর্থ অবজারভেশন, মাটির রেকর্ড এবং আপনার নিজস্ব ফিল্ড সেন্সরের ডেটা সমন্বয় করে।"
            : "CropWise blends NASA Earth observation, soil records and your own field sensor."}
        </p>

        {/* 9 Rows List */}
        <div className="border-t border-[#e3e1d8]">
          {[
            { name: "NASA POWER", desc: "Weather and climate history for your location", tag: "Climate" },
            { name: "GPM IMERG", desc: "Satellite rainfall, tracked continuously", tag: "Rain" },
            { name: "SMAP", desc: "Moisture in the top layer of soil", tag: "Soil" },
            { name: "MODIS", desc: "Vegetation health and evapotranspiration", tag: "Crop" },
            { name: "Landsat 8/9", desc: "Detailed imagery of the land surface", tag: "Imagery" },
            { name: "ECOSTRESS", desc: "Plant water stress and land surface temperature", tag: "Heat" },
            { name: "ISRIC SoilGrids", desc: "Soil texture and properties", tag: "Soil" },
            { name: "NASADEM", desc: "Elevation and terrain shape", tag: "Terrain" },
            { name: "GEDI", desc: "Vegetation height and structure", tag: "Canopy" },
          ].map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-2 md:gap-5 items-baseline py-5 border-b border-[#e3e1d8] transition hover:pl-3"
            >
              <b className="text-xl font-medium text-[#12162b]">{row.name}</b>
              <span className="text-[#5d6478] text-base">{row.desc}</span>
              <em className="text-xs text-[#2f7d5b] border border-[#e3e1d8] rounded-full px-3 py-0.5 whitespace-nowrap not-italic self-start md:self-auto">
                {row.tag}
              </em>
            </div>
          ))}
        </div>

        {/* In-situ Hardware Sub-section */}
        <h3 className="font-serif font-normal text-2xl sm:text-4xl text-[#12162b] mt-16 mb-4">
          {isBn
            ? "মাটিতে একটি ESP32 ডিভাইস যোগ করে যা স্যাটেলাইট দেখতে পারে না।"
            : "On the ground, an ESP32 device adds what satellites can’t see."}
        </h3>

        <div className="flex flex-wrap gap-2.5">
          {[
            "DHT11 · air temperature and humidity",
            "Capacitive soil probe",
            "Analog rain sensor",
            "NEO-6M GPS",
          ].map((sensor) => (
            <span
              key={sensor}
              className="border border-dashed border-[#12162b]/30 rounded-2xl px-4 py-2.5 text-sm text-[#12162b] bg-white/40"
            >
              {sensor}
            </span>
          ))}
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 6. FAQ ACCORDION ("Good to know")                                        */}
      {/* ========================================================================= */}
      <section id="faq" className="max-w-[780px] mx-auto px-6 pt-32 pb-16">
        <h2 className="font-serif font-normal text-3xl sm:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.03em] mb-8 text-[#12162b]">
          {isBn ? "দরকারি তথ্য" : "Good to know"}
        </h2>

        <div className="divide-y divide-[#e3e1d8] border-y border-[#e3e1d8]">
          {[
            {
              q: isBn ? "তথ্যগুলো কোথা থেকে আসে?" : "Where does the data come from?",
              a: isBn
                ? "আমেরিকার নাসা আর্থ অবজারভেশন (POWER, GPM IMERG, SMAP, MODIS, Landsat, ECOSTRESS, NASADEM, GEDI), ISRIC SoilGrids এবং আপনার নিজের জমিতে থাকা ESP32 ফিল্ড সেন্সর থেকে।"
                : "From NASA Earth observation (POWER, GPM IMERG, SMAP, MODIS, Landsat, ECOSTRESS, NASADEM, GEDI), ISRIC SoilGrids and your own ESP32 field sensor.",
            },
            {
              q: isBn ? "আমাকে কি স্যাটেলাইট ডাটা বুঝতে হবে?" : "Do I need to understand satellite data?",
              a: isBn
                ? "না। ক্রপওয়াইজ স্যাটেলাইটের জটিল পরিমাপকে সহজ কথায় সংক্ষিপ্ত করণীয় পরামর্শে রূপান্তর করে।"
                : "No. CropWise turns the readings into short advice in plain words.",
            },
            {
              q: isBn ? "কোন কোন ফসল সম্পর্কে জানা যাবে?" : "Which crops can I explore?",
              a: isBn
                ? "ধান, পাট, গম, আলু, চা এবং আরও অনেক ফসল ক্রপস পেজে দেখা যাবে।"
                : "Rice, jute, wheat, potato, tea and more are on the Crops page.",
            },
            {
              q: isBn ? "মাঠের সেন্সর কী কী পরিমাপ করে?" : "What does the field sensor measure?",
              a: isBn
                ? "বাতাসের তাপমাত্রা ও আর্দ্রতা, মাটির আর্দ্রতা, বৃষ্টি এবং ডিভাইসের ভৌগোলিক অবস্থান। ক্রপওয়াইজ এগুলোকে স্যাটেলাইট তথ্যের সাথে মিলিয়ে নেয়।"
                : "Air temperature and humidity, soil moisture, rain and the device location. CropWise compares these with the satellite view.",
            },
            {
              q: isBn ? "পরামর্শ কি শতভাগ নিশ্চয়তা দেয়?" : "Is the advice a guarantee?",
              a: isBn
                ? "না। এটি বৈজ্ঞানিক তথ্যের ওপর ভিত্তি করে দিকনির্দেশনা। নিজের মাঠের বাস্তব পর্যবেক্ষণ এবং স্থানীয় কৃষি কর্মকর্তাদের উপদেশের সাথে এটি মিলিয়ে সিদ্ধান্ত নিন।"
                : "No. It’s guidance based on data. Combine it with what you see in your own field and with local extension advice.",
            },
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between text-left text-lg sm:text-xl font-medium text-[#12162b] cursor-pointer"
                >
                  <span>{item.q}</span>
                  <span className={`text-2xl text-[#5d6478] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-[#5d6478] text-base leading-relaxed max-w-[620px]">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 7. FINAL CALL TO ACTION ("Start with one field.")                         */}
      {/* ========================================================================= */}
      <section className="max-w-[960px] mx-auto px-6 sm:px-14 pt-16 pb-24 pl-16">
        <h2 className="font-serif font-normal text-5xl sm:text-7xl lg:text-[100px] leading-none tracking-[-0.035em] text-[#12162b] mb-8">
          {isBn ? "একটি খামার দিয়ে" : "Start with"}
          <br />
          {isBn ? "শুরু করুন।" : "one field."}
        </h2>

        <button
          type="button"
          onClick={() => router.push("/dashboard/crop-rotation")}
          className="relative overflow-hidden rounded-full bg-[#2f7d5b] px-8 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-[#25664a] active:scale-95 cursor-pointer"
        >
          <span>{isBn ? "✦ শুরু করুন" : "✦ Let’s try"}</span>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shine" />
        </button>
      </section>

    </div>
  );
}
