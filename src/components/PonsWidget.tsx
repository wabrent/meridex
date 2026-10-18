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
    <div className="rounded-xl border border-ink-600 bg-[#07080a]/75 p-4 shadow-card backdrop-blur-[48px]">
      {/* Token identity */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e6e6e6] font-display text-sm font-medium text-[#454647]">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-medium tracking-tight text-white">$MRDX</span>
              <span className="rounded-full border border-ink-600 bg-ink-700 px-2 py-px font-mono text-[9px] font-medium tracking-wide text-[#9c9c9d]">
                PONS CURVE
              </span>
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
          className="group flex items-center gap-2 rounded-full border border-up/45 bg-up/10 px-4 py-2 font-display text-[12px] font-medium tracking-tight text-up transition-all duration-200 hover:bg-up/20"
        >
          <Rocket size={14} />
          BUY ON PONS
          <ExternalLink size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
      </div>

      {/* Curve progress */}
      <div className="mt-4">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <div className="font-mono text-[9px] font-medium tracking-wider text-dim">BONDING CURVE PROGRESS</div>
            <div className="mt-0.5 font-mono text-xl font-medium text-white">
              {pct.toFixed(2)}
              <span className="text-sm text-muted">%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] font-medium tracking-wider text-dim">PRICE</div>
            <div className="mt-0.5 font-mono text-base font-medium text-up">{fmtUsd(curve.priceUsd, 5)}</div>
          </div>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-ink-700">
          <motion.div
            className="h-full rounded-full bg-[#e6e6e6]"
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[9px] text-dim">
          <span>
            {fmtEth(curve.raisedEth)} / {fmtEth(curve.hardCapEth)} ETH RAISED
          </span>
          <span className="hidden sm:inline">LISTING @ {fmtUsd(0.001, 4)}</span>
          <span>{fmtEth(Math.max(0, curve.hardCapEth - curve.raisedEth))} REMAINING</span>
        </div>
      </div>

      {/* Stats grid */}
      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5">
            <div className="font-mono text-[9px] tracking-widest text-dim">MARKET CAP</div>
            <div className="mt-0.5 font-mono text-sm font-bold text-white">{fmtCompactUsd(curve.marketCapUsd)}</div>
          </div>
          <div className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5">
            <div className="font-mono text-[9px] tracking-widest text-dim">RAISED</div>
            <div className="mt-0.5 font-mono text-sm font-bold text-white">
              {curve.raisedEth.toFixed(2)} ETH
            </div>
          </div>
          <div className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5">
            <div className="font-mono text-[9px] tracking-widest text-dim">SOLD</div>
            <div className="mt-0.5 font-mono text-sm font-bold text-white">
              {(curve.soldTokens / 1e6).toFixed(1)}M
            </div>
          </div>
          <div className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5">
            <div className="font-mono text-[9px] tracking-widest text-dim">24H</div>
            <div className="mt-0.5 font-mono text-sm font-bold text-up">{soldOut ? 'SOLD OUT' : 'PUMPING'}</div>
          </div>
        </div>
      )}

      {/* Simulated buy row (demo) */}
      {onSimBuy && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-ink-600 bg-ink-900/60 px-3 py-2.5">
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-dim">
            <Flame size={11} className="text-dim" /> DEMO FILLS
          </span>
          {[0.05, 0.25, 1].map((eth) => (
            <button
              key={eth}
              onClick={() => onSimBuy(eth)}
              disabled={soldOut}
              className="rounded-full border border-ink-600 bg-ink-800 px-2.5 py-1 font-mono text-[10px] font-medium text-[#9c9c9d] transition-all duration-200 hover:border-[#e6e6e6] hover:bg-[#e6e6e6] hover:text-[#454647] disabled:opacity-40"
            >
              +{eth} ETH
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
