import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { BetSide, Round, RoundPhase } from '../types';
import { PROTOCOL_FEE } from '../hooks/useRoundEngine';
import { fmtEth } from '../lib/format';

const QUICK_AMOUNTS = [0.01, 0.05, 0.1] as const;

interface BettingBandProps {
  round: Round;
  phase: RoundPhase;
  timeLeft: number;
  balance: number;
  multiplierForSide: (side: BetSide) => number;
  onPlaceBet: (side: BetSide, amount: number) => void;
  myRoundStake: number;
}

/**
 * Claude-style horizontal betting band floating over the chart's lower edge:
 *   UP card | stake input + chips + pool bar | DOWN card
 * Keyboard: `U` / `D` fire the matching side (both QWERTY and Russian layouts).
 */
export default function BettingBand({
  round,
  phase,
  timeLeft,
  balance,
  multiplierForSide,
  onPlaceBet,
  myRoundStake,
}: BettingBandProps) {
  const [amount, setAmount] = useState('0.05');
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  const canBet = phase === 'ACCEPTING_BETS';
  const stake = Math.max(0, Number(amount) || 0);
  const invalid = stake <= 0 || stake > balance;

  const upMult = multiplierForSide('UP');
  const downMult = multiplierForSide('DOWN');

  const poolUp = round.poolUp;
  const poolDown = round.poolDown;
  const totalPool = poolUp + poolDown;
  const upPct = totalPool > 0 ? (poolUp / totalPool) * 100 : 50;

  const statusLine = useMemo(() => {
    const pool = `${fmtEth(totalPool)} in pool`;
    switch (phase) {
      case 'ACCEPTING_BETS':
        return `bets close in ${Math.ceil(timeLeft)}s · ${pool} · balance ${fmtEth(balance)}`;
      case 'LOCKED':
        return `locked · resolves in ${Math.ceil(timeLeft)}s · ${round.bets.length} participants`;
      case 'CALCULATING':
        return `settling round #${round.id}…`;
      default:
        return `next round in ${Math.ceil(timeLeft)}s · stay ready`;
    }
  }, [phase, timeLeft, totalPool, balance, round.bets.length, round.id]);

  const fire = (next: BetSide) => {
    if (!canBet || invalid) return;
    setFlash(next === 'UP' ? 'up' : 'down');
    window.setTimeout(() => setFlash(null), 450);
    try {
      onPlaceBet(next, stake);
    } catch {
      /* surfaced by caller toast */
    }
  };

  // Keyboard triggers — U (г) for UP, D (в) for DOWN on either layout.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === 'u' || k === 'г') fire('UP');
      else if (k === 'd' || k === 'в') fire('DOWN');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBet, invalid, stake]);

  const cardCls = (s: BetSide) => {
    const isUp = s === 'UP';
    const flashed = flash === (isUp ? 'up' : 'down');
    return `relative rounded-[20px] border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
      flashed
        ? isUp
          ? 'border-up bg-up/15'
          : 'border-down bg-down/15'
        : isUp
          ? 'border-up/35 bg-up/[0.07] hover:bg-up/10'
          : 'border-down/35 bg-down/[0.07] hover:bg-down/10'
    }`;
  };

  return (
    <div className="relative z-20 mx-3 mb-3 mt-3 rounded-[28px] border border-white/10 bg-white/[0.05] p-3 backdrop-blur-[48px] lg:absolute lg:inset-x-3 lg:bottom-3 lg:mx-0 lg:mb-0 lg:mt-0 lg:p-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* UP card */}
        <button
          disabled={!canBet || invalid}
          onClick={() => fire('UP')}
          className={`${cardCls('UP')} order-1 lg:order-1`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-up">
              <ChevronUp size={16} strokeWidth={3} /> UP
            </span>
            <kbd className="rounded-md border border-up/40 bg-up/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-up">
              U
            </kbd>
          </div>
          <div className="mt-1.5 font-display text-4xl font-semibold leading-none tabular-nums text-up">
            {upMult.toFixed(2)}x
          </div>
          <div className="mt-1.5 font-mono text-[11px] text-muted">
            win <span className="font-semibold text-white">{fmtEth(stake * upMult)}</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-dim">CALL POOL {fmtEth(poolUp)}</div>
        </button>

        {/* Center — stake, chips, pool bar, status */}
        <div className="order-3 col-span-2 flex flex-col gap-2.5 lg:order-2 lg:col-span-1 lg:justify-center lg:px-2">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-baseline gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 transition-colors focus-within:border-white/40">
              <input
                id="stake"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-24 bg-transparent text-right font-mono text-2xl font-semibold tabular-nums text-white outline-none placeholder:text-dim [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
              <span className="font-mono text-xs font-semibold text-muted">ETH</span>
            </div>
            <span className="hidden text-left font-mono text-[10px] leading-tight text-dim sm:block">
              AVAILABLE
              <br />
              <span className="font-semibold text-white">{fmtEth(balance)}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {QUICK_AMOUNTS.map((qa) => (
              <button
                key={qa}
                onClick={() => setAmount(String(qa))}
                className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium transition-colors duration-200 ${
                  Number(amount) === qa
                    ? 'border-[#e6e6e6] bg-[#e6e6e6] text-[#454647]'
                    : 'border-ink-600 text-[#9c9c9d] hover:border-[#4d4e50] hover:text-white'
                }`}
              >
                {qa}
              </button>
            ))}
            <button
              onClick={() => setAmount(balance.toFixed(4))}
              className="rounded-full border border-ink-600 px-2.5 py-1 font-mono text-[11px] font-medium text-[#e6e6e6] transition-all duration-200 hover:border-[#e6e6e6] hover:bg-[#e6e6e6] hover:text-[#454647]"
            >
              MAX
            </button>
          </div>

          {/* Parimutuel pool split + fee */}
          <div>
            <div className="flex justify-between font-mono text-[10px]">
              <span className="font-bold text-up">
                {upPct.toFixed(0)}% UP · {fmtEth(poolUp)}
              </span>
              <span className="text-dim">PARIMUTUEL · FEE {(PROTOCOL_FEE * 100).toFixed(0)}%</span>
              <span className="font-bold text-down">
                {fmtEth(poolDown)} · DOWN {(100 - upPct).toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-down/50">
              <div
                className="h-full rounded-full bg-up transition-all duration-500"
                style={{ width: `${upPct}%` }}
              />
            </div>
          </div>

          <div className="text-center font-mono text-[10px] tracking-wide text-muted">
            {statusLine}
            {myRoundStake > 0 && <span className="text-accent2"> · your stake {fmtEth(myRoundStake)}</span>}
          </div>
        </div>

        {/* DOWN card */}
        <button
          disabled={!canBet || invalid}
          onClick={() => fire('DOWN')}
          className={`${cardCls('DOWN')} order-2 lg:order-3`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-down">
              <ChevronDown size={16} strokeWidth={3} /> DOWN
            </span>
            <kbd className="rounded-md border border-down/40 bg-down/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-down">
              D
            </kbd>
          </div>
          <div className="mt-1.5 font-display text-4xl font-semibold leading-none tabular-nums text-down">
            {downMult.toFixed(2)}x
          </div>
          <div className="mt-1.5 font-mono text-[11px] text-muted">
            win <span className="font-semibold text-white">{fmtEth(stake * downMult)}</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-dim">PUT POOL {fmtEth(poolDown)}</div>
        </button>
      </div>
    </div>
  );
}
