// Solified — content script
// Responsibilities:
//   1. Detect Solana base58 addresses on every page (debounced, deduped)
//   2. Inject a colored Solified Badge next to each
//   3. Pre-transaction warning modal when user clicks a detected address
//   4. Clipboard-attack detection (copy → paste mismatch)
//   5. Address-similarity warning against recent + trusted addresses
//   6. Floating banner for high-risk findings
//
// Safety: only public addresses are sent to backend. Never touches keys or page data.

const BASE58_RE = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
const BADGE_CLASS = "solified-badge";
const PROCESSED_ATTR = "data-solified-processed";
const SCAN_DEBOUNCE_MS = 1200;
const PASTE_CHECK_WINDOW_MS = 15_000;
const SIMILARITY_THRESHOLD = 0.85;

const addressCache = new Map(); // address -> { data, ts }
const scannedOnPage = new Set();
const recentAddresses = []; // LRU of addresses seen by user

function rememberRecent(addr) {
  if (!addr) return;
  const i = recentAddresses.indexOf(addr);
  if (i >= 0) recentAddresses.splice(i, 1);
  recentAddresses.unshift(addr);
  if (recentAddresses.length > 25) recentAddresses.length = 25;
}

function riskColor(color) {
  if (color === "green") return "#00FF66";
  if (color === "yellow") return "#FFD600";
  return "#FF3333";
}

function sendMessage(type, payload = {}) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type, ...payload }, (resp) => resolve(resp));
    } catch {
      resolve(null);
    }
  });
}

async function fetchRisk(address) {
  const cached = addressCache.get(address);
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) return cached.data;
  const data = await sendMessage("ANALYZE", { address });
  if (data && typeof data.score === "number") {
    addressCache.set(address, { data, ts: Date.now() });
  }
  return data;
}

function buildBadge(data, address) {
  const span = document.createElement("span");
  span.className = BADGE_CLASS;
  span.dataset.address = address;
  const c = riskColor(data.riskColor);
  const isVerified = data.isWhitelisted || data.riskLevel === "Verified";
  span.style.setProperty("--solified-color", c);
  const icon = isVerified ? "✓" : data.riskColor === "red" ? "!" : data.riskColor === "yellow" ? "?" : "✓";
  const label = isVerified ? "Solified Verified" : data.riskLevel;
  span.innerHTML = `
    <span class="solified-icon">${icon}</span>
    <span class="solified-score">${data.score}</span>
    <span class="solified-label">${label}</span>
  `;
  span.title = `Solified: ${label} · ${data.score}/100`;
  span.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.riskColor === "red") {
      showPreTxModal(address, data);
    } else {
      sendMessage("OPEN_REPORT", { address });
    }
  });
  return span;
}

function isEligibleTextNode(node) {
  if (!node?.nodeValue || node.nodeValue.length < 32) return false;
  const p = node.parentElement;
  if (!p) return false;
  const tag = p.tagName;
  if (!tag || ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT"].includes(tag)) return false;
  if (p.closest(`.${BADGE_CLASS}`)) return false;
  if (p.hasAttribute(PROCESSED_ATTR)) return false;
  return true;
}

async function processOccurrence(address, textNode) {
  if (scannedOnPage.has(address)) return;
  scannedOnPage.add(address);
  rememberRecent(address);

  const data = await fetchRisk(address);
  if (!data || typeof data.score !== "number") return;

  // Inject badge
  const parent = textNode?.parentNode;
  if (parent) {
    const badge = buildBadge(data, address);
    parent.insertBefore(badge, textNode.nextSibling);
    parent.setAttribute?.(PROCESSED_ATTR, "true");
  }

  // Floating banner for high-risk first detection on this page
  if (data.riskColor === "red") {
    showBanner({
      tone: "red",
      title: "Solified: High Risk wallet detected",
      detail: `${shortAddr(address)} scored ${data.score}/100. Avoid interacting.`,
      address,
    });
  } else if (data.riskColor === "yellow") {
    showBanner({
      tone: "yellow",
      title: "Solified: Suspicious address detected",
      detail: `${shortAddr(address)} scored ${data.score}/100.`,
      address,
    });
  } else if (data.isWhitelisted || data.riskLevel === "Verified") {
    // Silent — badge is enough.
  }
}

function scanRoot(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (isEligibleTextNode(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const seen = new Set();
  let node;
  while ((node = walker.nextNode())) {
    const matches = node.nodeValue.match(BASE58_RE);
    if (!matches) continue;
    for (const m of matches) {
      if (seen.has(m)) continue;
      seen.add(m);
      processOccurrence(m, node);
    }
  }
}

// ---------- Floating banner ----------
function showBanner({ tone = "red", title, detail, address }) {
  // Don't spam — one banner per address per page.
  const key = `solified-banner-${address}`;
  if (document.getElementById(key)) return;
  const wrap = document.createElement("div");
  wrap.id = key;
  wrap.className = `solified-banner solified-banner-${tone}`;
  wrap.innerHTML = `
    <div class="solified-banner-icon">${tone === "red" ? "🚨" : "⚠️"}</div>
    <div class="solified-banner-body">
      <div class="solified-banner-title">${title}</div>
      <div class="solified-banner-detail">${detail}</div>
    </div>
    <button class="solified-banner-cta" type="button">View report</button>
    <button class="solified-banner-close" type="button" aria-label="Dismiss">✕</button>
  `;
  wrap.querySelector(".solified-banner-close").addEventListener("click", () => wrap.remove());
  wrap.querySelector(".solified-banner-cta").addEventListener("click", () => {
    sendMessage("OPEN_REPORT", { address });
  });
  document.body.appendChild(wrap);
  // Auto-dismiss suspicious after 12s; keep red until manual dismiss
  if (tone !== "red") setTimeout(() => wrap.remove(), 12_000);
}

// ---------- Pre-transaction modal ----------
function showPreTxModal(address, data) {
  if (document.getElementById("solified-modal")) return;
  const wrap = document.createElement("div");
  wrap.id = "solified-modal";
  wrap.className = "solified-modal-overlay";
  wrap.innerHTML = `
    <div class="solified-modal">
      <div class="solified-modal-header">
        <span class="solified-modal-dot"></span>
        <span>SOLIFIED WARNING</span>
      </div>
      <div class="solified-modal-title">⚠️ High Risk Address</div>
      <div class="solified-modal-score">Solified Score · <b>${data.score}/100</b></div>
      <div class="solified-modal-body">
        You are about to interact with a wallet flagged by Solified.
        Proceed with extreme caution — approvals on Solana are permanent.
      </div>
      <div class="solified-modal-addr">${address}</div>
      <div class="solified-modal-actions">
        <button type="button" class="solified-modal-cancel">Cancel</button>
        <button type="button" class="solified-modal-report">View full report</button>
      </div>
    </div>
  `;
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap) wrap.remove();
  });
  wrap.querySelector(".solified-modal-cancel").addEventListener("click", () => wrap.remove());
  wrap.querySelector(".solified-modal-report").addEventListener("click", () => {
    sendMessage("OPEN_REPORT", { address });
    wrap.remove();
  });
  document.body.appendChild(wrap);
}

// ---------- Clipboard attack & similarity detection ----------
let lastCopiedAddress = null;
let lastCopiedAt = 0;

document.addEventListener("copy", () => {
  try {
    const sel = window.getSelection()?.toString() || "";
    const match = sel.match(BASE58_RE);
    if (match && match[0]) {
      lastCopiedAddress = match[0];
      lastCopiedAt = Date.now();
      rememberRecent(lastCopiedAddress);
    }
  } catch {}
});

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  if (!max) return 1;
  return 1 - levenshtein(a, b) / max;
}

function checkPasted(pasted) {
  if (!pasted || !BASE58_RE.test(pasted)) return;
  // reset regex state since /g retains lastIndex
  BASE58_RE.lastIndex = 0;

  // CLIPBOARD HIJACK: recent copy was different address
  if (
    lastCopiedAddress &&
    pasted !== lastCopiedAddress &&
    Date.now() - lastCopiedAt < PASTE_CHECK_WINDOW_MS
  ) {
    showBanner({
      tone: "red",
      title: "Solified: Clipboard attack detected",
      detail: `You copied ${shortAddr(lastCopiedAddress)} but ${shortAddr(pasted)} was pasted. Possible clipboard hijacker.`,
      address: pasted,
    });
  }

  // SIMILARITY: pasted looks like a recent/trusted address but isn't
  const candidates = Array.from(new Set([...recentAddresses]));
  for (const cand of candidates) {
    if (cand === pasted) continue;
    const s = similarity(cand, pasted);
    if (s >= SIMILARITY_THRESHOLD) {
      showBanner({
        tone: "yellow",
        title: "Solified: Look-alike address",
        detail: `Pasted ${shortAddr(pasted)} is ${(s * 100).toFixed(0)}% similar to ${shortAddr(cand)}. Verify carefully.`,
        address: pasted,
      });
      break;
    }
  }
}

document.addEventListener("paste", (e) => {
  try {
    const pasted =
      (e.clipboardData && e.clipboardData.getData("text")) ||
      window.getSelection()?.toString() ||
      "";
    checkPasted(pasted.trim());
  } catch {}
}, true);

// Input-level paste (React / controlled inputs)
document.addEventListener("input", (e) => {
  const v = e.target?.value;
  if (typeof v === "string" && v.length >= 32 && v.length <= 64) {
    const m = v.match(BASE58_RE);
    if (m && m[0] && m[0] === v.trim()) checkPasted(m[0]);
  }
}, true);

function shortAddr(a, n = 4, b = 4) {
  if (!a) return "";
  return a.length > n + b + 3 ? `${a.slice(0, n)}…${a.slice(-b)}` : a;
}

// ---------- Debounced mutation scanning ----------
let pending = null;
function scheduleScan() {
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    scanRoot();
  }, SCAN_DEBOUNCE_MS);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => scanRoot());
} else {
  scanRoot();
}

const observer = new MutationObserver(scheduleScan);
observer.observe(document.body, { childList: true, subtree: true });
