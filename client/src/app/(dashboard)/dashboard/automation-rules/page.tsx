"use client";

import React, { useState, useEffect } from "react";
import { script } from "@/lib/fonts";
import {
  Cpu,
  Sliders,
  Droplets,
  CloudRain,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  Plus,
  Power,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  Trash2,
  Wind,
  Activity,
  Layers,
} from "lucide-react";
import { TransparentNavSlot } from "../../header-context";
import { useLanguage } from "@/lib/language-context";
import DeviceConnectGate from "@/Components/modules/Device/DeviceConnectGate";

interface AutomationRule {
  id: string;
  name: string;
  conditionSensor: string;
  conditionOperator: "<" | ">" | "==";
  conditionValue: string;
  actionRelay: string;
  actionState: "ON" | "OFF";
  actionDuration?: string;
  active: boolean;
  triggersToday: number;
  iconType: "droplets" | "rain" | "temp" | "humidity" | "shield";
  color: "emerald" | "sky" | "amber" | "rose" | "indigo";
}

const defaultRules: AutomationRule[] = [
  {
    id: "RULE-1",
    name: "Low Soil Moisture Auto-Irrigation",
    conditionSensor: "Soil Moisture Probe A1",
    conditionOperator: "<",
    conditionValue: "35% VWC",
    actionRelay: "Relay 1 (Water Motor)",
    actionState: "ON",
    actionDuration: "for 30 mins",
    active: true,
    triggersToday: 3,
    iconType: "droplets",
    color: "emerald",
  },
  {
    id: "RULE-2",
    name: "Rain Detection Emergency Cutoff",
    conditionSensor: "Rain Sensor Array",
    conditionOperator: ">",
    conditionValue: "0 mm (Wet)",
    actionRelay: "Relay 1 & Relay 2",
    actionState: "OFF",
    actionDuration: "until dry",
    active: true,
    triggersToday: 1,
    iconType: "rain",
    color: "sky",
  },
  {
    id: "RULE-3",
    name: "Excess Heat Greenhouse Misting",
    conditionSensor: "Field Weather Temp",
    conditionOperator: ">",
    conditionValue: "38.0 °C",
    actionRelay: "Relay 2 (Solenoid Valve)",
    actionState: "ON",
    actionDuration: "for 10 mins",
    active: true,
    triggersToday: 2,
    iconType: "temp",
    color: "amber",
  },
  {
    id: "RULE-4",
    name: "Waterlogging Root Rot Protection",
    conditionSensor: "Root Zone Saturation",
    conditionOperator: ">",
    conditionValue: "75% VWC",
    actionRelay: "Relay 1 (Water Motor)",
    actionState: "OFF",
    actionDuration: "safety lockout",
    active: false,
    triggersToday: 0,
    iconType: "shield",
    color: "rose",
  },
];

const STORAGE_KEY = "cropwise_automation_rules_v1";

function AutomationRulesContent() {
  const { lang } = useLanguage();
  const isBn = lang === "BN";

  const [rules, setRules] = useState<AutomationRule[]>(defaultRules);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state for creating a new automation rule
  const [formName, setFormName] = useState("");
  const [formSensor, setFormSensor] = useState("Soil Moisture Probe A1");
  const [formOperator, setFormOperator] = useState<"<" | ">" | "==">("<");
  const [formValue, setFormValue] = useState("30% VWC");
  const [formRelay, setFormRelay] = useState("Relay 1 (Water Motor)");
  const [formState, setFormState] = useState<"ON" | "OFF">("ON");
  const [formDuration, setFormDuration] = useState("for 20 mins");

  // Load saved rules from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRules(parsed);
        }
      }
    } catch {}
  }, []);

  // Save rules to localStorage whenever they change
  const saveRules = (newRules: AutomationRule[]) => {
    setRules(newRules);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules));
      } catch {}
    }
  };

  const toggleRule = (id: string) => {
    const updated = rules.map((r) =>
      r.id === id ? { ...r, active: !r.active } : r
    );
    saveRules(updated);
  };

  const deleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    saveRules(updated);
  };

  const handleOpenModal = () => {
    setFormName(isBn ? "নতুন স্মার্ট অটোমেশন শর্ত" : "Custom Field Automation Rule");
    setFormSensor("Soil Moisture Probe A1");
    setFormOperator("<");
    setFormValue("30% VWC");
    setFormRelay("Relay 1 (Water Motor)");
    setFormState("ON");
    setFormDuration(isBn ? "২০ মিনিটের জন্য" : "for 20 mins");
    setIsModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let iconType: AutomationRule["iconType"] = "droplets";
    let color: AutomationRule["color"] = "emerald";

    if (formSensor.toLowerCase().includes("rain") || formSensor.toLowerCase().includes("বৃষ্টি")) {
      iconType = "rain";
      color = "sky";
    } else if (formSensor.toLowerCase().includes("temp") || formSensor.toLowerCase().includes("তাপমাত্রা")) {
      iconType = "temp";
      color = "amber";
    } else if (formSensor.toLowerCase().includes("humidity") || formSensor.toLowerCase().includes("আর্দ্রতা")) {
      iconType = "humidity";
      color = "indigo";
    } else if (formState === "OFF") {
      iconType = "shield";
      color = "rose";
    }

    const nextIdNumber = rules.length + 1;
    const newRule: AutomationRule = {
      id: `RULE-${nextIdNumber}`,
      name: formName.trim(),
      conditionSensor: formSensor,
      conditionOperator: formOperator,
      conditionValue: formValue.trim(),
      actionRelay: formRelay,
      actionState: formState,
      actionDuration: formDuration.trim() || undefined,
      active: true,
      triggersToday: 0,
      iconType,
      color,
    };

    saveRules([...rules, newRule]);
    setIsModalOpen(false);
  };

  const getRuleIcon = (type: AutomationRule["iconType"]) => {
    switch (type) {
      case "rain":
        return CloudRain;
      case "temp":
        return Thermometer;
      case "humidity":
        return Wind;
      case "shield":
        return ShieldAlert;
      case "droplets":
      default:
        return Droplets;
    }
  };

  const activeRulesCount = rules.filter((r) => r.active).length;
  const totalTriggers = rules.reduce((acc, curr) => acc + (curr.triggersToday || 0), 0);

  return (
    <div className="pb-24 sm:pb-12">
      <TransparentNavSlot />

      {/* ================= HERO ================= */}
      <section className="relative min-h-[300px] overflow-hidden bg-[#fbfcfa] sm:min-h-[320px]">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-[center_35%]"
            style={{
              backgroundImage:
                "url('https://i.ibb.co.com/PG31PycM/Chat-GPT-Image-Sep-24-2026-05-42-01-PM.png')",
            }}
          />
          <div className="absolute inset-y-0 left-0 hidden w-[45%] bg-gradient-to-r from-[#fbfcfa]/100 to-transparent sm:block" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/55 sm:hidden" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 hidden h-[35%] bg-gradient-to-t from-[#f5f7f5]/90 to-transparent sm:block" />
        </div>

        <div className="relative px-6 pb-20 pt-24 sm:px-10 sm:pb-24 sm:pt-24">
          <div className="max-w-lg">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-primary-700 uppercase sm:text-primary-800">
              <Cpu className="h-3.5 w-3.5 animate-pulse" />
              {isBn ? "স্মার্ট সেন্সর-ট্রিগারড অটোমেশন" : "Sensor-Driven Autonomous Control"}
            </p>

            <h1 className="text-3xl font-bold leading-tight text-white drop-shadow sm:text-4xl sm:font-semibold sm:text-slate-900 sm:drop-shadow-none">
              {isBn ? "অটোমেশন রুলস" : "Automation Rules"}
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/90 drop-shadow sm:text-slate-600 sm:drop-shadow-none">
              {isBn
                ? "সেন্সরের ডেটা অনুযায়ী রিলে এবং পাম্প স্বয়ংক্রিয়ভাবে অন/অফ করার শর্তাবলী তৈরি ও পরিচালনা করুন।"
                : "Create intelligent IF-THIS-THEN-THAT triggers to automatically control irrigation based on live temperature, moisture, and rain sensors."}
            </p>
          </div>

          <p
            className={`${script.className} absolute right-6 top-20 hidden -rotate-2 text-2xl leading-6 text-white drop-shadow sm:right-10 sm:block sm:top-24`}
          >
            Autonomous Fields.
            <br />
            Continuous Care.
          </p>
        </div>
      </section>

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 -mt-8 space-y-6 px-4 sm:-mt-10 sm:px-6">
        {/* Top bar with stats & add button */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-800">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {isBn
                  ? `${activeRulesCount} টি সক্রিয় অটোমেশন রুল কনফিগার করা`
                  : `${activeRulesCount} Active Field Logic Rules Configured`}
              </p>
              <p className="text-xs text-slate-500">
                {isBn
                  ? `আজকে মোট ${totalTriggers} বার স্বয়ংক্রিয়ভাবে ট্রিগার হয়েছে`
                  : `Triggered ${totalTriggers} times autonomously today`}
              </p>
            </div>
          </div>

          {/* Interactive Add Automation Rule Button */}
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 rounded-xl bg-primary-800 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-primary-900 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{isBn ? "নতুন অটোমেশন রুল যুক্ত করুন" : "Add Automation Rule"}</span>
          </button>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rules.map((rule) => {
            const Icon = getRuleIcon(rule.iconType);
            return (
              <div
                key={rule.id}
                className={`group relative overflow-hidden rounded-3xl border p-5 transition-all duration-200 ${
                  rule.active
                    ? "border-slate-200 bg-white shadow-sm hover:shadow-md"
                    : "border-slate-200/60 bg-slate-50/70 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        rule.color === "emerald"
                          ? "bg-emerald-100 text-emerald-700"
                          : rule.color === "sky"
                          ? "bg-sky-100 text-sky-700"
                          : rule.color === "amber"
                          ? "bg-amber-100 text-amber-700"
                          : rule.color === "indigo"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">
                        {rule.id} · {isBn ? "আজকে" : "Today"}: {rule.triggersToday} {isBn ? "বার ট্রিগার" : "triggers"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => deleteRule(rule.id)}
                      title="Delete rule"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        rule.active ? "bg-primary-700" : "bg-slate-300"
                      }`}
                      role="switch"
                      aria-checked={rule.active}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          rule.active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* IF THEN visualization */}
                <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2 sm:gap-4 border border-slate-100">
                  <div className="space-y-1">
                    <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase border border-slate-200">
                      {isBn ? "IF (শর্ত / Condition)" : "IF (Condition)"}
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {rule.conditionSensor}
                    </p>
                    <p className="text-xs font-bold text-primary-700">
                      {rule.conditionOperator} {rule.conditionValue}
                    </p>
                  </div>

                  <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                    <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase border border-slate-200">
                      {isBn ? "THEN (পদক্ষেপ / Action)" : "THEN (Action)"}
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {rule.actionRelay}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span
                        className={`font-bold ${
                          rule.actionState === "ON" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        SET {rule.actionState}
                      </span>
                      {rule.actionDuration && (
                        <span className="text-slate-500">({rule.actionDuration})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= ADD AUTOMATION RULE MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isBn ? "নতুন অটোমেশন রুল তৈরি করুন" : "Create New Automation Rule"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? "সেন্সর থ্রেশহোল্ড অনুযায়ী স্বয়ংক্রিয় রিলে কন্ট্রোল" : "Automated actuator trigger based on sensor thresholds"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRule} className="mt-5 space-y-4">
              {/* Rule Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isBn ? "রুলের নাম (Rule Name)" : "Rule Name"}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={isBn ? "যেমন: শুষ্ক মাটিতে সেচ" : "e.g. Dry Soil Auto-Watering"}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                />
              </div>

              {/* IF Condition Block */}
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/70 space-y-2.5">
                <span className="inline-block rounded bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800 uppercase">
                  IF (শর্ত / Trigger Condition)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isBn ? "সেন্সর নির্বাচন" : "Trigger Sensor"}
                    </label>
                    <select
                      value={formSensor}
                      onChange={(e) => setFormSensor(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-primary-600"
                    >
                      <option value="Soil Moisture Probe A1">Soil Moisture (মাটির আর্দ্রতা)</option>
                      <option value="Rain Sensor Array">Rain Sensor (বৃষ্টি সেন্সর)</option>
                      <option value="Field Weather Temp">Temperature (তাপমাত্রা)</option>
                      <option value="Relative Humidity">Relative Humidity (বাতাসের আর্দ্রতা)</option>
                      <option value="Root Zone Saturation">Root Zone Saturation (শিকড় অঞ্চল)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isBn ? "অপারেটর" : "Operator"}
                    </label>
                    <select
                      value={formOperator}
                      onChange={(e) => setFormOperator(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-bold outline-none focus:border-primary-600"
                    >
                      <option value="<">&lt; (Less than / কম)</option>
                      <option value=">">&gt; (Greater than / বেশি)</option>
                      <option value="==">== (Equal to / সমান)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {isBn ? "থ্রেশহোল্ড মান (Threshold Value)" : "Threshold Value"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="e.g. 30% VWC, 35 °C, 0 mm (Wet)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-primary-600"
                  />
                </div>
              </div>

              {/* THEN Action Block */}
              <div className="rounded-2xl bg-emerald-50/60 p-3.5 border border-emerald-200/70 space-y-2.5">
                <span className="inline-block rounded bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900 uppercase">
                  THEN (পদক্ষেপ / Actuator Action)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isBn ? "টার্গেট হার্ডওয়্যার" : "Target Actuator"}
                    </label>
                    <select
                      value={formRelay}
                      onChange={(e) => setFormRelay(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-primary-600"
                    >
                      <option value="Relay 1 (Water Motor)">Relay 1 (Water Motor)</option>
                      <option value="Relay 2 (Solenoid Valve)">Relay 2 (Solenoid Valve)</option>
                      <option value="Relay 1 & Relay 2">Relay 1 & Relay 2 (All Actuators)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isBn ? "অ্যাকশন স্টেট" : "Action State"}
                    </label>
                    <select
                      value={formState}
                      onChange={(e) => setFormState(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-primary-600"
                    >
                      <option value="ON">SET ON (চালু করুন)</option>
                      <option value="OFF">SET OFF (বন্ধ করুন)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {isBn ? "স্থায়িত্ব / সময়সীমা (Duration)" : "Duration"}
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. for 20 mins, for 1 hour, until dry"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-primary-600"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-800 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-primary-900 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isBn ? "রুল সংরক্ষণ করুন" : "Save Automation Rule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AutomationRulesPage() {
  return (
    <DeviceConnectGate
      pageTitle="Sensor Automation Rules"
      pageSubtitle="Connect your ESP32 device to configure threshold-triggered automated watering and relay rules."
    >
      <AutomationRulesContent />
    </DeviceConnectGate>
  );
}
