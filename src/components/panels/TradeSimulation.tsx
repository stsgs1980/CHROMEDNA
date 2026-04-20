'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  X,
  RotateCcw,
  Minus,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarketStore } from '@/stores/marketStore';
import {
  useTradeStore,
  getTradeStats,
  TradeSide,
  CONTRACT_MULTIPLIER,
} from '@/stores/tradeStore';

// Mini sparkline SVG for equity curve
function EquitySparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 28;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  });

  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = isPositive ? '#4ade80' : '#f87171';
  const fillColor = isPositive
    ? 'rgba(74, 222, 128, 0.08)'
    : 'rgba(248, 113, 113, 0.08)';

  // Build fill polygon (close the path to bottom)
  const fillPoints = [
    `${padding},${h - padding}`,
    ...points,
    `${w - padding},${h - padding}`,
  ].join(' ');

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polygon points={fillPoints} fill={fillColor} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={w - padding}
        cy={h - padding - ((data[data.length - 1] - min) / range) * (h - padding * 2)}
        r="2"
        fill={strokeColor}
        className="animate-glow-breathe"
      />
    </svg>
  );
}

export function TradeSimulation() {
  const symbol = useMarketStore((s) => s.symbol);
  const candles = useMarketStore((s) => s.candles);

  const position = useTradeStore((s) => s.position);
  const tradeHistory = useTradeStore((s) => s.tradeHistory);
  const startingBalance = useTradeStore((s) => s.startingBalance);
  const currentBalance = useTradeStore((s) => s.currentBalance);
  const equityCurve = useTradeStore((s) => s.equityCurve);
  const openTrade = useTradeStore((s) => s.openTrade);
  const closePosition = useTradeStore((s) => s.closePosition);
  const resetAccount = useTradeStore((s) => s.resetAccount);

  const [collapsed, setCollapsed] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const currentPrice = useMemo(() => {
    if (candles.length === 0) return 0;
    return candles[candles.length - 1].close;
  }, [candles]);

  const decDigits = symbol === 'CL' ? 2 : 4;

  // Unrealized P&L
  const unrealizedPnl = useMemo(() => {
    if (position.side === 'Flat') return 0;
    const direction = position.side === 'Long' ? 1 : -1;
    return direction * (currentPrice - position.entryPrice) * position.quantity * CONTRACT_MULTIPLIER;
  }, [position, currentPrice]);

  // Estimated P&L for a new trade
  const estimatedPnl = useMemo(() => {
    // Simulate a small move based on recent volatility
    if (candles.length < 2) return 0;
    const recentCandles = candles.slice(-5);
    const avgRange =
      recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) /
      recentCandles.length;
    return avgRange * quantity * CONTRACT_MULTIPLIER * 0.5;
  }, [candles, quantity]);

  // Trade stats
  const stats = useMemo(
    () => getTradeStats({ position, tradeHistory, startingBalance, currentBalance, equityCurve } as ReturnType<typeof useTradeStore.getState>),
    [position, tradeHistory, startingBalance, currentBalance, equityCurve]
  );

  // Current equity = balance + unrealized P&L
  const currentEquity = currentBalance + unrealizedPnl;

  // Last 5 trades for display
  const recentTrades = useMemo(() => tradeHistory.slice(0, 5), [tradeHistory]);

  const handleTrade = useCallback(
    (side: TradeSide) => {
      if (currentPrice <= 0) return;
      openTrade(side, currentPrice, quantity, symbol);
    },
    [currentPrice, quantity, symbol, openTrade]
  );

  const handleClosePosition = useCallback(() => {
    if (currentPrice <= 0 || position.side === 'Flat') return;
    closePosition(currentPrice);
  }, [currentPrice, position.side, closePosition]);

  const handleReset = useCallback(() => {
    resetAccount();
  }, [resetAccount]);

  // Format currency
  const fmtCurrency = (v: number) =>
    v >= 0
      ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `-$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const fmtPnl = (v: number) => {
    const prefix = v >= 0 ? '+' : '';
    return `${prefix}$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {/* Collapsible Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 mb-2 group"
      >
        <Activity className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Trade Sim
        </span>
        <span className="text-[8px] text-gray-600 ml-1">SIMULATED</span>
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-600 ml-auto group-hover:text-gray-400 transition-colors" />
        ) : (
          <ChevronDown className="w-3 h-3 text-gray-600 ml-auto group-hover:text-gray-400 transition-colors" />
        )}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {/* Quick Trade Section */}
              <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3 space-y-2.5">
                {/* Price display */}
                <div className="flex items-center justify-between">
                  <span className="data-label">Current Price</span>
                  <span className="text-sm font-bold tabular-nums text-white number-transition">
                    {currentPrice > 0 ? currentPrice.toFixed(decDigits) : '—'}
                  </span>
                </div>

                {/* Quantity selector */}
                <div>
                  <span className="data-label">Quantity (Contracts)</span>
                  <div className="flex gap-1.5 mt-1.5">
                    {[1, 5, 10].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuantity(q)}
                        className={`flex-1 h-7 rounded text-[10px] font-semibold transition-all ${
                          quantity === q
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 active-glow-amber'
                            : 'bg-white/[0.03] text-gray-500 border border-transparent hover:text-gray-300 hover:border-white/[0.06]'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BUY / SELL buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTrade('BUY')}
                    disabled={currentPrice <= 0}
                    className="trade-btn-buy h-9 rounded-md text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                    Buy
                  </button>
                  <button
                    onClick={() => handleTrade('SELL')}
                    disabled={currentPrice <= 0}
                    className="trade-btn-sell h-9 rounded-md text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <TrendingDown className="w-3.5 h-3.5 inline mr-1" />
                    Sell
                  </button>
                </div>

                {/* Estimated P&L */}
                <div className="flex items-center justify-between">
                  <span className="data-label">Est. Move P&L</span>
                  <span className="text-[10px] font-semibold tabular-nums text-amber-400/70 number-transition">
                    ±{fmtCurrency(estimatedPnl)}
                  </span>
                </div>
              </div>

              {/* Position Tracker */}
              {position.side !== 'Flat' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="data-label">Position</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        position.side === 'Long'
                          ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                          : 'bg-red-500/15 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {position.side} ×{position.quantity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div>
                      <span className="data-label">Entry</span>
                      <div className="text-[11px] font-semibold tabular-nums text-white number-transition">
                        {position.entryPrice.toFixed(decDigits)}
                      </div>
                    </div>
                    <div>
                      <span className="data-label">Current</span>
                      <div className="text-[11px] font-semibold tabular-nums text-white number-transition">
                        {currentPrice > 0 ? currentPrice.toFixed(decDigits) : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Unrealized P&L */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <span className="data-label">Unrealized P&L</span>
                    <span
                      className={`text-xs font-bold tabular-nums number-transition ${
                        unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {fmtPnl(unrealizedPnl)}
                    </span>
                  </div>

                  {/* Close Position */}
                  <button
                    onClick={handleClosePosition}
                    className="w-full h-7 rounded text-[10px] font-semibold bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3 h-3" />
                    Close Position
                  </button>
                </motion.div>
              )}

              {/* Flat position indicator */}
              {position.side === 'Flat' && (
                <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-gray-600">
                  <Minus className="w-3 h-3" />
                  <span>Flat — No Position</span>
                </div>
              )}

              {/* Order History (last 5) */}
              {recentTrades.length > 0 && (
                <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3 space-y-2">
                  <span className="data-label">Recent Trades</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px]">
                      <thead>
                        <tr className="text-gray-600">
                          <th className="text-left font-medium pb-1.5">Side</th>
                          <th className="text-right font-medium pb-1.5">Price</th>
                          <th className="text-right font-medium pb-1.5">Qty</th>
                          <th className="text-right font-medium pb-1.5">P&L</th>
                          <th className="text-right font-medium pb-1.5">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTrades.map((trade) => (
                          <tr key={trade.id} className="border-t border-white/[0.02]">
                            <td className="py-1">
                              <span
                                className={`font-bold ${
                                  trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {trade.side}
                              </span>
                            </td>
                            <td className="text-right tabular-nums text-gray-300">
                              {trade.price.toFixed(decDigits)}
                            </td>
                            <td className="text-right tabular-nums text-gray-400">
                              {trade.quantity}
                            </td>
                            <td
                              className={`text-right tabular-nums font-semibold ${
                                trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {fmtPnl(trade.pnl)}
                            </td>
                            <td className="text-right tabular-nums text-gray-600">
                              {fmtTime(trade.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Account Summary */}
              <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="data-label">Account Summary</span>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-[8px] text-gray-600 hover:text-amber-400 transition-colors"
                    title="Reset account"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset
                  </button>
                </div>

                {/* Equity sparkline */}
                {equityCurve.length >= 2 && (
                  <div className="flex items-center justify-center py-1">
                    <EquitySparkline data={equityCurve} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <div>
                    <span className="data-label">Equity</span>
                    <div className="text-[11px] font-bold tabular-nums text-white number-transition">
                      {fmtCurrency(currentEquity)}
                    </div>
                  </div>
                  <div>
                    <span className="data-label">Day P&L</span>
                    <div
                      className={`text-[11px] font-bold tabular-nums number-transition ${
                        stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {fmtPnl(stats.totalPnl)}
                    </div>
                  </div>
                  <div>
                    <span className="data-label">Win Rate</span>
                    <div className="text-[11px] font-semibold tabular-nums text-amber-400/80 number-transition">
                      {stats.totalTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <span className="data-label">Max DD</span>
                    <div className="text-[11px] font-semibold tabular-nums text-red-400/80 number-transition">
                      {stats.maxDrawdown > 0 ? `-${stats.maxDrawdown.toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                </div>

                {/* Balance bar */}
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="data-label">Balance Utilization</span>
                    <span className="text-[9px] tabular-nums text-gray-500">
                      {fmtCurrency(currentBalance)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 number-transition"
                      style={{
                        width: `${Math.min(100, (currentBalance / startingBalance) * 100)}%`,
                        background:
                          currentBalance >= startingBalance
                            ? 'linear-gradient(90deg, rgba(74, 222, 128, 0.4), rgba(74, 222, 128, 0.6))'
                            : 'linear-gradient(90deg, rgba(248, 113, 113, 0.4), rgba(248, 113, 113, 0.6))',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-center">
                <span className="text-[8px] text-gray-700">
                  Simulation only — no real trades executed
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
