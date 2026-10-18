import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { PAIRS, type PairConfig, type PairKey } from '../lib/pairs';

export interface PriceTick {
  time: number; // epoch seconds
  price: number;
}

const TICK_MS = 400;
const MAX_TICKS = 6000;
const SEED_COUNT = 450;
/** Slow mean-reversion anchor so price never wanders off-screen. */
const MEAN_REV = 0.0008;

const randn = () => {
  // Box–Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/** Reactive snapshot of one market. */
export interface PairFeed {
  price: number;
  prevPrice: number;
  direction: 'up' | 'down';
  ticks: PriceTick[];
}

interface Snap {
  price: number;
  prevPrice: number;
  ticks: PriceTick[];
}

type Snapshots = Record<PairKey, Snap>;

/** ~3 minutes of pre-seeded history so charts render instantly. */
function seedPair(cfg: PairConfig): Snap {
  const now = Date.now() / 1000;
  const ticks: PriceTick[] = [];
  let p = cfg.base * (1 - 0.004);
  for (let i = SEED_COUNT; i > 0; i--) {
    p += p * (randn() * cfg.vol * 2.1) + (cfg.base - p) * MEAN_REV;
    ticks.push({ time: Math.floor(now - i * (TICK_MS / 1000)), price: p });
  }
  return { price: p, prevPrice: p, ticks };
}

export interface MarketFeed {
  /** Stable mutable price refs, keyed by pair — the round engine reads these. */
  refs: Record<PairKey, MutableRefObject<number>>;
  /** Reactive per-market data (state) for the UI/chart. */
  markets: Record<PairKey, PairFeed>;
}

/**
 * Simulated feeds for every tradeable pair (ETH, BTC, SOL, XRP, DOGE).
 * All markets tick together every 400ms so switching pairs never loses
 * history; the round engine resolves against the active market's ref.
 */
export function useMarketFeed(): MarketFeed {
  const seeds = useRef<Snapshots | null>(null);
  if (seeds.current === null) {
    seeds.current = {} as Snapshots;
    for (const cfg of PAIRS) seeds.current[cfg.key] = seedPair(cfg);
  }

  const refs = useRef<Record<PairKey, MutableRefObject<number>> | null>(null);
  if (refs.current === null) {
    refs.current = {} as Record<PairKey, MutableRefObject<number>>;
    for (const cfg of PAIRS) refs.current[cfg.key] = { current: seeds.current[cfg.key].price };
  }

  const [snaps, setSnaps] = useState<Snapshots>(() => {
    const init = {} as Snapshots;
    for (const cfg of PAIRS) {
      const s = seeds.current![cfg.key];
      init[cfg.key] = { price: s.price, prevPrice: s.prevPrice, ticks: s.ticks };
    }
    return init;
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      setSnaps((prev) => {
        const next = { ...prev };
        for (const cfg of PAIRS) {
          const s = prev[cfg.key];
          const ref = refs.current![cfg.key];
          const current = ref.current;
          const price = current * (1 + randn() * cfg.vol) + (cfg.base - current) * MEAN_REV;
          ref.current = price;
          const ticks =
            s.ticks.length >= MAX_TICKS ? s.ticks.slice(s.ticks.length - MAX_TICKS + 1) : s.ticks.slice();
          ticks.push({ time: Math.floor(Date.now() / 1000), price });
          next[cfg.key] = { price, prevPrice: current, ticks };
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const markets = useMemo(() => {
    const out = {} as Record<PairKey, PairFeed>;
    for (const cfg of PAIRS) {
      const s = snaps[cfg.key];
      out[cfg.key] = {
        price: s.price,
        prevPrice: s.prevPrice,
        direction: s.price >= s.prevPrice ? 'up' : 'down',
        ticks: s.ticks,
      };
    }
    return out;
  }, [snaps]);

  return { refs: refs.current, markets };
}
