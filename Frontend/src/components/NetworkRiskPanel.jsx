import { Graph, GitFork, Pulse, Warning, ShieldCheck } from "@phosphor-icons/react";
import { shortAddr } from "@/lib/format";

const distLabel = (d) => {
  if (d == null) return "Clean — no scam connections found";
  if (d === 0) return "FLAGGED · This wallet is on the scam list";
  if (d === 1) return "1 hop away from a known scam wallet";
  if (d === 2) return "2 hops away from a known scam cluster";
  return `${d} hops away`;
};
const distTone = (d) => (d == null ? "#00FF66" : d === 0 ? "#FF3333" : d === 1 ? "#FF3333" : "#FFD600");

export default function NetworkRiskPanel({ networkRisk }) {
  if (!networkRisk) return null;
  const {
    closestScamDistance,
    connectedScamWallets = 0,
    connectedCluster = 0,
    scamCounterparties = [],
    clusterCounterparties = [],
    totalCounterparties = 0,
    topCounterparties = [],
    txParsed = 0,
  } = networkRisk;

  const tone = distTone(closestScamDistance);
  const Icon = closestScamDistance == null ? ShieldCheck : Warning;

  return (
    <div data-testid="network-risk-panel" className="border border-white/10 bg-[#121216] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-white/20">
            <Graph size={18} weight="duotone" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              Network Graph
            </div>
            <div className="font-display text-lg font-black">Counterparty risk</div>
          </div>
        </div>
        <div
          data-testid="network-distance-badge"
          className="inline-flex items-center gap-2 border px-3 py-1.5"
          style={{ borderColor: `${tone}66`, color: tone }}
        >
          <Icon size={14} weight="bold" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
            {distLabel(closestScamDistance)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="TX parsed" value={txParsed} testId="net-tx-parsed" />
        <Stat label="Counterparties" value={totalCounterparties} testId="net-counterparties" />
        <Stat
          label="Direct scams"
          value={connectedScamWallets}
          tone={connectedScamWallets ? "#FF3333" : undefined}
          testId="net-direct-scams"
        />
        <Stat
          label="Cluster hits"
          value={connectedCluster}
          tone={connectedCluster ? "#FFD600" : undefined}
          testId="net-cluster-hits"
        />
      </div>

      {(scamCounterparties.length > 0 || clusterCounterparties.length > 0) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {scamCounterparties.length > 0 && (
            <div className="border border-[#FF3333]/30 bg-[#FF3333]/5 p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#FF3333]">
                Direct scam contacts
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {scamCounterparties.map((a) => (
                  <span key={a} className="font-mono text-xs text-white/80">
                    {shortAddr(a, 6, 6)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {clusterCounterparties.length > 0 && (
            <div className="border border-[#FFD600]/30 bg-[#FFD600]/5 p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#FFD600]">
                Suspicious cluster contacts
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {clusterCounterparties.map((a) => (
                  <span key={a} className="font-mono text-xs text-white/80">
                    {shortAddr(a, 6, 6)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {topCounterparties.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            <GitFork size={12} weight="bold" /> Top counterparties
          </div>
          <div className="border border-white/10" data-testid="top-counterparties-list">
            {topCounterparties.slice(0, 8).map((c, i) => (
              <div
                key={c.address}
                className="flex items-center justify-between border-b border-white/10 px-3 py-2 last:border-0"
              >
                <span className="font-mono text-xs text-white/70">
                  #{i + 1} {shortAddr(c.address, 6, 6)}
                </span>
                <span className="font-mono text-xs text-white/50">
                  <Pulse size={10} weight="bold" className="inline mr-1.5 mb-0.5" />
                  {c.interactions}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const Stat = ({ label, value, tone, testId }) => (
  <div className="border border-white/10 p-3" data-testid={testId}>
    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">{label}</div>
    <div
      className="mt-1 font-display text-2xl font-black tabular-nums"
      style={{ color: tone || "#FFFFFF" }}
    >
      {value}
    </div>
  </div>
);
