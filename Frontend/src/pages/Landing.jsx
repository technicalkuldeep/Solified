import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import {
  ShieldCheck,
  Lightning,
  Database,
  Cube,
  MagnifyingGlass,
  Crosshair,
  Shield,
  DownloadSimple,
  Browsers,
  Clipboard,
  Warning,
  SealCheck,
  ShieldWarning,
  Lock,
  Eye,
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

const FEATURES = [
  {
    icon: Crosshair,
    title: "Wallet Risk Analyzer",
    body: "Every Solana wallet scored 0–100. Deterministic checks: wallet age, tx frequency, failed-tx ratio, known-scam interactions.",
  },
  {
    icon: Cube,
    title: "Token Scanner",
    body: "Mint authority, freeze authority, holder concentration, supply analysis. Detect rug-pulls before they happen.",
  },
  {
    icon: Lightning,
    title: "Sub-5s Analysis",
    body: "Alchemy-powered Solana RPC + parallel fetch. Most scans complete in under 3 seconds.",
  },
  {
    icon: Database,
    title: "Cached & Explainable",
    body: "Every score comes with human-readable reasons. Results cached for 5 minutes — share & compare freely.",
  },
];

const STEPS = [
  { n: "01", title: "Paste", body: "Drop any Solana wallet or token mint address." },
  { n: "02", title: "Solify", body: "We query Solana mainnet and run 20+ deterministic heuristics." },
  { n: "03", title: "Verdict", body: "Get a color-coded Solified Score with every reason exposed." },
];

// Shared reveal config
const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

export default function Landing() {
  // Strip any hash fragment and force scroll-to-top on mount so reloads never land mid-page.
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#07070A] text-white" data-testid="landing-page">
      <Navbar />

      {/* 1 · HERO — firewall positioning */}
      <section
        className="relative overflow-hidden border-b border-white/[0.06]"
        data-testid="hero-section"
      >
        {/* Ambient gradient orbs */}
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] brand-orb brand-orb-cyan opacity-30 float-slow" />
        <div
          className="absolute right-[-180px] top-32 h-[520px] w-[520px] brand-orb brand-orb-violet opacity-30 float-slow"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute left-1/3 bottom-0 h-[360px] w-[360px] brand-orb brand-orb-blue opacity-20" />
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="noise absolute inset-0" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1fr_auto] lg:gap-20 lg:px-12 lg:pb-20 lg:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.02] px-3.5 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 bg-[var(--brand-cyan)] animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/75">
                Pre-signing firewall · Solana Mainnet
              </span>
            </div>

            <h1 className="mt-6 font-display text-[44px] font-black leading-[0.92] tracking-tighter sm:text-6xl lg:text-[76px]">
              <span className="text-white">Protection</span>
              <br />
              <span className="text-white/40">before </span>
              <span className="brand-gradient-text">permission.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/65 lg:text-lg">
              Solified intercepts every Solana transaction <span className="text-white">before</span> it reaches
              your wallet — decoding instructions, simulating outcomes, and flagging
              drainer signatures in under a second. Not a scanner. A{" "}
              <span className="brand-gradient-text font-medium">shield</span>.
            </p>

            <div className="mt-5 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-white/55">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--brand-cyan)]/70" />
              Verify before you trust.
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--brand-violet)]/70" />
            </div>

            <div className="mt-9">
              <WalletInput size="lg" />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="https://chromewebstore.google.com/detail/solified-%E2%80%94-verify-before/keehfjecmfameniahpgbejpfjjckifom"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="hero-download-solified"
                className="group inline-flex items-center gap-3 border border-white/20 bg-white/[0.03] px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#0A0A0C]"
              >
                <img
                  src="https://fonts.gstatic.com/s/i/productlogos/chrome_store/v7/192px.svg"
                  alt="Chrome Web Store"
                  className="h-5 w-5"
                  draggable="false"
                />
                Download Solified
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </a>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                Free · Chrome Web Store
              </span>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                Try a scan:
              </span>
              {DEMO_ADDRESSES.map((d) => (
                <Link
                  key={d.addr}
                  to={`/scan/${encodeURIComponent(d.addr)}`}
                  data-testid={`demo-address-${d.label.replace(/\s+/g, "-").toLowerCase()}`}
                  className="font-mono text-xs text-white/55 underline decoration-dotted underline-offset-4 transition-colors hover:text-white"
                >
                  {d.label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Hero brand mark — dominant shield */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex lg:w-[420px] lg:items-center lg:justify-center xl:w-[480px]"
          >
            <div className="relative h-[440px] w-[440px] xl:h-[500px] xl:w-[500px]">
              <div className="absolute inset-[-15%] brand-orb brand-orb-violet opacity-60" />
              <div className="absolute inset-[-10%] brand-orb brand-orb-cyan opacity-40 -translate-x-12 -translate-y-8" />
              <div className="absolute inset-[5%] brand-orb brand-orb-blue opacity-35" />
              {/* Concentric rings with brand-gradient accent */}
              <div
                className="absolute inset-0 rounded-full border border-white/[0.05] animate-pulse"
                style={{ animationDuration: "4s" }}
              />
              <div className="absolute inset-[8%] rounded-full border border-white/[0.04]" />
              <div className="absolute inset-[16%] rounded-full border border-white/[0.035]" />
              {/* Rotating scan-ring — gives the shield a "live" firewall feel */}
              <div className="shield-scan-ring absolute inset-[-2%] rounded-full" />
              <img
                src="brand\solified-shield.png"
                alt="Solified shield"
                className="absolute inset-0 h-full w-full select-none float-slow"
                style={{
                  mixBlendMode: "screen",
                  filter:
                    "drop-shadow(0 0 90px rgba(181,54,255,0.55)) drop-shadow(0 0 50px rgba(14,132,255,0.35)) drop-shadow(0 0 30px rgba(56,255,208,0.25))",
                }}
                draggable="false"
              />
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="relative mx-auto -mt-2 max-w-7xl px-6 pb-16 lg:px-12 lg:pb-20">
          <motion.div
            {...reveal}
            className="grid grid-cols-2 border border-white/[0.08] bg-white/[0.015] backdrop-blur-sm sm:grid-cols-4"
          >
            {[
              ["<1s", "Firewall decision"],
              ["0–100", "Solified Score"],
              ["20+", "Detection rules"],
              ["100%", "On-chain verified"],
            ].map(([v, l], i) => (
              <div
                key={i}
                className="group border-b border-r border-white/[0.06] p-6 transition-all duration-300 last:border-r-0 hover:bg-white/[0.03] sm:border-b-0 sm:[&:nth-child(4n)]:border-r-0"
                data-testid={`hero-stat-${i}`}
              >
                <div className="font-display text-3xl font-black tracking-tight transition-transform duration-300 group-hover:translate-y-[-2px] lg:text-4xl">
                  {v}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  {l}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 2 · SIGNER FIREWALL — the hero feature */}
      <section
        id="firewall"
        className="border-t border-white/10 bg-[#121216]"
        data-testid="firewall-section"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <motion.div
            {...reveal}
            className="grid grid-cols-1 gap-0 border border-white/10 lg:grid-cols-[1fr_auto]"
          >
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
              <div className="inline-flex items-center gap-2 border border-[#FF3333]/35 bg-[#FF3333]/10 px-3 py-1.5">
                <ShieldWarning size={12} weight="bold" className="text-[#FF3333]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FF3333]">
                  Solified Signer Firewall · v1.2
                </span>
              </div>
              <h2 className="mt-6 font-display text-3xl font-black tracking-tight lg:text-5xl">
                Intercept.
                <br />
                <span className="text-white/40">Decode. Decide.</span>
              </h2>
              <p className="mt-5 max-w-xl text-white/60 leading-relaxed">
                Every Solana wallet you connect — Phantom, Solflare, Backpack — is now
                pre-screened by Solified. We intercept{" "}
                <span className="font-mono text-white">signTransaction</span> calls
                before they reach your wallet, decode every instruction, simulate the
                outcome on mainnet, and present a clear verdict you can act on.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: Eye, k: "Decode", v: "Every instruction translated into plain English." },
                  { icon: Lock, k: "Simulate", v: "Run the tx on mainnet first. Catch failures before fees." },
                  { icon: ShieldWarning, k: "Verdict", v: "Block or continue with full context. You decide." },
                ].map((p, i) => {
                  const Ic = p.icon;
                  return (
                    <div
                      key={i}
                      className="border border-white/10 p-4 transition-colors hover:border-[#FF3333]/40"
                      data-testid={`firewall-step-${i}`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center border border-[#FF3333]/40 text-[#FF3333]">
                        <Ic size={16} weight="duotone" />
                      </div>
                      <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                        {p.k}
                      </div>
                      <div className="mt-1 text-sm text-white/70 leading-relaxed">{p.v}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#extension"
                  data-testid="firewall-install-cta"
                  className="inline-flex items-center gap-3 bg-[#FF3333] px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] transition-colors hover:bg-[#FF3333]/90"
                >
                  <ShieldWarning size={16} weight="bold" /> Arm the firewall
                </a>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                  Phantom · Solflare · Backpack · &lt;1s decision time
                </span>
              </div>
            </div>

            {/* Modal preview — mirrors the actual in-page firewall modal */}
            <div className="bg-[#0A0A0C] p-8 lg:max-w-[440px] lg:p-10" data-testid="firewall-modal-preview">
              <div className="relative overflow-hidden border border-white/10 bg-[#0A0A0C]">
                {/* Top brand-gradient hairline */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--brand-cyan)] via-[var(--brand-blue)] to-[var(--brand-violet)]" />
                {/* Tone-tinted aurora */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF3B6E]/30 blur-3xl" />
                {/* Tone left edge */}
                <div className="absolute inset-y-0 left-0 top-[2px] w-[3px] bg-gradient-to-b from-[#FF3B6E] to-[#FF3333] shadow-[0_0_24px_rgba(255,59,110,0.4)]" />

                <div className="relative p-5">
                  <div className="flex items-center gap-2.5 font-mono text-[9px] uppercase tracking-[0.32em] text-white/55">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#FF3B6E] shadow-[0_0_10px_#FF3B6E] animate-pulse" />
                    Signer Firewall
                    <span className="ml-auto brand-gradient-text font-bold tracking-[0.28em]">SOLIFIED</span>
                  </div>

                  <div className="mt-4 flex items-start gap-3">
                    {/* Mini gradient shield */}
                    <div className="relative grid h-10 w-10 flex-shrink-0 place-items-center text-[#FF3B6E]">
                      <span className="absolute inset-[-6px] rounded-full bg-[#FF3B6E]/25 blur-md" />
                      <svg viewBox="0 0 24 24" fill="none" className="relative h-8 w-8">
                        <defs>
                          <linearGradient id="modalShield" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#38FFD0" />
                            <stop offset="50%" stopColor="#0E84FF" />
                            <stop offset="100%" stopColor="#B536FF" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M12 2.5 4 5.5v6.2c0 4.6 3.2 8.6 8 9.8 4.8-1.2 8-5.2 8-9.8V5.5l-8-3z"
                          stroke="url(#modalShield)"
                          strokeWidth="1.5"
                          fill="rgba(14,132,255,0.08)"
                        />
                        <path
                          d="M9 12.5l2 2 4-4.5"
                          stroke="url(#modalShield)"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-display text-xl font-black leading-tight text-[#FF3B6E]">
                        High-risk transaction
                      </div>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
                        3 instructions · v0 · 2 programs
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-4 flex items-center gap-3 border border-white/[0.06] bg-white/[0.02] p-3.5 text-[#FF3B6E]">
                    <div className="absolute inset-y-0 left-0 w-[2px] bg-current opacity-90" />
                    <div
                      className="font-display text-[44px] font-black leading-none tabular-nums tracking-tighter"
                      style={{ filter: "drop-shadow(0 0 14px currentColor)" }}
                    >
                      35
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="self-start border border-current px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]">
                        High Risk
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                        Solified Score · 0–100
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/[0.06] pt-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/40">
                      What this transaction does
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      {[
                        "Transfer 1.200000 SOL → 8sMp…Eyd7",
                        "Approve UNLIMITED token spending → 4zd…d7a",
                        "Interact with unknown program ZkPro…XYZf",
                      ].map((a, i) => (
                        <div
                          key={i}
                          className="border border-white/[0.06] bg-white/[0.025] px-3 py-2 font-mono text-[10px] text-white/90"
                        >
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/[0.06] pt-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/40">
                      Warnings
                    </div>
                    <div className="mt-2.5 space-y-2">
                      <div className="border-l-2 border-[#FF3B6E] bg-gradient-to-r from-[#FF3B6E]/12 to-[#FF3B6E]/[0.02] p-2.5 text-[10px] text-[#FFB3C5]">
                        <b className="block text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                          Unlimited token approval
                        </b>
                        Drainer signature — proceed with extreme caution.
                      </div>
                      <div className="border-l-2 border-[#FFD600] bg-gradient-to-r from-[#FFD600]/12 to-[#FFD600]/[0.02] p-2.5 text-[10px] text-[#FFE680]">
                        <b className="block text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                          Hidden SOL transfer
                        </b>
                        SOL transfer bundled with an unknown program call.
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-2 border-t border-white/[0.06] pt-4">
                    <span className="border border-white/20 bg-white/[0.03] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/80">
                      Continue anyway
                    </span>
                    <span
                      className="px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#1A0508]"
                      style={{
                        background: "linear-gradient(135deg, #FF3B6E 0%, #FF3333 100%)",
                        boxShadow: "0 4px 24px rgba(255,59,110,0.35)",
                      }}
                    >
                      Block transaction
                    </span>
                  </div>

                  <div className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                    Verify before you trust · pre-signing firewall
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/35">
                Live preview · this is what users see in-flight
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3 · PROTECTION LAYER */}
      <section
        id="protection"
        className="border-t border-white/10 bg-[#0A0A0C]"
        data-testid="protection-layer-section"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <motion.div {...reveal} className="mb-12 grid items-end gap-6 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 border border-[#00FF66]/30 bg-[#00FF66]/5 px-3 py-1.5">
                <ShieldCheck size={12} weight="bold" className="text-[#00FF66]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00FF66]">
                  Solified Protection Layer
                </span>
              </div>
              <h2 className="mt-5 font-display text-3xl font-black tracking-tight lg:text-5xl">
                A real-time shield
                <br />
                <span className="text-white/40">across every Solana interaction.</span>
              </h2>
            </div>
            <p className="text-white/60 leading-relaxed md:text-lg">
              The Solified extension watches every page you visit and every address
              you copy. It warns you before a signature, not after.
            </p>
          </motion.div>
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="grid grid-cols-1 gap-0 border border-white/10 sm:grid-cols-2 lg:grid-cols-5"
          >
            {[
              {
                icon: Crosshair,
                title: "Real-time wallet detection",
                body: "Every base58 address on every page is scanned and scored automatically.",
              },
              {
                icon: Warning,
                title: "Transaction risk warnings",
                body: "Pre-transaction modal blocks high-risk interactions before you confirm.",
              },
              {
                icon: Clipboard,
                title: "Clipboard attack detection",
                body: "Detects clipboard hijackers that swap the address between copy and paste.",
              },
              {
                icon: MagnifyingGlass,
                title: "Address similarity alerts",
                body: "Levenshtein-based look-alike detection against recent & trusted addresses.",
              },
              {
                icon: SealCheck,
                title: "Trusted address recognition",
                body: "Green Solified Verified badge on whitelisted issuers and protocols.",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group border-b border-r border-white/10 p-6 transition-colors last:border-r-0 hover:bg-white/[0.02] sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(n)]:border-r lg:[&:nth-child(5n)]:border-r-0"
                  data-testid={`protection-feature-${i}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center border border-[#00FF66]/30 text-[#00FF66] transition-colors group-hover:border-[#00FF66]">
                    <Icon size={18} weight="duotone" />
                  </div>
                  <h3 className="mt-5 font-display text-base font-black leading-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </motion.div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#extension"
              data-testid="protection-cta-install"
              className="inline-flex items-center gap-3 bg-[#00FF66] px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] transition-colors hover:bg-[#00FF66]/90"
            >
              <DownloadSimple size={16} weight="bold" /> Install protection
            </a>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              Free · Chrome, Edge, Brave · No account required
            </span>
          </div>
        </div>
      </section>

      {/* 4 · HOW IT WORKS */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28"
        data-testid="how-it-works-section"
      >
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Workflow
          </div>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight lg:text-5xl">
            Three steps. Zero mysticism.
          </h2>
        </motion.div>
        <motion.div
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.1 }}
          className="grid grid-cols-1 gap-0 border border-white/10 md:grid-cols-3"
        >
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="border-b border-r border-white/10 p-8 transition-colors last:border-r-0 hover:bg-white/[0.02] md:border-b-0"
              data-testid={`step-${i}`}
            >
              <div className="font-mono text-5xl font-bold text-white/15">{s.n}</div>
              <h3 className="mt-6 font-display text-xl font-black">{s.title}</h3>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* 5 · EXTENSION */}
      <section
        id="extension"
        className="border-t border-white/10"
        data-testid="extension-section"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <motion.div
            {...reveal}
            className="grid grid-cols-1 gap-0 border border-white/10 lg:grid-cols-2"
          >
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
              <div className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5">
                <img
                  src="https://fonts.gstatic.com/s/i/productlogos/chrome_store/v7/192px.svg"
                  alt="Chrome Web Store"
                  className="h-3.5 w-3.5"
                  draggable="false"
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/70">
                  Chrome Extension · v1.0
                </span>
              </div>
              <h2 className="mt-6 font-display text-3xl font-black tracking-tight lg:text-5xl">
                Scan without
                <br />
                <span className="text-white/40">lifting a finger.</span>
              </h2>
              <p className="mt-5 max-w-md text-white/60 leading-relaxed">
                Install the Solified browser extension and see instant risk badges
                next to every Solana address on any webpage — Twitter, Discord,
                Solscan, Jupiter, you name it.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="https://chromewebstore.google.com/detail/solified-%E2%80%94-verify-before/keehfjecmfameniahpgbejpfjjckifom"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="extension-download-button"
                  className="inline-flex items-center gap-3 bg-white px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] transition-colors hover:bg-white/90"
                >
                  <img
                    src="https://fonts.gstatic.com/s/i/productlogos/chrome_store/v7/192px.svg"
                    alt="Chrome Web Store"
                    className="h-5 w-5"
                    draggable="false"
                  />
                  Add to Chrome
                </a>
                <a
                  href="https://chromewebstore.google.com/detail/solified-%E2%80%94-verify-before/keehfjecmfameniahpgbejpfjjckifom"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="extension-install-guide"
                  className="inline-flex items-center gap-2 border border-white/20 bg-transparent px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] text-white/80 transition-colors hover:border-white"
                >
                  View on Chrome Web Store →
                </a>
              </div>
            </div>
            <div className="bg-[#121216] p-8 lg:p-12">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                What you get
              </div>
              <ul className="mt-6 space-y-4">
                {[
                  ["Auto-detect", "Scans every page for 32-44 char base58 addresses."],
                  ["Inline badges", "Color-coded score injected next to each address."],
                  ["One-click deep dive", "Click a badge to open the full scan report."],
                  ["Zero telemetry", "Only the address is sent. Nothing else is logged."],
                ].map(([k, v], i) => (
                  <li key={i} className="flex gap-4 border-l-2 border-white/10 pl-4">
                    <div className="flex-1">
                      <div className="font-display text-sm font-bold">{k}</div>
                      <div className="mt-1 text-sm text-white/60">{v}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border border-white/10 bg-[#0A0A0C] p-4 font-mono text-xs text-white/60">
                <div className="text-white/40">$ chrome web store</div>
                <div className="mt-1">→ Click “Add to Chrome”</div>
                <div>→ Confirm → Pin Solified → Done</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6 · FEATURES */}
      <section
        id="features"
        className="border-t border-white/10 bg-[#121216]"
        data-testid="features-section"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <motion.div {...reveal} className="mb-12 grid items-end gap-8 md:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                Capabilities
              </div>
              <h2 className="mt-2 font-display text-3xl font-black tracking-tight lg:text-5xl">
                Deterministic.
                <br />
                Explainable.
                <br />
                <span className="text-white/40">No black-box ML.</span>
              </h2>
            </div>
            <p className="text-white/60 leading-relaxed md:text-lg">
              Every deduction and addition is accounted for. You see exactly why a wallet
              scored 42 — not just that it did.
            </p>
          </motion.div>
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="grid grid-cols-1 gap-0 border border-white/10 md:grid-cols-2"
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group border-b border-r border-white/10 p-8 transition-colors last:border-r-0 hover:bg-white/[0.02] md:[&:nth-child(even)]:border-r-0 md:[&:nth-last-child(-n+2)]:border-b-0"
                  data-testid={`feature-${i}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center border border-white/20 transition-colors group-hover:border-white">
                    <Icon size={22} weight="duotone" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-black">{f.title}</h3>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 7 · CTA band */}
      <section className="border-t border-white/10" data-testid="cta-section">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
          <motion.div
            {...reveal}
            className="border border-white/10 bg-[#121216] p-8 lg:p-12"
          >
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="font-display text-2xl font-black tracking-tight lg:text-4xl">
                  Solify before you sign.
                </h3>
                <p className="mt-3 max-w-xl text-white/60">
                  Every approval on Solana is permanent. One wrong signature drains a
                  wallet. Solified takes 3 seconds — your assets are worth it.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  data-testid="cta-scan-link"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="inline-flex items-center gap-3 bg-white px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] transition-colors hover:bg-white/90"
                >
                  <MagnifyingGlass size={16} weight="bold" /> Run a Solify
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8 · RECENT SCANS */}
      <RecentScans />

      <Footer />
    </div>
  );
}
