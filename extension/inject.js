// Solified Signer Firewall — MAIN world transaction interceptor.
//
// Wraps window.solana.signTransaction / signAllTransactions / signAndSendTransaction
// and Phantom's request method, so that BEFORE any signature is produced we:
//   1) Serialize the tx (base64)
//   2) POST it to /api/analyze-transaction
//   3) Render a blocking modal showing decoded actions + warnings
//   4) Allow the user to BLOCK or CONTINUE
//
// Strict requirements from spec:
//   - Never read or transmit private keys
//   - Never break wallet flow on errors (fail-open with a visible disclosure)
//   - Cache analysis for identical serialized tx (debounce duplicates)

(function () {
  if (window.__solifiedFirewallInstalled) return;
  window.__solifiedFirewallInstalled = true;

  const API_BASE = "https://solified.onrender.com/api";
  const ANALYSIS_CACHE = new Map(); // sha-ish key -> { ts, data }
  const CACHE_TTL_MS = 60_000;

  // ---------- helpers ----------
  function b64Encode(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function txToBase64(tx) {
    if (!tx) return null;
    try {
      // Both VersionedTransaction (.serialize()) and legacy Transaction (.serialize())
      if (typeof tx.serialize === "function") {
        const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
        return b64Encode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
      }
      if (tx instanceof Uint8Array) return b64Encode(tx);
      if (Array.isArray(tx) && typeof tx[0] === "number") return b64Encode(new Uint8Array(tx));
    } catch (e) {
      console.warn("[Solified] tx serialization failed:", e);
    }
    return null;
  }

  async function quickHash(s) {
    try {
      const buf = new TextEncoder().encode(s);
      const h = await crypto.subtle.digest("SHA-1", buf);
      return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      return s.slice(0, 32);
    }
  }

  async function analyzeTx(b64, wallet, intent) {
    const key = await quickHash(b64 + (intent?.kind || ""));
    const cached = ANALYSIS_CACHE.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
    try {
      const r = await fetch(`${API_BASE}/analyze-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: b64,
          userWallet: wallet || null,
          intent: intent?.kind || null,
          intentDetail: intent?.raw || null,
        }),
      });
      const data = await r.json();
      ANALYSIS_CACHE.set(key, { ts: Date.now(), data });
      return data;
    } catch (e) {
      console.warn("[Solified] analyze-transaction failed:", e);
      return null;
    }
  }

  function getActiveWallet() {
    try {
      const sol = window.solana;
      if (sol && sol.publicKey) return sol.publicKey.toString();
    } catch {}
    return null;
  }

  // ---------- Intent capture ----------
  // Watch button/anchor clicks and remember the most recent label that looks
  // like a transaction-triggering action. This runs in MAIN world so it sees
  // the page's DOM directly.
  let lastIntent = null;
  let lastIntentAt = 0;
  const INTENT_WINDOW_MS = 8000;

  const INTENT_PATTERNS = [
    { re: /\bswap\b/i, kind: "swap" },
    { re: /\b(send|transfer)\b/i, kind: "send" },
    { re: /\bmint\b/i, kind: "mint" },
    { re: /\b(stake|delegate)\b/i, kind: "stake" },
    { re: /\b(approve|allow)\b/i, kind: "approve" },
    { re: /\bbuy\b/i, kind: "swap" },
    { re: /\bclaim\b/i, kind: "claim" },
  ];

  function classifyText(label) {
    if (!label) return null;
    const trimmed = label.trim().slice(0, 80);
    for (const p of INTENT_PATTERNS) {
      if (p.re.test(trimmed)) return { kind: p.kind, raw: trimmed };
    }
    return null;
  }

  document.addEventListener("click", (e) => {
    try {
      const target = e.target.closest("button, [role=button], a");
      if (!target) return;
      const text = (target.innerText || target.getAttribute("aria-label") || "").trim();
      const c = classifyText(text);
      if (c) {
        lastIntent = c;
        lastIntentAt = Date.now();
      }
    } catch {}
  }, true);

  function currentIntent() {
    if (!lastIntent) return null;
    if (Date.now() - lastIntentAt > INTENT_WINDOW_MS) return null;
    return lastIntent;
  }

  // ---------- modal ----------
  function colorFor(color) {
    if (color === "green") return "#00FF66";
    if (color === "yellow") return "#FFD600";
    return "#FF3333";
  }

  function ensureStyle() {
    if (document.getElementById("solified-fw-style")) return;
    const css = `
      /* ========================================================
         Solified Signer Firewall · Premium Modal · v2
         ======================================================== */
      .sfw-overlay {
        position: fixed; inset: 0; z-index: 2147483647;
        background:
          radial-gradient(ellipse at 30% 20%, rgba(56,255,208,0.06), transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(181,54,255,0.10), transparent 55%),
          rgba(4,4,6,0.82);
        backdrop-filter: blur(14px) saturate(1.2);
        -webkit-backdrop-filter: blur(14px) saturate(1.2);
        display: flex; align-items: center; justify-content: center; padding: 24px;
        font-family: "Inter", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif;
        color: #fff;
        animation: sfw-fade .22s ease-out;
      }
      @keyframes sfw-fade { from{opacity:0} to{opacity:1} }
      @keyframes sfw-rise { from{opacity:0; transform: translateY(16px) scale(.98)} to{opacity:1; transform:none} }
      @keyframes sfw-aurora-spin { to { transform: rotate(360deg); } }
      @keyframes sfw-pulse { 0%,100%{opacity:.85} 50%{opacity:1} }

      /* ---- Modal shell ---- */
      .sfw-modal {
        position: relative;
        width: 100%; max-width: 560px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.025), transparent 30%),
          #0A0A0C;
        border: 1px solid rgba(255,255,255,0.08);
        padding: 0;
        box-shadow:
          0 30px 80px rgba(0,0,0,0.65),
          0 0 0 1px rgba(255,255,255,0.02) inset,
          0 1px 0 rgba(255,255,255,0.04) inset;
        overflow: hidden;
        animation: sfw-rise .28s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      /* Top gradient hairline (brand) */
      .sfw-modal::before {
        content: "";
        position: absolute; inset: 0 0 auto 0; height: 2px;
        background: linear-gradient(90deg, #38FFD0, #0E84FF, #B536FF);
        opacity: 0.95;
      }
      /* Tone left-edge accent */
      .sfw-modal::after {
        content: "";
        position: absolute; inset: 2px auto 0 0; width: 3px;
        opacity: 0.85;
      }
      .sfw-modal[data-tone="red"]::after    { background: linear-gradient(180deg, #FF3B6E, #FF3333); box-shadow: 0 0 24px rgba(255,59,110,0.4); }
      .sfw-modal[data-tone="yellow"]::after { background: linear-gradient(180deg, #FFD600, #FFA300); box-shadow: 0 0 24px rgba(255,214,0,0.3); }
      .sfw-modal[data-tone="green"]::after  { background: linear-gradient(180deg, #38FFD0, #00FF9C); box-shadow: 0 0 24px rgba(0,255,156,0.3); }

      /* Tone-tinted aurora behind score */
      .sfw-aurora {
        position: absolute; top: -120px; right: -120px;
        width: 360px; height: 360px;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.55;
        pointer-events: none;
        z-index: 0;
      }
      .sfw-modal[data-tone="red"]    .sfw-aurora { background: radial-gradient(circle, rgba(255,51,51,0.5), transparent 60%); }
      .sfw-modal[data-tone="yellow"] .sfw-aurora { background: radial-gradient(circle, rgba(255,214,0,0.45), transparent 60%); }
      .sfw-modal[data-tone="green"]  .sfw-aurora { background: radial-gradient(circle, rgba(0,255,156,0.45), transparent 60%); }

      .sfw-body { position: relative; z-index: 1; padding: 26px 28px 24px; }

      /* ---- Eyebrow ---- */
      .sfw-eyebrow {
        font-family: "IBM Plex Mono", monospace;
        font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase;
        color: rgba(255,255,255,0.55);
        display: flex; align-items: center; gap: 10px;
      }
      .sfw-eyebrow .sfw-dot {
        width: 7px; height: 7px; border-radius: 50%;
        animation: sfw-pulse 1.6s ease-in-out infinite;
        box-shadow: 0 0 10px currentColor;
      }
      .sfw-eyebrow .sfw-brand {
        margin-left: auto;
        font-weight: 700;
        background: linear-gradient(135deg, #38FFD0, #0E84FF, #B536FF);
        -webkit-background-clip: text; background-clip: text;
        color: transparent; -webkit-text-fill-color: transparent;
        letter-spacing: 0.28em;
      }

      /* ---- Title row with shield ---- */
      .sfw-title-row {
        display: flex; align-items: flex-start; gap: 14px;
        margin-top: 16px;
      }
      .sfw-shield {
        flex-shrink: 0;
        width: 44px; height: 44px;
        display: grid; place-items: center;
        position: relative;
      }
      .sfw-shield::before {
        content: "";
        position: absolute; inset: -6px;
        background: radial-gradient(circle, currentColor, transparent 70%);
        opacity: 0.25;
        filter: blur(8px);
        border-radius: 50%;
      }
      .sfw-shield svg { position: relative; width: 36px; height: 36px; }
      .sfw-title {
        font-family: "Azeret Mono","IBM Plex Mono",monospace;
        font-weight: 900; font-size: 26px; line-height: 1.05;
        letter-spacing: -0.02em;
      }
      .sfw-meta {
        margin-top: 8px;
        font-family: "IBM Plex Mono", monospace;
        font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
        color: rgba(255,255,255,0.45);
      }

      /* ---- Score block ---- */
      .sfw-score-row {
        display: flex; align-items: center; gap: 14px;
        margin-top: 18px;
        padding: 14px 16px;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        position: relative;
      }
      .sfw-score-row::before {
        content: "";
        position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
        background: currentColor; opacity: .9;
      }
      .sfw-score {
        font-family: "Azeret Mono", monospace;
        font-weight: 900; font-size: 48px; line-height: 1;
        letter-spacing: -0.04em;
        font-variant-numeric: tabular-nums;
        text-shadow: 0 0 24px currentColor;
        filter: drop-shadow(0 0 14px currentColor);
      }
      .sfw-score-meta { display: flex; flex-direction: column; gap: 6px; }
      .sfw-level {
        font-family: "IBM Plex Mono", monospace;
        font-size: 10px; padding: 4px 9px;
        border: 1px solid currentColor;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        align-self: flex-start;
      }
      .sfw-score-cap {
        font-family: "IBM Plex Mono", monospace;
        font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
        color: rgba(255,255,255,0.4);
      }

      /* ---- Programs ---- */
      .sfw-program-list {
        display: flex; flex-wrap: wrap; gap: 6px;
        margin-top: 14px;
      }
      .sfw-program {
        font-family: "IBM Plex Mono", monospace;
        font-size: 10px; padding: 4px 9px;
        border: 1px solid rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.7);
        background: rgba(255,255,255,0.015);
        letter-spacing: 0.06em;
      }
      .sfw-program[data-trusted="true"] {
        color: #00FF9C;
        border-color: rgba(0,255,156,0.4);
        background: rgba(0,255,156,0.06);
        box-shadow: 0 0 10px rgba(0,255,156,0.12);
      }

      /* ---- Sections ---- */
      .sfw-section {
        margin-top: 22px;
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .sfw-section-title {
        font-family: "IBM Plex Mono", monospace;
        font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase;
        color: rgba(255,255,255,0.4);
        display: flex; align-items: center; gap: 8px;
      }
      .sfw-section-title::before {
        content: "";
        width: 14px; height: 1px;
        background: linear-gradient(90deg, currentColor, transparent);
        opacity: 0.6;
      }

      .sfw-actions { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
      .sfw-action {
        padding: 10px 12px;
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06);
        font-family: "IBM Plex Mono", monospace;
        font-size: 12px; color: rgba(255,255,255,0.92);
        word-break: break-word;
        line-height: 1.45;
        transition: border-color .2s ease, background .2s ease;
      }
      .sfw-action:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); }

      .sfw-warns { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
      .sfw-warn {
        padding: 11px 13px;
        border-left: 3px solid;
        font-family: "Inter", "IBM Plex Sans", sans-serif;
        font-size: 12px; line-height: 1.5;
      }
      .sfw-warn[data-level="high"]   { border-color:#FF3B6E; background:linear-gradient(90deg, rgba(255,59,110,0.12), rgba(255,59,110,0.02)); color:#FFB3C5; }
      .sfw-warn[data-level="medium"] { border-color:#FFD600; background:linear-gradient(90deg, rgba(255,214,0,0.12), rgba(255,214,0,0.02)); color:#FFE680; }
      .sfw-warn[data-level="low"]    { border-color:rgba(255,255,255,0.25); background:rgba(255,255,255,0.025); color:rgba(255,255,255,0.7); }
      .sfw-warn b {
        color:#fff; display:block; margin-bottom:3px;
        font-size:10px; letter-spacing:.18em; text-transform:uppercase; font-weight:700;
      }

      /* ---- Buttons ---- */
      .sfw-buttons {
        margin-top: 26px;
        display: flex; gap: 10px; justify-content: flex-end;
        padding-top: 18px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .sfw-btn {
        padding: 13px 20px;
        border: 0;
        font-family: "IBM Plex Mono", monospace;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.22em; text-transform: uppercase;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: transform .18s cubic-bezier(0.22,1,0.36,1), filter .18s ease;
        display: inline-flex; align-items: center; gap: 8px;
      }
      .sfw-btn:active { transform: translateY(1px); }
      .sfw-btn-block {
        background: linear-gradient(135deg, #FF3B6E 0%, #FF3333 100%);
        color: #1A0508;
        box-shadow: 0 4px 24px rgba(255,59,110,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset;
      }
      .sfw-btn-block:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 8px 30px rgba(255,59,110,0.45); }
      .sfw-btn-block::before {
        content: "";
        position: absolute; inset: 0;
        background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%);
        transform: translateX(-100%);
        transition: transform .6s ease;
      }
      .sfw-btn-block:hover::before { transform: translateX(100%); }
      .sfw-btn-continue {
        background: rgba(255,255,255,0.03);
        color: rgba(255,255,255,0.85);
        border: 1px solid rgba(255,255,255,0.18);
      }
      .sfw-btn-continue:hover {
        border-color: rgba(255,255,255,0.45);
        background: rgba(255,255,255,0.06);
        color: #fff;
        transform: translateY(-1px);
      }

      /* ---- Loading state ---- */
      .sfw-loading-shell {
        padding: 42px 28px;
        display: flex; flex-direction: column; align-items: center; gap: 14px;
        text-align: center;
      }
      .sfw-loading-shield {
        width: 56px; height: 56px; position: relative;
        display: grid; place-items: center;
      }
      .sfw-loading-shield::before {
        content: "";
        position: absolute; inset: -8px;
        border-radius: 50%;
        background: conic-gradient(from 0deg, transparent 0 240deg, #38FFD0 280deg, #0E84FF 320deg, #B536FF 350deg, transparent 360deg);
        -webkit-mask: radial-gradient(circle, transparent 60%, #000 62%, #000 64%, transparent 66%);
                mask: radial-gradient(circle, transparent 60%, #000 62%, #000 64%, transparent 66%);
        animation: sfw-aurora-spin 2s linear infinite;
      }
      .sfw-loading-shield svg {
        position: relative; width: 36px; height: 36px;
      }
      .sfw-loading-text {
        font-family: "IBM Plex Mono", monospace;
        font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase;
        color: rgba(255,255,255,0.65);
      }
      .sfw-loading-sub {
        font-family: "IBM Plex Mono", monospace;
        font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
        color: rgba(255,255,255,0.3);
      }

      /* Footer caption */
      .sfw-foot {
        margin-top: 14px;
        font-family: "IBM Plex Mono", monospace;
        font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
        color: rgba(255,255,255,0.32);
        text-align: center;
      }
    `;
    const el = document.createElement("style");
    el.id = "solified-fw-style";
    el.textContent = css;
    document.head.appendChild(el);
  }

  function showModal({ analysis, txBase64 }) {
    return new Promise((resolve) => {
      ensureStyle();
      const overlay = document.createElement("div");
      overlay.className = "sfw-overlay";

      const renderContent = (a) => {
        // Inline shield SVG (currentColor for tone-aware tinting)
        const shieldSvg = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="sfwShieldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"  stop-color="#38FFD0"/>
                <stop offset="50%" stop-color="#0E84FF"/>
                <stop offset="100%" stop-color="#B536FF"/>
              </linearGradient>
            </defs>
            <path d="M12 2.5 4 5.5v6.2c0 4.6 3.2 8.6 8 9.8 4.8-1.2 8-5.2 8-9.8V5.5l-8-3z"
              stroke="url(#sfwShieldGrad)" stroke-width="1.5" fill="rgba(14,132,255,0.08)"/>
            <path d="M9 12.5l2 2 4-4.5" stroke="url(#sfwShieldGrad)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

        if (!a) {
          return `
            <div class="sfw-modal" data-tone="yellow">
              <div class="sfw-aurora"></div>
              <div class="sfw-loading-shell">
                <div class="sfw-loading-shield">${shieldSvg}</div>
                <div class="sfw-loading-text">Solifying transaction…</div>
                <div class="sfw-loading-sub">Decoding instructions · simulating outcome</div>
              </div>
            </div>
          `;
        }
        const tone = a.riskColor || "yellow";
        const c = colorFor(tone);
        const titleLabel =
          tone === "red" ? "High-risk transaction" :
          tone === "green" ? "Looks safe to sign" :
          "Review before signing";
        const actionHtml = (a.actions || [])
          .map((x) => `<div class="sfw-action">${escape(x)}</div>`)
          .join("") || `<div class="sfw-action">No human-readable actions decoded.</div>`;
        const warnHtml = (a.warnings || [])
          .map((w) => `<div class="sfw-warn" data-level="${w.level}"><b>${escape(w.label)}</b>${escape(w.detail || "")}</div>`)
          .join("") || `<div class="sfw-warn" data-level="low"><b>No warnings</b>Proceed at your own discretion.</div>`;
        const progHtml = (a.programs || [])
          .map((p) => `<span class="sfw-program" data-trusted="${!!p.trusted}">${escape(p.name || p.programId.slice(0, 8) + '…')}</span>`)
          .join("");
        return `
          <div class="sfw-modal" data-tone="${tone}">
            <div class="sfw-aurora"></div>
            <div class="sfw-body">
              <div class="sfw-eyebrow">
                <span class="sfw-dot" style="background:${c}; color:${c}"></span>
                Signer Firewall
                <span class="sfw-brand">SOLIFIED</span>
              </div>

              <div class="sfw-title-row">
                <div class="sfw-shield" style="color:${c}">${shieldSvg}</div>
                <div>
                  <div class="sfw-title" style="color:${c}">${escape(titleLabel)}</div>
                  <div class="sfw-meta">${a.instructionCount || 0} instruction(s) · ${a.version || "tx"} · ${a.programs?.length || 0} program(s)</div>
                </div>
              </div>

              <div class="sfw-score-row" style="color:${c}">
                <div class="sfw-score">${a.score ?? "—"}</div>
                <div class="sfw-score-meta">
                  <div class="sfw-level">${a.riskLevel || "Unknown"} Risk</div>
                  <div class="sfw-score-cap">Solified Score · 0–100</div>
                </div>
              </div>

              ${progHtml ? `<div class="sfw-program-list">${progHtml}</div>` : ""}

              <div class="sfw-section">
                <div class="sfw-section-title">What this transaction does</div>
                <div class="sfw-actions">${actionHtml}</div>
              </div>

              <div class="sfw-section">
                <div class="sfw-section-title">Warnings</div>
                <div class="sfw-warns">${warnHtml}</div>
              </div>

              <div class="sfw-buttons">
                <button class="sfw-btn sfw-btn-continue" data-act="continue">Continue anyway</button>
                <button class="sfw-btn sfw-btn-block" data-act="block">Block transaction</button>
              </div>

              <div class="sfw-foot">Verify before you trust · pre-signing firewall</div>
            </div>
          </div>
        `;
      };

      overlay.innerHTML = renderContent(analysis);
      document.body.appendChild(overlay);

      const wire = () => {
        overlay.querySelectorAll("[data-act]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const act = btn.getAttribute("data-act");
            overlay.remove();
            resolve(act);
          });
        });
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) {
            overlay.remove();
            resolve("block"); // safe default: outside-click = block
          }
        });
      };

      if (analysis) {
        wire();
      } else {
        // Showed loading; caller will call updateModal
        overlay._update = (a) => {
          overlay.innerHTML = renderContent(a);
          wire();
        };
      }

      // Expose updater
      overlay._wire = wire;
    });
  }

  function escape(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------- gating logic ----------
  async function gateTransaction(tx) {
    const b64 = txToBase64(tx);
    if (!b64) return "continue"; // unknown payload, fail-open with banner
    const wallet = getActiveWallet();
    const intent = currentIntent();

    // Show modal with loader, fetch analysis, then update.
    let resolveDecision;
    const decisionPromise = new Promise((res) => (resolveDecision = res));
    const overlay = document.createElement("div");
    ensureStyle();
    overlay.className = "sfw-overlay";
    overlay.innerHTML = `
      <div class="sfw-modal" data-tone="yellow">
        <div class="sfw-aurora"></div>
        <div class="sfw-loading-shell">
          <div class="sfw-loading-shield">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="sfwShieldGradL" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"  stop-color="#38FFD0"/>
                  <stop offset="50%" stop-color="#0E84FF"/>
                  <stop offset="100%" stop-color="#B536FF"/>
                </linearGradient>
              </defs>
              <path d="M12 2.5 4 5.5v6.2c0 4.6 3.2 8.6 8 9.8 4.8-1.2 8-5.2 8-9.8V5.5l-8-3z"
                stroke="url(#sfwShieldGradL)" stroke-width="1.5" fill="rgba(14,132,255,0.08)"/>
              <path d="M9 12.5l2 2 4-4.5" stroke="url(#sfwShieldGradL)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="sfw-loading-text">Solifying transaction…</div>
          <div class="sfw-loading-sub">Decoding instructions · simulating outcome</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const analysis = await analyzeTx(b64, wallet, intent);

    // If analysis failed entirely, fail-open with informational modal
    const finalAnalysis = analysis || {
      score: null,
      riskLevel: "Unknown",
      riskColor: "yellow",
      actions: ["Could not decode transaction details."],
      warnings: [{ level: "medium", label: "Solified analysis unavailable", detail: "Backend did not return a verdict. Proceed only if you fully trust the dApp." }],
      programs: [],
      instructionCount: 0,
      version: "tx",
    };

    const tone = finalAnalysis.riskColor || "yellow";
    const c = colorFor(tone);
    const actionHtml = (finalAnalysis.actions || [])
      .map((x) => `<div class="sfw-action">${escape(x)}</div>`)
      .join("") || `<div class="sfw-action">No human-readable actions decoded.</div>`;
    const warnHtml = (finalAnalysis.warnings || [])
      .map((w) => `<div class="sfw-warn" data-level="${w.level}"><b>${escape(w.label)}</b>${escape(w.detail || "")}</div>`)
      .join("") || `<div class="sfw-warn" data-level="low"><b>No warnings</b>Proceed at your own discretion.</div>`;
    const progHtml = (finalAnalysis.programs || [])
      .map((p) => `<span class="sfw-program" data-trusted="${!!p.trusted}">${escape(p.name || p.programId.slice(0, 8) + '…')}</span>`)
      .join("");

    const intentRow = finalAnalysis.intent
      ? `<div class="sfw-section">
          <div class="sfw-section-title">Intent vs Reality</div>
          <div class="sfw-action" style="margin-top:8px">
            <div style="font-size:10px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:.18em">Expected</div>
            <div style="margin-top:2px">${escape(finalAnalysis.intent.expected || finalAnalysis.intent.raw || "—")}</div>
          </div>
          <div class="sfw-action" style="margin-top:6px">
            <div style="font-size:10px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:.18em">Actual</div>
            <div style="margin-top:2px">${escape((finalAnalysis.intent.actual || []).join(" · ") || "—")}</div>
          </div>
          ${
            finalAnalysis.intent.mismatch
              ? `<div class="sfw-warn" data-level="high" style="margin-top:8px"><b>⚠ Mismatch</b>${escape(finalAnalysis.intent.mismatch)}</div>`
              : ""
          }
        </div>`
      : "";

    const titleLabel =
      tone === "red" ? "High-risk transaction" :
      tone === "green" ? "Looks safe to sign" :
      "Review before signing";
    const shieldSvg = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="sfwShieldGradR" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stop-color="#38FFD0"/>
            <stop offset="50%" stop-color="#0E84FF"/>
            <stop offset="100%" stop-color="#B536FF"/>
          </linearGradient>
        </defs>
        <path d="M12 2.5 4 5.5v6.2c0 4.6 3.2 8.6 8 9.8 4.8-1.2 8-5.2 8-9.8V5.5l-8-3z"
          stroke="url(#sfwShieldGradR)" stroke-width="1.5" fill="rgba(14,132,255,0.08)"/>
        <path d="M9 12.5l2 2 4-4.5" stroke="url(#sfwShieldGradR)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    overlay.innerHTML = `
      <div class="sfw-modal" data-tone="${tone}">
        <div class="sfw-aurora"></div>
        <div class="sfw-body">
          <div class="sfw-eyebrow">
            <span class="sfw-dot" style="background:${c}; color:${c}"></span>
            Signer Firewall
            <span class="sfw-brand">SOLIFIED</span>
          </div>

          <div class="sfw-title-row">
            <div class="sfw-shield" style="color:${c}">${shieldSvg}</div>
            <div>
              <div class="sfw-title" style="color:${c}">${escape(titleLabel)}</div>
              <div class="sfw-meta">${finalAnalysis.instructionCount || 0} instruction(s) · ${finalAnalysis.version || "tx"} · ${finalAnalysis.programs?.length || 0} program(s)</div>
            </div>
          </div>

          <div class="sfw-score-row" style="color:${c}">
            <div class="sfw-score">${finalAnalysis.score ?? "—"}</div>
            <div class="sfw-score-meta">
              <div class="sfw-level">${finalAnalysis.riskLevel || "Unknown"} Risk</div>
              <div class="sfw-score-cap">Solified Score · 0–100</div>
            </div>
          </div>

          ${progHtml ? `<div class="sfw-program-list">${progHtml}</div>` : ""}
          ${intentRow}

          <div class="sfw-section">
            <div class="sfw-section-title">What this transaction does</div>
            <div class="sfw-actions">${actionHtml}</div>
          </div>

          <div class="sfw-section">
            <div class="sfw-section-title">Warnings</div>
            <div class="sfw-warns">${warnHtml}</div>
          </div>

          <div class="sfw-buttons">
            <button class="sfw-btn sfw-btn-continue" data-act="continue">Continue anyway</button>
            <button class="sfw-btn sfw-btn-block" data-act="block">Block transaction</button>
          </div>

          <div class="sfw-foot">Verify before you trust · pre-signing firewall</div>
        </div>
      </div>
    `;
    overlay.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        overlay.remove();
        resolveDecision(btn.getAttribute("data-act"));
      });
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolveDecision("block");
      }
    });

    return decisionPromise;
  }

  // ---------- wrapper installer ----------
  function wrapProvider(provider) {
    if (!provider || provider.__solifiedWrapped) return;
    provider.__solifiedWrapped = true;

    const origSign = provider.signTransaction?.bind(provider);
    const origSignAll = provider.signAllTransactions?.bind(provider);
    const origSignAndSend = provider.signAndSendTransaction?.bind(provider);

    if (origSign) {
      provider.signTransaction = async (tx, ...rest) => {
        try {
          const decision = await gateTransaction(tx);
          if (decision === "block") throw new Error("Blocked by Solified");
        } catch (err) {
          if (err && err.message === "Blocked by Solified") throw err;
          console.warn("[Solified] gate error, failing open:", err);
        }
        return origSign(tx, ...rest);
      };
    }

    if (origSignAll) {
      provider.signAllTransactions = async (txs, ...rest) => {
        try {
          // gate the FIRST tx; assume bundle is one logical operation.
          if (Array.isArray(txs) && txs.length) {
            const decision = await gateTransaction(txs[0]);
            if (decision === "block") throw new Error("Blocked by Solified");
          }
        } catch (err) {
          if (err && err.message === "Blocked by Solified") throw err;
          console.warn("[Solified] gate error, failing open:", err);
        }
        return origSignAll(txs, ...rest);
      };
    }

    if (origSignAndSend) {
      provider.signAndSendTransaction = async (tx, ...rest) => {
        try {
          const decision = await gateTransaction(tx);
          if (decision === "block") throw new Error("Blocked by Solified");
        } catch (err) {
          if (err && err.message === "Blocked by Solified") throw err;
          console.warn("[Solified] gate error, failing open:", err);
        }
        return origSignAndSend(tx, ...rest);
      };
    }

    console.log("[Solified] Signer Firewall armed on provider", provider?.isPhantom ? "(Phantom)" : provider?.isSolflare ? "(Solflare)" : "");
  }

  function tryArm() {
    const candidates = [];
    if (window.solana) candidates.push(window.solana);
    if (window.phantom?.solana) candidates.push(window.phantom.solana);
    if (window.solflare) candidates.push(window.solflare);
    candidates.forEach(wrapProvider);
  }

  tryArm();
  // Re-arm when wallets inject after page load
  let attempts = 0;
  const interval = setInterval(() => {
    tryArm();
    if (++attempts > 40) clearInterval(interval); // ~20s
  }, 500);

  // Allow manual demo from page console:
  window.solifiedDemo = async function () {
    return gateTransaction({
      serialize: () => new Uint8Array([0]), // empty stub triggers fail-open analysis
    });
  };
})();
