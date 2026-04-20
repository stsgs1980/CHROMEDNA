'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMarketStore } from '@/stores/marketStore';

interface TimeframeRow {
  label: string;
  price: number;
  changePct: number;
  direction: 'up' | 'down' | 'flat';
}

export function MultiTimeframeComparison() {
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const [isOpen, setIsOpen] = useState(true);
  const decDigits = symbol === 'CL' ? 2 : 4;

  // Derive multi-timeframe prices by sampling candles at different intervals
  const timeframes = useMemo<TimeframeRow[]>(() => {
    if (candles.length < 4) return [];

    const len = candles.length;
    const lastPrice = candles[len - 1].close;

    // 1H: last candle close
    const price1H = lastPrice;

    // 4H: sample every 4th candle, take the last sampled close
    const step4H = Math.max(1, Math.floor(len / (len / 4)));
    const idx4H = Math.min(len - 1, Math.floor((len - 1) / step4H) * step4H);
    const price4H = candles[idx4H].close;

    // 1D: use the candle at ~1/4 of the dataset (simulating a day ago)
    const idx1D = Math.max(0, len - Math.min(len, 24));
    const price1D = candles[idx1D].close;

    // 1W: use the first candle (simulating a week ago)
    const price1W = candles[0].close;

    const rows: TimeframeRow[] = [
      {
        label: '1H',
        price: price1H,
        changePct: ((price1H - price4H) / price4H) * 100,
        direction: price1H >= price4H ? (price1H > price4H ? 'up' : 'flat') : 'down',
      },
      {
        label: '4H',
        price: price4H,
        changePct: ((price4H - price1D) / price1D) * 100,
        direction: price4H >= price1D ? (price4H > price1D ? 'up' : 'flat') : 'down',
      },
      {
        label: '1D',
        price: price1D,
        changePct: ((price1D - price1W) / price1W) * 100,
        direction: price1D >= price1W ? (price1D > price1W ? 'up' : 'flat') : 'down',
      },
      {
        label: '1W',
        price: price1W,
        changePct: ((price1W - candles[0].open) / candles[0].open) * 100,
        direction: price1W >= candles[0].open ? (price1W > candles[0].open ? 'up' : 'flat') : 'down',
      },
    ];

    return rows;
  }, [candles]);

  // CONSENSUS: average direction
  const consensus = useMemo(() => {
    if (timeframes.length === 0) return { direction: 'flat' as const, score: 0 };
    const score = timeframes.reduce((sum, tf) => {
      if (tf.direction === 'up') return sum + 1;
      if (tf.direction === 'down') return sum - 1;
      return sum;
    }, 0);
    if (score > 0) return { direction: 'up' as const, score };
    if (score < 0) return { direction: 'down' as const, score };
    return { direction: 'flat' as const, score: 0 };
  }, [timeframes]);

  const directionIcon = (dir: 'up' | 'down' | 'flat') => {
    if (dir === 'up') return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (dir === 'down') return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-amber-400" />;
  };

  const directionColor = (dir: 'up' | 'down' | 'flat') => {
    if (dir === 'up') return 'text-green-400';
    if (dir === 'down') return 'text-red-400';
    return 'text-amber-400';
  };

  const changeColor = (pct: number) => {
    if (pct > 0.01) return 'text-green-400';
    if (pct < -0.01) return 'text-red-400';
    return 'text-amber-400';
  };

  return (
    <div className="glass-card-enhanced rounded-lg">
      {/* Collapsible header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.02] transition-colors rounded-t-lg"
      >
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Multi-Timeframe</span>
        <span className="text-[9px] text-gray-600 ml-1">4 TFs</span>
        <div className="ml-auto flex items-center gap-1.5">
          {consensus.direction !== 'flat' && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              consensus.direction === 'up' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {consensus.direction === 'up' ? 'BULLISH' : 'BEARISH'}
            </span>
          )}
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5">
              {/* Table header */}
              <div className="flex items-center gap-2 text-[8px] text-gray-600 uppercase tracking-wider px-1">
                <span className="w-8">TF</span>
                <span className="flex-1 text-right">Price</span>
                <span className="w-16 text-right">Change</span>
                <span className="w-5 text-center">Dir</span>
              </div>

              {/* Timeframe rows */}
              {timeframes.map((tf, i) => (
                <motion.div
                  key={tf.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex items-center gap-2 metric-card-enhanced rounded-md px-2.5 py-1.5"
                >
                  <span className="text-[10px] font-bold text-amber-400 w-8 tracking-wide">{tf.label}</span>
                  <span className="flex-1 text-right text-[11px] font-semibold tabular-nums text-white">
                    {tf.price.toFixed(decDigits)}
                  </span>
                  <span className={`w-16 text-right text-[10px] font-semibold tabular-nums ${changeColor(tf.changePct)}`}>
                    {tf.changePct >= 0 ? '+' : ''}{tf.changePct.toFixed(2)}%
                  </span>
                  <span className="w-5 flex justify-center">
                    {directionIcon(tf.direction)}
                  </span>
                </motion.div>
              ))}

              {/* CONSENSUS row */}
              <div className="flex items-center gap-2 rounded-md px-2.5 py-2 mt-2 border-t border-white/[0.06]">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Consensus</span>
                <div className="flex-1" />
                <div className="flex items-center gap-1.5">
                  {/* Mini bar showing up/down/flat count */}
                  <div className="flex gap-[2px]">
                    {timeframes.map((tf, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-3 rounded-sm"
                        style={{
                          backgroundColor:
                            tf.direction === 'up' ? '#4ade80' :
                            tf.direction === 'down' ? '#f87171' :
                            '#fbbf24',
                          opacity: 0.7,
                        }}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${directionColor(consensus.direction)}`}>
                    {consensus.direction === 'up' ? 'Bullish' : consensus.direction === 'down' ? 'Bearish' : 'Neutral'}
                  </span>
                  {directionIcon(consensus.direction)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
