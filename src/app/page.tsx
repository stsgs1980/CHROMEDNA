'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { Header } from '@/components/panels/Header';
import { LeftPanel } from '@/components/panels/LeftPanel';
import { RightPanel } from '@/components/panels/RightPanel';
import { BottomPanel } from '@/components/panels/BottomPanel';
import { generateEnergyData, generateVolumeProfile, generateOrderFlow } from '@/lib/energyGenerators';
import { calculateCompositeScore } from '@/lib/aiScoring';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamic import for 3D scene to avoid SSR issues
const Scene = dynamic(
  () => import('@/components/canvas/Scene').then((mod) => mod.Scene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#050510]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
          <div className="text-gray-500 text-sm">Loading 3D Scene...</div>
        </div>
      </div>
    ),
  }
);

function DataLoader() {
  const symbol = useMarketStore((s) => s.symbol);
  const setCandles = useMarketStore((s) => s.setCandles);
  const setVolumeProfile = useMarketStore((s) => s.setVolumeProfile);
  const setOrderFlow = useMarketStore((s) => s.setOrderFlow);
  const setAiScore = useMarketStore((s) => s.setAiScore);
  const setLoading = useMarketStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(true);
    
    // Generate mock data (will be replaced with API calls)
    const candles = generateEnergyData(symbol, 200);
    const vp = generateVolumeProfile(candles);
    const of = generateOrderFlow(candles);
    const score = calculateCompositeScore(candles);

    // Small delay for smooth loading
    const timer = setTimeout(() => {
      setCandles(candles);
      setVolumeProfile(vp);
      setOrderFlow(of);
      setAiScore(score);
    }, 300);

    return () => clearTimeout(timer);
  }, [symbol, setCandles, setVolumeProfile, setOrderFlow, setAiScore, setLoading]);

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

  return (
    <div className="fixed inset-0 bg-[#050510] overflow-hidden">
      {/* Data Loader (invisible) */}
      <DataLoader />

      {/* 3D Canvas (full screen background) */}
      <div className="absolute inset-0">
        {candles.length > 0 && <Scene />}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header - pointer events enabled */}
        <div className="pointer-events-auto">
          <Header />
        </div>

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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#050510] flex items-center justify-center z-[100]">
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
              <div className="text-gray-500 text-sm mt-1">Loading Energy Futures...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
