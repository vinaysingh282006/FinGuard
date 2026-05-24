# AI Developer Handover Document: FinGuard AI

**To the Next AI Assistant:**
The user is providing this document to give you full context on the current state of the "FinGuard AI" project. Please read this entirely before making modifications or continuing development.

## 1. Project Overview
**FinGuard AI** is an enterprise-grade, real-time blockchain fraud detection and AML (Anti-Money Laundering) monitoring dashboard. It visualizes live transaction data, scores it for fraud using a rule-based engine, and provides AI-driven analysis via Gemini 1.5 Flash.

The app is **frontend-only** (client-side), relying on Vite to proxy external APIs (to avoid CORS) and leveraging `Zustand` for complex global state management.

## 2. Tech Stack
*   **Framework:** React 19 + Vite
*   **Styling:** Tailwind CSS v4 (using `@tailwindcss/postcss` and `@import "tailwindcss";` in `src/index.css`) + custom CSS variables for glassmorphism.
*   **State Management:** Zustand (`zustand` package)
*   **Data Visualization:** Recharts (charts), `react-force-graph-2d` + `d3` (network graphs)
*   **AI Integration:** `@google/generative-ai` (Gemini 1.5 Flash)
*   **Icons:** `lucide-react`
*   **Routing:** `react-router-dom`
*   **CSV Parsing:** `papaparse`
*   **Notifications:** `sonner`

## 3. Project Structure
```text
finguard-ai/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   │   ├── dashboard/      # Dashboard-specific widgets (KPICards, LiveFeedTable, etc.)
│   │   ├── layout/         # Application shell (Sidebar, Header, AlertBanner, TickerBar)
│   │   ├── shared/         # Reusable atoms (RiskBadge, AddressChip, CountUp, FraudScoreGauge)
│   │   └── transaction/    # TransactionDetailPanel (3-tab drawer with Gemini AI integration)
│   ├── constants/          # Static configs (fraudRules.js - thresholds, risk levels, chain metadata)
│   ├── pages/              # Main route components (Dashboard, LiveFeed, NetworkGraph, WhaleTracker, Alerts, AddressLookup, Upload, AIAnalyst, Analytics, Reports)
│   ├── services/           # External API integrations
│   │   ├── addressService.js   # OpenSanctions, Etherscan, Mempool address lookups
│   │   ├── coingeckoService.js # Live price polling
│   │   ├── mempoolService.js   # WebSocket for live BTC txs + synthetic data fallback
│   │   └── whaleAlertService.js# Polling for massive movements
│   ├── store/              # Zustand global state
│   │   └── useStore.js     # Manages transactions, alerts, graph nodes/edges, prices, UI state
│   ├── utils/              # Helper functions
│   │   ├── demoMode.js     # Scripted fraud sequence generator
│   │   ├── formatters.js   # Numbers, dates, strings, CSV export helpers
│   │   └── fraudScoring.js # Core logic: processes a tx and returns a risk score (0-100)
│   ├── App.jsx             # Main routing, layout grid, and service initializers (WS, Polling)
│   ├── index.css           # Global styles, Tailwind import, keyframes, glass classes
│   └── main.jsx            # React root
├── .env.example            # Environment variable template
├── index.html              # HTML entrypoint
├── package.json            # Dependencies
├── postcss.config.js       # Tailwind v4 PostCSS config
├── tailwind.config.js      # Legacy v3 config (kept for reference, v4 uses index.css)
└── vite.config.js          # Vite config with extensive API proxying to bypass CORS
```

## 4. Key Systems & Data Flow

### A. Global State (Zustand)
Located in `src/store/useStore.js`. The single source of truth for the app.
*   **Transactions Array:** Capped at 1000 items. Holds scored transactions.
*   **Alerts Array:** Generated when high-risk transactions or whales are detected.
*   **Graph Nodes/Edges:** Tracks relationships for `react-force-graph-2d`.
*   **Prices:** Live BTC/ETH/USDT prices.
*   **Stats:** Running KPIs (total txs, fraud alerts, whale movements).

### B. Live Data Pipeline
1.  `App.jsx` mounts and connects to the Mempool.space WebSocket (`mempoolService.js`).
2.  If WebSocket connects, real BTC transactions flow in. If it fails, a synthetic fallback interval generates realistic mock data.
3.  Each transaction is intercepted and passed to `scoreFraud()` in `fraudScoring.js`.
4.  `scoreFraud()` checks the transaction against predefined rules (Large amount, velocity, multi-hop, night-time, sanctions). It assigns a score out of 100 and a risk level (LOW, MEDIUM, HIGH, CRITICAL).
5.  The scored transaction is dispatched to `useStore.addTransaction()`.
6.  If the score is >= 61, `App.jsx` automatically creates an alert via `useStore.addAlert()`.
7.  The UI reacts instantly to changes in the Zustand store.

### C. Gemini AI Integration
*   Used primarily in `TransactionDetailPanel.jsx` and `AIAnalyst.jsx`.
*   Requires `VITE_GEMINI_API_KEY` in `.env`.
*   Uses `@google/generative-ai`.
*   Contextual data (the selected transaction or recent session stats) is stringified and injected into the system prompt to ground the model.

### D. Demo Mode
*   Triggered from the `Header.jsx`.
*   Located in `utils/demoMode.js`.
*   Injects a series of hardcoded, highly suspicious transactions over a 45-second period to demonstrate the app's detection capabilities (Smurfing, Circular Laundering, Mega Whales, Sanction Hits).

## 5. Work Completed to Date
1.  **Project Scaffolding:** React, Vite, Tailwind setup. Fixed Tailwind v4 PostCSS compatibility.
2.  **Design System:** Full implementation of "Apple-grade glass aesthetic" with CSS variables, glowing shadows, animated widgets, and custom scrollbars.
3.  **Fraud Engine:** Fully written rule engine supporting 7 unique heuristic triggers and an in-memory graph for circular routing detection.
4.  **Pages:** Built 10 complete pages: Dashboard, Live Feed, Network Graph, Whale Tracker, Alerts, Address Intel, Upload & Scan, AI Analyst, Analytics, and Reports.
5.  **Data Connections:** Implemented all proxy configs and data pollers/websockets to bypass CORS and stream data directly into the browser.
6.  **AI Connections:** Gemini 1.5 Flash streaming implemented for narrative threat reporting.

## 6. How to Continue
If the human user asks you to implement a new feature, fix a bug, or change the UI:
1.  **Check `useStore.js`:** Determine if the state needed already exists. If not, add a new slice/action.
2.  **Check `index.css`:** Use existing CSS variables (e.g., `var(--glass-2)`, `var(--accent-primary)`) rather than hardcoding hex colors to maintain the aesthetic.
3.  **Check `formatters.js`:** Use existing formatting utilities for currency and dates.
4.  **Restarting Dev Server:** The command to run the app is `npm run dev`. Wait for Vite to build and the app will be available on `http://localhost:3000`.

**Good luck, Assistant!**
