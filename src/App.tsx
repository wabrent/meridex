import { useEffect, useRef, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import LandingPage from './pages/LandingPage';
import TerminalPage from './pages/TerminalPage';
import Toaster from './components/Toaster';
import type { HeroTarget } from './components/LandingHero';
import type { TabKey } from './components/BottomSection';
import { useMarketFeed } from './hooks/usePriceFeed';
import { useRoundEngine } from './hooks/useRoundEngine';
import { useMrdexBadge, usePonsCurve } from './hooks/usePonsCurve';
import { useToasts } from './hooks/useToasts';
import { useMeridexContract } from './hooks/useMeridexContract';
import { MERIDEX_ADDRESS, isDemoAddress } from './contracts';
import { getPair, type PairKey } from './lib/pairs';
import type { BetSide, Timeframe } from './types';

/**
 * Hash-based routing — the landing hero and the terminal are separate pages:
 *   #/                → landing (video hero)
 *   #/terminal        → terminal (default tab: live)
 *   #/terminal/pons   → terminal, deep-linked into the $MRDX tab
 *   #/terminal/history→ terminal, deep-linked into the history tab
 */
type Route = { page: 'landing' } | { page: 'terminal'; tab: TabKey };

function parseRoute(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw.startsWith('terminal')) return { page: 'landing' };
  const seg = raw.split('/')[1];
  const tab: TabKey = seg === 'pons' || seg === 'history' ? seg : 'live';
  return { page: 'terminal', tab };
}

const NAV_HASH: Record<HeroTarget, string> = {
  terminal: '#/terminal',
  live: '#/terminal/live',
  pons: '#/terminal/pons',
  history: '#/terminal/history',
};

export default function App() {
  // --- live market feeds (all pairs tick together) ---
  const { refs: priceRefs, markets } = useMarketFeed();
  const [pair, setPair] = useState<PairKey>('ETHUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const feed = markets[pair];

  // --- routing ---
  const [route, setRoute] = useState<Route>(parseRoute);
  const prevPageRef = useRef<Route['page']>(route.page);

  useEffect(() => {
    const onHash = () => {
      const next = parseRoute();
      const pageChanged = prevPageRef.current !== next.page;
      prevPageRef.current = next.page;
      setRoute(next);
      if (pageChanged) {
        window.requestAnimationFrame(() => {
          if (next.page === 'terminal' && next.tab !== 'live') {
            document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0 });
          }
        });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Deep link on first paint (e.g. reload directly on #/terminal/pons).
  useEffect(() => {
    const initial = parseRoute();
    if (initial.page === 'terminal' && initial.tab !== 'live') {
      window.requestAnimationFrame(() => {
        document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  // --- round state machine (ACCEPTING_BETS → LOCKED → CALCULATING → SETTLED) ---
  const engine = useRoundEngine(priceRefs, timeframe, pair);

  // --- $MRDX / Pons curve ---
  const curve = usePonsCurve();
  const mrdex = useMrdexBadge(curve.priceUsd);

  // --- toasts ---
  const { toasts, push, dismiss } = useToasts();

  // --- web3 ---
  const { isConnected } = useAccount();
  const { data: walletBalance } = useBalance();
  const meridex = useMeridexContract();

  const handleHeroNav = (target: HeroTarget) => {
    window.location.hash = NAV_HASH[target];
  };

  const handleTabChange = (tab: TabKey) => {
    window.location.hash = `#/terminal/${tab}`;
  };

  const handlePairChange = (next: PairKey) => {
    if (next === pair) return;
    setPair(next);
    push(`Market switched to ${getPair(next).label}`, 'accent');
  };

  /** Local engine entry + optional on-chain enterPosition relay. */
  const handlePlaceBet = (side: BetSide, amount: number) => {
    try {
      const roundId = engine.round.id;
      engine.placeBet(side, amount);
      push(
        `Position entered: ${amount} ETH on ${side} · ${getPair(pair).short} round #${roundId}`,
        side === 'UP' ? 'up' : 'down',
      );
      if (isConnected && !isDemoAddress(MERIDEX_ADDRESS)) {
        meridex
          .enterPosition(roundId, side === 'UP', amount)
          .then((hash) => push(`enterPosition tx: ${hash.slice(0, 14)}…`, 'accent'))
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message.slice(0, 80) : 'rpc unavailable';
            push(`On-chain relay failed (${msg}) — demo position kept`, 'down');
          });
      }
    } catch (err) {
      push(err instanceof Error ? err.message : 'Bet rejected', 'down');
    }
  };

  /** claimReward demo — real tx when a wallet + deployed address are present. */
  const handleClaim = (roundId: number) => {
    if (isConnected && !isDemoAddress(MERIDEX_ADDRESS)) {
      meridex
        .claimReward(roundId)
        .then((hash) => push(`claimReward(#${roundId}) tx: ${hash.slice(0, 14)}…`, 'accent'))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message.slice(0, 80) : 'rpc unavailable';
          push(`claimReward failed (${msg}) — payout already credited locally`, 'down');
        });
    } else {
      push(`claimReward(${roundId}) — payout already credited (demo mode)`, 'accent');
    }
  };

  const handleSimBuy = (eth: number) => {
    const { tokens, progressAfter } = curve.buy(eth);
    push(
      `Bought ${(tokens / 1e6).toFixed(2)}M $MRDX with ${eth} ETH — curve at ${(progressAfter * 100).toFixed(2)}%`,
      'up',
    );
  };

  return (
    <div className="relative min-h-screen bg-ink-900 font-display text-white">
      {/* Ambient light — soft glows instead of a grid */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[1100px] -translate-x-1/2 rounded-full bg-white/[0.045] blur-[150px]" />
        <div className="absolute -left-48 top-1/3 h-[420px] w-[420px] rounded-full bg-up/[0.05] blur-[160px]" />
        <div className="absolute -right-48 top-1/2 h-[420px] w-[420px] rounded-full bg-down/[0.05] blur-[160px]" />
      </div>

      <div className="relative z-10">
        {route.page === 'landing' ? (
          <LandingPage onNavigate={handleHeroNav} />
        ) : (
          <TerminalPage
            pair={pair}
            onPairChange={handlePairChange}
            feed={feed}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            engine={engine}
            tab={route.tab}
            onTabChange={handleTabChange}
            curve={curve}
            mrdexChange={mrdex.change24h}
            demoBalance={engine.user.balance}
            walletBalance={walletBalance ? Number(walletBalance.formatted) : undefined}
            isConnected={isConnected}
            onPlaceBet={handlePlaceBet}
            onClaim={handleClaim}
            onSimBuy={handleSimBuy}
            onCopy={() => push('$MRDX contract address copied to clipboard', 'accent')}
          />
        )}
      </div>

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
