import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { Toast } from '../types';

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const TONE = {
  up: { Icon: CheckCircle2, cls: 'border-ink-600 bg-[#07080a]/80 text-up' },
  down: { Icon: AlertTriangle, cls: 'border-ink-600 bg-[#07080a]/80 text-down' },
  accent: { Icon: Info, cls: 'border-ink-600 bg-[#07080a]/80 text-accent2' },
} as const;

/** Bottom-right toast stack for bet confirms, copy events, tx feedback. */
export default function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,340px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const { Icon, cls } = TONE[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-card backdrop-blur-[48px] ${cls}`}
            >
              <Icon size={15} className="mt-px shrink-0" />
              <p className="flex-1 font-mono text-[11px] leading-snug text-white">{toast.message}</p>
              <button
                onClick={() => onDismiss(toast.id)}
                className="rounded p-0.5 text-dim transition-colors hover:text-white"
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
