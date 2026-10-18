import { AnimatePresence, motion } from 'framer-motion';
import { Activity, LineChart, Wallet2 } from 'lucide-react';
import LiveRoundsTab from './tabs/LiveRoundsTab';
import PonsCurveTab from './tabs/PonsCurveTab';
import HistoryTab from './tabs/HistoryTab';
import type { PonsCurveState, Round, RoundPhase, UserState } from '../types';

export type TabKey = 'live' | 'pons' | 'history';

interface BottomSectionProps {
  /** Controlled tab state (lets the landing page deep-link into a tab). */
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
  currentRound: Round;
  phase: RoundPhase;
  timeLeft: number;
  history: Round[];
  curve: PonsCurveState;
  user: UserState;
  roundsById: Map<number, Round>;
  onCopy: (text: string) => void;
  onSimBuy: (eth: number) => void;
  onClaim: (roundId: number) => void;
}

/** Bottom area: Live Rounds · $MRDX Pons Curve · Bet History & PnL.
 *  Underline-style left-aligned tabs (Claude reference), Mist active accent. */
export default function BottomSection(props: BottomSectionProps) {
  const tab = props.tab;

  const tabs: { key: TabKey; label: string; icon: typeof Activity; badge?: string }[] = [
    { key: 'live', label: 'LIVE ROUNDS', icon: Activity, badge: `${props.currentRound.bets.length}` },
    { key: 'pons', label: '$MRDX PONS CURVE', icon: LineChart, badge: `${(props.curve.progress * 100).toFixed(0)}%` },
    { key: 'history', label: 'HISTORY & PNL', icon: Wallet2, badge: `${props.user.bets.length}` },
  ];

  return (
    <div id="tabs" className="mt-6 scroll-mt-24">
      {/* Underline tab rail */}
      <div className="flex items-center gap-5 overflow-x-auto border-b border-white/[0.07] px-1 sm:gap-7 sm:px-4">
        {tabs.map(({ key, label, icon: Icon, badge }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => props.onTabChange(key)}
              className={`relative -mb-px flex items-center gap-2 whitespace-nowrap pb-3 pt-1 font-display text-sm font-medium transition-colors duration-200 ${
                active ? 'text-white' : 'text-muted hover:text-white'
              }`}
            >
              <Icon size={14} className={active ? 'text-accent2' : 'text-dim'} />
              {label}
              {badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-px font-mono text-[10px] font-medium ${
                    active ? 'bg-white/10 text-white' : 'bg-ink-700 text-dim'
                  }`}
                >
                  {badge}
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="tabUnderline"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent2"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab body — content sits directly on the canvas, no box */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'live' && (
              <LiveRoundsTab
                currentRound={props.currentRound}
                phase={props.phase}
                history={props.history}
                timeLeft={props.timeLeft}
              />
            )}
            {tab === 'pons' && (
              <PonsCurveTab curve={props.curve} onCopy={props.onCopy} onSimBuy={props.onSimBuy} />
            )}
            {tab === 'history' && (
              <HistoryTab user={props.user} roundsById={props.roundsById} onClaim={props.onClaim} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
