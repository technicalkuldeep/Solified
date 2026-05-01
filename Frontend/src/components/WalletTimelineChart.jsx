import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChartLineUp } from "@phosphor-icons/react";
import { API } from "@/lib/api";

const colorFor = (score) => {
  if (score >= 80) return "#00FF66";
  if (score >= 50) return "#FFD600";
  return "#FF3333";
};

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const c = colorFor(d.score);
  return (
    <div className="border border-white/20 bg-[#0A0A0C] p-3 font-mono text-xs">
      <div className="text-white/50 uppercase tracking-wider text-[10px]">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-bold tabular-nums" style={{ color: c }}>
          {d.score}
        </span>
        <span className="text-white/60 uppercase text-[10px] tracking-wider" style={{ color: c }}>
          {d.riskLevel}
        </span>
      </div>
    </div>
  );
};

export default function WalletTimelineChart({ address }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");
    fetch(`${API}/wallet-timeline/${encodeURIComponent(address)}?days=60`)
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        setHistory(d?.history || []);
      })
      .catch((e) => mounted && setErr(e.message || "Failed to load timeline"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [address]);

  const data = history
    .map((h) => {
      const d = new Date(h.ts);
      return {
        ...h,
        label: `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        score: typeof h.score === "number" ? h.score : Number(h.score) || 0,
      };
    });

  const last = data[data.length - 1];
  const stroke = last ? colorFor(last.score) : "#FFFFFF";

  return (
    <div
      data-testid="wallet-timeline-chart"
      className="border border-white/10 bg-[#121216] p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-white/20">
            <ChartLineUp size={18} weight="duotone" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              Behavior Timeline
            </div>
            <div className="font-display text-lg font-black">
              How risk evolved
            </div>
          </div>
        </div>
        <div className="font-mono text-xs text-white/40">
          {data.length} snapshot{data.length === 1 ? "" : "s"}
        </div>
      </div>

      {loading && (
        <div className="flex h-[200px] items-center justify-center font-mono text-xs uppercase tracking-wider text-white/40">
          Loading…
        </div>
      )}
      {!loading && err && (
        <div className="flex h-[200px] items-center justify-center font-mono text-xs uppercase tracking-wider text-[#FF3333]">
          {err}
        </div>
      )}
      {!loading && !err && data.length === 0 && (
        <div
          className="flex h-[200px] items-center justify-center border border-dashed border-white/10 font-mono text-xs uppercase tracking-wider text-white/30"
          data-testid="timeline-empty"
        >
          First scan — re-Solify in a few hours to start the timeline
        </div>
      )}
      {!loading && !err && data.length > 0 && (
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="solifiedScoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f1f24" strokeDasharray="3 3" vertical={false} />
              <ReferenceLine y={80} stroke="rgba(0,255,102,0.25)" strokeDasharray="4 4" />
              <ReferenceLine y={50} stroke="rgba(255,214,0,0.25)" strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717A", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                stroke="#27272A"
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#71717A", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                stroke="#27272A"
              />
              <Tooltip cursor={{ stroke: stroke, strokeOpacity: 0.3 }} content={<TooltipBox />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#solifiedScoreFill)"
                isAnimationActive
                animationDuration={1200}
                dot={{ r: 2, fill: stroke }}
                activeDot={{ r: 4, fill: stroke }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
