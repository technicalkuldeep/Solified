# 🛡️ Solified — Pre-Signing Firewall for Solana

**Know before you sign.**

Solified is a security layer for Solana that analyzes transactions *before* they are signed. It decodes instructions, simulates outcomes, and detects hidden risks—helping users, bots, and developers avoid costly mistakes.

---

## 🚨 The Problem

On Solana, transactions are fast and irreversible.

Users often think they are:

* swapping a token
* minting an NFT
* interacting with a trusted app

But in reality, transactions can include:

* unlimited token approvals
* hidden SOL transfers
* interactions with unknown programs

Once signed, there is no undo.

---

## 💡 The Solution

Solified acts as a **pre-signing firewall**.

Before a transaction is executed, Solified:

* decodes what the transaction actually does
* simulates the outcome
* compares intent vs reality
* returns a clear verdict

👉 **ALLOW · WARN · BLOCK**

---

## ⚙️ Core Features

### 🔥 Transaction Firewall (Primary)

* Pre-signing transaction analysis
* Instruction decoding & simulation
* Intent vs Reality detection
* Hidden approval & transfer detection
* Real-time verdict system (Allow / Warn / Block)

---

### 🧠 Supporting Intelligence

* Wallet risk scoring with detailed insights
* Token risk analysis (liquidity, holder patterns, suspicious signals)
* Graph-based scam detection (multi-hop wallet analysis)
* Network risk insights (counterparties, scam proximity, clusters)
* Wallet behavior timeline (risk evolution over time)

---

### 🛡️ Scam Protection Layer

* Clipboard attack detection (prevents address replacement)
* Lookalike address detection (phishing protection)
* Fake dApp detection (malicious site warnings)

---

### 🌐 Chrome Extension

* Real-time protection across websites
* Detects wallet addresses on any page
* Injects risk indicators inline
* One-click deep analysis

---

## 🧱 Tech Stack

**Frontend**

* Next.js (React)
* Tailwind CSS
* Framer Motion (animations)

**Backend**

* FastAPI (Python)

**Blockchain & Data**

* Solana RPC (via Alchemy)
* DexScreener API

**Database**

* MongoDB

**Infrastructure**

* Vercel (frontend)
* Render (backend)

---

## 🧠 How It Works

### 🔐 Mode 1 — Transaction Protection

1. User initiates a transaction
2. Solified intercepts before signing
3. Decodes + simulates instructions
4. Compares intent vs actual behavior
5. Returns verdict → **Allow / Warn / Block**

---

### 🔍 Mode 2 — Wallet & Token Analysis

1. User inputs wallet or token
2. Solified analyzes risk signals
3. Displays insights, score, and network data

---

## 🎯 Who It’s For

* Solana users
* Traders & degens
* Bot & agent builders
* Developers & dApps
* Anyone interacting with on-chain transactions

---

## 🚀 Vision

Solified is not just a scanner.

It’s a **decision engine before execution**—
a security layer for the future of autonomous, high-speed on-chain interactions.

---

## 🧪 Status

* ✅ Core features built
* ✅ Extension working
* 🚧 Continuous improvements & iterations

---

## 📢 Tagline

> **Verify before you trust.**
> **Know before you sign.**

---

## 🔗 Coming Soon

A safer way to interact with Solana—without guessing what you’re signing.

---
