import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { riskHex } from "@/lib/format";

/**
 * Animated SVG risk meter — Solana-themed.
 * - 0..100 score
 * - Stroke color based on riskColor (Solana green / amber / coral)
 * - Glassmorphic backing + pulsing inner ring + scan line
 * - Animates stroke-dashoffset + number count-up
 */
export const RiskScoreMeter = ({
  score = 0,
  riskLevel = "",
  riskColor = "red",
  size = 260,
}) => {
  const [display, setDisplay] = useState(0);
  const stroke = riskHex(riskColor);
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const offset = arcLength * (1 - progress);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 1500;
    const animate = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const glowClass =
    riskColor === "green"
      ? "meter-glow-green"
      : riskColor === "yellow"
      ? "meter-glow-yellow"
      : "meter-glow-red";

  const gradientId = `meter-grad-${riskColor}`;

  return (
    <div
      data-testid="risk-score-meter"
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glassmorphic backing disk */}
      <div
        className="absolute inset-[12%] rounded-full border border-white/[0.06]"
        style={{
          background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.04), transparent 60%), radial-gradient(circle, ${stroke}10 0%, transparent 70%)`,
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Soft outer aura */}
      <div
        className="pointer-events-none absolute inset-[-8%] rounded-full opacity-60"
        style={{
          background: `radial-gradient(circle, ${stroke}22 0%, transparent 65%)`,
          filter: "blur(20px)",
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={glowClass}
        style={{ transform: "rotate(135deg)" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.55" />
            <stop offset="100%" stopColor={stroke} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1F1F2A"
          strokeWidth="8"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="butt"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          strokeDasharray={`${arcLength} ${circumference}`}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          strokeLinecap="butt"
        />
        {/* Tick marks */}
        {[...Array(11)].map((_, i) => {
          const angle = (i / 10) * 270;
          const rad = (angle * Math.PI) / 180;
          const x1 = size / 2 + (radius - 16) * Math.cos(rad);
          const y1 = size / 2 + (radius - 16) * Math.sin(rad);
          const x2 = size / 2 + (radius - 8) * Math.cos(rad);
          const y2 = size / 2 + (radius - 8) * Math.sin(rad);
          // Highlight ticks up to current score
          const tickAt = (i / 10) * 100;
          const active = tickAt <= score;
          return (
            <motion.line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={active ? stroke : "#3f3f46"}
              strokeWidth={active ? "1.5" : "1"}
              strokeOpacity={active ? 0.85 : 0.45}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            />
          );
        })}
      </svg>

      {/* Pulsing inner ring */}
      <div
        className="pointer-events-none absolute inset-[28%] rounded-full border animate-pulse"
        style={{
          borderColor: `${stroke}33`,
          animationDuration: "2.5s",
        }}
      />

      {/* Vertical scan line */}
      <div
        className="meter-scan-line"
        style={{ color: stroke, top: "8%" }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40"
          data-testid="risk-score-label"
        >
          Solified Score
        </div>
        <div
          data-testid="risk-score-value"
          className="font-display font-black leading-none tabular-nums"
          style={{
            color: stroke,
            fontSize: size * 0.3,
            textShadow: `0 0 20px ${stroke}88`,
          }}
        >
          {display}
        </div>
        <div
          data-testid="risk-level-label"
          className="mt-1 font-mono text-xs uppercase tracking-[0.25em]"
          style={{ color: stroke }}
        >
          {riskLevel}
        </div>
        <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/30">
          0–100
        </div>
      </div>
    </div>
  );
};

export default RiskScoreMeter;
