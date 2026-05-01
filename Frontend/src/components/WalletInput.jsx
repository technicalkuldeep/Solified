import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, ArrowRight, Warning } from "@phosphor-icons/react";

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const WalletInput = ({ size = "lg", initialValue = "" }) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = (e) => {
    e?.preventDefault?.();
    const v = value.trim();
    if (!v) {
      setError("Enter a Solana wallet or token address");
      return;
    }
    if (!BASE58_RE.test(v)) {
      setError("Invalid Solana address format");
      return;
    }
    setError("");
    setLoading(true);
    navigate(`/scan/${encodeURIComponent(v)}`);
  };

  const big = size === "lg";

  return (
    <form
      onSubmit={submit}
      className="w-full"
      data-testid="wallet-input-form"
    >
      <div
        className={`flex flex-col gap-0 border bg-[#0E0E13] transition-all duration-300 focus-within:border-white/40 focus-within:shadow-[0_0_0_4px_rgba(14,132,255,0.08)] sm:flex-row ${
          error ? "border-[#FF3B6E]/70" : "border-white/15"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4 sm:border-b-0 sm:border-r sm:px-6">
          <MagnifyingGlass size={20} weight="bold" className="text-white/55" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
            Solana Address
          </span>
        </div>

        <input
          data-testid="wallet-input-field"
          type="text"
          autoFocus={big}
          spellCheck={false}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          placeholder="Paste wallet or token mint address…"
          className={`flex-1 bg-transparent px-5 py-4 text-white placeholder-white/30 outline-none font-mono ${
            big ? "text-base sm:text-lg lg:text-xl" : "text-sm sm:text-base"
          }`}
        />

        <button
          type="submit"
          data-testid="wallet-input-submit"
          disabled={loading}
          className={`group relative flex items-center justify-center gap-2 overflow-hidden bg-white px-8 py-4 font-mono text-xs uppercase tracking-[0.22em] text-[#07070A] transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 ${
            big ? "sm:py-5" : ""
          }`}
        >
          <span className="absolute inset-0 -z-10 opacity-0 brand-gradient-bg transition-opacity duration-500 group-hover:opacity-100" />
          {loading ? "Solifying…" : "Solify Now"}
          <ArrowRight
            size={16}
            weight="bold"
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>
      {error && (
        <div
          data-testid="wallet-input-error"
          className="mt-3 flex items-center gap-2 text-[#FF3333] font-mono text-xs uppercase tracking-wider"
        >
          <Warning size={14} weight="fill" />
          {error}
        </div>
      )}
    </form>
  );
};

export default WalletInput;
