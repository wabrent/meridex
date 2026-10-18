import { useCallback, useEffect, useRef, useState } from 'react';
import { PAIRS, type PairKey } from '../lib/pairs';
import type {
  Bet,
  BetSide,
  Round,
  RoundPhase,
  RoundView,
  Timeframe,
  UserState,
} from '../types';

/** Parimutuel pool math — 2% protocol fee, accrued to the $MRDX treasury. */
export const PROTOCOL_FEE = 0.02;

const DURATION: Record<Timeframe, number> = { '1m': 60, '5m': 300 };
const LOCK: Record<Timeframe, number> = { '1m': 10, '5m': 30 };
const CALC_MS = 5_000;
const SETTLE_MS = 4_000;
const TICK_MS = 100;
const START_BALANCE = 10; // demo bankroll (ETH)
const HISTORY_LIMIT = 40;

const BOT_STAKE_SIZES = [0.01, 0.02, 0.05, 0.05, 0.1, 0.1, 0.2, 0.35, 0.5, 0.75, 1, 1.5, 2];
const BOT_BET_PROB: Record<Timeframe, number> = { '1m': 0.05, '5m': 0.016 };

function randomAddress(): string {
  const hex = '0123456789abcdef';
  let out = '0x';
  for (let i = 0; i < 40; i++) out += hex[Math.floor(Math.random() * 16)];
  return out;
}

let betSeq = 0;
const nextBetId = () => `bet_${Date.now().toString(36)}_${(betSeq++).toString(36)}`;

interface EngineCore {
  phase: RoundPhase;
  current: Round;
  history: Round[];
  user: UserState;
}

function newRound(id: number, timeframe: Timeframe, cycleStart: number, pair: PairKey): Round {
  return {
    id,
    pair,
    duration: DURATION[timeframe],
    cycleStart,
    strikePrice: null,
    settlePrice: null,
    outcome: null,
    poolUp: 0,
    poolDown: 0,
    bets: [],
  };
}

function phaseAt(round: Round, timeframe: Timeframe, now: number): {
  phase: RoundPhase;
  timeLeft: number;
  phaseProgress: number;
  cycleProgress: number;
} {
  const lockAt = round.duration - LOCK[timeframe];
  const calcAt = round.duration;
  const settleAt = round.duration + CALC_MS / 1000;
  const cycleTotal = round.duration + (CALC_MS + SETTLE_MS) / 1000;
  let elapsed = (now - round.cycleStart) / 1000;
  // Roll into the next cycle when this one has fully elapsed (handles background-tab lag too).
  while (elapsed >= cycleTotal) elapsed -= cycleTotal;

  let phase: RoundPhase;
  let phaseStart: number;
  let phaseEnd: number;
  if (elapsed < lockAt) {
    phase = 'ACCEPTING_BETS';
    phaseStart = 0;
    phaseEnd = lockAt;
  } else if (elapsed < calcAt) {
    phase = 'LOCKED';
    phaseStart = lockAt;
    phaseEnd = calcAt;
  } else if (elapsed < settleAt) {
    phase = 'CALCULATING';
    phaseStart = calcAt;
    phaseEnd = settleAt;
  } else {
    phase = 'SETTLED';
    phaseStart = settleAt;
    phaseEnd = cycleTotal;
  }
  const phaseProgress = Math.min(1, Math.max(0, (elapsed - phaseStart) / (phaseEnd - phaseStart)));
  return {
    phase,
    timeLeft: Math.max(0, phaseEnd - elapsed),
    phaseProgress,
    cycleProgress: Math.min(1, Math.max(0, elapsed / cycleTotal)),
  };
}

/** Current parimutuel payout multiplier for a side (fee-adjusted, capped for display). */
export function multiplierFor(round: Round, side: BetSide): number {
  const winPool = side === 'UP' ? round.poolUp : round.poolDown;
  const total = round.poolUp + round.poolDown;
  if (winPool <= 0) return 1.95; // no exposure yet — theoretical default
  const raw = (total * (1 - PROTOCOL_FEE)) / winPool;
  return Math.min(25, raw);
}

/**
 * Round state machine:
 *   ACCEPTING_BETS → LOCKED (strike frozen) → CALCULATING → SETTLED → …
 *
 * Drives its own 100ms clock, simulates rival participants (parimutuel pools),
 * settles user positions and tracks bankroll/PnL. Works fully offline; when a
 * wallet is connected, bets are additionally relayed on-chain by callers.
 */
export function useRoundEngine(
  priceRefs: Record<PairKey, React.MutableRefObject<number>>,
  timeframe: Timeframe,
  pair: PairKey,
): RoundView & {
  user: UserState;
  history: Round[];
  placeBet: (side: BetSide, amount: number) => Bet;
  multiplierForSide: (side: BetSide) => number;
  canBet: boolean;
} {
  const coreRef = useRef<EngineCore | null>(null);
  const timeframeRef = useRef(timeframe);
  const pairRef = useRef(pair);

  if (
    coreRef.current === null ||
    coreRef.current.current.pair !== pair ||
    coreRef.current.current.duration !== DURATION[timeframe]
  ) {
    // (Re)initialize when the market or timeframe changes — settle anything open first.
    const now = Date.now();
    const prev = coreRef.current;
    if (prev) {
      const hasBets = prev.current.bets.length > 0;
      if (prev.phase !== 'SETTLED' && hasBets) {
        // Settle against the market this round actually traded (its own pair).
        settleRound(prev, priceRefs[prev.current.pair]?.current ?? priceRefs[pair].current, true);
        prev.history = [prev.current, ...prev.history].slice(0, HISTORY_LIMIT);
      } else if (prev.phase === 'SETTLED') {
        prev.history = [prev.current, ...prev.history].slice(0, HISTORY_LIMIT);
      }
      // Empty rounds abandoned before lock (e.g. switching pairs) are dropped.
    }
    const user = prev?.user ?? {
      balance: START_BALANCE,
      totalStaked: 0,
      totalWon: 0,
      bets: [],
    };
    const lastId = prev?.current.id ?? 41_236;
    coreRef.current = {
      phase: 'ACCEPTING_BETS',
      current: newRound(lastId + 1, timeframe, now, pair),
      history: prev?.history ?? sampleHistory(lastId),
      user,
    };
  }
  timeframeRef.current = timeframe;
  pairRef.current = pair;

  const core = coreRef.current;
  const [, forceRender] = useState(0);

  /** Freeze the strike price when the round locks. */
  const lockRound = (round: Round, price: number) => {
    round.strikePrice = price;
  };

  /** Freeze settle price and resolve the outcome. */
  const calculateRound = (round: Round, price: number) => {
    if (round.strikePrice === null) round.strikePrice = price;
    round.settlePrice = price;
    if (price > round.strikePrice) round.outcome = 'UP';
    else if (price < round.strikePrice) round.outcome = 'DOWN';
    else round.outcome = null; // exact tie → refunds
  };

  const handleTransition = (from: RoundPhase, to: RoundPhase, price: number) => {
    const c = coreRef.current!;
    const round = c.current;
    if (to === 'LOCKED' && from === 'ACCEPTING_BETS') lockRound(round, price);
    if (to === 'CALCULATING') calculateRound(round, price);
    if (to === 'SETTLED') settleRound(c, price, false);
    if (to === 'ACCEPTING_BETS') {
      c.history = [round, ...c.history].slice(0, HISTORY_LIMIT);
      const cycleTotalMs = (round.duration + (CALC_MS + SETTLE_MS) / 1000) * 1000;
      const now = Date.now();
      // Catch up cleanly if several cycles were missed (e.g. throttled background tab).
      let start = round.cycleStart + cycleTotalMs;
      let skipped = 1;
      while (start <= now - cycleTotalMs) {
        start += cycleTotalMs;
        skipped++;
      }
      c.current = newRound(round.id + skipped, timeframeRef.current, start, pairRef.current);
    }
  };

  /** Simulated rival traders feeding the parimutuel pools. */
  const spawnBotBet = (round: Round) => {
    const side: BetSide = Math.random() < 0.5 ? 'UP' : 'DOWN';
    const amount =
      BOT_STAKE_SIZES[Math.floor(Math.random() * BOT_STAKE_SIZES.length)] * (0.6 + Math.random() * 0.8);
    const stake = Math.round(amount * 1000) / 1000;
    const bet: Bet = {
      id: nextBetId(),
      roundId: round.id,
      side,
      amount: stake,
      user: randomAddress(),
      isBot: true,
      placedAt: Date.now(),
    };
    round.bets.push(bet);
    if (side === 'UP') round.poolUp += stake;
    else round.poolDown += stake;
  };

  // Main 100ms clock.
  useEffect(() => {
    const id = window.setInterval(() => {
      const c = coreRef.current!;
      const round = c.current;
      const now = Date.now();
      const derived = phaseAt(round, timeframeRef.current, now);
      if (derived.phase !== c.phase) {
        handleTransition(c.phase, derived.phase, priceRefs[pairRef.current].current);
        c.phase = derived.phase;
      }
      if (c.phase === 'ACCEPTING_BETS') {
        const p = BOT_BET_PROB[timeframeRef.current];
        if (Math.random() < p) spawnBotBet(c.current);
        if (Math.random() < p * 0.6) spawnBotBet(c.current);
      }
      forceRender((n) => n + 1);
    }, TICK_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived fresh on every render (the 100ms clock forces re-renders anyway).
  const derived = phaseAt(core.current, timeframe, Date.now());
  const view = {
    round: core.current,
    phase: derived.phase,
    timeLeft: derived.timeLeft,
    phaseProgress: derived.phaseProgress,
    cycleProgress: derived.cycleProgress,
  };

  const placeBet = useCallback((side: BetSide, amount: number): Bet => {
    const c = coreRef.current!;
    const derived = phaseAt(c.current, timeframeRef.current, Date.now());
    if (derived.phase !== 'ACCEPTING_BETS') throw new Error('Bets are locked for this round');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid stake');
    if (amount > c.user.balance) throw new Error('Insufficient balance');
    const bet: Bet = {
      id: nextBetId(),
      roundId: c.current.id,
      side,
      amount: Math.round(amount * 10_000) / 10_000,
      user: 'you',
      isBot: false,
      placedAt: Date.now(),
    };
    c.current.bets.push(bet);
    if (side === 'UP') c.current.poolUp += bet.amount;
    else c.current.poolDown += bet.amount;
    c.user.balance -= bet.amount;
    c.user.totalStaked += bet.amount;
    c.user.bets.unshift(bet);
    if (c.user.bets.length > 200) c.user.bets.length = 200;
    return bet;
  }, []);

  const multiplierForSide = useCallback((side: BetSide) => multiplierFor(view.round, side), [view.round]);

  return {
    ...view,
    user: core.user,
    history: core.history,
    placeBet,
    multiplierForSide,
    canBet: view.phase === 'ACCEPTING_BETS',
  };
}

/** Resolve payouts against the winning pool (2% fee skimmed first). */
function settleRound(c: EngineCore, price: number, force: boolean) {
  const round = c.current;
  if (round.settlePrice === null || force) {
    if (round.strikePrice === null) round.strikePrice = price;
    round.settlePrice = price;
    if (price > round.strikePrice) round.outcome = 'UP';
    else if (price < round.strikePrice) round.outcome = 'DOWN';
    else round.outcome = null;
  }
  const totalPool = round.poolUp + round.poolDown;
  const winningPool = round.outcome === 'UP' ? round.poolUp : round.outcome === 'DOWN' ? round.poolDown : 0;
  const distributable = totalPool * (1 - PROTOCOL_FEE);

  let userPayoutTotal = 0;
  for (const bet of round.bets) {
    if (bet.payout !== undefined) continue;
    if (round.outcome === null) {
      bet.payout = bet.amount; // tie → refund
      continue;
    }
    if (bet.side === round.outcome) {
      bet.payout = winningPool > 0 ? (bet.amount / winningPool) * distributable : 0;
      bet.won = true;
    } else {
      bet.payout = 0;
      bet.won = false;
    }
    if (!bet.isBot) userPayoutTotal += bet.payout;
  }

  // Sync the user ledger.
  for (const ub of c.user.bets) {
    if (ub.roundId !== round.id || ub.payout !== undefined) continue;
    const mirror = round.bets.find((b) => b.id === ub.id);
    if (mirror) {
      ub.payout = mirror.payout;
      ub.won = mirror.won;
      const credited = mirror.payout ?? 0;
      if (mirror.won) c.user.totalWon += credited;
    }
  }
  c.user.balance += userPayoutTotal;
}

/** Pre-seeded settled rounds (mixed markets) so Live History never looks empty on first paint. */
function sampleHistory(lastId: number): Round[] {
  const out: Round[] = [];
  for (let i = 7; i >= 1; i--) {
    const cfg = PAIRS[Math.floor(Math.random() * PAIRS.length)];
    const strike = cfg.base * (0.996 + Math.random() * 0.008);
    const settle = strike * (1 + (Math.random() - 0.48) * 0.0025);
    const outcome: BetSide | null = settle > strike ? 'UP' : settle < strike ? 'DOWN' : null;
    const poolUp = Math.round((1.5 + Math.random() * 6) * 1000) / 1000;
    const poolDown = Math.round((1.5 + Math.random() * 6) * 1000) / 1000;
    const round = newRound(lastId - i, '1m', Date.now() - (i + 1) * 69_000, cfg.key);
    round.strikePrice = strike;
    round.settlePrice = settle;
    round.outcome = outcome;
    round.poolUp = poolUp;
    round.poolDown = poolDown;
    round.bets = [];
    out.push(round);
  }
  return out;
}
