import { Question } from "@phosphor-icons/react";
import RiskBreakdownList from "@/components/RiskBreakdownList";

export default function RiskExplanationPanel({ reasons = [], score = 0, riskLevel = "" }) {
  const deductions = reasons.filter((r) => r.type === "deduction" && r.points !== 0);
  const additions = reasons.filter((r) => r.type === "addition");

  return (
    <div data-testid="risk-explanation-panel" className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-white/20">
              <Question size={18} weight="duotone" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                Why this score?
              </div>
              <div className="font-display text-2xl font-black tracking-tight lg:text-3xl">
                {riskLevel} · {score}/100
              </div>
            </div>
          </div>
        </div>
        <div className="hidden font-mono text-xs text-white/40 sm:block">
          <span className="text-[#FF3333]">{deductions.length} deduction{deductions.length === 1 ? "" : "s"}</span>
          {" · "}
          <span className="text-[#00FF66]">{additions.length} addition{additions.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      <RiskBreakdownList reasons={reasons} />
    </div>
  );
}
