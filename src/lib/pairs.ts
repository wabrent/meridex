/** Tradeable market pairs on the Meridex terminal. */

export type PairKey = 'ETHUSD' | 'BTCUSD' | 'SOLUSD' | 'XRPUSD' | 'DOGEUSD';

export interface PairConfig {
  key: PairKey;
  /** Display label, e.g. `ETH / USD`. */
  label: string;
  /** Short ticker for the switcher pills, e.g. `ETH`. */
  short: string;
  /** Simulated feed anchor price. */
  base: number;
  /** Per-tick relative volatility of the demo feed. */
  vol: number;
  /** Decimal places used when formatting this market's prices. */
  digits: number;
}

export const PAIRS: PairConfig[] = [
  { key: 'ETHUSD', label: 'ETH / USD', short: 'ETH', base: 2412.5, vol: 0.00035, digits: 2 },
  { key: 'BTCUSD', label: 'BTC / USD', short: 'BTC', base: 68430, vol: 0.0003, digits: 1 },
  { key: 'SOLUSD', label: 'SOL / USD', short: 'SOL', base: 168.42, vol: 0.0005, digits: 2 },
  { key: 'XRPUSD', label: 'XRP / USD', short: 'XRP', base: 2.3478, vol: 0.00045, digits: 4 },
  { key: 'DOGEUSD', label: 'DOGE / USD', short: 'DOGE', base: 0.1642, vol: 0.0006, digits: 4 },
];

/** Look up a pair config; unknown/legacy keys fall back to ETH/USD. */
export const getPair = (key: string | undefined): PairConfig =>
  PAIRS.find((p) => p.key === key) ?? PAIRS[0];
