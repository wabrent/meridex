import { ArrowDownRight, ArrowUpRight, CheckCircle2, Gift, XCircle } from 'lucide-react';
import type { Bet, UserState } from '../../types';
import { getPair } from '../../lib/pairs';
import { fmtEth, fmtPairPrice } from '../../lib/format';
import type { Round } from '../../types';

interface HistoryTabProps {
  user: UserState;
  roundsById: Map<number, Round>;
  onClaim: (roundId: number) => void;
}

/** Tab 3 — user bet history & PnL accounting. Borderless, hairline rows. */
export default function HistoryTab({ user, roundsById, onClaim }: HistoryTabProps) {
  const settled = user.bets.filter((b) => b.payout !== undefined);
  const wins = settled.filter((b) => b.won).length;
  const losses = settled.filter((b) => b.won === false).length;
  const netPnl = user.totalWon - user.totalStaked;
  const winRate = settled.length > 0 ? (wins / settled.length) * 100 : 0;

  const stats = [
    { label: 'TOTAL STAKED', value: fmtEth(user.totalStaked), tone: 'text-white' },
    { label: 'TOTAL WON', value: fmtEth(user.totalWon), tone: 'text-up' },
    {
      label: 'NET PNL',
      value: `${netPnl >= 0 ? '+' : ''}${fmtEth(netPnl)}`,
      tone: netPnl >= 0 ? 'text-up' : 'text-down',
    },
    { label: 'WIN RATE', value: `${winRate.toFixed(0)}% · ${wins}W/${losses}L`, tone: 'text-accent2' },
  ];

  return (
    <div className="space-y-6">
      {/* PnL stats — one row, hairline dividers */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
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

      {/* Bet ledger */}
      <div>
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
          <h3 className="font-display text-sm font-semibold tracking-tight text-white">BET LEDGER</h3>
          <span className="font-mono text-[9px] tracking-[0.18em] text-dim">{user.bets.length} ENTRIES</span>
        </div>

        {user.bets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Gift size={22} className="text-dim" />
            <p className="font-mono text-xs text-muted">No positions yet — fire a prediction above.</p>
            <p className="font-mono text-[10px] text-dim">Demo bankroll: {fmtEth(user.balance)} available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] font-mono text-[9px] tracking-[0.18em] text-dim">
                  <th className="py-2.5 pr-4 text-left">TIME</th>
                  <th className="py-2.5 pr-4 text-left">ROUND</th>
                  <th className="py-2.5 pr-4 text-left">PAIR</th>
                  <th className="py-2.5 pr-4 text-left">SIDE</th>
                  <th className="py-2.5 pr-4 text-right">STAKE</th>
                  <th className="py-2.5 pr-4 text-right">STRIKE</th>
                  <th className="py-2.5 pr-4 text-right">PAYOUT</th>
                  <th className="py-2.5 pr-4 text-right">RESULT</th>
                  <th className="py-2.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {user.bets.map((bet: Bet) => {
                  const round = roundsById.get(bet.roundId);
                  const settledBet = bet.payout !== undefined;
                  const pnl = settledBet && bet.won ? (bet.payout ?? 0) - bet.amount : settledBet ? -bet.amount : 0;
                  return (
                    <tr
                      key={bet.id}
                      className="border-b border-white/[0.04] font-mono text-[11px] transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5 pr-4 text-muted">
                        {new Date(bet.placedAt).toLocaleTimeString('en-US', { hour12: false })}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-white">#{bet.roundId}</td>
                      <td className="py-2.5 pr-4 text-muted">{round ? getPair(round.pair).short : '—'}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            bet.side === 'UP' ? 'text-up' : 'text-down'
                          }`}
                        >
                          {bet.side === 'UP' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {bet.side}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right text-white">{fmtEth(bet.amount)}</td>
                      <td className="py-2.5 pr-4 text-right text-muted">
                        {round?.strikePrice != null
                          ? fmtPairPrice(round.strikePrice, getPair(round.pair).digits)
                          : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-white">
                        {settledBet ? fmtEth(bet.payout ?? 0) : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        {!settledBet ? (
                          <span className="text-[#9c9c9d]">PENDING</span>
                        ) : bet.won === undefined ? (
                          <span className="text-muted">REFUND</span>
                        ) : bet.won ? (
                          <span className="font-semibold text-up">+{pnl.toFixed(4)}</span>
                        ) : (
                          <span className="font-semibold text-down">{pnl.toFixed(4)}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {settledBet && bet.won ? (
                          <button
                            onClick={() => onClaim(bet.roundId)}
                            className="inline-flex items-center gap-1 rounded-full border border-ink-600 px-2.5 py-1 text-[9px] font-medium text-[#e6e6e6] transition-all duration-200 hover:border-[#e6e6e6] hover:bg-[#e6e6e6] hover:text-[#454647]"
                          >
                            <CheckCircle2 size={10} /> CLAIM
                          </button>
                        ) : settledBet && bet.won === false ? (
                          <XCircle size={13} className="ml-auto text-down/60" />
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
