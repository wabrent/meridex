import { useMemo } from 'react';
import Header from '../components/Header';
import ChartPanel from '../components/ChartPanel';
import BettingBand from '../components/BettingBand';
import BottomSection, { type TabKey } from '../components/BottomSection';
import Footer from '../components/Footer';
import { getPair, type PairKey } from '../lib/pairs';
import { useRoundEngine } from '../hooks/useRoundEngine';
import type { PairFeed } from '../hooks/usePriceFeed';
import type { BetSide, PonsCurveState, Timeframe } from '../types';

interface TerminalPageProps {
  pair: PairKey;
  onPairChange: (pair: PairKey) => void;
  /** Reactive feed of the active market. */
  feed: PairFeed;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  engine: ReturnType<typeof useRoundEngine>;
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
  curve: PonsCurveState;
  mrdexChange: number;
  demoBalance: number;
  walletBalance?: number;
  isConnected: boolean;
  onPlaceBet: (side: BetSide, amount: number) => void;
  onClaim: (roundId: number) => void;
  onSimBuy: (eth: number) => void;
  onCopy: () => void;
}

/**
 * Terminal page (`#/terminal`) — full-width cinematic chart card with the
 * floating parimutuel betting band, then underline-tabbed market sections.
 */
export default function TerminalPage(props: TerminalPageProps) {
  const { pair, onPairChange, feed, timeframe, onTimeframeChange, engine, curve } = props;

  const myRoundStake = useMemo(
    () =>
      engine.round.bets
        .filter((b) => !b.isBot && b.roundId === engine.round.id)
        .reduce((sum, b) => sum + b.amount, 0),
    [engine.round],
  );

  const roundsById = useMemo(() => {
    const map = new Map<number, typeof engine.round>();
    for (const r of engine.history) map.set(r.id, r);
    map.set(engine.round.id, engine.round);
    return map;
  }, [engine.history, engine.round]);

  return (
    <div className="min-h-screen">
      <Header
        mrdexPrice={curve.priceUsd}
        mrdexChange={props.mrdexChange}
        demoBalance={props.demoBalance}
        walletBalance={props.walletBalance}
        isConnected={props.isConnected}
      />

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6">
        {/* Cinematic chart card + floating betting band */}
        <ChartPanel
          pair={pair}
          onPairChange={onPairChange}
          ticks={feed.ticks}
          price={feed.price}
          prevPrice={feed.prevPrice}
          timeframe={timeframe}
          onTimeframeChange={onTimeframeChange}
          round={engine.round}
          phase={engine.phase}
          timeLeft={engine.timeLeft}
          phaseProgress={engine.phaseProgress}
          participants={engine.round.bets.length}
          band={
            <BettingBand
              round={engine.round}
              phase={engine.phase}
              timeLeft={engine.timeLeft}
              balance={engine.user.balance}
              multiplierForSide={engine.multiplierForSide}
              onPlaceBet={props.onPlaceBet}
              myRoundStake={myRoundStake}
            />
          }
        />

        {/* Live Rounds · Pons Curve · History */}
        <BottomSection
          tab={props.tab}
          onTabChange={props.onTabChange}
          currentRound={engine.round}
          phase={engine.phase}
          timeLeft={engine.timeLeft}
          history={engine.history}
          curve={curve}
          user={engine.user}
          roundsById={roundsById}
          onCopy={props.onCopy}
          onSimBuy={props.onSimBuy}
          onClaim={props.onClaim}
        />

        <Footer />
      </main>

      {/* Active market readout for screen readers / quick context */}
      <span className="sr-only">{getPair(pair).label} market</span>
    </div>
  );
}
