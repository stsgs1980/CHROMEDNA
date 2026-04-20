'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { Header } from '@/components/panels/Header';
import { LeftPanel } from '@/components/panels/LeftPanel';
import { RightPanel } from '@/components/panels/RightPanel';
import { BottomPanel } from '@/components/panels/BottomPanel';
import { PlaybackBar } from '@/components/panels/PlaybackBar';
import { generateEnergyData, generateVolumeProfile, generateOrderFlow } from '@/lib/energyGenerators';
import { calculateCompositeScore } from '@/lib/aiScoring';
import { PanelLeftOpen, PanelRightOpen, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic import for 3D scene to avoid SSR issues
const Scene = dynamic(
  () => import('@/components/canvas/Scene').then((mod) => mod.Scene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#030308]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
          <div className="text-gray-500 text-sm">Initializing 3D Engine...</div>
        </div>
      </div>
    ),
  }
);

function DataLoader() {
  const symbol = useMarketStore((s) => s.symbol);
  const prevSymbolRef = useRef(symbol);

  useEffect(() => {
    // Skip if symbol hasn't actually changed (and data already loaded)
    if (symbol === prevSymbolRef.current && useMarketStore.getState().candles.length > 0) {
      return;
    }
    prevSymbolRef.current = symbol;

    // Use Zustand's getState() to get fresh data and set it directly
    // This avoids React state batching issues
    const store = useMarketStore.getState();
    
    // Generate all data for the current symbol
    const candles = generateEnergyData(symbol, 80);
    const vp = generateVolumeProfile(candles);
    const ofData = generateOrderFlow(candles);
    const score = calculateCompositeScore(candles);

    // Batch all updates together using Zustand's set
    useMarketStore.setState({
      candles,
      volumeProfile: vp,
      orderFlow: ofData,
      aiScore: score,
      isLoading: false,
      selectedCandleIndex: null,
    });
  }, [symbol]);

  return null;
}

export default function Home() {
  const isLoading = useMarketStore((s) => s.isLoading);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const bottomPanelOpen = useUIStore((s) => s.bottomPanelOpen);
  const toggleLeftPanel = useUIStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);
  const candles = useMarketStore((s) => s.candles);
  const symbol = useMarketStore((s) => s.symbol);
  const showPlaybackBar = useUIStore((s) => s.showPlaybackBar);

  return (
    <div className="fixed inset-0 bg-[#030308] overflow-hidden">
      {/* Data Loader (invisible) */}
      <DataLoader />

      {/* 3D Canvas (full screen background) - always mounted */}
      <div className="absolute inset-0">
        <Scene />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <div className="pointer-events-auto">
          <Header />
        </div>

        {/* Playback Bar (conditional) */}
        {showPlaybackBar && (
          <div className="pointer-events-auto">
            <PlaybackBar />
          </div>
        )}

        {/* Left Panel */}
        <div className="pointer-events-auto">
          <LeftPanel />
        </div>

        {/* Right Panel */}
        <div className="pointer-events-auto">
          <RightPanel />
        </div>

        {/* Bottom Panel */}
        <div className="pointer-events-auto">
          <BottomPanel />
        </div>

        {/* Panel Toggle Buttons */}
        <div className="pointer-events-auto fixed left-0 top-1/2 -translate-y-1/2 z-50">
          {!leftPanelOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLeftPanel}
              className="bg-gray-950/60 backdrop-blur-md border border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/10 rounded-r-lg rounded-l-none h-16 w-6 p-0"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <div className="pointer-events-auto fixed right-0 top-1/2 -translate-y-1/2 z-50">
          {!rightPanelOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleRightPanel}
              className="bg-gray-950/60 backdrop-blur-md border border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/10 rounded-l-lg rounded-r-none h-16 w-6 p-0"
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {!bottomPanelOpen && (
          <div className="pointer-events-auto fixed bottom-0 left-1/2 -translate-x-1/2 z-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBottomPanel}
              className="bg-gray-950/60 backdrop-blur-md border border-white/[0.06] border-b-0 text-gray-500 hover:text-white hover:bg-white/10 rounded-t-lg h-6 w-16 p-0"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Initial Loading Overlay - only shows on first load */}
      <AnimatePresence>
        {isLoading && candles.length === 0 && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 bg-[#030308] flex items-center justify-center z-[100]"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-white text-xl font-bold tracking-tight">
                  CHROME<span className="text-amber-400">DNA</span>
                </div>
                <div className="text-gray-500 text-sm mt-1">
                  Loading Energy Futures...
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Symbol transition indicator - subtle, doesn't block 3D */}
      <AnimatePresence>
        {isLoading && candles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
          >
            <div className="bg-gray-950/80 backdrop-blur-md border border-amber-500/20 rounded-full px-4 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-amber-400 font-medium">Switching to {symbol}...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="flex items-center justify-center py-1">
          <div className="footer-gradient-text text-[9px] tracking-widest font-medium">
            CHROME DNA v0.3 · Energy Futures Terminal · Mock Data
          </div>
        </div>
      </footer>
    </div>
  );
}
