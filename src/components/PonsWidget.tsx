import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink, Flame, Rocket } from 'lucide-react';
import type { PonsCurveState } from '../types';
import { MRDX_ADDRESS, PONS_SWAP_URL, isDemoAddress } from '../contracts';
import { fmtCompactUsd, fmtEth, fmtUsd, shortAddress } from '../lib/format';

interface PonsWidgetProps {
  curve: PonsCurveState;
  onCopy: (text: string) => void;
  onSimBuy?: (eth: number) => void;
  compact?: boolean;
}

/**
 * Pons $MRDX widget — contract address (one-click copy), live bonding-curve
 * progress, market cap, and a direct swap link out to the Pons launchpad.
 * Borderless: hairline stats, light does the layering.
 */
export default function PonsWidget({ curve, onCopy, onSimBuy, compact = false }: PonsWidgetProps) {
  const [copied, setCopied] = useState(false);
  const pct = curve.progress * 100;
  const soldOut = curve.progress >= 1;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MRDX_ADDRESS);
    } catch {
      /* clipboard may be unavailable — still show feedback */
    }
    setCopied(true);
    onCopy(MRDX_ADDRESS);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Token identity */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#e6e6e6] font-display text-base font-semibold text-[#454647] shadow-[0_0_36px_-6px_rgba(230,230,230,0.45)]">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-semibold tracking-tight text-white">$MRDX</span>
              <span className="font-mono text-[9px] font-semibold tracking-[0.18em] text-dim">PONS CURVE</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <code className="max-w-[160px] truncate font-mono text-[10px] text-muted sm:max-w-none">
                {shortAddress(MRDX_ADDRESS, 8)}
              </code>
              <button
                onClick={copy}
                aria-label="Copy $MRDX contract address"
                className="rounded p-1 text-muted transition-colors hover:bg-ink-700 hover:text-white"
              >
                {copied ? <Check size={12} className="text-up" /> : <Copy size={12} />}
              </button>
              {isDemoAddress(MRDX_ADDRESS) && (
                <span className="rounded-full border border-[#363739] bg-[#1b1c1e] px-1.5 py-px font-mono text-[8px] font-medium text-white">
                  SET VITE_MRDX_TOKEN_ADDRESS
                </span>
              )}
            </div>
          </div>
        </div>

        <a
          href={PONS_SWAP_URL}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 rounded-full bg-[#e6e6e6] px-4 py-2 font-display text-[12px] font-semibold tracking-tight text-[#0b0c0d] transition-all duration-200 hover:bg-white"
        >
          <Rocket size={14} />
          BUY ON PONS
          <ExternalLink size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
      </div>

      {/* Curve progress */}
      <div>
        <div className="mb-2 flex items-end justify-between">
          <div>
            <div className="font-mono text-[9px] font-medium tracking-[0.18em] text-dim">BONDING CURVE PROGRESS</div>
            <div className="mt-0.5 font-mono text-3xl font-semibold tabular-nums text-white">
              {pct.toFixed(2)}
              <span className="text-lg text-muted">%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] font-medium tracking-[0.18em] text-dim">PRICE</div>
            <div className="mt-0.5 font-mono text-xl font-semibold text-up">{fmtUsd(curve.priceUsd, 5)}</div>
          </div>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-[#e6e6e6] shadow-[0_0_26px_rgba(230,230,230,0.4)]"
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[9px] tracking-wide text-dim">
          <span>
            {fmtEth(curve.raisedEth)} / {fmtEth(curve.hardCapEth)} RAISED
          </span>
          <span className="hidden sm:inline">LISTING @ {fmtUsd(0.001, 4)}</span>
          <span>{fmtEth(Math.max(0, curve.hardCapEth - curve.raisedEth))} REMAINING</span>
        </div>
      </div>

      {/* Stats — hairline row, no boxes */}
      {!compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[
            { label: 'MARKET CAP', value: fmtCompactUsd(curve.marketCapUsd), tone: 'text-white' },
            { label: 'RAISED', value: `${curve.raisedEth.toFixed(2)} ETH`, tone: 'text-white' },
            { label: 'SOLD', value: `${(curve.soldTokens / 1e6).toFixed(1)}M`, tone: 'text-white' },
            { label: '24H', value: soldOut ? 'SOLD OUT' : 'PUMPING', tone: 'text-up' },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`px-4 py-1 first:pl-0 ${i > 0 ? 'sm:border-l sm:border-white/[0.06]' : ''}`}
            >
              <div className="font-mono text-[9px] tracking-[0.18em] text-dim">{s.label}</div>
              <div className={`mt-1 font-mono text-xl font-semibold tabular-nums ${s.tone}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Simulated buy row (demo) */}
      {onSimBuy && (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.18em] text-dim">
            <Flame size={11} className="text-dim" /> DEMO FILLS
          </span>
          {[0.05, 0.25, 1].map((eth) => (
            <button
              key={eth}
              onClick={() => onSimBuy(eth)}
              disabled={soldOut}
              className="rounded-full border border-ink-600 px-2.5 py-1 font-mono text-[10px] font-medium text-[#9c9c9d] transition-all duration-200 hover:border-[#e6e6e6] hover:bg-[#e6e6e6] hover:text-[#454647] disabled:opacity-40"
            >
              +{eth} ETH
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
