import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import PriceChart from './PriceChart';
import { PAIRS, getPair, type PairKey } from '../lib/pairs';
import type { Round, RoundPhase, Timeframe } from '../types';
import type { PriceTick } from '../hooks/usePriceFeed';
import { fmtCountdown, fmtPairPrice } from '../lib/format';

interface ChartPanelProps {
  pair: PairKey;
  onPairChange: (pair: PairKey) => void;
  ticks: PriceTick[];
  price: number;
  prevPrice: number;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  round: Round;
  phase: RoundPhase;
  timeLeft: number;
  phaseProgress: number;
  participants: number;
  /** Floating parimutuel betting band (Claude-style overlay). */
  band: ReactNode;
}

const INTERVALS: { key: Timeframe; label: string }[] = [
  { key: '1m', label: '1M' },
  { key: '5m', label: '5M' },
];

const PHASE_STATUS: Record<RoundPhase, { label: string; cls: string }> = {
  ACCEPTING_BETS: { label: 'ACCEPTING BETS', cls: 'border-up/40 bg-up/10 text-up' },
  LOCKED: { label: 'LOCKED', cls: 'border-[#454647] bg-[#1b1c1e] text-[#e6e6e6]' },
  CALCULATING: { label: 'SETTLING', cls: 'border-white/15 bg-white/5 text-muted' },
  SETTLED: { label: 'SETTLED', cls: 'border-up/40 bg-up/10 text-up' },
};

/**
 * Full-width cinematic chart card:
 *  - market switcher pills · timeframe · round status pill (top row)
 *  - oversized live price, delta, strike state + phase progress, big timer
 *  - chart body with the betting band floating over its lower edge (desktop)
 */
export default function ChartPanel(props: ChartPanelProps) {
  const {
    pair,
    onPairChange,
    ticks,
    price,
    prevPrice,
    timeframe,
    onTimeframeChange,
    round,
    phase,
    timeLeft,
    phaseProgress,
    participants,
    band,
  } = props;

  const cfg = getPair(pair);
  const strike = round.strikePrice;
  const settle = round.settlePrice;
  const aboveStrike = strike !== null ? price >= strike : true;
  const delta = price - prevPrice;
  const [intPart, fracPart] = fmtPairPrice(price, cfg.digits).split('.');
  const status = PHASE_STATUS[phase];

  const strikeLine = (() => {
    if (phase === 'ACCEPTING_BETS') return { text: 'STRIKE PENDING', tone: 'text-dim' };
    if (phase === 'LOCKED')
      return {
        text: `STRIKE ${fmtPairPrice(strike ?? price, cfg.digits)} · FROZEN`,
        tone: aboveStrike ? 'text-up' : 'text-down',
      };
    if (phase === 'CALCULATING')
      return { text: `RESOLVING AT ${fmtPairPrice(settle ?? price, cfg.digits)}`, tone: 'text-muted' };
    const outcome = round.outcome === null ? 'TIE' : round.outcome;
    return {
      text: `${outcome} · ${fmtPairPrice(strike ?? price, cfg.digits)} → ${fmtPairPrice(settle ?? price, cfg.digits)}`,
      tone:
        round.outcome === 'UP' ? 'text-up' : round.outcome === 'DOWN' ? 'text-down' : 'text-muted',
    };
  })();

  return (
    <section className="relative flex flex-col overflow-hidden rounded-[28px] border border-ink-600 bg-ink-800 shadow-card lg:h-[760px]">
      {/* Top row — market switcher · timeframe · round status */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-ink-600 bg-ink-900 p-1">
          {PAIRS.map((p) => (
            <button
              key={p.key}
              onClick={() => onPairChange(p.key)}
              title={p.label}
              className={`relative rounded-full px-3 py-1.5 font-display text-[11px] font-medium transition-colors duration-200 ${
                pair === p.key ? 'text-[#454647]' : 'text-[#9c9c9d] hover:text-white'
              }`}
            >
              {pair === p.key && (
                <motion.span
                  layoutId="pairPill"
                  className="absolute inset-0 rounded-full bg-[#e6e6e6]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{p.short}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-ink-600 bg-ink-900 p-1">
            {INTERVALS.map((iv) => (
              <button
                key={iv.key}
                onClick={() => onTimeframeChange(iv.key)}
                className={`relative rounded-full px-3.5 py-1.5 font-display text-[11px] font-medium transition-colors duration-200 ${
                  timeframe === iv.key ? 'text-[#454647]' : 'text-[#9c9c9d] hover:text-white'
                }`}
              >
                {timeframe === iv.key && (
                  <motion.span
                    layoutId="tfPill"
                    className="absolute inset-0 rounded-full bg-[#e6e6e6]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{iv.label}</span>
              </button>
            ))}
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-[10px] font-medium tracking-wide ${status.cls}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.label} · #{round.id}
          </span>
        </div>
      </div>

      {/* Price row — oversized live price + delta + strike state + big timer */}
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-wider text-dim">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-up" />
              {cfg.label}
            </span>
            <span className="text-ink-500">·</span>
            <span>{participants} DEGENS ONLINE</span>
            <span className="text-ink-500">·</span>
            <span>PERPETUAL ORACLE</span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">
              {intPart}
              <span className="text-dim">.{fracPart}</span>
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold ${
                delta >= 0 ? 'border-up/40 bg-up/10 text-up' : 'border-down/40 bg-down/10 text-down'
              }`}
            >
              {delta >= 0 ? '+' : ''}
              {delta.toPrecision(3)}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span className={`font-mono text-[10px] font-medium tracking-wider ${strikeLine.tone}`}>
              {strikeLine.text}
            </span>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-ink-600/70 sm:w-44">
              <motion.div
                className="h-full rounded-full bg-accent"
                style={{ width: `${phaseProgress * 100}%` }}
                transition={{ ease: 'linear', duration: 0.1 }}
              />
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-right">
          <div className="font-mono text-4xl font-bold tabular-nums text-white sm:text-5xl">
            {fmtCountdown(timeLeft)}
          </div>
          <div className="font-mono text-[10px] tracking-wider text-dim">
            {phase === 'ACCEPTING_BETS'
              ? 'BETS CLOSE IN'
              : phase === 'LOCKED'
                ? 'RESOLVES IN'
                : phase === 'CALCULATING'
                  ? 'SETTLING…'
                  : 'NEXT ROUND IN'}
          </div>
        </div>
      </div>

      {/* Chart body — the band floats over its lower edge on desktop */}
      <div className="relative mt-3 min-h-[300px] flex-1 sm:min-h-[360px] lg:mb-[200px] lg:min-h-0">
        <PriceChart
          ticks={ticks}
          timeframe={timeframe}
          pairKey={cfg.key}
          digits={cfg.digits}
          strikePrice={strike}
          aboveStrike={aboveStrike}
          phase={phase}
        />
      </div>

      {band}
    </section>
  );
}
