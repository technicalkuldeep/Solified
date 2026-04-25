# 🛡️ Solified — Verify Before You Trust

Solified is a real-time security and verification layer for Solana that helps users detect risky wallets and tokens before interacting. It combines a powerful web app with a Chrome extension to actively protect users from scams, phishing attacks, and irreversible mistakes.

---

## 🚨 Problem 

On Solana, transactions are irreversible .  
Users often interact with wallets and tokens blindly, leading to:

- Clipboard attacks (address replacement)
- Fake or lookalike wallet addresses
- Malicious wallets linked to scams
- Fake or low-liquidity tokens (rug pulls)
- Human errors during fast transactions

There is no real-time safety layer that warns users before they make a mistake.

---

## 💡 Solution

Solified introduces a two-layer security system:

### 🧠 1. Intelligence Layer
- Analyzes wallets and tokens using on-chain data  
- Generates a Solified Score (0–100)  
- Provides risk insights and explanations  

### ⚡ 2. Protection Layer (Chrome Extension)
- Detects wallet addresses on any webpage  
- Shows real-time risk badges  
- Prevents clipboard attacks  
- Warns users before risky transactions  
- Flags suspicious or similar-looking addresses  

---

## ✨ Features

### 🔍 Wallet & Token Analysis
- Risk scoring engine (0–100)  
- Risk classification:
  - 🟢 Verified  
  - 🟡 Suspicious  
  - 🔴 High Risk  
- Transaction history insights  
- Token liquidity and volume analysis  

---

### 🧨 Chrome Extension (Core Feature)
- Real-time wallet detection on webpages  
- Clipboard attack detection (copy–paste mismatch)  
- Address similarity warnings (phishing prevention)  
- Pre-transaction risk alerts  
- Floating warning banners  
- Recent scan history  

---

### 🧠 Smart Detection
- Interaction with flagged wallets  
- Suspicious transaction patterns  
- Low liquidity tokens  
- Known trusted addresses (whitelisting)  

---

### 🟢 Whitelisting System

Recognizes trusted entities like:
- USDC  
- Major protocols (Jupiter, Raydium, etc.)  

Automatically marks them as **Verified**.

---

## 🏗️ Architecture

User Browser
↓
Solified Chrome Extension
↓
Backend API (FastAPI)
↓
Risk Engine (Scoring Logic)
↓
Data Sources:

Solana RPC (Alchemy)
DexScreener API
↓
Database (Scan History)

---

## ⚙️ How It Works

1. User pastes or encounters a wallet/token  
2. Extension detects address in real-time  
3. Backend fetches on-chain + market data  
4. Risk engine calculates score using heuristics  
5. Results returned instantly  
6. Extension displays warnings or badges  

---

## 🧮 Risk Scoring Logic

- Interacts with scam wallets → −40  
- Rug-pull pattern → −50  
- New wallet (<7 days) → −20  
- Suspicious transaction patterns → −15  
- Low liquidity token → −10  
- Trusted protocol interaction → +10  

Final score is normalized between **0–100**.

---

## 🛠 Tech Stack

### Frontend
- React (Next.js)  
- Tailwind CSS  
- Framer Motion  
- Recharts  

### Backend
- FastAPI (Python)  
- MongoDB  

### Blockchain & Data
- Solana RPC (Alchemy)  
- DexScreener API  

### Extension
- Chrome Extension (Manifest v3)  
- Content Scripts + Background Scripts  

## 4. Load Chrome Extension
- Open chrome://extensions
- Enable Developer Mode
- Click Load unpacked
- Select /extension folder

