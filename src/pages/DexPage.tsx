import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpDown, ArrowUpRight, ChevronDown, Fuel, SlidersHorizontal, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { usePonsCurve } from '../hooks/usePonsCurve';

interface DexPageProps {
  pons: ReturnType<typeof usePonsCurve>;
  mrdexPrice: number;
  mrdexChange: number;
  demoBalance: number;
  onEvent: (msg: string, kind?: 'up' | 'down' | 'accent') => void;
}

type SwapSide = 'buy' | 'sell';

interface FeedRow {
  id: number;
  side: 'BUY' | 'SELL';
  user: string;
  eth: number;
  tokens: number;
  t: number;
}

const FEE_PCT = 0.2;

const fmtNum = (n: number, d = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const randomAddr = () =>
  `0x${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')}…${Math.floor(
    Math.random() * 0xffff,
  )
    .toString(16)
    .padStart(4, '0')}`;

function TokenIcon({ kind }: { kind: 'ETH' | 'MRDX' }) {
  return kind === 'ETH' ? (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e6e6e6] font-display text-sm font-semibold text-[#454647]">
      Ξ
    </span>
  ) : (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent2/15 font-display text-sm font-semibold text-accent2 ring-1 ring-accent2/25">
      M
    </span>
  );
}

/**
 * `#/dex` — swap terminal on the live Pons bonding curve:
 * glass swap card (ETH ⇄ $OPTION, price impact straight from the curve),
 * market sparkline, and a live swaps feed.
 */
export default function DexPage({ pons, mrdexPrice, mrdexChange, demoBalance, onEvent }: DexPageProps) {
  const [side, setSide] = useState<SwapSide>('buy');
  const [amount, setAmount] = useState('0.1');
  const [tokenOpen, setTokenOpen] = useState(false);
  const [ethBal, setEthBal] = useState(demoBalance);
  const [mrdxBal, setMrdxBal] = useState(2_500_000);
  const [feed, setFeed] = useState<FeedRow[]>(() => {
    const now = Date.now();
    return Array.from({ length: 6 }, (_, i) => {
      const eth = 0.01 * Math.pow(120, Math.random());
      return {
        id: now - i,
        side: (Math.random() > 0.45 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
        user: randomAddr(),
        eth,
        tokens: (eth * 2412.5) / 0.0007,
        t: now - i * 4200,
      };
    });
  });
  const [lastSwapAt, setLastSwapAt] = useState(0);

  const priceUsd = pons.priceUsd;
  const soldOut = pons.progress >= 1;

  const num = Math.max(0, Number(amount) || 0);
  const fromIsEth = side === 'buy';
  const fromBal = fromIsEth ? ethBal : mrdxBal;

  const quote = useMemo(() => {
    if (num <= 0) return null;
    if (side === 'buy') {
      if (soldOut) return null;
      const { tokens } = pons.quoteBuy(num);
      if (tokens <= 0) return null;
      const eff = (num * pons.ethUsd) / tokens;
      return {
        out: tokens,
        outD: 0,
        impact: Math.max(0, (eff / priceUsd - 1) * 100),
        rate: `1 ETH = ${fmtNum(tokens / num, 0)} $OPTION`,
        outUsd: tokens * priceUsd,
      };
    }
    const { eth } = pons.quoteSell(num);
    if (eth <= 0) return null;
    const eff = (eth * pons.ethUsd) / num;
    return {
      out: eth,
      outD: 4,
      impact: Math.max(0, (priceUsd / eff - 1) * 100),
      rate: `1 $OPTION = ${fmtNum(eth / num, 8)} ETH`,
      outUsd: eth * pons.ethUsd,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [num, side, priceUsd, pons.progress]);

  const valid = num > 0 && num <= fromBal && quote !== null && !(side === 'buy' && soldOut);
  const insufficient = num > fromBal;

  const pushFeed = (rowSide: 'BUY' | 'SELL', eth: number, tokens: number, user = 'YOU') =>
    setFeed((f) =>
      [{ id: Date.now() + Math.random(), side: rowSide, user, eth, tokens, t: Date.now() }, ...f].slice(0, 12),
    );

  const exec = () => {
    if (!valid || !quote) return;
    if (side === 'buy') {
      const { tokens } = pons.buy(num);
      setEthBal((b) => b - num);
      setMrdxBal((b) => b + tokens);
      pushFeed('BUY', num, tokens);
      onEvent(`Swapped ${fmtNum(num, 4)} ETH → ${fmtNum(tokens, 0)} $OPTION`, 'up');
    } else {
      const { eth } = pons.sell(num);
      setMrdxBal((b) => b - num);
      setEthBal((b) => b + eth);
      pushFeed('SELL', eth, num);
      onEvent(`Sold ${fmtNum(num, 0)} $OPTION → ${fmtNum(eth, 4)} ETH`, 'down');
    }
    setLastSwapAt(Date.now());
  };

  const flip = () => {
    setSide((s) => (s === 'buy' ? 'sell' : 'buy'));
    setAmount('');
  };

  /* Ambient market noise — random swaps keep the feed alive. */
  useEffect(() => {
    const id = window.setInterval(() => {
      const eth = 0.01 * Math.pow(120, Math.random());
      const tokens = (eth * pons.ethUsd) / pons.priceUsd;
      pushFeed(Math.random() > 0.45 ? 'BUY' : 'SELL', eth, tokens, randomAddr());
    }, 2600);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceUsd]);

  /* Price sparkline — seeded walk that keeps appending live points. */
  const seed = useMemo(() => {
    const pts: number[] = [];
    let p = priceUsd;
    for (let i = 0; i < 56; i++) {
      pts.unshift(p);
      p = p * (1 - (Math.random() - 0.46) * 0.007);
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [live, setLive] = useState<number[]>([priceUsd]);
  useEffect(() => {
    setLive((l) => [...l.slice(-63), priceUsd]);
  }, [priceUsd]);
  const pts = [...seed, ...live].slice(-72);
  const pMin = Math.min(...pts);
  const pMax = Math.max(...pts);
  const pSpan = pMax - pMin || 1;
  const sparkLine = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${100 - ((v - pMin) / pSpan) * 94 - 3}`).join(' ');
  const sparkArea = `0,100 ${sparkLine} 100,100`;
  const sparkChange = (pts[pts.length - 1] / pts[0] - 1) * 100;

  const fromTokenLabel = fromIsEth ? 'ETH' : '$OPTION';

  return (
    <div className="min-h-screen">
      <Header
        mrdexPrice={mrdexPrice}
        mrdexChange={mrdexChange}
        demoBalance={ethBal}
        isConnected={false}
      />

      <main className="mx-auto max-w-[1120px] px-3 py-6 sm:px-4 lg:px-6">
        <div className="mb-5 flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">SWAP</h1>
          <span className="font-mono text-[10px] tracking-[0.18em] text-dim">
            $OPTION BONDING-CURVE DEX · LIVE ON ROBINHOOD CHAIN
          </span>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          {/* ── Swap card ─────────────────────────────────────────── */}
          <div className="relative rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-4 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-semibold tracking-tight text-white">SWAP</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full border border-ink-600 px-2 py-1 font-mono text-[9px] tracking-wide text-muted">
                  <SlidersHorizontal size={10} /> 0.5%
                </span>
                <span className="flex items-center gap-1 rounded-full border border-ink-600 px-2 py-1 font-mono text-[9px] tracking-wide text-muted">
                  <Fuel size={10} /> {FEE_PCT}%
                </span>
              </div>
            </div>

            {/* FROM */}
            <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/[0.06] transition focus-within:ring-white/25 hover:ring-white/15">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-wide">
                <span className="text-dim">FROM</span>
                <span className="text-muted">
                  balance {fmtNum(fromBal, fromIsEth ? 4 : 0)} {fromTokenLabel}
                  <button
                    onClick={() => setAmount(String(fromBal))}
                    className="ml-2 font-semibold text-white transition-colors hover:text-accent2"
                  >
                    MAX
                  </button>
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-w-0 bg-transparent font-mono text-3xl font-semibold tabular-nums text-white outline-none placeholder:text-dim [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="relative shrink-0">
                  <button
                    onClick={() => setTokenOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-3 transition hover:border-white/30"
                  >
                    <TokenIcon kind={fromIsEth ? 'ETH' : 'MRDX'} />
                    <span className="font-display text-sm font-semibold text-white">{fromTokenLabel}</span>
                    <ChevronDown size={14} className="text-muted" />
                  </button>
                  <AnimatePresence>
                    {tokenOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-30 mt-2 w-60 rounded-2xl border border-white/10 bg-ink-800 p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)]"
                      >
                        {(['ETH', 'MRDX'] as const).map((tk) => {
                          const active = (tk === 'ETH') === fromIsEth;
                          return (
                            <button
                              key={tk}
                              onClick={() => {
                                if (!active) flip();
                                setTokenOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.05]"
                            >
                              <span className="flex items-center gap-2.5">
                                <TokenIcon kind={tk} />
                                <span className="font-display text-sm font-semibold text-white">
                                  {tk === 'ETH' ? 'ETH' : '$OPTION'}
                                </span>
                              </span>
                              <span className="font-mono text-[11px] text-muted">
                                {fmtNum(tk === 'ETH' ? ethBal : mrdxBal, tk === 'ETH' ? 4 : 0)}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="mt-1.5 font-mono text-[11px] text-dim">
                ≈ ${fmtNum(num * (fromIsEth ? pons.ethUsd : priceUsd), 2)}
              </div>
            </div>

            {/* Flip */}
            <div className="relative z-20 -my-3 flex justify-center">
              <button
                onClick={flip}
                aria-label="Flip direction"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-ink-800 text-muted transition-all duration-300 hover:rotate-180 hover:border-white/30 hover:text-white"
              >
                <ArrowUpDown size={16} />
              </button>
            </div>

            {/* TO */}
            <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/[0.06]">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-wide">
                <span className="text-dim">TO</span>
                <span className="text-muted">
                  balance {fmtNum(fromIsEth ? mrdxBal : ethBal, fromIsEth ? 0 : 4)}{' '}
                  {fromIsEth ? '$OPTION' : 'ETH'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="w-full min-w-0 truncate font-mono text-3xl font-semibold tabular-nums text-white">
                  {quote ? fmtNum(quote.out, quote.outD) : <span className="text-dim">0.00</span>}
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-3">
                  <TokenIcon kind={fromIsEth ? 'MRDX' : 'ETH'} />
                  <span className="font-display text-sm font-semibold text-white">
                    {fromIsEth ? '$OPTION' : 'ETH'}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 font-mono text-[11px] text-dim">
                ≈ ${fmtNum(quote?.outUsd ?? 0, 2)}
              </div>
            </div>

            {/* Quote lines */}
            <div className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-dim">RATE</span>
                <span className="text-muted">{quote ? quote.rate : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">PRICE IMPACT</span>
                <span
                  className={
                    quote && quote.impact > 2 ? 'font-semibold text-down' : 'font-semibold text-up'
                  }
                >
                  {quote ? `${quote.impact.toFixed(2)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">POOL FEE</span>
                <span className="text-muted">{FEE_PCT}%</span>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={exec}
              disabled={!valid}
              className={`mt-4 w-full rounded-2xl py-3.5 font-display text-[15px] font-semibold transition-all duration-200 ${
                valid
                  ? 'bg-[#e6e6e6] text-[#0b0c0d] shadow-[0_12px_44px_-12px_rgba(230,230,230,0.4)] hover:bg-white'
                  : 'cursor-not-allowed bg-white/[0.04] text-dim'
              }`}
            >
              {insufficient
                ? `INSUFFICIENT ${fromTokenLabel.replace('$', '')}`
                : side === 'buy' && soldOut
                  ? 'CURVE SOLD OUT'
                  : num <= 0
                    ? 'ENTER AN AMOUNT'
                    : 'SWAP'}
            </button>

            <p className="mt-3 text-center font-mono text-[9px] tracking-wide text-dim">
              {lastSwapAt > 0 ? 'SWAP CONFIRMED · DEMO' : 'DEMO SWAPS MOVE THE LIVE BONDING CURVE'}
              {' · '}NO WALLET NEEDED
            </p>
          </div>

          {/* ── Market column ─────────────────────────────────────── */}
          <div className="flex flex-col gap-5">
            {/* Sparkline */}
            <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="flex items-center gap-3">
                  <TokenIcon kind="MRDX" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-semibold text-white">$OPTION / ETH</span>
                      <span className="flex items-center gap-1 font-mono text-[9px] tracking-[0.18em] text-dim">
                        <Sparkles size={10} className="text-accent2" /> PONS CURVE
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-3xl font-semibold tabular-nums text-white">
                      {fmtUsdLike(priceUsd)}
                    </div>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 font-mono text-sm font-semibold ${
                    sparkChange >= 0 ? 'text-up' : 'text-down'
                  }`}
                >
                  {sparkChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {sparkChange >= 0 ? '+' : ''}
                  {sparkChange.toFixed(2)}%
                </div>
              </div>

              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 h-32 w-full">
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(230,230,230,0.16)" />
                    <stop offset="100%" stopColor="rgba(230,230,230,0)" />
                  </linearGradient>
                </defs>
                <polygon points={sparkArea} fill="url(#sparkFill)" />
                <polyline
                  points={sparkLine}
                  fill="none"
                  stroke="#e6e6e6"
                  strokeWidth="1.2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="mt-3 grid grid-cols-3 border-t border-white/[0.06] pt-3">
                {[
                  { label: 'MARKET CAP', value: `$${(pons.marketCapUsd / 1e6).toFixed(1)}M` },
                  { label: 'CURVE', value: `${(pons.progress * 100).toFixed(1)}%` },
                  { label: 'REMAINING', value: `${(pons.hardCapEth - pons.raisedEth).toFixed(1)} ETH` },
                ].map((s, i) => (
                  <div key={s.label} className={i > 0 ? 'border-l border-white/[0.06] pl-4' : ''}>
                    <div className="font-mono text-[9px] tracking-[0.18em] text-dim">{s.label}</div>
                    <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-white">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live swaps feed */}
            <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
                  </span>
                  LIVE SWAPS
                </h3>
                <span className="font-mono text-[9px] tracking-[0.18em] text-dim">PONS CURVE · 0.2%</span>
              </div>
              <div>
                <AnimatePresence initial={false}>
                  {feed.map((row) => (
                    <motion.div
                      key={row.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="-mx-2 flex items-center justify-between gap-2 rounded-lg border-b border-white/[0.05] px-2 py-2.5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`grid h-6 w-6 place-items-center rounded-full ring-1 ${
                            row.side === 'BUY'
                              ? 'bg-up/10 text-up ring-up/25'
                              : 'bg-down/10 text-down ring-down/25'
                          }`}
                        >
                          {row.side === 'BUY' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        </span>
                        <span>
                          <span
                            className={`block font-mono text-xs font-semibold ${
                              row.user === 'YOU' ? 'text-accent2' : 'text-white'
                            }`}
                          >
                            {row.user}
                          </span>
                          <span className="block font-mono text-[10px] text-dim">
                            {new Date(row.t).toLocaleTimeString('en-US', { hour12: false })}
                          </span>
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-mono text-xs font-semibold tabular-nums text-white">
                          {fmtNum(row.eth, 4)} ETH
                        </span>
                        <span className="block font-mono text-[10px] text-dim">
                          {row.side === 'BUY' ? '+' : '−'}
                          {fmtNum(row.tokens, 0)} OPTION
                        </span>
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {feed.length === 0 && (
                  <div className="py-8 text-center font-mono text-[11px] text-dim">
                    waiting for flow…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

function fmtUsdLike(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`;
}
