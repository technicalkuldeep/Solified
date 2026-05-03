import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lightning,
  Database,
  Cube,
  MagnifyingGlass,
  Crosshair,
  DownloadSimple,
  Browsers,
  Clipboard,
  Warning,
  SealCheck,
  ShieldWarning,
  Lock,
  Eye,
  ArrowRight,
  Prohibit,
  Fire,
  Cpu,
  Fingerprint,
  BracketsCurly,
  FlowArrow,
} from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WalletInput from "@/components/WalletInput";
import RecentScans from "@/components/RecentScans";

const DEMO_ADDRESSES = [
  { label: "USDC (Token)", addr: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { label: "Jupiter Aggregator", addr: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4" },
  { label: "BONK (Token)", addr: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { label: "Marinade mSOL", addr: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So" },
];

const INTENT_REALITY = [
  {
    intent: "Swap 10 USDC → SOL",
    reality: [
      { label: "Approve UNLIMITED token spending → 4zd…d7a", severity: "critical" },
      { label: "Transfer 2.4 SOL to unknown wallet → 8sMp…Eyd7", severity: "critical" },
      { label: "Interact with unverified program ZkPro…XYZf", severity: "warn" },
    ],
  },
  {
    intent: "Mint NFT for 0.1 SOL",
    reality: [
      { label: "Drain authority granted to contract", severity: "critical" },
      { label: "Hidden fee of 0.5 SOL embedded", severity: "critical" },
      { label: "Royalty override instruction present", severity: "warn" },
    ],
  },
  {
    intent: "Claim free airdrop",
    reality: [
      { label: "Sign over wallet delegate access", severity: "critical" },
      { label: "Interact with 3 unknown programs", severity: "warn" },
      { label: "Irreversible approval granted permanently", severity: "critical" },
    ],
  },
];

const CORE_FEATURES = [
  {
    icon: FlowArrow,
    label: "Transaction Firewall",
    body: "Intercepts signTransaction calls before they reach your wallet. Every instruction decoded before you see the prompt.",
    accent: "#38FFD0",
  },
  {
    icon: BracketsCurly,
    label: "Instruction Decoder",
    body: "Parses raw Solana instructions into human-readable actions. You see what the contract actually does — not its marketing copy.",
    accent: "#5B8FFF",
  },
  {
    icon: Cpu,
    label: "Simulation Engine",
    body: "Runs the transaction on mainnet state before you sign. Catches SOL drains, failures, and unexpected side-effects.",
    accent: "#B536FF",
  },
  {
    icon: Fingerprint,
    label: "Intent Verification",
    body: "Compares what you think you're doing vs. what the transaction executes. Mismatches trigger immediate warnings.",
    accent: "#FF5B5B",
  },
];

const SUPPORTING_FEATURES = [
  {
    icon: Crosshair,
    title: "Wallet Risk Analysis",
    body: "Wallet age, tx frequency, failed-tx ratio, known-scam interactions — all scored 0–100 with every reason exposed.",
  },
  {
    icon: Cube,
    title: "Token Risk Signals",
    body: "Mint authority, freeze authority, holder concentration, supply analysis. Detect rug-pull patterns before exposure.",
  },
  {
    icon: Warning,
    title: "Scam Detection",
    body: "Cross-referenced against known drainer contracts, flagged programs, and reported scam addresses.",
  },
];

function VerdictBadge({ verdict }) {
  const map = {
    BLOCK: { bg: "#FF333318", color: "#FF3333", border: "#FF333550" },
    WARN:  { bg: "#FFD60018", color: "#FFD600", border: "#FFD60050" },
    ALLOW: { bg: "#00FF6618", color: "#00FF66", border: "#00FF6650" },
  };
  const s = map[verdict];
  return (
    <span
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      className="font-mono text-[9px] uppercase tracking-[0.3em] px-2.5 py-1"
    >
      {verdict}
    </span>
  );
}

function IntentRealityCard({ item, isOpen, onToggle }) {
  return (
    <div
      className={`border transition-colors cursor-pointer ${isOpen ? "border-white/25 bg-white/[0.015]" : "border-white/10 hover:border-white/18"}`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between p-5">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/35 mb-1">You intended</div>
          <div className="font-display text-sm font-bold text-white">{item.intent}</div>
        </div>
        <VerdictBadge verdict="BLOCK" />
      </div>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 p-5 space-y-2"
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#FF3333] mb-3">
            Transaction actually executes
          </div>
          {item.reality.map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-3 py-2 border-l-2 ${
                r.severity === "critical"
                  ? "border-[#FF3333] bg-[#FF3333]/10"
                  : "border-[#FFD600] bg-[#FFD600]/10"
              }`}
            >
              <Prohibit
                size={12}
                weight="bold"
                className={`mt-0.5 shrink-0 ${r.severity === "critical" ? "text-[#FF3333]" : "text-[#FFD600]"}`}
              />
              <span className={`font-mono text-[10px] leading-relaxed ${r.severity === "critical" ? "text-[#FFB3B3]" : "text-[#FFE680]"}`}>
                {r.label}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function Landing() {
  const [openCard, setOpenCard] = useState(0);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white" data-testid="landing-page">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]" data-testid="hero-section">
        <div className="absolute -left-32 top-10 h-[500px] w-[500px] brand-orb brand-orb-cyan opacity-25 float-slow" />
        <div className="absolute right-[-200px] top-24 h-[600px] w-[600px] brand-orb brand-orb-violet opacity-25 float-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute left-1/3 bottom-0 h-[380px] w-[380px] brand-orb brand-orb-blue opacity-15" />
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="noise absolute inset-0" />

        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-10 lg:px-12 lg:pt-32">
          <div className="grid lg:grid-cols-[1fr_460px] gap-14 items-start">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 border border-[#FF3333]/30 bg-[#FF3333]/8 px-3.5 py-1.5 backdrop-blur-sm mb-8">
                <span className="h-1.5 w-1.5 bg-[#FF3333] animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#FF3333]/90">
                  Pre-signing Firewall · Solana Mainnet
                </span>
              </div>

              <h1 className="font-display text-5xl font-black leading-[0.93] tracking-tighter sm:text-6xl lg:text-[80px]">
                <span className="text-white">Know before</span>
                <br />
                <span className="brand-gradient-text">you sign.</span>
              </h1>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-white/60 lg:text-lg">
                Solified is a <span className="text-white font-medium">pre-signing firewall</span> for Solana.
                It intercepts every transaction, decodes each instruction, simulates outcomes on mainnet, and
                delivers a clear verdict — before your wallet ever sees the request.
              </p>

              <div className="mt-7 border border-[#FFD600]/25 bg-[#FFD600]/6 p-4 max-w-lg">
                <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#FFD600]/60 mb-1.5">
                  Example · you clicked "Swap"
                </div>
                <div className="font-mono text-sm text-white/85 leading-relaxed">
                  It also requested{" "}
                  <span className="text-[#FF3333] font-bold">unlimited token approval</span> and a{" "}
                  <span className="text-[#FF3333] font-bold">hidden SOL transfer.</span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#firewall"
                  className="inline-flex items-center gap-3 bg-white px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] hover:bg-white/90 transition-colors"
                >
                  <ShieldWarning size={15} weight="bold" /> Arm the firewall
                </a>
                <a
                  href="#scan"
                  className="inline-flex items-center gap-2 border border-white/20 px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] text-white/65 hover:border-white/40 transition-colors"
                >
                  <MagnifyingGlass size={13} /> Scan wallet / token
                </a>
              </div>
            </motion.div>

            {/* Firewall modal preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
              data-testid="hero-modal-preview"
            >
              <div className="border border-[#FF3333] border-l-[3px] bg-[#0D0D10] shadow-[0_0_60px_rgba(255,51,51,0.12)]">
                <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-[#FF3333] animate-pulse" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#FF3333]">
                      Solified · Firewall Intercepted
                    </span>
                  </div>
                  <VerdictBadge verdict="BLOCK" />
                </div>
                <div className="p-5">
                  <div className="font-display text-lg font-black text-white">Transaction intercepted</div>
                  <div className="font-mono text-[10px] text-white/35 mt-0.5">3 instructions · 2 programs · Score: 18/100</div>
                  <div className="mt-5 space-y-1.5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30 mb-2">What this transaction actually does</div>
                    {[
                      "Transfer 1.200000 SOL → 8sMp…Eyd7",
                      "Approve UNLIMITED token spending → 4zd…d7a",
                      "Interact with unknown program ZkPro…XYZf",
                    ].map((a, i) => (
                      <div key={i} className="border border-white/10 bg-[#121216] px-3 py-2 font-mono text-[10px] text-white/75">{a}</div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30 mb-2">Warnings</div>
                    <div className="border-l-2 border-[#FF3333] bg-[#FF3333]/10 p-3">
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF3333] mb-1">Unlimited token approval</div>
                      <div className="text-[10px] text-[#FFB3B3]">Classic drainer signature. Proceed with extreme caution.</div>
                    </div>
                    <div className="border-l-2 border-[#FFD600] bg-[#FFD600]/10 p-3">
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FFD600] mb-1">Hidden SOL transfer</div>
                      <div className="text-[10px] text-[#FFE680]">SOL bundled inside unknown program call.</div>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2 justify-end">
                    <span className="border border-white/15 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">✅ Proceed</span>
                    <span className="bg-[#FF3333] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white font-bold">🚫 Block</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/22">
                Live preview · real-time interception
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative mx-auto max-w-7xl px-6 pb-12 lg:px-12">
          <div className="grid grid-cols-2 border border-white/[0.08] bg-white/[0.012] backdrop-blur-sm sm:grid-cols-4">
            {[
              ["<800ms", "Verdict time"],
              ["3-step", "Decode · Simulate · Verdict"],
              ["20+", "Heuristics"],
              ["100%", "Pre-signing"],
            ].map(([v, l], i) => (
              <div key={i} className="border-b border-r border-white/[0.06] p-6 last:border-r-0 hover:bg-white/[0.02] transition-colors sm:border-b-0 sm:[&:nth-child(4n)]:border-r-0" data-testid={`hero-stat-${i}`}>
                <div className="font-display text-3xl font-black tracking-tight lg:text-4xl brand-gradient-text">{v}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/38">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRANSACTION FIREWALL ── */}
      <section id="firewall" className="border-t border-white/10 bg-[#0D0D10]" data-testid="firewall-section">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <div className="grid grid-cols-1 gap-0 border border-white/10 lg:grid-cols-[1fr_400px]">
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
              <div className="inline-flex items-center gap-2 border border-[#FF3333]/35 bg-[#FF3333]/8 px-3 py-1.5 mb-6">
                <Fire size={12} weight="bold" className="text-[#FF3333]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FF3333]">Transaction Firewall · Primary</span>
              </div>
              <h2 className="font-display text-3xl font-black tracking-tight lg:text-[50px] leading-[0.94]">
                Your transaction
                <br />
                <span className="text-white/32">is not what it seems.</span>
              </h2>
              <p className="mt-6 max-w-lg text-white/58 leading-relaxed">
                Every Solana transaction — on Jupiter, Magic Eden, any dApp — is intercepted by Solified.
                We decode every instruction, simulate the outcome on mainnet, and surface any mismatch
                between what you intended and what the contract will actually execute.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: Eye, k: "Decode", v: "Every instruction parsed into plain language. No raw hex.", accent: "#38FFD0" },
                  { icon: Cpu, k: "Simulate", v: "Transaction executed on mainnet state before you sign.", accent: "#5B8FFF" },
                  { icon: ShieldWarning, k: "Verdict", v: "ALLOW, WARN, or BLOCK — with every reason exposed.", accent: "#B536FF" },
                ].map((p, i) => {
                  const Ic = p.icon;
                  return (
                    <div key={i} className="border border-white/10 p-4 hover:border-white/20 transition-colors" data-testid={`firewall-step-${i}`}>
                      <div className="flex h-9 w-9 items-center justify-center border" style={{ borderColor: `${p.accent}40`, color: p.accent }}>
                        <Ic size={16} weight="duotone" />
                      </div>
                      <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: p.accent }}>{p.k}</div>
                      <div className="mt-1 text-sm text-white/55 leading-relaxed">{p.v}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex flex-wrap gap-3 items-center">
                <a href="#extension" data-testid="firewall-install-cta" className="inline-flex items-center gap-3 bg-white px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] hover:bg-white/90 transition-colors">
                  <ShieldWarning size={16} weight="bold" /> Arm the firewall
                </a>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">Phantom · Solflare · Backpack</span>
              </div>
            </div>

            {/* Live modal */}
            <div className="bg-[#080810] p-8 lg:p-10" data-testid="firewall-modal-preview">
              <div className="border border-[#FF3333] border-l-[3px]">
                <div className="border-b border-white/10 px-4 py-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-[#FF3333] animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#FF3333]">Solified · Signer Firewall</span>
                </div>
                <div className="p-4">
                  <div className="font-display text-xl font-black text-[#FF3333]">⚠ Warning</div>
                  <div className="font-mono text-[10px] text-white/35 mt-0.5">3 instructions · v0 · 2 programs</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="font-display text-3xl font-black text-[#FF3333]">35</div>
                    <div className="border border-[#FF3333] font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF3333] px-2 py-0.5">High Risk</div>
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-3 space-y-1.5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30 mb-2">What this transaction does</div>
                    {["Transfer 1.200000 SOL → 8sMp…Eyd7", "Approve UNLIMITED token spending → 4zd…d7a", "Interact with unknown program ZkPro…XYZf"].map((a, i) => (
                      <div key={i} className="border border-white/10 bg-[#121216] px-2.5 py-1.5 font-mono text-[10px] text-white/78">{a}</div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-white/10 pt-3 space-y-1.5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30 mb-2">Warnings</div>
                    <div className="border-l-2 border-[#FF3333] bg-[#FF3333]/10 p-2 text-[10px] text-[#FFB3B3]">
                      <b className="block text-[9px] uppercase tracking-[0.2em] text-[#FF3333] mb-0.5">Unlimited token approval</b>
                      Drainer signature — proceed with extreme caution.
                    </div>
                    <div className="border-l-2 border-[#FFD600] bg-[#FFD600]/10 p-2 text-[10px] text-[#FFE680]">
                      <b className="block text-[9px] uppercase tracking-[0.2em] text-[#FFD600] mb-0.5">Hidden SOL transfer</b>
                      SOL bundled with unknown program call.
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <span className="border border-white/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">✅ Continue</span>
                    <span className="bg-[#FF3333] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white font-bold">🚫 Block</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/22">Live preview · in-flight interception</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTENT vs REALITY ── */}
      <section id="intent-reality" className="border-t border-white/10" data-testid="intent-reality-section">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <div className="mb-12 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/38 mb-2">Intent vs Reality</div>
              <h2 className="font-display text-3xl font-black tracking-tight lg:text-5xl">
                What you think
                <br />
                <span className="text-white/32">vs. what you're signing.</span>
              </h2>
            </div>
            <p className="text-white/52 leading-relaxed md:text-base max-w-sm">
              Malicious contracts disguise their behavior. Click any example to see what Solified exposes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {INTENT_REALITY.map((item, i) => (
              <IntentRealityCard
                key={i}
                item={item}
                isOpen={openCard === i}
                onToggle={() => setOpenCard(openCard === i ? -1 : i)}
              />
            ))}
          </div>

          <div className="mt-5 border border-white/[0.06] bg-white/[0.01] p-5 flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#38FFD0]/30 text-[#38FFD0]">
              <Eye size={16} weight="duotone" />
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              <span className="text-white font-medium">Every example above is real.</span>{" "}
              These are actual patterns Solified detects across Solana dApps. The interface says one thing.
              The transaction says another. Solified shows you both.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="border-t border-white/10 bg-[#0D0D10]" data-testid="how-it-works-section">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <div className="mb-12 max-w-2xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/38 mb-2">How It Works</div>
            <h2 className="font-display text-3xl font-black tracking-tight lg:text-5xl">
              Two modes.
              <br />
              <span className="text-white/32">One verdict system.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Mode 1: Firewall */}
            <div className="border border-white/10">
              <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center border border-[#FF3333]/40 text-[#FF3333]">
                  <Fire size={13} weight="bold" />
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#FF3333]">Mode 1 · Primary</div>
                  <div className="font-display text-sm font-black mt-0.5">Transaction Firewall</div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { n: "01", t: "Transaction triggered", b: "You interact with any Solana dApp. Solified intercepts the signTransaction call." },
                  { n: "02", t: "Decode & Simulate", b: "Every instruction decoded. Outcome simulated on mainnet state. Intent checked." },
                  { n: "03", t: "ALLOW / WARN / BLOCK", b: "A clear verdict with full context. You decide — with complete information." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4" data-testid={`step-firewall-${i}`}>
                    <div className="font-mono text-2xl font-bold text-white/12 shrink-0 w-8">{s.n}</div>
                    <div>
                      <div className="font-display text-sm font-black">{s.t}</div>
                      <div className="mt-1 text-sm text-white/50 leading-relaxed">{s.b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode 2: Scan */}
            <div className="border border-white/10">
              <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center border border-[#38FFD0]/40 text-[#38FFD0]">
                  <MagnifyingGlass size={13} weight="bold" />
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#38FFD0]">Mode 2 · Supporting</div>
                  <div className="font-display text-sm font-black mt-0.5">Wallet & Token Analysis</div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { n: "01", t: "Paste any address", b: "Drop a Solana wallet or token mint address into the scanner below." },
                  { n: "02", t: "Analyze risk signals", b: "20+ heuristics run across wallet age, tx patterns, token supply, and known scam data." },
                  { n: "03", t: "View full insights", b: "Get a scored breakdown with every reason explained — no black-box output." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4" data-testid={`step-scan-${i}`}>
                    <div className="font-mono text-2xl font-bold text-white/12 shrink-0 w-8">{s.n}</div>
                    <div>
                      <div className="font-display text-sm font-black">{s.t}</div>
                      <div className="mt-1 text-sm text-white/50 leading-relaxed">{s.b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Verdict row */}
          <div className="mt-6 grid grid-cols-3 border border-white/10 divide-x divide-white/10">
            {[
              { v: "ALLOW", desc: "Transaction is safe. Proceed.", color: "#00FF66" },
              { v: "WARN",  desc: "Risk detected. Review before signing.", color: "#FFD600" },
              { v: "BLOCK", desc: "High risk. Do not sign.", color: "#FF3333" },
            ].map(({ v, desc, color }) => (
              <div key={v} className="p-5 text-center">
                <div className="inline-block border font-mono text-[10px] uppercase tracking-[0.3em] px-3 py-1 mb-2" style={{ color, borderColor: `${color}45`, background: `${color}10` }}>{v}</div>
                <p className="text-xs text-white/42">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCAN TOOL ── */}
      <section id="scan" className="border-t border-white/10" data-testid="scan-section">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <div className="grid grid-cols-1 gap-0 border border-white/10 lg:grid-cols-[1fr_auto]">
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
              <div className="inline-flex items-center gap-2 border border-[#38FFD0]/30 bg-[#38FFD0]/6 px-3 py-1.5 mb-6">
                <MagnifyingGlass size={11} weight="bold" className="text-[#38FFD0]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#38FFD0]">
                  Analysis Layer · Supporting Intelligence
                </span>
              </div>

              <h2 className="font-display text-3xl font-black tracking-tight lg:text-5xl">
                Scan any wallet
                <br />
                <span className="text-white/32">or token, instantly.</span>
              </h2>

              <p className="mt-5 max-w-lg text-white/55 leading-relaxed">
                Beyond transactions, Solified lets you analyze wallets and tokens for risk signals. Use it as
                a quick pre-check before interacting with a new address — or go deeper with transaction-level
                firewall protection.
              </p>

              <div className="mt-8">
                <WalletInput size="lg" />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/32">Try:</span>
                {DEMO_ADDRESSES.map((d) => (
                  <Link
                    key={d.addr}
                    to={`/scan/${encodeURIComponent(d.addr)}`}
                    data-testid={`demo-address-${d.label.replace(/\s+/g, "-").toLowerCase()}`}
                    className="font-mono text-xs text-white/45 underline decoration-dotted underline-offset-4 transition-colors hover:text-white"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* What scanning covers */}
            <div className="bg-[#0D0D10] p-8 lg:p-10 lg:w-[340px]">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/32 mb-6">What scanning covers</div>
              <div className="space-y-4">
                {[
                  ["Wallet score 0–100", "Age, activity, failed-tx ratio, scam interactions."],
                  ["Token risk signals", "Mint authority, freeze authority, holder concentration."],
                  ["Known scam matching", "Cross-referenced against flagged addresses and drainers."],
                  ["Human-readable reasons", "Every deduction explained. No black-box output."],
                  ["5-min result caching", "Share links and compare results freely."],
                ].map(([k, v], i) => (
                  <div key={i} className="flex gap-3 border-l-2 border-white/10 pl-4">
                    <div>
                      <div className="font-display text-sm font-bold">{k}</div>
                      <div className="mt-0.5 text-sm text-white/48">{v}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border border-white/8 bg-white/[0.012] p-3">
                <p className="font-mono text-[9px] text-white/38 leading-relaxed">
                  Scanning surfaces risk signals. The firewall blocks bad transactions in real-time.
                  Use both for full-stack protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section id="features" className="border-t border-white/10 bg-[#0D0D10]" data-testid="features-section">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          {/* Core Protection */}
          <div className="mb-14">
            <div className="mb-10 grid items-end gap-8 md:grid-cols-2">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/38 mb-2">Core Protection</div>
                <h2 className="font-display text-3xl font-black tracking-tight lg:text-5xl">
                  Not a scanner.
                  <br />
                  <span className="text-white/32">A decision engine.</span>
                </h2>
              </div>
              <p className="text-white/52 leading-relaxed md:text-base">
                Scanners give you scores. Solified tells you{" "}
                <span className="text-white">exactly what will happen</span> — and stops it if needed.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-0 border border-white/10 md:grid-cols-2">
              {CORE_FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="group border-b border-r border-white/10 p-8 hover:bg-white/[0.012] transition-colors md:[&:nth-child(even)]:border-r-0 md:[&:nth-last-child(-n+2)]:border-b-0" data-testid={`feature-${i}`}>
                    <div className="flex h-12 w-12 items-center justify-center border" style={{ borderColor: `${f.accent}35`, color: f.accent }}>
                      <Icon size={22} weight="duotone" />
                    </div>
                    <div className="mt-5 font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: f.accent }}>{f.label}</div>
                    <h3 className="mt-1 font-display text-xl font-black">{f.label}</h3>
                    <p className="mt-3 text-sm text-white/52 leading-relaxed">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supporting Intelligence */}
          <div>
            <div className="mb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/32 mb-2">Supporting Intelligence</div>
              <h3 className="font-display text-2xl font-black lg:text-3xl">
                More signal.{" "}
                <span className="text-white/32">Better verdicts.</span>
              </h3>
              <p className="mt-3 text-white/45 text-sm max-w-lg">
                Wallet history and token data feed the firewall as supporting context — giving verdicts more depth.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-0 border border-white/10 md:grid-cols-3">
              {SUPPORTING_FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="border-b border-r border-white/10 p-6 last:border-r-0 md:border-b-0" data-testid={`supporting-feature-${i}`}>
                    <div className="flex h-10 w-10 items-center justify-center border border-white/12 text-white/42">
                      <Icon size={18} weight="duotone" />
                    </div>
                    <h3 className="mt-5 font-display text-base font-black">{f.title}</h3>
                    <p className="mt-2 text-sm text-white/45 leading-relaxed">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── EXTENSION ── */}
      <section id="extension" className="border-t border-white/10" data-testid="extension-section">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <div className="grid grid-cols-1 gap-0 border border-white/10 lg:grid-cols-2">
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
              <div className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 mb-6">
                <Browsers size={12} weight="bold" />
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/65">Chrome Extension · v1.0</span>
              </div>
              <h2 className="font-display text-3xl font-black tracking-tight lg:text-5xl">
                Firewall active.
                <br />
                <span className="text-white/32">Every tab, every dApp.</span>
              </h2>
              <p className="mt-5 max-w-md text-white/52 leading-relaxed">
                Install Solified once. Every Solana transaction across every site you visit is automatically
                intercepted and analyzed — no manual review required.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="/extension/solified-extension.zip" download data-testid="extension-download-button" className="inline-flex items-center gap-3 bg-white px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] hover:bg-white/90 transition-colors">
                  <DownloadSimple size={16} weight="bold" /> Download (.zip)
                </a>
                <a href="/extension/solified-extension.zip" download data-testid="extension-install-guide" className="inline-flex items-center gap-2 border border-white/20 bg-transparent px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] text-white/70 hover:border-white/40 transition-colors">
                  Install guide →
                </a>
              </div>
            </div>
            <div className="bg-[#0D0D10] p-8 lg:p-12">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/32 mb-6">What you get</div>
              <ul className="space-y-4">
                {[
                  ["Auto-intercept", "Every signTransaction call caught before it reaches your wallet."],
                  ["Real-time decode", "Instructions translated to plain English as they arrive."],
                  ["Inline badges", "Color-coded risk indicators on every Solana address on any page."],
                  ["Zero telemetry", "Only the transaction is analyzed. Nothing else is logged."],
                ].map(([k, v], i) => (
                  <li key={i} className="flex gap-4 border-l-2 border-white/10 pl-4">
                    <div className="flex-1">
                      <div className="font-display text-sm font-bold">{k}</div>
                      <div className="mt-1 text-sm text-white/48">{v}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border border-white/10 bg-[#0A0A0C] p-4 font-mono text-xs text-white/48">
                <div className="text-white/28">$ chrome://extensions</div>
                <div className="mt-1">→ Enable Developer mode</div>
                <div>→ Load unpacked → select unzipped folder</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/10 bg-[#0D0D10]" data-testid="cta-section">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
          <div className="relative overflow-hidden border border-white/10 p-8 lg:p-14">
            <div className="absolute -left-24 top-0 h-64 w-64 brand-orb brand-orb-violet opacity-18 pointer-events-none" />
            <div className="absolute right-0 bottom-0 h-64 w-64 brand-orb brand-orb-cyan opacity-12 pointer-events-none" />
            <div className="relative grid items-center gap-10 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="font-display text-2xl font-black tracking-tight lg:text-4xl">
                  One wrong signature
                  <br />
                  <span className="text-white/32">drains a wallet permanently.</span>
                </h3>
                <p className="mt-4 max-w-xl text-white/50">
                  Solified intercepts the transaction. You make the call. The firewall takes under a second —
                  and your assets are worth at least that.
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <a
                  href="/extension/solified-extension.zip"
                  download
                  data-testid="cta-install-link"
                  className="inline-flex items-center gap-3 bg-white px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] hover:bg-white/90 transition-colors"
                >
                  <ShieldWarning size={16} weight="bold" /> Check before signing
                </a>
                <a
                  href="#scan"
                  data-testid="cta-scan-link"
                  className="inline-flex items-center justify-center gap-3 border border-white/20 px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-white/65 hover:border-white/38 transition-colors"
                >
                  <MagnifyingGlass size={14} weight="bold" /> Scan wallet or token
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RecentScans />
      <Footer />
    </div>
  );
}