// Solified background service worker
const API_BASE = "https://solified.onrender.com/api";
const WEB_APP = "https://www.solified.app";
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE = new Map();
const MAX_HISTORY = 25;

async function analyze(address) {
  const cached = CACHE.get(address);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
  try {
    const resp = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    CACHE.set(address, { ts: Date.now(), data });
    pushHistory(data);
    return data;
  } catch {
    return null;
  }
}

async function pushHistory(data) {
  if (!data?.address) return;
  try {
    const stored = await chrome.storage.local.get("solified_history");
    const list = stored.solified_history || [];
    const entry = {
      address: data.address,
      type: data.type,
      score: data.score,
      riskLevel: data.riskLevel,
      riskColor: data.riskColor,
      isWhitelisted: !!data.isWhitelisted,
      analyzedAt: data.analyzedAt || new Date().toISOString(),
    };
    const filtered = list.filter((x) => x.address !== entry.address);
    filtered.unshift(entry);
    if (filtered.length > MAX_HISTORY) filtered.length = MAX_HISTORY;
    await chrome.storage.local.set({ solified_history: filtered });
  } catch {}
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "ANALYZE" && msg.address) {
    analyze(msg.address).then((data) => sendResponse(data));
    return true;
  }
  if (msg?.type === "OPEN_REPORT" && msg.address) {
    chrome.tabs.create({ url: `${WEB_APP}/scan/${encodeURIComponent(msg.address)}` });
    sendResponse(true);
    return true;
  }
  if (msg?.type === "GET_HISTORY") {
    chrome.storage.local.get("solified_history").then((stored) =>
      sendResponse(stored.solified_history || [])
    );
    return true;
  }
  if (msg?.type === "CLEAR_HISTORY") {
    chrome.storage.local.set({ solified_history: [] }).then(() => sendResponse(true));
    return true;
  }
});
