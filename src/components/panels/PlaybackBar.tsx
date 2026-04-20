'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, FastForward, Rewind, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { generateEnergyData, generateVolumeProfile, generateOrderFlow } from '@/lib/energyGenerators';
import { calculateCompositeScore } from '@/lib/aiScoring';

type PlaybackSpeed = 0.5 | 1 | 2 | 4 | 8;

export function PlaybackBar() {
  const symbol = useMarketStore((s) => s.symbol);
  const candles = useMarketStore((s) => s.candles);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);

  // Generate full dataset for the current symbol
  const fullData = useMemo(() => generateEnergyData(symbol, 200), [symbol]);
  const totalCandles = fullData.length;

  // Reset playback when symbol changes
  const [prevSymbol, setPrevSymbol] = useState(symbol);
  if (symbol !== prevSymbol) {
    setPrevSymbol(symbol);
    setPlaybackIndex(0);
    setIsPlaying(false);
  }

  // Playback timer
  useEffect(() => {
    if (isPlaying && playbackIndex < totalCandles) {
      const id = setInterval(() => {
        setPlaybackIndex((prev) => {
          const next = prev + 1;
          if (next >= totalCandles) {
            setIsPlaying(false);
            return totalCandles;
          }
          return next;
        });
      }, 1000 / speed);
      return () => clearInterval(id);
    }
  }, [isPlaying, speed, totalCandles]);

  // Update visible candles based on playback index
  useEffect(() => {
    const visibleCandles = fullData.slice(0, playbackIndex);
    
    if (visibleCandles.length > 0) {
      const vp = generateVolumeProfile(visibleCandles);
      const ofData = generateOrderFlow(visibleCandles);
      const score = calculateCompositeScore(visibleCandles);

      useMarketStore.setState({
        candles: visibleCandles,
        volumeProfile: vp,
        orderFlow: ofData,
        aiScore: score,
        selectedCandleIndex: null,
      });
    }
  }, [playbackIndex, fullData]);

  const handlePlay = useCallback(() => {
    if (playbackIndex >= totalCandles) {
      setPlaybackIndex(0);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, playbackIndex, totalCandles]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setPlaybackIndex(0);
    const vp = generateVolumeProfile(fullData);
    const ofData = generateOrderFlow(fullData);
    const score = calculateCompositeScore(fullData);
    useMarketStore.setState({
      candles: fullData,
      volumeProfile: vp,
      orderFlow: ofData,
      aiScore: score,
      selectedCandleIndex: null,
    });
  }, [fullData]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    setPlaybackIndex(idx);
    setIsPlaying(false);
  }, []);

  const cycleSpeed = useCallback(() => {
    const speeds: PlaybackSpeed[] = [0.5, 1, 2, 4, 8];
    const currentIdx = speeds.indexOf(speed);
    const nextIdx = (currentIdx + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
  }, [speed]);

  const progress = totalCandles > 0 ? (playbackIndex / totalCandles) * 100 : 0;

  const currentCandle = candles[candles.length - 1];
  const dateStr = currentCandle
    ? new Date(currentCandle.time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-[600px] max-w-[90vw]"
    >
      <div className="bg-gray-950/90 backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl shadow-black/40">
        {/* Progress bar */}
        <div className="relative mb-2">
          <input
            type="range"
            min={0}
            max={totalCandles}
            value={playbackIndex}
            onChange={handleSliderChange}
            className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400
              [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:shadow-amber-400/30
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10"
            style={{
              background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${progress}%, rgba(255,255,255,0.06) ${progress}%, rgba(255,255,255,0.06) 100%)`,
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 w-7 p-0 text-gray-500 hover:text-white hover:bg-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlaybackIndex(Math.max(0, playbackIndex - 10))}
              className="h-7 w-7 p-0 text-gray-500 hover:text-white hover:bg-white/5"
            >
              <Rewind className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlaybackIndex(Math.max(0, playbackIndex - 1))}
              className="h-7 w-7 p-0 text-gray-500 hover:text-white hover:bg-white/5"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 border border-amber-500/20"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlaybackIndex(Math.min(totalCandles, playbackIndex + 1))}
              className="h-7 w-7 p-0 text-gray-500 hover:text-white hover:bg-white/5"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlaybackIndex(Math.min(totalCandles, playbackIndex + 10))}
              className="h-7 w-7 p-0 text-gray-500 hover:text-white hover:bg-white/5"
            >
              <FastForward className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="tabular-nums">{playbackIndex} / {totalCandles}</span>
            <span className="text-gray-600">|</span>
            <span>{dateStr}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={cycleSpeed}
            className="h-7 px-2 text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 border border-amber-500/20"
          >
            {speed}x
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
