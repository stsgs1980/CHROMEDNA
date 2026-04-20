'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useMarketStore } from '@/stores/marketStore';

interface EIAReportData {
  date: string;
  crudeOil: { actual: number; expected: number; unit: string };
  gasoline: { actual: number; expected: number; unit: string };
  distillate: { actual: number; expected: number; unit: string };
  naturalGas: { actual: number; expected: number; unit: string };
  weeklyHistory: number[];
}

function generateMockEIAReport(): EIAReportData {
  const now = new Date();
  const reportDate = new Date(now);
  // EIA reports come out on Wednesdays
  const dayOfWeek = now.getDay();
  const daysSinceWed = (dayOfWeek + 7 - 3) % 7;
  reportDate.setDate(now.getDate() - daysSinceWed);
  const dateStr = reportDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const rand = (min: number, max: number) => +(min + Math.random() * (max - min)).toFixed(1);

  const crudeActual = rand(-2.1, 4.5);
  const gasolineActual = rand(-1.5, 3.2);
  const distillateActual = rand(-0.8, 2.1);
  const natGasActual = rand(-20, 60);

  const weeklyHistory = Array.from({ length: 5 }, () => rand(-3, 5));

  return {
    date: dateStr,
    crudeOil: {
      actual: crudeActual,
      expected: +(crudeActual + (Math.random() - 0.5) * 3).toFixed(1),
      unit: 'M bbl',
    },
    gasoline: {
      actual: gasolineActual,
      expected: +(gasolineActual + (Math.random() - 0.5) * 2).toFixed(1),
      unit: 'M bbl',
    },
    distillate: {
      actual: distillateActual,
      expected: +(distillateActual + (Math.random() - 0.5) * 1.5).toFixed(1),
      unit: 'M bbl',
    },
    naturalGas: {
      actual: natGasActual,
      expected: +(natGasActual + (Math.random() - 0.5) * 20).toFixed(1),
      unit: 'Bcf',
    },
    weeklyHistory,
  };
}

function InventoryRow({
  label,
  data,
  icon,
}: {
  label: string;
  data: { actual: number; expected: number; unit: string };
  icon: React.ReactNode;
}) {
  const isBuild = data.actual >= 0;
  const isSurprise = Math.abs(data.actual - data.expected) > Math.abs(data.expected) * 0.3;

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
          isBuild ? 'bg-red-500/10' : 'bg-green-500/10'
        }`}
      >
        {icon}
      </div>

      {/* Label + Unit */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-300 truncate">{label}</div>
        <div className="text-[9px] text-gray-600">{data.unit}</div>
      </div>

      {/* Expected */}
      <div className="text-right flex-shrink-0">
        <div className="text-[9px] text-gray-600 uppercase tracking-wider">Exp</div>
        <div className="text-[11px] text-gray-400 tabular-nums font-medium">
          {data.expected >= 0 ? '+' : ''}
          {data.expected}
        </div>
      </div>

      {/* Actual */}
      <div className="text-right flex-shrink-0">
        <div className="text-[9px] text-gray-600 uppercase tracking-wider">Act</div>
        <div
          className={`text-[11px] font-bold tabular-nums ${
            isBuild ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {data.actual >= 0 ? '+' : ''}
          {data.actual}
        </div>
      </div>

      {/* Build/Draw Badge */}
      <div
        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
          isBuild
            ? 'bg-red-500/15 text-red-400 border border-red-500/20'
            : 'bg-green-500/15 text-green-400 border border-green-500/20'
        }`}
      >
        {isBuild ? (
          <TrendingDown className="w-2.5 h-2.5" />
        ) : (
          <TrendingUp className="w-2.5 h-2.5" />
        )}
        {isBuild ? 'Build' : 'Draw'}
      </div>

      {/* Surprise indicator */}
      {isSurprise && (
        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
    </div>
  );
}

function WeeklyBarChart({ data }: { data: number[] }) {
  const maxAbs = Math.max(...data.map(Math.abs), 1);
  const chartHeight = 64;
  const barWidth = 28;

  return (
    <div className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <BarChart3 className="w-3 h-3 text-amber-400" />
        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
          5-Week Inventory Trend
        </span>
      </div>

      <div className="flex items-end justify-center gap-2" style={{ height: chartHeight }}>
        {data.map((value, i) => {
          const isBuild = value >= 0;
          const barHeight = Math.max(4, (Math.abs(value) / maxAbs) * (chartHeight - 20));
          const weekLabel = `W${i + 1}`;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              {/* Bar */}
              <div className="relative flex flex-col items-center justify-end" style={{ height: chartHeight - 16 }}>
                <div
                  className={`w-7 rounded-sm transition-all duration-300 ${
                    isBuild
                      ? 'bg-gradient-to-t from-red-500/60 to-red-400/30'
                      : 'bg-gradient-to-t from-green-500/60 to-green-400/30'
                  }`}
                  style={{ height: barHeight }}
                />
                {/* Zero line indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
              </div>
              {/* Value */}
              <div
                className={`text-[8px] tabular-nums font-medium ${
                  isBuild ? 'text-red-400/70' : 'text-green-400/70'
                }`}
              >
                {value >= 0 ? '+' : ''}
                {value}
              </div>
              {/* Week label */}
              <div className="text-[8px] text-gray-600">{weekLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EIAReportOverlay() {
  const showEIAReport = useUIStore((s) => s.showEIAReport);
  const toggleEIAReport = useUIStore((s) => s.toggleEIAReport);
  const symbol = useMarketStore((s) => s.symbol);

  const report = useMemo(() => generateMockEIAReport(), [showEIAReport]);

  // Only show for oil-related symbols or always show
  const isRelevant = symbol === 'CL' || symbol === 'RB' || symbol === 'HO' || symbol === 'NG';

  return (
    <AnimatePresence>
      {showEIAReport && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={toggleEIAReport}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4"
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-gray-950/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <FileText className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">
                      EIA Weekly Report
                    </h2>
                    <p className="text-[10px] text-gray-500">{report.date}</p>
                  </div>
                </div>
                <button
                  onClick={toggleEIAReport}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-4 space-y-3">
                {/* Relevance notice for non-oil symbols */}
                {!isRelevant && (
                  <div className="text-[10px] text-amber-400/70 bg-amber-500/5 border border-amber-500/10 rounded-md px-3 py-1.5">
                    Showing crude oil complex data · Switch to CL/RB/HO for context
                  </div>
                )}

                {/* Inventory Rows */}
                <InventoryRow
                  label="Crude Oil"
                  data={report.crudeOil}
                  icon={
                    <TrendingDown
                      className={`w-4 h-4 ${
                        report.crudeOil.actual >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    />
                  }
                />
                <InventoryRow
                  label="Gasoline"
                  data={report.gasoline}
                  icon={
                    <TrendingDown
                      className={`w-4 h-4 ${
                        report.gasoline.actual >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    />
                  }
                />
                <InventoryRow
                  label="Distillate"
                  data={report.distillate}
                  icon={
                    <TrendingDown
                      className={`w-4 h-4 ${
                        report.distillate.actual >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    />
                  }
                />
                <InventoryRow
                  label="Natural Gas"
                  data={report.naturalGas}
                  icon={
                    <TrendingUp
                      className={`w-4 h-4 ${
                        report.naturalGas.actual >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    />
                  }
                />

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                {/* Weekly Trend Chart */}
                <WeeklyBarChart data={report.weeklyHistory} />

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-[9px] text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-red-400/40" />
                    <span>Build (Bearish)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-green-400/40" />
                    <span>Draw (Bullish)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Surprise</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-600">
                    Source: EIA Weekly Petroleum Status Report
                  </span>
                  <span className="text-[9px] text-gray-600">
                    Simulated Data
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
