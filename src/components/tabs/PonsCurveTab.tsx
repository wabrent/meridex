import PonsWidget from '../PonsWidget';
import type { PonsCurveState } from '../../types';

interface PonsCurveTabProps {
  curve: PonsCurveState;
  onCopy: (text: string) => void;
  onSimBuy: (eth: number) => void;
}

/** Tab 2 — $MRDX Pons bonding curve tracker. */
export default function PonsCurveTab({ curve, onCopy, onSimBuy }: PonsCurveTabProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <PonsWidget curve={curve} onCopy={onCopy} onSimBuy={onSimBuy} />

      {/* Revenue / fee flow explainer */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-ink-600 bg-[#07080a]/75 p-4 shadow-card backdrop-blur-[48px]">
          <h3 className="font-display text-sm font-medium tracking-tight text-white">PROTOCOL REVENUE</h3>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted">
            Every settled round skims a <span className="text-up">2% protocol fee</span> from the winning
            pool. Fees are swept to the treasury and converted into <span className="text-accent2">$MRDX</span>,
            linking terminal volume directly to token demand.
          </p>
          <div className="mt-3 space-y-2">
            {[
              { label: 'Round fees → treasury', value: '2.0%', color: 'text-up', width: '40%' },
              { label: 'Treasury → $MRDX buybacks', value: '60%', color: 'text-accent2', width: '60%' },
              { label: 'LP / insurance reserve', value: '40%', color: 'text-[#9c9c9d]', width: '40%' },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between font-mono text-[10px]">
                  <span className="text-muted">{row.label}</span>
                  <span className={`font-bold ${row.color}`}>{row.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-600">
                  <div className={`h-full rounded-full ${row.color.replace('text-', 'bg-')}`} style={{ width: row.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-ink-600 bg-[#07080a]/75 p-4 shadow-card backdrop-blur-[48px]">
          <div className="font-mono text-[9px] font-medium tracking-wider text-[#9c9c9d]">WHY $MRDX</div>
          <ul className="mt-2 space-y-2 font-mono text-[11px] leading-relaxed text-muted">
            <li className="flex gap-2">
              <span className="text-dim">▸</span> Fee-share snapshots for holders above 100K $MRDX.
            </li>
            <li className="flex gap-2">
              <span className="text-dim">▸</span> Round multiplier boosts paid in $MRDX.
            </li>
            <li className="flex gap-2">
              <span className="text-dim">▸</span> Governance over new oracle pairs &amp; timeframes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
