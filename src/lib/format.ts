/** Shared formatting helpers. */

export const fmtUsd = (n: number, digits = 2) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtCompactUsd = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return fmtUsd(n, n < 1 ? 4 : 2);
};

/** Price with adaptive precision (crypto-friendly). */
export const fmtPrice = (n: number) => {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.0001) return n.toFixed(5);
  return n.toPrecision(4);
};

/** Fixed-precision price for a market pair (see lib/pairs). */
export const fmtPairPrice = (n: number, digits: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtEth = (n: number) => `${n.toFixed(n >= 100 ? 2 : 4)} ETH`;

export const fmtPct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;

export const shortAddress = (addr: string, size = 4) =>
  addr.length <= size * 2 + 2 ? addr : `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`;

export const fmtCountdown = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return m > 0 ? `${m}:${String(rest).padStart(2, '0')}` : `00:${String(rest).padStart(2, '0')}`;
};

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
