// Solified Fake-dApp Detector
// ------------------------------------------------------------------
// Compares the current page's hostname against a whitelist of known
// Solana dApp domains. If we find a HIGH similarity match (Levenshtein
// ratio >= 0.7) but NOT an exact match, we flag the page as a likely
// impersonator and inject a sticky red banner.
//
// Runs in the ISOLATED content-script world (so it doesn't conflict
// with the existing badge scanner from content.js).
(function () {
  if (window.__solifiedDappDetector) return;
  window.__solifiedDappDetector = true;

  const KNOWN_DAPPS = {
    "jup.ag": "Jupiter Aggregator",
    "raydium.io": "Raydium",
    "orca.so": "Orca",
    "marinade.finance": "Marinade Finance",
    "tensor.trade": "Tensor",
    "magiceden.io": "Magic Eden",
    "drift.trade": "Drift",
    "kamino.finance": "Kamino",
    "marginfi.com": "MarginFi",
    "phantom.app": "Phantom",
    "solflare.com": "Solflare",
    "backpack.app": "Backpack",
    "solana.com": "Solana Foundation",
    "solscan.io": "Solscan",
    "explorer.solana.com": "Solana Explorer",
    "meteora.ag": "Meteora",
    "step.finance": "Step Finance",
    "jito.network": "Jito",
  };

  function rootDomain(host) {
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    // crude eTLD+1
    return parts.slice(-2).join(".");
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const m = a.length, n = b.length;
    const prev = new Array(n + 1);
    const curr = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      for (let j = 0; j <= n; j++) prev[j] = curr[j];
    }
    return prev[n];
  }

  function similarity(a, b) {
    const max = Math.max(a.length, b.length);
    if (!max) return 1;
    return 1 - levenshtein(a, b) / max;
  }

  function ensureStyle() {
    if (document.getElementById("solified-dapp-style")) return;
    const css = `
      .sdd-banner { position: fixed; top: 0; left: 0; right: 0;
        z-index: 2147483645; background: rgba(255,51,51,0.96); color: #0A0A0C;
        padding: 12px 16px 12px 20px; border-bottom: 2px solid #FF3333;
        font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif;
        display: flex; align-items: center; gap: 12px;
        box-shadow: 0 6px 20px rgba(255,51,51,0.25);
        animation: sdd-slide-down .25s ease-out;
      }
      .sdd-banner-verified { background: rgba(0,255,102,0.94); border-bottom-color: #00FF66; }
      .sdd-banner-icon { font-size: 18px; line-height: 1; }
      .sdd-banner-body { flex: 1; min-width: 0; }
      .sdd-banner-title { font-weight: 700; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; }
      .sdd-banner-detail { font-size: 12px; opacity: .85; margin-top: 2px; }
      .sdd-banner-cta { background: #0A0A0C; color: #FF3333; border: none;
        padding: 6px 12px; font-family: "IBM Plex Mono", monospace; font-size: 10px;
        font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
        cursor: pointer; }
      .sdd-banner-verified .sdd-banner-cta { color: #00FF66; }
      .sdd-banner-close { background: transparent; border: none; cursor: pointer;
        font-size: 16px; line-height: 1; padding: 0 4px; color: #0A0A0C;
        opacity: .7; }
      .sdd-banner-close:hover { opacity: 1; }
      @keyframes sdd-slide-down { from { transform: translateY(-100%); } to { transform: translateY(0); } }
    `;
    const el = document.createElement("style");
    el.id = "solified-dapp-style";
    el.textContent = css;
    document.head.appendChild(el);
  }

  function inject(banner) {
    ensureStyle();
    if (document.querySelector(".sdd-banner")) return;
    document.body && document.body.prepend(banner);
  }

  function makeWarning(currentHost, suspectedDomain, suspectedName, ratio) {
    const el = document.createElement("div");
    el.className = "sdd-banner";
    el.innerHTML = `
      <span class="sdd-banner-icon">🚨</span>
      <div class="sdd-banner-body">
        <div class="sdd-banner-title">Solified · Possible fake dApp</div>
        <div class="sdd-banner-detail">
          ${currentHost} looks ${(ratio * 100).toFixed(0)}% similar to <b>${suspectedDomain}</b> (${suspectedName}). Verify the URL before signing anything.
        </div>
      </div>
      <button class="sdd-banner-cta" type="button">Open ${suspectedDomain}</button>
      <button class="sdd-banner-close" aria-label="Dismiss" type="button">✕</button>
    `;
    el.querySelector(".sdd-banner-cta").addEventListener("click", () => {
      window.open(`https://${suspectedDomain}`, "_blank", "noopener");
    });
    el.querySelector(".sdd-banner-close").addEventListener("click", () => el.remove());
    inject(el);
  }

  function makeVerified(domain, name) {
    const el = document.createElement("div");
    el.className = "sdd-banner sdd-banner-verified";
    el.innerHTML = `
      <span class="sdd-banner-icon">✅</span>
      <div class="sdd-banner-body">
        <div class="sdd-banner-title">Solified · Verified dApp</div>
        <div class="sdd-banner-detail">${domain} is recognised as ${name}.</div>
      </div>
      <button class="sdd-banner-close" aria-label="Dismiss" type="button">✕</button>
    `;
    el.querySelector(".sdd-banner-close").addEventListener("click", () => el.remove());
    inject(el);
    setTimeout(() => el.remove(), 8000);
  }

  function detect() {
    let host = (location.hostname || "").toLowerCase();
    if (!host) return;
    host = host.replace(/^www\./, "");
    // Skip localhost / IPs / extension hosts
    if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return;

    if (KNOWN_DAPPS[host]) {
      makeVerified(host, KNOWN_DAPPS[host]);
      return;
    }
    // Check root for subdomains of legit dApps (e.g. app.jup.ag)
    const root = rootDomain(host);
    if (KNOWN_DAPPS[root]) {
      // Subdomain of a known dApp — silent.
      return;
    }

    let bestMatch = null;
    let bestScore = 0;
    for (const known of Object.keys(KNOWN_DAPPS)) {
      const s = similarity(root, known);
      if (s > bestScore) {
        bestScore = s;
        bestMatch = known;
      }
    }
    if (bestMatch && bestScore >= 0.7 && bestScore < 1.0) {
      makeWarning(host, bestMatch, KNOWN_DAPPS[bestMatch], bestScore);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", detect);
  } else {
    detect();
  }
})();
