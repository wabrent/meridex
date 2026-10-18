/** Meridex core domain types */

import type { PairKey } from '../lib/pairs';

/** Lifecycle of a single prediction round. */
export type RoundPhase =
  | 'ACCEPTING_BETS'
  | 'LOCKED'
  | 'CALCULATING'
  | 'SETTLED';

export type BetSide = 'UP' | 'DOWN';

/** Selectable round timeframe. */
export type Timeframe = '1m' | '5m';

/** A single wager placed on a round (user or simulated participant). */
export interface Bet {
  id: string;
  roundId: number;
  side: BetSide;
  /** Stake in native ETH units. */
  amount: number;
  /** Address label of the bettor. */
  user: string;
  isBot: boolean;
  placedAt: number;
  /** Populated once the round settles. */
  payout?: number;
  won?: boolean;
}

/** A full prediction round. */
export interface Round {
  id: number;
  /** Market pair this round trades (see lib/pairs). */
  pair: PairKey;
  /** Betting + lock window length in seconds. */
  duration: number;
  /** Epoch ms when this round's cycle started. */
  cycleStart: number;
  /** Frozen at the LOCKED transition; null until then. */
  strikePrice: number | null;
  /** Price sampled when CALCULATING began. */
  settlePrice: number | null;
  outcome: BetSide | null;
  poolUp: number;
  poolDown: number;
  bets: Bet[];
}

/** Aggregated performance of the connected/demo trader. */
export interface UserState {
  /** Playable bankroll (mock units when no wallet is connected). */
  balance: number;
  totalStaked: number;
  totalWon: number;
  bets: Bet[];
}

/** Derived, render-friendly view of the active round. */
export interface RoundView {
  round: Round;
  phase: RoundPhase;
  /** Seconds remaining in the current phase. */
  timeLeft: number;
  /** 0..1 progress of the current phase. */
  phaseProgress: number;
  /** 0..1 progress of the whole round cycle (for the countdown bar). */
  cycleProgress: number;
}

/** $MRDX Pons bonding-curve snapshot. */
export interface PonsCurveState {
  /** 0..1 completion of the bonding curve. */
  progress: number;
  raisedEth: number;
  hardCapEth: number;
  soldTokens: number;
  totalSupply: number;
  priceUsd: number;
  ethUsd: number;
  marketCapUsd: number;
}

export interface Toast {
  id: number;
  message: string;
  tone: 'up' | 'down' | 'accent';
}
