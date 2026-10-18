import { useEffect, useRef } from 'react';
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { RoundPhase, Timeframe } from '../types';
import type { PriceTick } from '../hooks/usePriceFeed';

interface Candle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

const BUCKET: Record<Timeframe, number> = { '1m': 5, '5m': 10 };
const MAX_CANDLES = 600;
const VISIBLE_BARS = 42;

function bucketOf(timeSec: number, bucket: number) {
  return Math.floor(timeSec / bucket) * bucket;
}

function buildCandles(ticks: PriceTick[], bucket: number): Candle[] {
  const out: Candle[] = [];
  for (const tick of ticks) {
    const t = bucketOf(tick.time, bucket) as UTCTimestamp;
    const last = out[out.length - 1];
    if (last && last.time === t) {
      last.close = tick.price;
      last.high = Math.max(last.high, tick.price);
      last.low = Math.min(last.low, tick.price);
    } else {
      out.push({
        time: t,
        open: last ? last.close : tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
      });
    }
  }
  return out;
}

interface PriceChartProps {
  ticks: PriceTick[];
  timeframe: Timeframe;
  /** Active market key — changing it rebuilds the series from scratch. */
  pairKey: string;
  /** Price precision (decimal places) for the active market. */
  digits: number;
  /** Frozen strike for the active round; null while ACCEPTING_BETS. */
  strikePrice: number | null;
  /** Live price relative to strike — drives the green/red tint. */
  aboveStrike: boolean;
  phase: RoundPhase;
}

/**
 * TradingView Lightweight Chart with:
 *  - live candles (1m / 5m aggregation), rebuilt when the market switches
 *  - horizontal Strike Price overlay line
 *  - dynamic emerald/coral tint driven by live price vs strike
 */
export default function PriceChart({
  ticks,
  timeframe,
  pairKey,
  digits,
  strikePrice,
  aboveStrike,
  phase,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const strikeLineRef = useRef<IPriceLine | null>(null);
  const candlesRef = useRef<Candle[]>([]);
  const builtKeyRef = useRef<string | null>(null);

  // --- create chart (once) ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9c9c9d',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(54, 55, 57, 0.45)' },
        horzLines: { color: 'rgba(54, 55, 57, 0.45)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(230, 230, 230, 0.45)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#454647' },
        horzLine: { color: 'rgba(230, 230, 230, 0.45)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#454647' },
      },
      rightPriceScale: {
        borderColor: '#363739',
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderColor: '#363739',
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 4,
        barSpacing: 8,
      },
      handleScroll: true,
      handleScale: true,
    });
    const series = chart.addCandlestickSeries({
      upColor: '#59d499',
      downColor: '#ff6363',
      borderUpColor: '#59d499',
      borderDownColor: '#ff6363',
      wickUpColor: 'rgba(89, 212, 153, 0.8)',
      wickDownColor: 'rgba(255, 99, 99, 0.8)',
      priceLineColor: aboveStrike ? '#59d499' : '#ff6363',
      priceLineStyle: LineStyle.Dotted,
      priceLineWidth: 1,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      strikeLineRef.current = null;
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      candlesRef.current = [];
      builtKeyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- feed data (incremental updates; full rebuild on pair/timeframe switch) ---
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || ticks.length === 0) return;
    const bucket = BUCKET[timeframe];
    const buildKey = `${pairKey}|${bucket}`;
    const rebuild = builtKeyRef.current !== buildKey;

    if (rebuild) {
      builtKeyRef.current = buildKey;
      series.applyOptions({
        priceFormat: { type: 'price', precision: digits, minMove: Number((10 ** -digits).toFixed(digits)) },
      });
      candlesRef.current = buildCandles(ticks, bucket);
      series.setData(candlesRef.current);
      const len = candlesRef.current.length;
      chart.timeScale().setVisibleLogicalRange({
        from: Math.max(0, len - VISIBLE_BARS),
        to: len + 4,
      });
      return;
    }

    const last = ticks[ticks.length - 1];
    const t = bucketOf(last.time, bucket) as UTCTimestamp;
    const candles = candlesRef.current;
    const tip = candles[candles.length - 1];

    if (candles.length >= MAX_CANDLES) {
      candlesRef.current = buildCandles(ticks, bucket);
      series.setData(candlesRef.current);
      return;
    }

    if (tip && tip.time === t) {
      tip.close = last.price;
      tip.high = Math.max(tip.high, last.price);
      tip.low = Math.min(tip.low, last.price);
      series.update(tip);
    } else {
      const candle: Candle = {
        time: t,
        open: tip ? tip.close : last.price,
        high: last.price,
        low: last.price,
        close: last.price,
      };
      candles.push(candle);
      series.update(candle);
    }
  }, [ticks, timeframe, pairKey, digits]);

  // --- strike overlay line ---
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    if (strikeLineRef.current) {
      series.removePriceLine(strikeLineRef.current);
      strikeLineRef.current = null;
    }
    if (strikePrice !== null && Number.isFinite(strikePrice)) {
      strikeLineRef.current = series.createPriceLine({
        price: strikePrice,
        color: aboveStrike ? '#59d499' : '#ff6363',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'STRIKE',
      });
    }
  }, [strikePrice, aboveStrike, timeframe]);

  // --- live price line color follows the tint ---
  useEffect(() => {
    seriesRef.current?.applyOptions({
      priceLineColor: aboveStrike ? '#59d499' : '#ff6363',
    });
  }, [aboveStrike]);

  const locked = phase !== 'ACCEPTING_BETS';

  return (
    <div className="absolute inset-0">
      {/* Dynamic tint layers */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          locked ? (aboveStrike ? 'opacity-100' : 'opacity-100') : 'opacity-40'
        }`}
        style={{
          background: locked
            ? aboveStrike
              ? 'radial-gradient(120% 90% at 50% 110%, rgba(89,212,153,0.10), transparent 60%)'
              : 'radial-gradient(120% 90% at 50% 110%, rgba(255,99,99,0.10), transparent 60%)'
            : 'radial-gradient(120% 90% at 50% 110%, rgba(255,255,255,0.05), transparent 60%)',
        }}
      />
      <div
        ref={containerRef}
        className={`absolute inset-0 transition-shadow duration-500 ${
          locked
            ? aboveStrike
              ? 'shadow-[inset_0_0_60px_-30px_rgba(89,212,153,0.45)]'
              : 'shadow-[inset_0_0_60px_-30px_rgba(255,99,99,0.45)]'
            : ''
        }`}
      />
    </div>
  );
}
