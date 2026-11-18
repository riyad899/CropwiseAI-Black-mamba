"use client";

import React from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function Footer() {
  const { lang } = useLanguage();
  const isBn = lang === "BN";

  return (
    <footer className="border-t border-[#e3e1d8] bg-[#fbfaf7] text-slate-600 font-sans">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 py-10 sm:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          
          {/* Brand & Attribution */}
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f5a42] text-white shadow-sm">
              <Leaf className="h-4 w-4" />
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold text-[#12162b] text-[15px]">CropWise AI</span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="text-xs sm:text-sm text-[#5d6478] font-medium">
                {isBn
                  ? "টিম ব্ল্যাক মাম্বা · নাসা স্পেস অ্যাপস চ্যালেঞ্জ"
                  : "Team Black Mamba · NASA Space Apps Challenge"}
              </span>
            </div>
          </div>

          {/* Tagline Motto */}
          <div className="text-center font-serif italic text-base sm:text-lg text-slate-700">
            {isBn
              ? "মহাকাশের উপাত্ত · স্থানীয় প্রভাব · সমৃদ্ধ ভবিষ্যৎ।"
              : "Earth Data. Local Impact. Stronger Farms."}
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs sm:text-sm font-medium text-[#5d6478]">
            <Link href="/" className="transition hover:text-[#12162b]">
              {isBn ? "গোপনীয়তা" : "Privacy"}
            </Link>
            <Link href="/" className="transition hover:text-[#12162b]">
              {isBn ? "শর্তাবলী" : "Terms"}
            </Link>
            <Link href="/dashboard/about" className="transition hover:text-[#12162b]">
              {isBn ? "আমাদের সম্পর্কে" : "About"}
            </Link>
          </div>

        </div>

        {/* Bottom microcopy */}
        <div className="mt-8 pt-6 border-t border-[#e3e1d8]/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} CropWise AI. {isBn ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
          </p>
          <p>
            {isBn ? "নাসা আর্থ সায়েন্স ওপেন ডেটা দ্বারা চালিত।" : "Powered by NASA Earth Science Open Data."}
          </p>
        </div>
      </div>
    </footer>
  );
}
