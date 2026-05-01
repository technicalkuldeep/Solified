import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lightning,
  Database,
  Cube,
  MagnifyingGlass,
  Crosshair,
  PuzzlePiece,
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

const HERO_IMG = "/brand/solified-banner.png";

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

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white" data-testid="landing-page">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/[0.06]" data-testid="hero-section">
        {/* Ambient gradient orbs (premium dark) */}
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] brand-orb brand-orb-cyan opacity-30 float-slow" />
        <div className="absolute right-[-180px] top-32 h-[520px] w-[520px] brand-orb brand-orb-violet opacity-30 float-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute left-1/3 bottom-0 h-[360px] w-[360px] brand-orb brand-orb-blue opacity-20" />
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="noise absolute inset-0" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-12 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.02] px-3.5 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 bg-[var(--brand-cyan)] animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/75">
                Live · Solana Mainnet
              </span>
            </div>

            <h1 className="mt-7 font-display text-5xl font-black leading-[0.95] tracking-tighter sm:text-6xl lg:text-[88px]">
              <span className="brand-gradient-text">Verify</span>
              <br />
              <span className="text-white/45">before you trust.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/65 lg:text-lg">
              Paste any <span className="font-mono text-white">Solana wallet</span> or{" "}
              <span className="font-mono text-white">token mint</span> and get an instant,
              explainable <span className="brand-gradient-text font-medium">Solified Score</span>.
              Real-time intelligence across every signature you'll ever sign.
            </p>

            <div className="mt-10">
              <WalletInput size="lg" />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                Try:
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

          {/* Hero brand mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block lg:w-[360px] xl:w-[420px]"
          >
            <div className="relative">
              <div className="absolute inset-0 -z-10 brand-orb brand-orb-violet opacity-50" />
              <div className="absolute inset-0 -z-10 brand-orb brand-orb-cyan opacity-30 -translate-x-12" />
              <img
                src="/brand/solified-shield.png"
                alt="Solified"
                className="float-slow w-full select-none"
                style={{ mixBlendMode: "screen", filter: "drop-shadow(0 0 80px rgba(181,54,255,0.45)) drop-shadow(0 0 40px rgba(56,255,208,0.25))" }}
                draggable="false"
              />
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="relative mx-auto -mt-2 max-w-7xl px-6 pb-20 lg:px-12 lg:pb-28">
          <div className="grid grid-cols-2 border border-white/[0.08] bg-white/[0.015] backdrop-blur-sm sm:grid-cols-4">
            {[
              ["0–100", "Solified Score"],
              ["<3s", "Avg Solify Time"],
              ["20+", "Heuristics"],
              ["100%", "On-chain Data"],
            ].map(([v, l], i) => (
              <div
                key={i}
                className="border-b border-r border-white/[0.06] p-6 transition-colors last:border-r-0 hover:bg-white/[0.025] sm:border-b-0 sm:[&:nth-child(4n)]:border-r-0"
                data-testid={`hero-stat-${i}`}
              >
                <div className="font-display text-3xl font-black tracking-tight lg:text-4xl">{v}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28"
        data-testid="how-it-works-section"
      >
        <div className="mb-12 max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Workflow
          </div>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight lg:text-5xl">
            Three steps. Zero mysticism.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-0 border border-white/10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="border-b border-r border-white/10 p-8 last:border-r-0 md:border-b-0"
              data-testid={`step-${i}`}
            >
              <div className="font-mono text-5xl font-bold text-white/15">{s.n}</div>
              <h3 className="mt-6 font-display text-xl font-black">{s.title}</h3>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="border-t border-white/10 bg-[#121216]"
        data-testid="features-section"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <div className="mb-12 grid items-end gap-8 md:grid-cols-2">
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
          </div>
          <div className="grid grid-cols-1 gap-0 border border-white/10 md:grid-cols-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group border-b border-r border-white/10 p-8 last:border-r-0 md:[&:nth-child(even)]:border-r-0 md:[&:nth-last-child(-n+2)]:border-b-0"
                  data-testid={`feature-${i}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center border border-white/20 group-hover:border-white transition-colors">
                    <Icon size={22} weight="duotone" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-black">{f.title}</h3>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-white/10" data-testid="cta-section">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
          <div className="border border-white/10 bg-[#121216] p-8 lg:p-12">
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
                  className="inline-flex items-center gap-3 bg-white px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] hover:bg-white/90 transition-colors"
                >
                  <MagnifyingGlass size={16} weight="bold" /> Run a Solify
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNER FIREWALL */}
      <section
        id="firewall"
        className="border-t border-white/10 bg-[#121216]"
        data-testid="firewall-section"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <div className="grid grid-cols-1 gap-0 border border-white/10 lg:grid-cols-[1fr_auto]">
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
              <div className="inline-flex items-center gap-2 border border-[#FF3333]/35 bg-[#FF3333]/10 px-3 py-1.5">
                <ShieldWarning size={12} weight="bold" className="text-[#FF3333]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FF3333]">
                  Solified Signer Firewall · v1.2
                </span>
              </div>
              <h2 className="mt-6 font-display text-3xl font-black tracking-tight lg:text-5xl">
                The last line
                <br />
                <span className="text-white/40">before your signature.</span>
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
                      className="border border-white/10 p-4"
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
                  className="inline-flex items-center gap-3 bg-[#FF3333] px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] hover:bg-[#FF3333]/90 transition-colors"
                >
                  <ShieldWarning size={16} weight="bold" /> Arm the firewall
                </a>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                  Phantom · Solflare · Backpack · &lt;1s decision time
                </span>
              </div>
            </div>

            {/* Modal preview */}
            <div className="bg-[#0A0A0C] p-8 lg:p-10 lg:max-w-[420px]" data-testid="firewall-modal-preview">
              <div className="border border-[#FF3333] border-l-4 bg-[#0A0A0C] p-5">
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em] text-[#FF3333]">
                  <span className="inline-block h-2 w-2 bg-[#FF3333] animate-pulse" />
                  Solified · Signer Firewall
                </div>
                <div className="mt-3 font-display text-xl font-black text-[#FF3333] leading-tight">
                  ⚠ Solified Warning
                </div>
                <div className="mt-1 font-mono text-[10px] text-white/40">
                  3 instructions · v0 · 2 programs
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="font-display text-3xl font-black text-[#FF3333] tabular-nums">35</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] border border-[#FF3333] text-[#FF3333] px-2 py-0.5">
                    High Risk
                  </div>
                </div>
                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                    What this transaction does
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {[
                      "Transfer 1.200000 SOL → 8sMp…Eyd7",
                      "Approve UNLIMITED token spending → 4zd…d7a",
                      "Interact with unknown program ZkPro…XYZf",
                    ].map((a, i) => (
                      <div
                        key={i}
                        className="border border-white/10 bg-[#121216] px-2.5 py-1.5 font-mono text-[10px] text-white/85"
                      >
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 border-t border-white/10 pt-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                    Warnings
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="border-l-2 border-[#FF3333] bg-[#FF3333]/10 p-2 text-[10px] text-[#FFB3B3]">
                      <b className="block text-[9px] uppercase tracking-[0.2em] text-[#FF3333]">
                        Unlimited token approval
                      </b>
                      Drainer signature — proceed with extreme caution.
                    </div>
                    <div className="border-l-2 border-[#FFD600] bg-[#FFD600]/10 p-2 text-[10px] text-[#FFE680]">
                      <b className="block text-[9px] uppercase tracking-[0.2em] text-[#FFD600]">
                        Hidden SOL transfer
                      </b>
                      SOL transfer bundled with an unknown program call.
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <span className="border border-white/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">
                    ✅ Continue
                  </span>
                  <span className="bg-[#FF3333] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#0A0A0C]">
                    🚫 Block
                  </span>
                </div>
              </div>
              <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white/35 text-center">
                Live preview · this is what users see in-flight
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROTECTION LAYER */}
      <section
        id="protection"
        className="border-t border-white/10 bg-[#0A0A0C]"
        data-testid="protection-layer-section"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <div className="mb-12 grid items-end gap-6 md:grid-cols-2">
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
          </div>
          <div className="grid grid-cols-1 gap-0 border border-white/10 sm:grid-cols-2 lg:grid-cols-5">
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
                  className="group border-b border-r border-white/10 p-6 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(n)]:border-r lg:[&:nth-child(5n)]:border-r-0"
                  data-testid={`protection-feature-${i}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center border border-[#00FF66]/30 text-[#00FF66] group-hover:border-[#00FF66] transition-colors">
                    <Icon size={18} weight="duotone" />
                  </div>
                  <h3 className="mt-5 font-display text-base font-black leading-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#extension"
              data-testid="protection-cta-install"
              className="inline-flex items-center gap-3 bg-[#00FF66] px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] hover:bg-[#00FF66]/90 transition-colors"
            >
              <DownloadSimple size={16} weight="bold" /> Install protection
            </a>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              Free · Chrome, Edge, Brave · No account required
            </span>
          </div>
        </div>
      </section>

      {/* EXTENSION */}
      <section
        id="extension"
        className="border-t border-white/10"
        data-testid="extension-section"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
          <div className="grid grid-cols-1 gap-0 border border-white/10 lg:grid-cols-2">
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
              <div className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5">
                <Browsers size={12} weight="bold" />
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
                  href="/extension/solified-extension.zip"
                  download
                  data-testid="extension-download-button"
                  className="inline-flex items-center gap-3 bg-white px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0C] hover:bg-white/90 transition-colors"
                >
                  <DownloadSimple size={16} weight="bold" />
                  Download (.zip)
                </a>
                <a
                  href="/extension/solified-extension.zip"
                  download
                  data-testid="extension-install-guide"
                  className="inline-flex items-center gap-2 border border-white/20 bg-transparent px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] text-white/80 hover:border-white transition-colors"
                >
                  Install guide →
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
                <div className="text-white/40">$ chrome://extensions</div>
                <div className="mt-1">→ Enable Developer mode</div>
                <div>→ Load unpacked → select unzipped folder</div>
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
