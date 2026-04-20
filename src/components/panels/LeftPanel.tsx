'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Layers, Eye, EyeOff, RotateCcw, Settings2, Thermometer, Droplets, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { Timeframe } from '@/types/energy';
import { DECOMPOSITION_LEVELS } from '@/types/energy';

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
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs text-gray-300">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-75" />
    </div>
  );
}

export function LeftPanel() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useUIStore((s) => s.toggleLeftPanel);
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
    <AnimatePresence>
      {leftPanelOpen && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-14 bottom-0 w-[260px] z-40 bg-gray-950/80 backdrop-blur-xl border-r border-white/[0.06] overflow-hidden"
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
                      className={`h-8 text-xs ${
                        timeframe === tf.value
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tf.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/5" />

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
                      className={`w-full justify-start h-8 text-xs ${
                        decompositionLevel === level.level
                          ? 'bg-white/10 text-white'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="font-bold mr-2 w-6">{level.level}</span>
                      <span>{level.label}</span>
                      <span className="ml-auto text-gray-600">{level.timeRange}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/5" />

              {/* Display Layers */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layers</span>
                </div>
                <div className="space-y-0.5">
                  <LayerToggle
                    label="Buyers Spiral"
                    icon={<div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
                    checked={showBuyers}
                    onChange={setShowBuyers}
                    color="#FFD700"
                  />
                  <LayerToggle
                    label="Sellers Spiral"
                    icon={<div className="w-2.5 h-2.5 rounded-full bg-red-400" />}
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

              <Separator className="bg-white/5" />

              {/* Controls */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Controls</span>
                </div>
                <LayerToggle
                  label="Auto Rotate"
                  icon={<RotateCcw className="w-2.5 h-2.5" />}
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
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
