import { useCallback, useEffect, useRef, useState } from 'react';
import type { PonsCurveState } from '../types';

const HARD_CAP_ETH = 500;
const TOTAL_SUPPLY = 1_000_000_000; // 1B $MRDX
const BASE_PRICE_USD = 0.0002;
const END_PRICE_USD = 0.001;
const ETH_USD = 2412.5;

/**
 * Simulated Pons bonding curve for $MRDX.
 * Auto-drifts upward slowly (live market feel) and supports simulated buys.
 */
export function usePonsCurve() {
  const [state, setState] = useState<PonsCurveState>(() => {
    const progress = 0.625; // 62.5% filled on first paint
    const priceUsd = BASE_PRICE_USD + progress * (END_PRICE_USD - BASE_PRICE_USD);
    return {
      progress,
      raisedEth: HARD_CAP_ETH * progress,
      hardCapEth: HARD_CAP_ETH,
      soldTokens: TOTAL_SUPPLY * 0.6 * progress,
      totalSupply: TOTAL_SUPPLY,
      priceUsd,
      ethUsd: ETH_USD,
      marketCapUsd: priceUsd * TOTAL_SUPPLY,
    };
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Gentle organic drift upward.
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => {
        if (s.progress >= 1) return s;
        const nextProgress = Math.min(1, s.progress + Math.random() * 0.0004);
        const priceUsd = BASE_PRICE_USD + nextProgress * (END_PRICE_USD - BASE_PRICE_USD);
        return {
          ...s,
          progress: nextProgress,
          raisedEth: HARD_CAP_ETH * nextProgress,
          soldTokens: TOTAL_SUPPLY * 0.6 * nextProgress,
          priceUsd,
          marketCapUsd: priceUsd * TOTAL_SUPPLY,
        };
      });
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  /** Simulated one-click buy on the Pons curve. */
  const buy = useCallback((ethAmount: number): { tokens: number; progressAfter: number } => {
    const s = stateRef.current;
    const nextProgress = Math.min(1, s.progress + ethAmount / HARD_CAP_ETH);
    const priceUsd = BASE_PRICE_USD + nextProgress * (END_PRICE_USD - BASE_PRICE_USD);
    const tokens = (ethAmount * ETH_USD) / priceUsd;
    setState({
      ...s,
      progress: nextProgress,
      raisedEth: s.raisedEth + ethAmount,
      soldTokens: s.soldTokens + tokens,
      priceUsd,
      marketCapUsd: priceUsd * TOTAL_SUPPLY,
    });
    return { tokens, progressAfter: nextProgress };
  }, []);

  return { ...state, buy, ethUsd: ETH_USD };
}

/** 24h change badge for the header ticker (mock drift derived from curve progress). */
export function useMrdexBadge(priceUsd: number) {
  const [change, setChange] = useState(0.084);
  useEffect(() => {
    setChange((c) => Math.max(-0.25, Math.min(0.6, c + (Math.random() - 0.48) * 0.004)));
  }, [priceUsd]);
  return { change24h: change };
}
