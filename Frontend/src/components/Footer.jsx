export const Footer = () => (
  <footer
    data-testid="app-footer"
    className="relative mt-24 border-t border-white/[0.06]"
  >
    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--brand-blue)]/30 to-transparent" />
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src="/brand/solified-shield.png" alt="Solified" className="h-9 w-9" style={{ mixBlendMode: "screen" }} draggable="false" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-black tracking-tight brand-gradient-text">
                SOLIFIED
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                verify before you trust
              </span>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
            A real-time verification layer for every Solana wallet, token, and
            transaction. Built for users who'd rather check twice.
          </p>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            System
          </div>
          <ul className="mt-5 space-y-2.5 text-sm text-white/65">
            <li>Alchemy · Solana Mainnet</li>
            <li>Deterministic scoring engine</li>
            <li>5-minute result cache</li>
            <li>Open-source extension v1.3.0</li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            Disclaimer
          </div>
          <p className="mt-5 text-sm leading-relaxed text-white/55">
            Risk scores are heuristic and informational. Always do your own
            research before signing any on-chain transaction.
          </p>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
          © {new Date().getFullYear()} Solified · Built for the Solana ecosystem
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
          Verify before you trust.
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
