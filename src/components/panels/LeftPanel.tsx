'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Clock, Layers, Eye, Thermometer, Droplets, Play, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { Timeframe, ENERGY_SYMBOLS } from '@/types/energy';
import { DECOMPOSITION_LEVELS } from '@/types/energy';
import { generateEnergyData } from '@/lib/energyGenerators';

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
];

interface LayerToggleProps {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}

function LayerToggle({ label, icon, checked, onChange, color }: LayerToggleProps) {
  return (
    <div className="flex items-center justify-between layer-toggle-row">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs text-gray-300">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-75" />
    </div>
  );
}

// Market Pulse - Correlation between energy symbols
function MarketPulse() {
  const symbol = useMarketStore((s) => s.symbol);
  // useSyncExternalStore avoids hydration mismatch - server gets false, client gets true
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const correlations = useMemo(() => {
    // Return deterministic placeholder during SSR to avoid hydration mismatch
    if (!isClient) {
      const symbols = ['CL', 'NG', 'RB', 'HO'] as const;
      return symbols.map(s => {
        const info = ENERGY_SYMBOLS[s];
        return { symbol: s, change: 0, avgVol: 0, buyerColor: info.buyerColor, isActive: s === symbol, name: info.name };
      });
    }
    const symbols = ['CL', 'NG', 'RB', 'HO'] as const;
    return symbols.map(s => {
      const data = generateEnergyData(s, 30);
      const closes = data.map(c => c.close);
      const change = closes.length > 1 ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 : 0;
      const vol = data.reduce((sum, c) => sum + c.volume, 0);
      const avgVol = vol / data.length;
      const info = ENERGY_SYMBOLS[s];
      const isActive = s === symbol;
      return { symbol: s, change, avgVol, buyerColor: info.buyerColor, isActive: s === symbol, name: info.name };
    });
  }, [symbol, isClient]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Market Pulse</span>
      </div>
      <div className="space-y-1.5">
        {correlations.map(c => (
          <div
            key={c.symbol}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-md transition-all duration-200 ${
              c.isActive
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04]'
            }`}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: c.buyerColor, boxShadow: c.isActive ? `0 0 6px ${c.buyerColor}40` : 'none' }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${c.isActive ? 'text-amber-400' : 'text-gray-300'}`}>{c.symbol}</span>
                <span className="text-[9px] text-gray-600 truncate">{c.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-[3px] bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 pulse-bar-animated ${
                      c.change >= 0 ? 'bg-green-500/60' : 'bg-red-500/60'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(c.change) * 10)}%` }}
                  />
                </div>
                <span className={`text-[10px] font-semibold tabular-nums ${
                  c.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {c.change >= 0 ? '+' : ''}{c.change.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeftPanel() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const timeframe = useMarketStore((s) => s.timeframe);
  const setTimeframe = useMarketStore((s) => s.setTimeframe);
  const decompositionLevel = useMarketStore((s) => s.decompositionLevel);
  const setDecompositionLevel = useMarketStore((s) => s.setDecompositionLevel);
  
  const showBuyers = useUIStore((s) => s.showBuyers);
  const setShowBuyers = useUIStore((s) => s.setShowBuyers);
  const showSellers = useUIStore((s) => s.showSellers);
  const setShowSellers = useUIStore((s) => s.setShowSellers);
  const showConnections = useUIStore((s) => s.showConnections);
  const setShowConnections = useUIStore((s) => s.setShowConnections);
  const showVolumeProfile = useUIStore((s) => s.showVolumeProfile);
  const setShowVolumeProfile = useUIStore((s) => s.setShowVolumeProfile);
  const showFibonacci = useUIStore((s) => s.showFibonacci);
  const setShowFibonacci = useUIStore((s) => s.setShowFibonacci);
  const showEIALayer = useUIStore((s) => s.showEIALayer);
  const setShowEIALayer = useUIStore((s) => s.setShowEIALayer);
  const showWeatherLayer = useUIStore((s) => s.showWeatherLayer);
  const setShowWeatherLayer = useUIStore((s) => s.setShowWeatherLayer);
  const autoRotate = useUIStore((s) => s.autoRotate);
  const setAutoRotate = useUIStore((s) => s.setAutoRotate);
  const showPlaybackBar = useUIStore((s) => s.showPlaybackBar);
  const togglePlaybackBar = useUIStore((s) => s.togglePlaybackBar);

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: leftPanelOpen ? 0 : -280, opacity: leftPanelOpen ? 1 : 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed left-0 top-14 bottom-0 w-[260px] z-40 glass-panel panel-edge-left panel-responsive-left overflow-hidden"
    >
      <ScrollArea className="h-full">
        <div className="p-4 space-y-5">
          {/* Timeframe Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Timeframe</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {TIMEFRAMES.map((tf) => (
                <Button
                  key={tf.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeframe(tf.value)}
                  className={`h-8 text-xs transition-all duration-200 ${
                    timeframe === tf.value
                      ? 'tf-btn-active'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="section-divider-enhanced" />

          {/* Decomposition Level */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Decomposition</span>
            </div>
            <div className="space-y-1">
              {DECOMPOSITION_LEVELS.map((level) => (
                <Button
                  key={level.level}
                  variant="ghost"
                  size="sm"
                  onClick={() => setDecompositionLevel(level.level)}
                  className={`w-full justify-start h-8 text-xs decomp-btn ${
                    decompositionLevel === level.level
                      ? 'decomp-btn-active text-white border border-white/[0.06]'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  <span className="font-bold mr-2 w-6">{level.level}</span>
                  <span>{level.label}</span>
                  <span className="ml-auto text-gray-600">{level.timeRange}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="section-divider-enhanced" />

          {/* Display Layers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layers</span>
            </div>
            <div className="space-y-0.5">
              <LayerToggle
                label="Buyers Spiral"
                icon={<div className="w-2.5 h-2.5 rounded-full bg-amber-400 glow-dot-amber" />}
                checked={showBuyers}
                onChange={setShowBuyers}
                color="#FFD700"
              />
              <LayerToggle
                label="Sellers Spiral"
                icon={<div className="w-2.5 h-2.5 rounded-full bg-red-400 glow-dot-red" />}
                checked={showSellers}
                onChange={setShowSellers}
                color="#FF6347"
              />
              <LayerToggle
                label="Connections"
                icon={<div className="w-2.5 h-2.5 rounded-sm bg-gray-400" />}
                checked={showConnections}
                onChange={setShowConnections}
              />
              <LayerToggle
                label="Volume Profile"
                icon={<div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />}
                checked={showVolumeProfile}
                onChange={setShowVolumeProfile}
                color="#00CED1"
              />
              <LayerToggle
                label="Fibonacci"
                icon={<div className="w-2.5 h-2.5 rounded-sm bg-purple-400" />}
                checked={showFibonacci}
                onChange={setShowFibonacci}
                color="#9370DB"
              />
              <LayerToggle
                label="EIA Layer"
                icon={<Droplets className="w-2.5 h-2.5" />}
                checked={showEIALayer}
                onChange={setShowEIALayer}
                color="#32CD32"
              />
              <LayerToggle
                label="Weather Layer"
                icon={<Thermometer className="w-2.5 h-2.5" />}
                checked={showWeatherLayer}
                onChange={setShowWeatherLayer}
                color="#FF6347"
              />
            </div>
          </div>

          <div className="section-divider-enhanced" />

          {/* Market Pulse - NEW FEATURE */}
          <MarketPulse />

          <div className="section-divider-enhanced" />

          {/* Controls */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Controls</span>
            </div>
            <LayerToggle
              label="Auto Rotate"
              icon={<div className="w-2.5 h-2.5 rounded-full border border-gray-400 border-t-transparent animate-spin" />}
              checked={autoRotate}
              onChange={setAutoRotate}
            />
            <LayerToggle
              label="Playback Mode"
              icon={<Play className="w-2.5 h-2.5" />}
              checked={showPlaybackBar}
              onChange={togglePlaybackBar}
              color="#F59E0B"
            />
          </div>

          {/* Bottom padding */}
          <div className="h-6" />
        </div>
      </ScrollArea>
    </motion.aside>
  );
}
