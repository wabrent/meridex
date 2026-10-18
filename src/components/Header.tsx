import { ConnectKitButton } from 'connectkit';
import { Activity, Radio, Wallet } from 'lucide-react';
import BrandMark from './BrandMark';
import { robinhoodChain } from '../lib/chains';
import { fmtPct, fmtUsd } from '../lib/format';

interface HeaderProps {
  mrdexPrice: number;
  mrdexChange: number;
  demoBalance: number;
  walletBalance?: number;
  isConnected: boolean;
}

function Logo() {
  return (
    <a href="#/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
      <BrandMark className="h-9 w-9" />
      <div className="leading-none">
        <div className="font-display text-lg font-bold tracking-[0.18em] text-white">
          MERI<span className="text-accent2">DEX</span>
        </div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.3em] text-dim">PREDICTION TERMINAL</div>
      </div>
    </a>
  );
}

/** Fixed top bar: brand, network status, $MRDX ticker, wallet connect. */
export default function Header({ mrdexPrice, mrdexChange, demoBalance, walletBalance, isConnected }: HeaderProps) {
  const up = mrdexChange >= 0;
  return (
    <header className="sticky top-0 z-40 border-b border-ink-600 bg-ink-900/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <Logo />

        <div className="order-3 flex flex-1 items-center justify-start gap-2 md:order-2 md:justify-center lg:flex-none">
          {/* Live network pill */}
          <div className="flex items-center gap-2 rounded-full border border-ink-600 bg-[#07080a]/75 px-3 py-1.5 backdrop-blur-[48px] transition-colors hover:border-[#4d4e50]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
            </span>
            <Radio size={12} className="text-up" />
            <span className="font-mono text-[11px] font-medium tracking-wider text-white">
              {robinhoodChain.name}
            </span>
            <span className="hidden font-mono text-[10px] text-dim sm:inline">CH:{robinhoodChain.id}</span>
          </div>

          {/* $MRDX ticker */}
          <div className="flex items-center gap-2 rounded-full border border-[#ff6363]/40 bg-[#ff6363]/10 px-3 py-1.5 backdrop-blur-[48px]">
            <span className="rounded-full bg-[#ff6363] px-2 py-0.5 font-mono text-[9px] font-medium tracking-wider text-white">
              $MRDX
            </span>
            <span className="font-mono text-[12px] font-medium text-white">{fmtUsd(mrdexPrice, 4)}</span>
            <span className={`flex items-center gap-0.5 font-mono text-[11px] font-medium ${up ? 'text-up' : 'text-down'}`}>
              <Activity size={10} />
              {up ? '+' : ''}
              {fmtPct(mrdexChange, 2)}
            </span>
          </div>
        </div>

        {/* Wallet */}
        <div className="order-2 flex items-center gap-2 md:order-3">
          <div className="hidden items-center gap-2 rounded-full border border-ink-600 bg-[#07080a]/75 px-3 py-1.5 backdrop-blur-[48px] transition-colors hover:border-[#4d4e50] sm:flex">
            <Wallet size={13} className="text-muted" />
            <span className="font-mono text-[12px] font-medium text-white">
              {(isConnected ? (walletBalance ?? 0) : demoBalance).toFixed(3)}
            </span>
            <span className="font-mono text-[10px] text-dim">ETH</span>
            {!isConnected && (
              <span className="rounded-full border border-[#363739] bg-[#1b1c1e] px-1.5 py-px font-mono text-[8px] font-medium tracking-wider text-white">
                DEMO
              </span>
            )}
          </div>
          <ConnectKitButton />
        </div>
      </div>
    </header>
  );
}
