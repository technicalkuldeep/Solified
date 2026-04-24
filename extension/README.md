# Solified Chrome Extension

**Solified — Verify Before You Trust.** A real-time verification layer for every Solana interaction.

## What it does

- **Real-time wallet detection** — Scans every webpage for base58 Solana addresses and injects a colored Solified Badge next to each one.
- **Risk badges** — 🟢 Verified / 🟡 Suspicious / 🔴 High Risk.
- **Pre-transaction warning modal** — Clicking a high-risk address surfaces a blocking warning before you sign anything.
- **Clipboard attack detection** — Watches copy/paste events and alerts you if the pasted address differs from the one you copied (classic clipboard-hijacker attack).
- **Address similarity warnings** — Levenshtein-based detection catches look-alike addresses against your recent & trusted list.
- **Trusted address recognition** — Whitelisted issuers (USDC, USDT, Jupiter, Raydium, etc.) show a green "Solified Verified" badge.
- **Floating banners** — High-risk or suspicious detections trigger a dismissible banner; red banners stay until dismissed, yellow auto-clear after 12s.
- **Popup history** — Your last 25 scans stored locally in `chrome.storage.local`. Click a row to re-solify.

## Install (unpacked)

1. Download the ZIP from the Solified site → unzip.
2. `chrome://extensions` → enable **Developer mode**.
3. Click **Load unpacked** → pick the unzipped folder.
4. Pin the Solified icon.

## Privacy

Only public Solana addresses are sent to the Solified API for scoring. No page content, no keys, no personal data is ever transmitted. Results are cached in the service worker for 5 minutes.
