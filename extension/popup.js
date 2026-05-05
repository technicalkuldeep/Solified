const API_BASE = "https://solified.onrender.com/api";
const WEB_APP = "https://www.solified.app";

const $addr = document.getElementById("addr");
const $btn = document.getElementById("scan");
const $btnLabel = $btn.querySelector("span:first-child");
const $btnArrow = $btn.querySelector(".arrow");
const $result = document.getElementById("result");
const $error = document.getElementById("error");
const $open = document.getElementById("openapp");
const $history = document.getElementById("history");
const $clear = document.getElementById("clear-history");

function colorFor(color) {
  if (color === "green") return "#00FF66";
  if (color === "yellow") return "#FFD600";
  return "#FF3333";
}

function shortAddr(a, n = 4, b = 4) {
  if (!a) return "";
  return a.length > n + b + 3 ? `${a.slice(0, n)}…${a.slice(-b)}` : a;
}

function fmtTime(ts) {
  try {
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

function render(data) {
  $error.classList.add("hidden");
  const c = colorFor(data.riskColor);
  const verified = data.isWhitelisted || data.riskLevel === "Verified";
  const reasonsHtml = (data.reasons || [])
    .slice(0, 5)
    .map((r) => {
      const pts = r.points ? `${r.points > 0 ? "+" : ""}${r.points}` : "±0";
      const color =
        r.type === "deduction" && r.points !== 0
          ? "#FF3333"
          : r.type === "addition" && r.points > 0
          ? "#00FF66"
          : "rgba(255,255,255,0.5)";
      return `<div class="reason"><span class="pts" style="color:${color}">${pts}</span><span>${r.label}</span></div>`;
    })
    .join("");
  $result.innerHTML = `
    <div class="score-row">
      <div class="score" style="color:${c}">${data.score}</div>
      <div class="level" style="color:${c}">${verified ? "VERIFIED" : data.riskLevel}</div>
    </div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.15em">
      ${data.type} · ${(data.reasons || []).length} signals · ${(data.flags || []).length} flags
    </div>
    ${verified ? '<div class="verified-badge">✓ Solified Verified</div>' : ""}
    <div class="reasons">${reasonsHtml || '<div class="reason" style="color:rgba(255,255,255,0.4)">No flagged signals</div>'}</div>
  `;
  $result.classList.remove("hidden");
  $open.href = `${WEB_APP}/scan/${encodeURIComponent(data.address)}`;
  $open.style.display = "block";
}

function showError(msg) {
  $error.textContent = msg;
  $error.classList.remove("hidden");
  $result.classList.add("hidden");
  $open.style.display = "none";
}

async function scan() {
  const v = ($addr.value || "").trim();
  if (!v) return showError("Enter a Solana address");
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)) return showError("Invalid Solana address format");
  $btn.disabled = true;
  $btnLabel.textContent = "SOLIFYING";
  $btnArrow.textContent = "…";
  $error.classList.add("hidden");
  try {
    const resp = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: v }),
    });
    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}));
      throw new Error(e.detail || `Error ${resp.status}`);
    }
    const data = await resp.json();
    render(data);
    // Persist to history
    await chrome.runtime.sendMessage({ type: "ANALYZE", address: v });
    renderHistory();
  } catch (e) {
    showError(e.message || "Solify failed");
  } finally {
    $btn.disabled = false;
    $btnLabel.textContent = "SOLIFY NOW";
    $btnArrow.textContent = "→";
  }
}

async function renderHistory() {
  const list = await new Promise((resolve) =>
    chrome.runtime.sendMessage({ type: "GET_HISTORY" }, (r) => resolve(r || []))
  );
  if (!list.length) {
    $history.innerHTML = '<div class="history-empty">No recent solifies yet</div>';
    return;
  }
  $history.innerHTML = list
    .slice(0, 8)
    .map((h) => {
      const c = colorFor(h.riskColor);
      return `
        <div class="history-row" data-addr="${h.address}">
          <span class="history-addr">${shortAddr(h.address, 6, 6)}</span>
          <span class="history-score" style="color:${c}">${h.score}</span>
          <span class="history-time">${fmtTime(h.analyzedAt)}</span>
        </div>
      `;
    })
    .join("");
  $history.querySelectorAll(".history-row").forEach((row) => {
    row.addEventListener("click", () => {
      const addr = row.dataset.addr;
      $addr.value = addr;
      scan();
    });
  });
}

async function clearHistory() {
  await new Promise((resolve) =>
    chrome.runtime.sendMessage({ type: "CLEAR_HISTORY" }, resolve)
  );
  renderHistory();
}

$btn.addEventListener("click", scan);
$addr.addEventListener("keydown", (e) => {
  if (e.key === "Enter") scan();
});
$clear.addEventListener("click", clearHistory);

// Pre-fill from clipboard if it looks like a Solana address
(async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text.trim())) {
      $addr.value = text.trim();
    }
  } catch {}
  $addr.focus();
  renderHistory();
})();
