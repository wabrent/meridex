/** Shared site footer — brand line + protocol links. */
export default function Footer() {
  return (
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-600/70 py-5 font-mono text-[10px] tracking-wider text-dim">
      <span>
        MERIDEX © 2026 — BINARY OPTIONS &amp; PREDICTION TERMINAL ON ROBINHOOD CHAIN
      </span>
      <span className="flex flex-wrap items-center gap-3">
        <span>PROTOCOL FEE 2%</span>
        <span className="text-ink-500">|</span>
        <span>$MRDX POWERED</span>
        <span className="text-ink-500">|</span>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-white"
        >
          CHARTS BY TRADINGVIEW
        </a>
        <span className="text-ink-500">|</span>
        <span className="text-dim">DEMO FEEDS · NOT FINANCIAL ADVICE</span>
      </span>
    </footer>
  );
}
