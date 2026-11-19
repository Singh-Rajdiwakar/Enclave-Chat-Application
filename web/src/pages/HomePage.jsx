import { useState } from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import {
  ArrowRightIcon,
  SparklesIcon,
  PhoneIcon,
  VideoIcon,
  MicIcon,
  PlayIcon,
  CheckCheckIcon,
  ShieldCheckIcon,
  ZapIcon,
  UsersIcon,
  PaletteIcon,
  FileTextIcon,
  CheckIcon,
  GlobeIcon,
  LockIcon,
  RadioIcon,
  MessageSquareIcon,
  BarChart3Icon,
  PinIcon,
  BookmarkIcon,
  Undo2Icon,
  CommandIcon,
  CheckSquareIcon,
} from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("transcribe");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07080C] text-white selection:bg-indigo-500/30 selection:text-white">
      {/* 🌌 Aurora Ambient Top Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[550px] w-[950px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute top-[600px] -right-40 h-[450px] w-[500px] rounded-full bg-purple-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-[1200px] -left-40 h-[450px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px]" />

      {/* 🕸️ Tech Grid with Radial Fade Mask */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* 🚀 NAVBAR */}
      <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <img
            src="/enclave-icon.svg"
            alt="Enclave"
            className="w-8 h-8 rounded-lg shadow-[0_0_20px_-4px_rgba(52,211,153,0.5)] object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-white">Enclave</span>
        </div>

        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition cursor-pointer">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 shadow-sm transition active:scale-95 cursor-pointer">
              Get started
            </button>
          </SignUpButton>
        </div>
      </nav>

      {/* 🎯 HERO HEADER */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-16 sm:pt-24 text-center">
        {/* Pill Tag */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-white/80 backdrop-blur-md shadow-xs">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Real-time · Voice · AI Transcriptions
        </span>

        {/* Heading */}
        <h1 className="mt-8 text-5xl font-semibold leading-[1.06] tracking-tight md:text-7xl">
          Conversations,{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            without the noise.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-white/60 leading-relaxed font-light">
          Instant messaging with voice notes, HD WebRTC calling, live voice-to-text transcriptions, and a refined dark glass experience.
        </p>

        {/* CTA Buttons */}
        <div className="mt-9 flex flex-wrap justify-center items-center gap-3">
          <SignUpButton mode="modal">
            <button className="group rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-3.5 font-medium text-white shadow-[0_0_30px_-6px_rgba(124,131,255,.8)] hover:scale-105 active:scale-95 transition flex items-center gap-2 cursor-pointer">
              <span>Start chatting</span>
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </SignUpButton>

          <SignInButton mode="modal">
            <button className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-medium text-white/80 backdrop-blur hover:bg-white/10 hover:text-white active:scale-95 transition cursor-pointer">
              I have an account
            </button>
          </SignInButton>
        </div>

        {/* Real Feature Chips */}
        <div className="mt-10 flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs text-white/50 font-mono">
          <span className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">⚡ &lt;50ms Real-time</span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">📞 WebRTC Audio & Video</span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">🎙️ Voice-to-Text AI</span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-emerald-500/30 text-emerald-400">🔒 E2EE Secret Chat</span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-indigo-500/30 text-indigo-300">🧵 Threaded Replies</span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">📊 Live Polls</span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">⌘K Command Palette</span>
        </div>
      </section>

      {/* 💻 LIVE PRODUCT MOCKUP (Actual Chat UI Experience) */}
      <section className="relative z-10 mx-auto mt-14 max-w-3xl px-4 sm:px-6">
        <div className="relative rounded-2xl border border-white/10 bg-[#11131A]/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          {/* Ambient Corner Glow */}
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Mockup Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80"
                  alt="Sarah Lin"
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-[#11131A]"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Sarah Lin</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    CORE TEAM
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">Online · Active now</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] text-white/60 border border-white/[0.06]">
                <PaletteIcon className="w-4 h-4" />
              </span>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] text-white/60 border border-white/[0.06]">
                <PhoneIcon className="w-4 h-4" />
              </span>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] text-white/60 border border-white/[0.06]">
                <VideoIcon className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Mockup Chat Messages Stream */}
          <div className="py-5 space-y-3.5">
            {/* 📌 Pinned Message Mockup Banner */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs">
              <div className="flex items-center gap-2 truncate">
                <PinIcon className="w-3.5 h-3.5 text-indigo-400 fill-current" />
                <span className="text-[10px] font-mono text-white/40 uppercase">PINNED:</span>
                <span className="text-white/85 text-xs truncate">Production STUN / TURN credentials & WebRTC mesh architecture</span>
              </div>
              <span className="text-[10px] font-mono text-white/40">Keep</span>
            </div>

            {/* 1. Received Message (Glass / Outline) + Thread Pill */}
            <div className="flex flex-col items-start max-w-md">
              <div className="px-4 py-2.5 rounded-[14px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-sm text-[#E6E8EF] shadow-xs">
                Hey team! Just tried out Enclave's new Cyber Indigo theme. The glass outline look is so clean.
                <div className="flex justify-end mt-1 text-[10px] font-mono text-white/40">10:41 PM</div>
              </div>
              {/* Thread pill */}
              <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-300 font-mono px-1">
                <MessageSquareIcon className="w-3.5 h-3.5" />
                <span>3 replies in thread →</span>
              </div>
            </div>

            {/* 2. E2E Encrypted Bubble Mockup */}
            <div className="flex flex-col items-start max-w-md">
              <div className="px-4 py-2.5 rounded-[14px] bg-white/[0.04] border border-emerald-500/30 backdrop-blur-md text-sm text-[#E6E8EF] shadow-[0_0_15px_-4px_rgba(52,211,153,0.25)]">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mb-1 pb-1 border-b border-white/[0.06]">
                  <LockIcon className="w-3 h-3" />
                  <span>E2E ENCRYPTED (AES-GCM 256)</span>
                </div>
                Private client keys exchanged via Web Crypto ECDH P-256. Zero server visibility.
                <div className="flex justify-end mt-1 text-[10px] font-mono text-white/40">10:42 PM</div>
              </div>
            </div>

            {/* 3. Sent Message (Gradient border + glow) */}
            <div className="flex flex-col items-end">
              <div
                className="max-w-md px-4 py-2.5 rounded-[14px] text-sm text-[#E6E8EF] relative"
                style={{
                  background:
                    "linear-gradient(#11131A, #11131A) padding-box, linear-gradient(135deg, #7C83FF, #A78BFA) border-box",
                  border: "1px solid transparent",
                  boxShadow: "0 0 24px -8px rgba(124,131,255,.45)",
                }}
              >
                Zero-latency sockets with dark glass bubbles — feels like Linear meets Arc. Check out this voice note:
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-mono text-white/40">
                  <span>10:42 PM</span>
                  <CheckCheckIcon className="w-3.5 h-3.5 text-[#7C83FF] stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* 4. Voice Note with Waveform & Live Transcription */}
            <div className="flex flex-col items-end">
              <div
                className="max-w-sm px-4 py-3 rounded-[14px] text-[#E6E8EF]"
                style={{
                  background:
                    "linear-gradient(#11131A, #11131A) padding-box, linear-gradient(135deg, #7C83FF, #A78BFA) border-box",
                  border: "1px solid transparent",
                  boxShadow: "0 0 20px -8px rgba(124,131,255,.3)",
                }}
              >
                {/* Player Row */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.08] text-white border border-white/[0.08]">
                    <PlayIcon className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70">
                    1.5x
                  </span>
                  {/* Waveform */}
                  <div className="flex-1 flex items-center gap-0.5 h-5">
                    {[40, 75, 100, 60, 85, 45, 90, 70, 50, 80, 95, 65, 40, 85, 60].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full"
                        style={{
                          height: `${h}%`,
                          background:
                            i < 7 ? "linear-gradient(#7C83FF, #A78BFA)" : "rgba(255,255,255,0.15)",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-white/50">0:18</span>
                </div>

                {/* In-Bubble Live Transcript Pill */}
                <div className="mt-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs">
                  <div className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <FileTextIcon className="w-3 h-3 text-[#7C83FF]" /> Live Transcript
                  </div>
                  <p className="italic text-white/80">"Deploying the group video call feature to production."</p>
                </div>

                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-mono text-white/40">
                  <span>10:43 PM</span>
                  <CheckCheckIcon className="w-3.5 h-3.5 text-[#7C83FF] stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* 5. Team Poll Mockup */}
            <div className="max-w-sm rounded-xl p-3 bg-white/[0.03] border border-white/[0.08] text-xs space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px] text-indigo-300">
                <span className="flex items-center gap-1">
                  <BarChart3Icon className="w-3 h-3" /> TEAM POLL
                </span>
                <span>28 votes</span>
              </div>
              <p className="font-medium text-white/90">Preferred backend runtime for Enclave v2?</p>
              <div className="space-y-1.5 pt-1">
                <div className="relative overflow-hidden rounded-lg p-2 border border-indigo-500/40 bg-indigo-500/10 flex justify-between">
                  <div className="absolute inset-y-0 left-0 bg-indigo-500/20 w-[72%]" />
                  <span className="relative z-10 font-medium">TypeScript + Express</span>
                  <span className="relative z-10 font-mono">72%</span>
                </div>
                <div className="relative overflow-hidden rounded-lg p-2 border border-white/[0.06] bg-white/[0.02] flex justify-between">
                  <div className="absolute inset-y-0 left-0 bg-white/[0.08] w-[28%]" />
                  <span className="relative z-10 font-medium">Go WebSockets</span>
                  <span className="relative z-10 font-mono">28%</span>
                </div>
              </div>
            </div>

            {/* 6. Call Pill Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-white/80 font-mono shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Voice Call</span>
                <span className="text-white/40">• 4m 12s</span>
              </div>
            </div>

            {/* 7. Live Typing Indicator */}
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300/80">
              <span className="flex gap-1 items-center px-2 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
              </span>
              <span>Sarah is typing...</span>
            </div>
          </div>

          {/* ⏳ Floating Undo Send Pill Mockup */}
          <div className="absolute bottom-16 right-6 hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#161922] border border-white/[0.12] shadow-2xl text-xs text-white">
            <span>Message sent</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[11px] font-medium">
              <Undo2Icon className="w-3 h-3" /> Undo (4s)
            </span>
          </div>

          {/* Mockup Input Bar */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2">
            <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white/40 font-mono flex items-center justify-between">
              <span>Type an encrypted message or record audio...</span>
              <MicIcon className="w-4 h-4 text-white/40" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-[0_0_15px_-3px_rgba(124,131,255,0.7)]">
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 🍱 BENTO GRID: PRODUCT FEATURES */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-28 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Crafted for speed, clarity &{" "}
            <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
              power users.
            </span>
          </h2>
          <p className="mt-3 text-white/50 text-sm sm:text-base font-light">
            Everything you need for seamless communication without bloated interfaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Voice Note Transcriptions (Col Span 2) */}
          <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.15] transition duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileTextIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">Speech-To-Text AI</span>
                <h3 className="text-lg font-semibold text-white">Live Voice Transcription</h3>
              </div>
            </div>
            <p className="text-sm text-white/60 max-w-lg mb-6 leading-relaxed">
              Never pause to listen to a 5-minute audio note in noisy environments. In-browser speech recognition transcribes voice notes instantly into readable text with multi-speed playback.
            </p>

            {/* Interactive Preview */}
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4 font-mono text-xs text-white/80 space-y-2">
              <div className="flex items-center justify-between text-white/40">
                <span>AUDIO RECORDING</span>
                <span className="text-emerald-400">TRANSCRIBED LIVE</span>
              </div>
              <p className="text-indigo-200 italic font-sans text-sm">
                “Hey team, the production deployment is complete. All STUN connections are verified.”
              </p>
            </div>
          </div>

          {/* Card 2: HD WebRTC Audio & Video Calling */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-white/[0.15] transition duration-300 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
                <VideoIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400">P2P Media Mesh</span>
              <h3 className="text-lg font-semibold text-white mt-1">HD Video & Audio Calls</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                Peer-to-peer WebRTC calling with floating picture-in-picture, audio wave visualizers, and multi-party participant invites.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 pt-4 border-t border-white/[0.06] text-xs font-mono text-white/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Google STUN • 0 Server Lag</span>
            </div>
          </div>

          {/* Card 3: 🧵 Slack-Style Threaded Conversations */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-white/[0.15] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <MessageSquareIcon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">Organized Discussions</span>
            <h3 className="text-lg font-semibold text-white mt-1">Threaded Conversations</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Reply directly inside side drawer threads without cluttering the main chat stream. Dedicated thread rooms with real-time typing indicators.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-black/40 border border-white/[0.06] font-mono text-xs text-indigo-300 flex items-center justify-between">
              <span>💬 3 replies in thread</span>
              <span className="text-white/40">Open →</span>
            </div>
          </div>

          {/* Card 4: 🔐 End-to-End Encrypted Secret Chat */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-white/[0.15] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <LockIcon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Web Crypto API</span>
            <h3 className="text-lg font-semibold text-white mt-1">E2E Encrypted Chats</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Hardware-grade ECDH Curve P-256 key exchange with AES-GCM 256-bit ciphertext on device. Server sees zero plaintext messages.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 font-mono text-xs text-emerald-400 flex items-center gap-2">
              <LockIcon className="w-3.5 h-3.5" />
              <span>AES-GCM-256 • Verified</span>
            </div>
          </div>

          {/* Card 5: 📊 Interactive Polls & Quick Voting */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-white/[0.15] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <BarChart3Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Decision Making</span>
            <h3 className="text-lg font-semibold text-white mt-1">Live Polls & Voting</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Create instant multi-option polls (2-6 options) in group or private chats. Real-time vote percentage bars and single-click vote toggle.
            </p>
            <div className="mt-4 space-y-1.5 font-mono text-xs">
              <div className="p-1.5 rounded bg-amber-500/15 text-amber-300 flex justify-between">
                <span>Option A</span>
                <span>65%</span>
              </div>
            </div>
          </div>

          {/* Card 6: 📌 Pinned Messages & Saved Notes */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-white/[0.15] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <PinIcon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Productivity</span>
            <h3 className="text-lg font-semibold text-white mt-1">Pinned & Saved Messages</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Pin critical announcements to the top glass banner. Use dedicated personal "Saved Messages" channel to store notes, files, and links.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-black/40 border border-white/[0.06] font-mono text-xs text-cyan-300 flex items-center gap-2">
              <BookmarkIcon className="w-3.5 h-3.5" />
              <span>Self-Notebook Active</span>
            </div>
          </div>

          {/* Card 7: ⏳ 5-Second Undo Send & Edit */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-white/[0.15] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <Undo2Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400">Precision Controls</span>
            <h3 className="text-lg font-semibold text-white mt-1">Undo Send & Edit</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Regret a typo? Cancel within 5 seconds with a floating countdown undo pill, edit messages in-place, or delete for everyone seamlessly.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-black/40 border border-white/[0.06] font-mono text-xs text-rose-300 flex items-center justify-between">
              <span>Undo send window</span>
              <span>5s countdown</span>
            </div>
          </div>

          {/* Card 8: ⌘K Command Palette & Tech Themes */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-white/[0.15] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-4">
              <CommandIcon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-fuchsia-400">Raycast &amp; Linear Feel</span>
            <h3 className="text-lg font-semibold text-white mt-1">⌘K Command Palette</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Hit Ctrl+K anywhere to jump between conversations, trigger voice calls, start polls, or switch between 4 dark glass neon accent themes.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-black/40 border border-white/[0.06] font-mono text-xs text-fuchsia-300 flex items-center justify-between">
              <span>Ctrl + K</span>
              <span>Quick Actions</span>
            </div>
          </div>

          {/* Card 9: 🎙️ Discord-Style Drop-in Voice Rooms */}
          <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-emerald-500/20 transition duration-300 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-emerald-500/8 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <RadioIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">WebRTC Mesh Audio</span>
                <h3 className="text-lg font-semibold text-white">Drop-in Voice Rooms</h3>
              </div>
            </div>
            <p className="text-sm text-white/60 max-w-lg mb-5 leading-relaxed">
              Discord-style drop-in audio rooms in any group chat. Join or leave anytime without ringing anyone. Live speaking indicators, mute/deafen controls, and real-time active member avatars with glow rings.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["R", "A", "P"].map((l, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#11131A] ${i === 0 ? "bg-emerald-500/70 ring-2 ring-emerald-400/60" : "bg-white/10"}`}>
                    {l}
                  </div>
                ))}
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                3 members connected
              </span>
            </div>
          </div>

          {/* Card 10: ⚡ Slash Commands */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-white/[0.15] transition duration-300">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <ZapIcon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Slack / Discord Style</span>
            <h3 className="text-lg font-semibold text-white mt-1">Slash Commands</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Type <code className="text-cyan-300 bg-cyan-500/10 px-1 rounded">/</code> to open the command menu. Run polls, split bills, set reminders, format code, or add tasks instantly.
            </p>
            <div className="mt-4 space-y-1 font-mono text-[11px]">
              {["/poll • /remind • /split", "/code • /task • /shrug"].map((s, i) => (
                <div key={i} className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.06] text-cyan-300/80">{s}</div>
              ))}
            </div>
          </div>

          {/* Card 11: 📋 Message-to-Task & Chat Tasks Panel */}
          <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#11131A]/70 p-6 sm:p-8 backdrop-blur-xl group hover:border-white/[0.15] transition duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <CheckSquareIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">Productivity Layer</span>
                <h3 className="text-lg font-semibold text-white">Chat Tasks &amp; Reminders</h3>
              </div>
            </div>
            <p className="text-sm text-white/60 max-w-lg mb-5 leading-relaxed">
              Hover any message and click "Make Task" to convert it into a tracked to-do. Use the Tasks panel to manage pending &amp; completed items with due dates, right inside the chat. No context switching.
            </p>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-200">
                <CheckSquareIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Review deploy checklist</span>
                <span className="ml-auto text-purple-400/60">due today</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/50 line-through">
                <CheckSquareIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Call the client back</span>
                <span className="ml-auto no-underline text-emerald-400/70 no-line-through">✓ done</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🛠️ TECH STACK & PORTFOLIO BANNER */}
      <section className="relative z-10 border-t border-white/[0.08] bg-black/30 py-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">MODERN TECH STACK</span>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mt-1">Built with production-grade tools</h3>
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                "React 19",
                "Vite",
                "Tailwind CSS v4",
                "TypeScript",
                "Node.js",
                "Express",
                "Socket.io",
                "WebRTC Mesh",
                "MongoDB Atlas",
                "Clerk Auth",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-lg text-xs font-mono bg-white/[0.04] border border-white/[0.08] text-white/80"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <SignUpButton mode="modal">
              <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition cursor-pointer shadow-md">
                Launch Enclave
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* 👣 FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 px-6 text-xs text-white/40 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-2.5 text-center">
          <div className="flex items-center gap-2">
            <img src="/enclave-icon.svg" alt="Enclave" className="w-4 h-4 object-contain opacity-80" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>All systems live & operational</span>
          </div>
          <p>© 2026 Enclave • High-performance real-time messaging</p>
          <p className="text-[11px] text-white/35 font-mono tracking-wider pt-1">
            Built by Singh Rajdiwakar
          </p>
        </div>
      </footer>
    </div>
  );
}
