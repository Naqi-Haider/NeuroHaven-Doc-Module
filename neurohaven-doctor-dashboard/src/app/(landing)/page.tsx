"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BrainCircuit,
  Activity,
  Bell,
  MessageSquare,
  Sparkles,
  Play,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typewriterTexts = [
  "Designed to assist clinicians in monitoring Mild Cognitive Impairment and early-stage Alzheimer's daily.",
  "Visualizing executive function, memory retrieval, and cognitive processing speed in real-time.",
  "Supporting cognitive reserve through adaptive daily exercises and objective telemetry tracking."
];

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState<"dashboard" | "chat" | "clinician">("dashboard");
  const [chatProgress, setChatProgress] = useState<number>(0);
  const [customReply, setCustomReply] = useState<string | null>(null);

  const [textIndex, setTextIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  const handleSelectSlide = (slide: "dashboard" | "chat" | "clinician") => {
    setActiveSlide(slide);
    const container = document.getElementById("patient-app");
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Typewriter fade transitions effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (fadeState === "in") {
      timer = setTimeout(() => {
        setFadeState("out");
      }, 4000);
    } else {
      timer = setTimeout(() => {
        setTextIndex((prevIndex) => (prevIndex + 1) % typewriterTexts.length);
        setFadeState("in");
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [fadeState]);

  const handleChatOption = (optionIndex: number, text: string) => {
    setChatProgress(optionIndex);
    setCustomReply(text);
  };

  return (
    <div className="w-full min-h-screen bg-[#F4F7F2] font-body text-jade-dark antialiased selection:bg-jade-primary/20 relative overflow-hidden pb-12">

      {/* Soft Ambient Glowing Orbs in the background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#EAF3DE]/60 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#BAC8B1]/30 blur-[150px] pointer-events-none -z-10" />

      {/* Glassmorphic Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-7xl z-50 flex h-16 items-center justify-between border border-white/50 bg-white/70 backdrop-blur-md px-6 md:px-8 rounded-full shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="relative h-7 w-7 shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/Neurohaven-logo.svg"
              alt="NeuroHaven Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-heading text-base font-bold tracking-tight text-jade-dark">
            NeuroHaven
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-jade-teal">
          <a href="#patient-app" className="hover:text-jade-dark transition-colors">Patient App</a>
          <a href="#companion" className="hover:text-jade-dark transition-colors">AI Companion</a>
          <a href="#clinician-features" className="hover:text-jade-dark transition-colors">Clinician Dashboard</a>
          <a href="#science" className="hover:text-jade-dark transition-colors">Cognitive Science</a>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/login" className="select-none">
            <button className="text-[12px] font-bold border border-jade-primary/20 hover:bg-[#EAF3DE]/30 text-jade-dark px-4 py-1.5 h-9 rounded-full transition-all cursor-pointer">
              Sign In
            </button>
          </Link>
          <Link href="/register" className="select-none">
            <button className="bg-jade-primary hover:bg-jade-dark text-white text-[12px] font-bold px-4 py-1.5 h-9 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="w-full min-h-[90vh] flex items-center max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 select-none">
        {/* Left Column: Headline */}
        <div className="lg:col-span-7 space-y-6 text-left">

          {/* Vibe-Coded Italic and Bold Hero Phrase */}
          <p className="text-xs md:text-sm font-bold italic text-jade-primary flex items-center gap-2 select-none">
            Empowering families and clinicians through early-stage care
          </p>

          <h1 className="font-heading text-4xl md:text-[56px] font-extrabold tracking-tight text-jade-dark leading-[1.15]">
            Your Daily Companion <br />
            for <span className="text-jade-primary">Cognitive Health</span>
          </h1>

          <p className="text-sm md:text-base text-jade-teal leading-relaxed max-w-xl font-medium">
            A gentle space designed for Alzheimer&apos;s care, memory support, and peaceful moments. NeuroHaven connects adaptive cognitive exercises with automated telemetry so clinicians and caregivers can monitor decline proactively.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/register" className="select-none">
              <button className="group bg-jade-primary hover:bg-jade-dark text-white rounded-full text-xs font-bold h-12 px-6 flex items-center gap-2 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 shadow-sm">
                Register as Provider <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/login" className="select-none">
              <button className="bg-white hover:bg-[#F4F7F2] border border-jade-primary/10 text-jade-dark rounded-full text-xs font-bold h-12 px-6 flex items-center gap-2 transition-all cursor-pointer hover:shadow-sm">
                <Play className="h-3.5 w-3.5 fill-jade-dark text-jade-dark" /> Clinician Log In
              </button>
            </Link>
          </div>
        </div>

        {/* Right Column: Nova Floating Persona (Static frame) */}
        <div className="lg:col-span-5 flex justify-center items-center relative">
          <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
            <Image
              src="/nova-avatar.png"
              alt="Nova AI Companion Avatar"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </header>

      {/* Floating Project Description (Fade-in/out typewriter, no background box / unenclosed layout) */}
      <section className="w-full min-h-[50vh] flex flex-col justify-center items-center max-w-5xl mx-auto text-center px-6 py-24">
        <div className="flex flex-col gap-4.5 w-full items-center">
          <span className="text-xs font-extrabold tracking-widest text-jade-primary uppercase select-none">
            Project Scope & Focus
          </span>
          <h2 className="font-heading text-2xl md:text-[38px] font-extrabold tracking-tight text-jade-dark leading-tight max-w-3xl select-none">
            Therapeutic support designed for <span className="italic font-serif font-light text-jade-primary">early cognitive decline</span> that is objective <span className="italic font-serif font-light text-jade-primary">and adaptive</span>
          </h2>

          <div className="min-h-[70px] md:min-h-[50px] flex items-center justify-center mt-2 w-full max-w-2xl select-none">
            <p
              className={`text-sm md:text-[16px] text-jade-teal leading-relaxed font-bold italic transition-all duration-700 ease-in-out ${fadeState === "in" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
            >
              {typewriterTexts[textIndex]}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Showcases Section */}
      <section className="w-full flex flex-col justify-start max-w-7xl mx-auto px-6 pt-36 pb-24" id="patient-app">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full mt-8">
          {/* Selector Navigation & Inline Heading (Left column) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Left Aligned Heading Block - Inline with phone start */}
            <div className="text-left w-full space-y-2 select-none">
              <span className="text-xs font-bold tracking-widest text-jade-primary uppercase">Unified Platform</span>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-jade-dark">
                Experience the NeuroHaven Interface
              </h2>
              <p className="text-xs md:text-sm text-jade-teal font-medium">
                Explore the companion screens built for patients and the detailed metrics logged for physicians.
              </p>
            </div>

            {/* Selector Navigation Buttons */}
            <div className="flex flex-col gap-4">
                {/* Nav item 1: Patient Dashboard */}
                <button
                  onClick={() => handleSelectSlide("dashboard")}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border bg-white transition-all duration-300 flex items-start gap-4 cursor-pointer focus:outline-none",
                    activeSlide === "dashboard" ? "border-jade-primary/30 shadow-md scale-100 opacity-100" : "border-jade-primary/5 scale-95 opacity-50"
                  )}
                >
                  <div className={cn("p-2.5 rounded-xl shrink-0 transition-colors", activeSlide === "dashboard" ? "bg-[#EAF3DE] text-jade-primary" : "bg-jade-light/40 text-jade-teal")}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-jade-dark">Patient App Interface</h4>
                    <p className="text-xs text-jade-teal leading-relaxed mt-1 font-medium">
                      Designed with high-contrast, clean typography, large targets, and soft color indicators to avoid clinical anxiety.
                    </p>
                  </div>
                </button>

                {/* Nav item 2: Nova AI Chat */}
                <button
                  onClick={() => handleSelectSlide("chat")}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border bg-white transition-all duration-300 flex items-start gap-4 cursor-pointer focus:outline-none",
                    activeSlide === "chat" ? "border-jade-primary/30 shadow-md scale-100 opacity-100" : "border-jade-primary/5 scale-95 opacity-50"
                  )}
                >
                  <div className={cn("p-2.5 rounded-xl shrink-0 transition-colors", activeSlide === "chat" ? "bg-[#EAF3DE] text-jade-primary" : "bg-jade-light/40 text-jade-teal")}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-jade-dark">Nova AI Companion Chat</h4>
                    <p className="text-xs text-jade-teal leading-relaxed mt-1 font-medium">
                      A conversational AI companion that guides patients through reminders, checks cognitive fluency, and assesses sentiment indices.
                    </p>
                  </div>
                </button>

                {/* Nav item 3: Clinician feed */}
                <button
                  onClick={() => handleSelectSlide("clinician")}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border bg-white transition-all duration-300 flex items-start gap-4 cursor-pointer focus:outline-none",
                    activeSlide === "clinician" ? "border-jade-primary/30 shadow-md scale-100 opacity-100" : "border-jade-primary/5 scale-95 opacity-50"
                  )}
                >
                  <div className={cn("p-2.5 rounded-xl shrink-0 transition-colors", activeSlide === "clinician" ? "bg-[#EAF3DE] text-jade-primary" : "bg-jade-light/40 text-jade-teal")}>
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-jade-dark">Clinician Dashboard Analytics</h4>
                    <p className="text-xs text-jade-teal leading-relaxed mt-1 font-medium">
                      Physicians inspect automated metrics, response latencies, missed dosage alarms, and trigger secure real-time message routes.
                    </p>
                  </div>
                </button>
              </div>
            </div>

              {/* Dynamic Mockup Viewport */}
              <div className="lg:col-span-7 flex justify-center items-center w-full py-4">

                {/* Patient Dashboard Mockup */}
                {activeSlide === "dashboard" && (
                  <div className="w-[320px] h-[600px] rounded-[36px] border-8 border-jade-dark bg-white shadow-2xl overflow-hidden flex flex-col justify-between font-sans relative select-none animate-fadeIn">
                    {/* Smartphone camera notch */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-jade-dark rounded-full z-20" />

                    {/* Phone Status header */}
                    <div className="px-6 pt-8 pb-3 bg-[#EAF3DE]/35 border-b border-jade-primary/5 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-white border border-jade-muted/30 shadow-sm flex items-center justify-center font-bold text-jade-primary text-xs">
                          E
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-jade-teal leading-none font-medium">Good morning,</span>
                          <span className="text-xs font-bold text-jade-dark mt-0.5">Eleanor</span>
                        </div>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-white border border-jade-muted/30 shadow-sm flex items-center justify-center text-jade-teal">
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    {/* Patient App Greeting Card */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#EAF3DE]/10 to-white">

                      {/* Avocado Banner Card (The only card element required) */}
                      <div className="bg-gradient-to-br from-[#7B9669] to-[#6C8480] text-white p-4 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                        <div className="absolute right-[-15px] bottom-[-15px] w-24 h-24 opacity-30 select-none">
                          <span className="text-7xl">🥑</span>
                        </div>
                        <div className="space-y-1">
                          <span className="bg-white/20 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block">
                            Today with Nova
                          </span>
                          <h4 className="font-heading text-sm font-bold leading-snug">
                            A gentle 10-minute routine awaits
                          </h4>
                        </div>
                        <button className="bg-white text-jade-dark text-[11px] font-bold py-1.5 px-3 rounded-lg w-fit shadow-sm hover:bg-[#F4F7F2] transition-all">
                          Begin →
                        </button>
                      </div>

                      {/* Stats Quick Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#F4F7F2] border border-jade-primary/5 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] text-[#6C8480] uppercase tracking-wider block font-bold">Streak</span>
                          <span className="text-sm font-bold text-jade-dark block mt-0.5">12 Days</span>
                        </div>
                        <div className="bg-[#404E3B] text-white rounded-xl p-2.5 text-center">
                          <span className="text-[9px] text-white/55 uppercase tracking-wider block font-bold">Mood</span>
                          <span className="text-xs font-bold block mt-0.5">😊 Calm</span>
                        </div>
                        <div className="bg-[#F4F7F2] border border-[#7B9669]/10 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] text-[#6C8480] uppercase tracking-wider block font-bold">Today</span>
                          <span className="text-sm font-bold text-jade-dark block mt-0.5">2 / 4</span>
                        </div>
                      </div>

                      {/* Exercise grid list */}
                      <div className="space-y-2 text-left">
                        <h5 className="text-[11px] font-bold text-jade-teal uppercase tracking-wider">Today&apos;s Exercises</h5>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-600 text-white rounded-xl p-3 flex flex-col justify-between min-h-[90px] cursor-pointer">
                            <span className="text-base select-none">🧩</span>
                            <div>
                              <span className="text-[8px] text-blue-200 uppercase tracking-wide block">Memory</span>
                              <span className="text-[11px] font-bold block leading-tight truncate">Sequence Recall</span>
                            </div>
                          </div>
                          <div className="bg-amber-600 text-white rounded-xl p-3 flex flex-col justify-between min-h-[90px] cursor-pointer">
                            <span className="text-base select-none">🎯</span>
                            <div>
                              <span className="text-[8px] text-amber-200 uppercase tracking-wide block">Attention</span>
                              <span className="text-[11px] font-bold block leading-tight truncate">Focus Flow</span>
                            </div>
                          </div>
                          <div className="bg-green-700 text-white rounded-xl p-3 flex flex-col justify-between min-h-[90px] cursor-pointer">
                            <span className="text-base select-none">🧠</span>
                            <div>
                              <span className="text-[8px] text-green-200 uppercase tracking-wide block">Logic</span>
                              <span className="text-[11px] font-bold block leading-tight truncate">Train of Thought</span>
                            </div>
                          </div>
                          <div className="bg-purple-600 text-white rounded-xl p-3 flex flex-col justify-between min-h-[90px] cursor-pointer">
                            <span className="text-base select-none">✨</span>
                            <div>
                              <span className="text-[8px] text-purple-200 uppercase tracking-wide block">Reflection</span>
                              <span className="text-[11px] font-bold block leading-tight truncate">Daily Spark</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phone Bottom Nav Bar */}
                    <div className="px-6 py-3 border-t border-jade-muted/20 bg-white flex items-center justify-around shrink-0 text-jade-teal select-none">
                      <span className="text-jade-primary cursor-pointer text-xs">Home</span>
                      <span className="cursor-pointer opacity-60">🧭</span>
                      <span className="cursor-pointer opacity-60">🎮</span>
                      <span className="cursor-pointer opacity-60">📊</span>
                    </div>
                  </div>
                )}

                {/* Nova Companion Chat Simulator Mockup */}
                {activeSlide === "chat" && (
                  <div className="w-[320px] h-[600px] rounded-[36px] border-8 border-jade-dark bg-white shadow-2xl overflow-hidden flex flex-col justify-between font-sans relative select-none animate-fadeIn">
                    {/* Smartphone camera notch */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-jade-dark rounded-full z-20" />

                    {/* Top Status Header */}
                    <div className="px-6 pt-8 pb-3 bg-[#EAF3DE]/35 border-b border-jade-primary/5 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-white border border-jade-muted/30 shadow-sm flex items-center justify-center text-xs">
                          🤖
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-jade-dark leading-none">Nova Companion</span>
                          <span className="text-[8px] text-[#1B8A5A] font-extrabold uppercase tracking-widest mt-0.5 flex items-center gap-0.5">
                            <span className="h-1 w-1 rounded-full bg-[#1B8A5A] inline-block animate-pulse" /> Active
                          </span>
                        </div>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-white border border-jade-muted/30 shadow-sm flex items-center justify-center text-jade-teal text-[10px] font-extrabold uppercase font-sans">
                        AI
                      </div>
                    </div>

                    {/* Simulated Message stream */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#EAF3DE]/10 to-white text-xs">

                      {/* Nova Message Bubble */}
                      <div className="flex gap-2 items-start text-left max-w-[85%]">
                        <div className="h-6 w-6 rounded-full bg-[#EAF3DE] text-jade-primary flex items-center justify-center shrink-0 text-[10px]">
                          🤖
                        </div>
                        <div className="bg-[#EAF3DE]/40 border border-jade-primary/5 rounded-2xl p-3 rounded-tl-none font-medium text-jade-dark leading-relaxed">
                          Hello Eleanor. We have our cognitive check today! Did you manage to complete your morning walk exercise?
                        </div>
                      </div>

                      {/* User response simulation */}
                      {chatProgress >= 0 && (
                        <div className="bg-jade-primary text-white p-3 rounded-2xl rounded-tr-none font-medium ml-auto max-w-[85%] text-left leading-relaxed animate-fadeIn">
                          {customReply || "Yes, I did! I walked down the street with Thomas."}
                        </div>
                      )}

                      {/* Nova AI response follow up */}
                      {chatProgress >= 1 && (
                        <div className="flex gap-2 items-start text-left max-w-[85%] animate-fadeIn">
                          <div className="h-6 w-6 rounded-full bg-[#EAF3DE] text-jade-primary flex items-center justify-center shrink-0 text-[10px]">
                            🤖
                          </div>
                          <div className="bg-[#EAF3DE]/40 border border-jade-primary/5 rounded-2xl p-3 rounded-tl-none font-medium text-jade-dark leading-relaxed">
                            That sounds lovely! Thomas is your son, correct? Remembering family walks is a wonderful milestone today. Let&apos;s run our brief word recall task next.
                          </div>
                        </div>
                      )}

                      {/* User option selection cards simulating input target interfaces */}
                      <div className="space-y-2 pt-2 select-none">
                        <button
                          disabled={chatProgress > 0}
                          onClick={() => handleChatOption(1, "Yes, it was warm outside.")}
                          className={cn(
                            "w-full bg-white border rounded-xl p-2.5 text-left font-bold text-[11px] transition-all flex items-center justify-between",
                            chatProgress === 0 ? "border-jade-primary/20 hover:bg-[#F4F7F2]/60 cursor-pointer" : "border-jade-muted/30 opacity-50"
                          )}
                        >
                          <span>Yes, it was warm outside.</span>
                          <ArrowRight className="h-3 w-3 text-jade-teal" />
                        </button>
                        <button
                          disabled={chatProgress > 0}
                          onClick={() => handleChatOption(2, "No, it was too cold today.")}
                          className={cn(
                            "w-full bg-white border rounded-xl p-2.5 text-left font-bold text-[11px] transition-all flex items-center justify-between",
                            chatProgress === 0 ? "border-jade-primary/20 hover:bg-[#F4F7F2]/60 cursor-pointer" : "border-jade-muted/30 opacity-50"
                          )}
                        >
                          <span>No, it was too cold today.</span>
                          <ArrowRight className="h-3 w-3 text-jade-teal" />
                        </button>
                      </div>

                      {/* Input field simulation */}
                      <div className="flex items-center gap-2 border border-jade-muted bg-[#F4F7F2]/60 px-3 py-1.5 rounded-full text-[10px] text-jade-teal font-medium mt-1">
                        <span>Tell Nova anything...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clinician Dashboard Mockup (Matching Phone Frame Size & Spacing) */}
                {activeSlide === "clinician" && (
                  <div className="w-[320px] h-[600px] rounded-[36px] border-8 border-jade-dark bg-white shadow-2xl overflow-hidden flex flex-col justify-between font-sans relative select-none animate-fadeIn">
                    {/* Smartphone camera notch */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-jade-dark rounded-full z-20" />

                    {/* Top Status Header */}
                    <div className="px-6 pt-8 pb-3 bg-[#EAF3DE]/35 border-b border-jade-primary/5 flex items-center justify-between shrink-0">
                      <span className="text-[10px] font-bold text-jade-dark uppercase tracking-wider">Clinician Portal</span>
                      <div className="flex items-center gap-1 bg-[#1B8A5A]/10 text-[#1B8A5A] px-2 py-0.5 rounded-full text-[8px] font-bold">
                        Live Status
                      </div>
                    </div>

                    {/* Scrollable details */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#EAF3DE]/10 to-white">
                      <h4 className="text-[11px] font-bold text-jade-teal uppercase tracking-wider">Active Telemetry</h4>

                      <div className="space-y-2 text-left">
                        <div className="bg-[#F4F7F2]/60 border border-jade-primary/5 rounded-xl p-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-7 w-7 rounded-full bg-[#EAF3DE] text-jade-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                              EV
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-jade-dark block truncate">Eleanor Vance</span>
                              <span className="text-[8px] text-[#E53935] font-bold block mt-0.5">Critical Drop Alert</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-jade-dark shrink-0">45%</span>
                        </div>

                        <div className="bg-white border border-jade-muted/50 rounded-xl p-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-7 w-7 rounded-full bg-[#EAF3DE] text-jade-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                              AP
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-jade-dark block truncate">Arthur Pendelton</span>
                              <span className="text-[8px] text-status-warning font-bold block mt-0.5">Medication Flag</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-jade-dark shrink-0">72%</span>
                        </div>

                        <div className="bg-white border border-jade-muted/50 rounded-xl p-2.5 flex items-center justify-between gap-3 opacity-70">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-7 w-7 rounded-full bg-[#EAF3DE] text-jade-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                              GC
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-jade-dark block truncate">Gordon Cole</span>
                              <span className="text-[8px] text-[#1B8A5A] font-bold block mt-0.5">Telemetry Stable</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-jade-dark shrink-0">88%</span>
                        </div>
                      </div>
                    </div>

                    {/* Secure Port details */}
                    <div className="p-3 bg-white border-t border-jade-primary/5 space-y-2 shrink-0">
                      <div className="bg-[#EAF3DE]/30 border border-jade-primary/10 rounded-xl p-2.5 space-y-1.5 text-left">
                        <div className="flex justify-between items-center text-[8px] font-bold text-jade-dark">
                          <span>SECURE CLINICIAN ROUTE</span>
                          <span className="text-[#1B8A5A] font-mono">PORT 3001</span>
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            disabled
                            placeholder="Let's adjust morning dose..."
                            className="flex-1 bg-white border border-jade-muted rounded-md px-2 py-1 text-[9px] font-medium text-jade-teal"
                          />
                          <button className="bg-jade-primary text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </section>
      {/* Feature grid with custom designs (No card wrappers except for Bento Main cell) */}
      <section className="w-full min-h-[90vh] flex flex-col justify-center max-w-7xl mx-auto px-6 py-24 border-t border-jade-muted/20" id="science">
        <div className="mb-12 text-left">
          <span className="text-xs font-bold tracking-widest text-jade-primary uppercase">Clinical Architecture</span>
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-jade-dark mt-1.5">
            Engineered to slow early-stage dementia
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Main Card (The ONLY grid card container allowed) */}
          <div className="lg:col-span-6 bg-gradient-to-tr from-jade-dark to-[#5a6e53] text-white rounded-[28px] p-8 md:p-10 flex flex-col justify-between min-h-[360px] border border-white/10 shadow-lg relative overflow-hidden group">
            <div className="absolute right-[-20px] top-[-20px] w-64 h-64 opacity-10 select-none transition-transform duration-700 group-hover:scale-105 group-hover:rotate-6">
              <Image
                src="/brain-exercise-logo.svg"
                alt="Brain Exercise Logo illustration"
                fill
                className="object-contain"
              />
            </div>

            {/* <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-white/90 w-fit backdrop-blur-md">
              <BrainCircuit className="h-4 w-4" /> Adaptive Q-Learning
            </div> */}

            <div className="space-y-3 mt-auto">
              <h3 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                Dynamic exercises that protect cognitive reserve
              </h3>
              <p className="text-xs md:text-sm text-white/80 leading-relaxed font-medium">
                Our reinforcement learning engine adjusts exercise difficulty in real-time based on past completion rates, keeping patients stimulated while avoiding user anxiety or cognitive frustration.
              </p>
            </div>
          </div>

          {/* Side Column: Non-card layout panels */}
          <div className="lg:col-span-6 flex flex-col justify-start gap-6 py-2">

            {/* Panel 1: Clean Split layout with SVG */}
            <div className="flex items-start gap-5 group pb-6 border-b border-jade-muted/20">
              <div className="relative h-14 w-14 shrink-0 transition-transform duration-500 group-hover:scale-105">
                <Image
                  src="/mobile-message.svg"
                  alt="Frictionless Linking"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading text-sm font-bold text-jade-dark">
                  Frictionless provider linking
                </h4>
                <p className="text-xs text-jade-teal leading-relaxed font-medium">
                  Connect apps instantly. Early-stage patients enter a secure 8-character code generated on their mobile screen to pair automatically with the clinic telemetry database.
                </p>
              </div>
            </div>

            {/* Panel 2: Clean Split layout with SVG */}
            <div className="flex items-start gap-5 group pt-2 pb-2">
              <div className="relative h-14 w-14 shrink-0 transition-transform duration-500 group-hover:scale-105">
                <Image
                  src="/notes-notepad.svg"
                  alt="Lexical Markers"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading text-sm font-bold text-jade-dark">
                  Lexical companion markers
                </h4>
                <p className="text-xs text-jade-teal leading-relaxed font-medium">
                  Nova AI logs speech cadence and lexical variations during daily chat sessions, evaluating sentiment indexes and flagging cognitive blocks.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Glossy / Frost themed clinician login CTA Banner */}
      <section className="w-full min-h-[50vh] flex flex-col justify-center max-w-7xl mx-auto px-6 py-24" id="companion">
        <div className="bg-white/60 border border-white/70 backdrop-blur-md rounded-[32px] p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold tracking-widest text-jade-primary uppercase">
              Provider Workstation
            </span>
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-jade-dark leading-tight">
              Ready to setup your clinician portal?
            </h2>
            <p className="text-xs md:text-sm text-jade-teal max-w-xl font-medium leading-relaxed">
              Register your credentials, configure alerts, and pair with patient devices to gain real-time clinical oversight.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 select-none">
            <Link href="/register" className="select-none">
              <button className="bg-jade-primary hover:bg-jade-dark text-white rounded-full text-xs font-bold h-12 px-6 shadow-sm hover:shadow-md transition-all cursor-pointer">
                Create Provider Account
              </button>
            </Link>
            <Link href="/login" className="select-none">
              <button className="bg-white hover:bg-[#F4F7F2] border border-jade-primary/10 text-jade-dark rounded-full text-xs font-bold h-12 px-6 transition-all cursor-pointer">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Secure clinical EHR status ticker - Properly colored and visible */}
      <div className="max-w-7xl mx-auto overflow-hidden py-4 select-none relative">
        <div className="flex w-max animate-marquee">
          <div className="flex space-x-12 px-4">
            <span className="text-xl md:text-2xl font-heading font-extrabold tracking-[0.15em] text-[#7B9669] uppercase">
              HIPAA SECURE • HL7 FHIR COMPLIANT • END-TO-END ENCRYPTED TELEMETRY • AES-256 SYSTEM STANDARDS • HIPAA SECURE
            </span>
          </div>
          <div className="flex space-x-12 px-4">
            <span className="text-xl md:text-2xl font-heading font-extrabold tracking-[0.15em] text-[#7B9669] uppercase">
              HIPAA SECURE • HL7 FHIR COMPLIANT • END-TO-END ENCRYPTED TELEMETRY • AES-256 SYSTEM STANDARDS • HIPAA SECURE
            </span>
          </div>
        </div>
      </div>

      {/* Scope disclaimer footer */}
      <footer className="max-w-7xl mx-auto px-6 pt-10 mt-6 border-t border-jade-muted/20 text-xs text-jade-teal space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2">
            <div className="relative h-5 w-5">
              <Image
                src="/Neurohaven-logo.svg"
                alt="NeuroHaven Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-jade-dark">© {new Date().getFullYear()} NeuroHaven Platform</span>
          </div>

          <div className="flex flex-wrap gap-4 font-semibold">
            <Link href="#" className="hover:underline">Privacy Policy</Link>
            <Link href="#" className="hover:underline">Terms of Service</Link>
            <Link href="#" className="hover:underline">HIPAA Compliance</Link>
            <Link href="#" className="hover:underline">Support</Link>
          </div>
        </div>

        <p className="text-[11px] text-[#8fa29e] leading-relaxed">
          <strong>Clinical Scope Disclaimer:</strong> {"NeuroHaven is designed specifically for therapeutic cognitive support and active monitoring in Mild Cognitive Impairment (MCI) and early-stage Alzheimer's Disease. It does not replace professional clinical diagnosis, and is not designed or intended for individuals with late-stage dementia or advanced cognitive loss."}
        </p>
      </footer>

    </div>
  );
}
