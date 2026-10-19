# Meridex — Binary Options & Prediction Terminal

High-performance, dark-themed decentralized binary options app for **Robinhood Chain**.
Predict **UP / DOWN** on fixed **1m / 5m** rounds, settle against a parimutuel pool, and track
the **$OPTION** Pons bonding curve — all from one cinematic neo-terminal.

![palette](https://img.shields.io/badge/theme-raycast%20dark-040506) ![MRDX](https://img.shields.io/badge/token-%24MRDX-e6e6e6)

---

## Quick start

```bash
npm install
npm run dev      # → http://localhost:5173
```

The app ships with **mock data providers out of the box** — live price feed, round engine,
bot participants, Pons curve, and a demo bankroll all animate immediately with no wallet
and no environment variables.

```bash
npm run build    # typecheck + production bundle
npm run preview
```

## Pages & routing

The landing and the terminal are **separate pages** (hash routing, no extra deps):

| Route                | Page                                                   |
| -------------------- | ------------------------------------------------------ |
| `#/`                 | Landing — fullscreen video hero                        |
| `#/terminal`         | Terminal (default tab: Live Rounds)                    |
| `#/terminal/live`    | Terminal, Live Rounds deep link                        |
| `#/terminal/pons`    | Terminal, $OPTION Pons Curve deep link                   |
| `#/terminal/history` | Terminal, History & PnL deep link                      |
| `#/dex`              | DEX — ETH ⇄ $OPTION swap on the live Pons curve          |

## DEX

`#/dex` is a swap terminal wired straight into the same Pons bonding curve the widget shows:

- **ETH ⇄ $OPTION** both directions — quotes, price impact, and the 0.2% pool fee come from the live curve state (buys walk the price up, sells walk it back down)
- Market panel: $OPTION/ETH sparkline that keeps appending live points, market cap / curve % / remaining stats
- **LIVE SWAPS** feed — ambient swaps every ~2–3s, your own swaps land as a highlighted **YOU** row
- Demo balances, no wallet needed: every swap mutates the shared curve, so the Pons widget on the terminal moves too

## Terminal layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ HEADER   Meridex logo · Robinhood Chain status · $OPTION ticker · WALLET│
├──────────────────────────────────────────────────────────────────────┤
│ CHART CARD (rounded-28px, cinematic)                                 │
│  pair pills ETH · BTC · SOL · XRP · DOGE   timeframe 1M · 5M         │
│  ● phase pill · oversized price with dimmed decimals · delta pill    │
│  strike line · Lightweight Charts canvas · big round timer           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ FLOATING BETTING BAND:  UP 2.13x │ stake · chips · pool bar │ DOWN│ │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│ TABS   ① Live Rounds   ② $OPTION Pons Curve   ③ History & PnL          │
└──────────────────────────────────────────────────────────────────────┘
```

- **All markets**: ETH / BTC / SOL / XRP / DOGE tick in parallel — switching pairs never
  loses chart history; rounds carry their own pair and settle against its price
- Keyboard: **U** / **D** fire UP / DOWN (Russian layout **г** / **в** also work)

## Round state machine

```
ACCEPTING_BETS ──(lock time)──▶ LOCKED ──(round end)──▶ CALCULATING ──▶ SETTLED ──▶ next
                                 │                          │
                          strike frozen               outcome = settle vs strike
```

- **1m rounds**: 60s window, lock at T-10s · **5m rounds**: 300s window, lock at T-30s
- Settlement: 5s calculating + 4s settled, then auto-rolls into the next round
- **Parimutuel payouts**: winners split the combined pool after a **2% protocol fee**
  `payout = stake × ((poolUP + poolDOWN) × 0.98) / winningPool`
- Ties (settle === strike) refund both sides
- Simulated rival traders continuously feed the pools so ROI floats live

## Folder structure

```
src/
├── pages/               # LandingPage (video hero), TerminalPage (chart + band + tabs),
│                        #   DexPage (ETH ⇄ $OPTION swap on the Pons curve)
├── components/          # Header, ChartPanel, PriceChart, BettingBand, Footer,
│   └── tabs/            #   BottomSection, PonsWidget, Toaster + the 3 tabs
├── hooks/               # useMarketFeed, useRoundEngine, usePonsCurve,
│                        #   useMeridexContract, useToasts
├── contracts/           # ABIs + addresses (env-driven)
├── lib/                 # Robinhood Chain config, wagmi setup, pairs, formatters
├── types/               # Shared domain types
├── App.tsx              # Hash router + shared state hub
└── main.tsx             # Wagmi / React-Query / ConnectKit providers
```

## Web3 integration

Configured for **Robinhood Chain** via `src/lib/chains.ts` (all params env-overridable).
Copy `.env.example` → `.env` and set your RPC + deployed addresses:

```bash
VITE_RH_CHAIN_ID=...
VITE_RH_RPC_URL=https://...
VITE_MERIDEX_ADDRESS=0x...
VITE_MRDX_TOKEN_ADDRESS=0x...
VITE_PONS_CURVE_ADDRESS=0x...
VITE_PONS_SWAP_URL=https://pons.fun/...
```

Contract hooks (`src/hooks/useMeridexContract.ts`) are integration-ready:

```ts
enterPosition(uint256 roundId, bool isUp) payable   // engine.placeBet + wallet → relayed on-chain
claimReward(uint256 roundId)                        // History tab → CLAIM button
```

When no wallet is connected (or addresses are unset), every bet runs purely in the local
round engine — the terminal never breaks, it just stays in demo mode.

### Pons $OPTION widget

- Contract address with one-click copy
- Live bonding-curve progress bar, market cap, price, raised ETH
- Direct **BUY ON PONS** swap link
- Demo fill buttons to watch the curve move

## Tech stack

| Layer    | Choice |
| -------- | ------ |
| Framework| Vite + React 18 + TypeScript (strict) |
| Styling  | Tailwind CSS + Lucide icons + Framer Motion |
| Web3     | Wagmi v2 · Viem v2 · ConnectKit (Robinhood Chain EVM) |
| Charts   | TradingView Lightweight Charts |

## Theme tokens

| Token | Hex |
| ----- | --- |
| Canvas | `#040506` |
| Card | `#07080a` |
| Hairline | `#363739` |
| Text (Mist) | `#e6e6e6` |
| UP / Call | `#59d499` |
| DOWN / Put | `#ff6363` |
| Muted / Dim | `#9c9c9d` / `#6a6b6c` |

> Demo feeds & simulated settlements — not financial advice.

`meridex-terminal.html` in the repo root is a standalone design-reference build (not part of
the app bundle).
