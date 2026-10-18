import { motion } from 'framer-motion';
import { Users, ArrowUpRight, ArrowDownRight, Trophy, Minus } from 'lucide-react';
import type { Round, RoundPhase } from '../../types';
import { getPair } from '../../lib/pairs';
import { fmtEth, fmtPairPrice, shortAddress } from '../../lib/format';

interface LiveRoundsTabProps {
  currentRound: Round;
  phase: RoundPhase;
  history: Round[];
  timeLeft: number;
}

function outcomeBadge(round: Round) {
  if (round.outcome === 'UP')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-up/40 bg-up/10 px-2 py-0.5 font-mono text-[10px] font-medium text-up">
        <ArrowUpRight size={11} /> UP
      </span>
    );
  if (round.outcome === 'DOWN')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-down/40 bg-down/10 px-2 py-0.5 font-mono text-[10px] font-medium text-down">
        <ArrowDownRight size={11} /> DOWN
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink-500 bg-ink-700 px-2 py-0.5 font-mono text-[10px] font-medium text-muted">
      <Minus size={11} /> TIE
    </span>
  );
}

/** Tab 1 — active round pools, participants, and recent settlements. */
export default function LiveRoundsTab({ currentRound, phase, history, timeLeft }: LiveRoundsTabProps) {
  const total = currentRound.poolUp + currentRound.poolDown;
  const upPct = total > 0 ? (currentRound.poolUp / total) * 100 : 50;
  const topBets = [...currentRound.bets].sort((a, b) => b.amount - a.amount).slice(0, 6);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Active round card */}
      <div className="rounded-xl border border-ink-600 bg-[#07080a]/75 p-4 shadow-card backdrop-blur-[48px]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <h3 className="font-display text-sm font-medium tracking-tight text-white">
              ROUND #{currentRound.id}
            </h3>
            <span className="rounded-full border border-ink-500 bg-ink-700 px-2 py-px font-mono text-[9px] font-medium tracking-wide text-accent2">
              {getPair(currentRound.pair).label}
            </span>
            <span className="rounded-full border border-ink-600 bg-ink-700 px-2 py-px font-mono text-[9px] font-medium tracking-wide text-muted">
              {phase}
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted">
            {phase === 'ACCEPTING_BETS' ? `closes in ${Math.ceil(timeLeft)}s` : `${phase.toLowerCase()} · ${Math.ceil(timeLeft)}s`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-up/30 bg-up/5 px-3 py-2.5">
            <div className="font-mono text-[9px] tracking-widest text-up">POOL UP</div>
            <div className="mt-0.5 font-mono text-base font-bold text-white">{fmtEth(currentRound.poolUp)}</div>
          </div>
          <div className="rounded-lg border border-down/30 bg-down/5 px-3 py-2.5">
            <div className="font-mono text-[9px] tracking-widest text-down">POOL DOWN</div>
            <div className="mt-0.5 font-mono text-base font-bold text-white">{fmtEth(currentRound.poolDown)}</div>
          </div>
          <div className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5">
            <div className="font-mono text-[9px] tracking-widest text-dim">TOTAL POOL</div>
            <div className="mt-0.5 font-mono text-base font-bold text-white">{fmtEth(total)}</div>
          </div>
          <div className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5">
            <div className="font-mono text-[9px] tracking-widest text-dim">STRIKE</div>
            <div className="mt-0.5 font-mono text-base font-bold text-accent2">
              {currentRound.strikePrice !== null
                ? fmtPairPrice(currentRound.strikePrice, getPair(currentRound.pair).digits)
                : '—'}
            </div>
          </div>
        </div>

        {/* Distribution bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between font-mono text-[10px]">
            <span className="text-up">{upPct.toFixed(1)}% bullish</span>
            <span className="text-dim">pool distribution</span>
            <span className="text-down">{(100 - upPct).toFixed(1)}% bearish</span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-down/60">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-up"
              animate={{ width: `${upPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Participants */}
        <div className="mt-4 flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted">
          <Users size={12} className="text-accent2" />
          {currentRound.bets.length} PARTICIPANTS
        </div>
        <div className="mt-2 space-y-1.5">
          {topBets.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-600 px-3 py-4 text-center font-mono text-[11px] text-dim">
              Waiting for degens to enter the pool…
            </div>
          )}
          {topBets.map((bet) => (
            <div
              key={bet.id}
              className="flex items-center justify-between rounded-lg border border-ink-600/70 bg-ink-900 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    bet.side === 'UP' ? 'bg-up/15 text-up' : 'bg-down/15 text-down'
                  }`}
                >
                  {bet.side === 'UP' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                </span>
                <span className="font-mono text-[11px] text-white">
                  {bet.isBot ? shortAddress(bet.user) : 'YOU'}
                </span>
                {!bet.isBot && (
                  <span className="rounded-full bg-accent/20 px-1.5 py-px font-mono text-[8px] font-medium text-accent2">
                    OPERATOR
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] font-bold text-white">{fmtEth(bet.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement feed */}
      <div className="rounded-xl border border-ink-600 bg-[#07080a]/75 p-4 shadow-card backdrop-blur-[48px]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-sm font-medium tracking-tight text-white">
            <Trophy size={14} className="text-[#e6e6e6]" /> SETTLEMENTS
          </h3>
          <span className="font-mono text-[9px] tracking-wider text-dim">LATEST 12</span>
        </div>
        <div className="space-y-2">
          {history.slice(0, 12).map((round) => (
            <div
              key={round.id}
              className="flex items-center justify-between rounded-lg border border-ink-600/70 bg-ink-900 px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="font-mono text-[11px] font-bold text-white">
                  #{round.id}{' '}
                  <span className="font-normal text-dim">{getPair(round.pair).short}</span>
                </span>
                <span className="font-mono text-[9px] text-dim">
                  {round.strikePrice !== null
                    ? fmtPairPrice(round.strikePrice, getPair(round.pair).digits)
                    : '—'}{' '}
                  →{' '}
                  {round.settlePrice !== null
                    ? fmtPairPrice(round.settlePrice, getPair(round.pair).digits)
                    : '—'}
                </span>
              </div>
              {outcomeBadge(round)}
              <span className="font-mono text-[10px] text-muted">{fmtEth(round.poolUp + round.poolDown)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
