import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
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
 * One continuous glass betting bar floating over the chart:
 *   gradient UP half │ stake · chips · pool split │ gradient DOWN half
 * Keyboard: `U` / `D` fire the matching side (QWERTY + Russian layouts).
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

  const halfCls = (side: BetSide) => {
    const isUp = side === 'UP';
    const flashed = flash === (isUp ? 'up' : 'down');
    const idle = isUp
      ? 'bg-[linear-gradient(100deg,rgba(89,212,153,0.15),rgba(89,212,153,0.02)_72%)] hover:bg-[linear-gradient(100deg,rgba(89,212,153,0.26),rgba(89,212,153,0.06)_72%)]'
      : 'bg-[linear-gradient(260deg,rgba(255,99,99,0.15),rgba(255,99,99,0.02)_72%)] hover:bg-[linear-gradient(260deg,rgba(255,99,99,0.26),rgba(255,99,99,0.06)_72%)]';
    const flashCls = flashed
      ? isUp
        ? 'shadow-[inset_0_0_0_1px_rgba(89,212,153,0.55),0_0_70px_-12px_rgba(89,212,153,0.6)]'
        : 'shadow-[inset_0_0_0_1px_rgba(255,99,99,0.55),0_0_70px_-12px_rgba(255,99,99,0.6)]'
      : '';
    return `group relative flex items-center justify-between gap-3 px-5 py-5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${idle} ${flashCls}`;
  };

  return (
    <div className="relative z-20 mx-3 mb-3 mt-3 grid overflow-hidden rounded-[24px] border border-white/[0.08] bg-black/45 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl lg:absolute lg:inset-x-4 lg:bottom-4 lg:mx-0 lg:mb-0 lg:mt-0 lg:grid-cols-[1fr_minmax(280px,460px)_1fr]">
      {/* UP half */}
      <button disabled={!canBet || invalid} onClick={() => fire('UP')} className={halfCls('UP')}>
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-up/40 bg-up/10 text-up transition-transform duration-200 group-hover:scale-110">
            <ArrowUpRight size={18} strokeWidth={2.5} />
          </span>
          <span>
            <span className="flex items-center gap-2 font-display text-base font-semibold leading-none text-up">
              UP
              <kbd className="rounded border border-up/30 bg-up/10 px-1 py-px font-mono text-[9px] font-semibold text-up/90">
                U
              </kbd>
            </span>
            <span className="mt-1.5 block font-mono text-[10px] tracking-wide text-muted">
              CALL POOL {fmtEth(poolUp)}
            </span>
          </span>
        </span>
        <span className="text-right">
          <span className="block font-display text-4xl font-semibold leading-none tabular-nums text-up drop-shadow-[0_0_22px_rgba(89,212,153,0.5)] xl:text-5xl">
            {upMult.toFixed(2)}x
          </span>
          <span className="mt-1.5 block font-mono text-[11px] text-muted">
            win <span className="font-semibold text-white">{fmtEth(stake * upMult)}</span>
          </span>
        </span>
      </button>

      {/* Center — stake, chips, pool split, status */}
      <div className="flex flex-col justify-center gap-3 border-y border-white/[0.06] bg-black/55 px-5 py-4 lg:border-x lg:border-y-0">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-baseline gap-2 rounded-2xl bg-white/[0.05] px-4 py-2 ring-1 ring-white/[0.08] transition focus-within:ring-white/30">
            <input
              id="stake"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24 bg-transparent text-right font-mono text-3xl font-semibold tabular-nums text-white outline-none placeholder:text-dim [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
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
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[10px]">
            <span className="font-bold text-up">{upPct.toFixed(0)}% UP · {fmtEth(poolUp)}</span>
            <span className="text-dim">PARIMUTUEL · FEE {(PROTOCOL_FEE * 100).toFixed(0)}%</span>
            <span className="font-bold text-down">{fmtEth(poolDown)} · DOWN {(100 - upPct).toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-down/45">
            <div
              className="h-full rounded-full bg-up shadow-[0_0_14px_rgba(89,212,153,0.6)] transition-all duration-500"
              style={{ width: `${upPct}%` }}
            />
          </div>
        </div>

        <div className="text-center font-mono text-[10px] tracking-wide text-muted">
          {statusLine}
          {myRoundStake > 0 && <span className="text-accent2"> · your stake {fmtEth(myRoundStake)}</span>}
        </div>
      </div>

      {/* DOWN half */}
      <button disabled={!canBet || invalid} onClick={() => fire('DOWN')} className={halfCls('DOWN')}>
        <span className="text-left">
          <span className="block font-display text-4xl font-semibold leading-none tabular-nums text-down drop-shadow-[0_0_22px_rgba(255,99,99,0.5)] xl:text-5xl">
            {downMult.toFixed(2)}x
          </span>
          <span className="mt-1.5 block font-mono text-[11px] text-muted">
            win <span className="font-semibold text-white">{fmtEth(stake * downMult)}</span>
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span>
            <span className="flex items-center justify-end gap-2 font-display text-base font-semibold leading-none text-down">
              <kbd className="rounded border border-down/30 bg-down/10 px-1 py-px font-mono text-[9px] font-semibold text-down/90">
                D
              </kbd>
              DOWN
            </span>
            <span className="mt-1.5 block text-right font-mono text-[10px] tracking-wide text-muted">
              PUT POOL {fmtEth(poolDown)}
            </span>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-down/40 bg-down/10 text-down transition-transform duration-200 group-hover:scale-110">
            <ArrowDownRight size={18} strokeWidth={2.5} />
          </span>
        </span>
      </button>
    </div>
  );
}
