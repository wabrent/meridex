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

function outcomeLabel(round: Round) {
  if (round.outcome === 'UP')
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-up">
        <ArrowUpRight size={12} /> UP
      </span>
    );
  if (round.outcome === 'DOWN')
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-down">
        <ArrowDownRight size={12} /> DOWN
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-muted">
      <Minus size={12} /> TIE
    </span>
  );
}

/** Tab 1 — active round pools, participants, and recent settlements. Borderless. */
export default function LiveRoundsTab({ currentRound, phase, history, timeLeft }: LiveRoundsTabProps) {
  const total = currentRound.poolUp + currentRound.poolDown;
  const upPct = total > 0 ? (currentRound.poolUp / total) * 100 : 50;
  const topBets = [...currentRound.bets].sort((a, b) => b.amount - a.amount).slice(0, 6);
  const digits = getPair(currentRound.pair).digits;

  const stats = [
    { label: 'POOL UP', value: fmtEth(currentRound.poolUp), tone: 'text-up' },
    { label: 'POOL DOWN', value: fmtEth(currentRound.poolDown), tone: 'text-down' },
    { label: 'TOTAL POOL', value: fmtEth(total), tone: 'text-white' },
    {
      label: 'STRIKE',
      value: currentRound.strikePrice !== null ? fmtPairPrice(currentRound.strikePrice, digits) : '—',
      tone: 'text-accent2',
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Active round */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <h3 className="font-display text-base font-semibold tracking-tight text-white">
              ROUND #{currentRound.id}
            </h3>
            <span className="font-mono text-[10px] font-semibold tracking-wide text-accent2">
              {getPair(currentRound.pair).label}
            </span>
            <span className="font-mono text-[10px] tracking-wide text-dim">
              {phase.replace('_', ' ')}
            </span>
          </div>
          <span className="font-mono text-xs text-muted">
            {phase === 'ACCEPTING_BETS'
              ? `closes in ${Math.ceil(timeLeft)}s`
              : `${phase.toLowerCase()} · ${Math.ceil(timeLeft)}s`}
          </span>
        </div>

        {/* Pool stats — one row, hairline dividers, no boxes */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`px-4 py-1 first:pl-0 ${i > 0 ? 'sm:border-l sm:border-white/[0.06]' : ''}`}
            >
              <div className="font-mono text-[9px] tracking-[0.18em] text-dim">{s.label}</div>
              <div className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${s.tone}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Distribution */}
        <div className="mt-5">
          <div className="mb-2 flex justify-between font-mono text-[10px]">
            <span className="font-semibold text-up">{upPct.toFixed(1)}% bullish</span>
            <span className="text-dim">pool distribution</span>
            <span className="font-semibold text-down">{(100 - upPct).toFixed(1)}% bearish</span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-down/40">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-up shadow-[0_0_16px_rgba(89,212,153,0.55)]"
              animate={{ width: `${upPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Participants — hairline rows */}
        <div className="mt-5 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-dim">
          <Users size={12} className="text-accent2" />
          {currentRound.bets.length} PARTICIPANTS
        </div>
        <div className="mt-1">
          {topBets.length === 0 && (
            <div className="py-6 text-center font-mono text-[11px] text-dim">
              waiting for degens to enter the pool…
            </div>
          )}
          {topBets.map((bet) => (
            <div
              key={bet.id}
              className="-mx-2 flex items-center justify-between rounded-lg border-b border-white/[0.05] px-2 py-2.5 transition-colors last:border-0 hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full ring-1 ${
                    bet.side === 'UP'
                      ? 'bg-up/10 text-up ring-up/25'
                      : 'bg-down/10 text-down ring-down/25'
                  }`}
                >
                  {bet.side === 'UP' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                </span>
                <span className="font-mono text-xs text-white">
                  {bet.isBot ? shortAddress(bet.user) : 'YOU'}
                </span>
                {!bet.isBot && (
                  <span className="font-mono text-[9px] font-semibold tracking-wide text-accent2">
                    OPERATOR
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-white">
                {fmtEth(bet.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement feed — separated by a hairline, not a box */}
      <div className="lg:border-l lg:border-white/[0.06] lg:pl-6">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
          <h3 className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight text-white">
            <Trophy size={14} className="text-[#e6e6e6]" /> SETTLEMENTS
          </h3>
          <span className="font-mono text-[9px] tracking-[0.18em] text-dim">LATEST 12</span>
        </div>
        <div>
          {history.slice(0, 12).map((round) => (
            <div
              key={round.id}
              className="-mx-2 flex items-center justify-between gap-2 rounded-lg border-b border-white/[0.05] px-2 py-2.5 transition-colors last:border-0 hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <span className="font-mono text-xs font-semibold text-white">
                  #{round.id}{' '}
                  <span className="font-normal text-dim">{getPair(round.pair).short}</span>
                </span>
                <div className="font-mono text-[10px] text-dim">
                  {round.strikePrice !== null ? fmtPairPrice(round.strikePrice, getPair(round.pair).digits) : '—'}
                  {' → '}
                  {round.settlePrice !== null ? fmtPairPrice(round.settlePrice, getPair(round.pair).digits) : '—'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {outcomeLabel(round)}
                <span className="font-mono text-[10px] text-muted">{fmtEth(round.poolUp + round.poolDown)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
