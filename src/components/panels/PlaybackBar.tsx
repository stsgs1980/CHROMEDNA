'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlaybackStore } from '@/stores/playbackStore';
import { useMarketStore } from '@/stores/marketStore';

const SPEEDS: { value: 0.5 | 1 | 2 | 4 | 8; label: string }[] = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
  { value: 8, label: '8x' },
];

export function PlaybackBar() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const speed = usePlaybackStore((s) => s.speed);
  const currentIndex = usePlaybackStore((s) => s.currentIndex);
  const maxIndex = usePlaybackStore((s) => s.maxIndex);
  const setPlaying = usePlaybackStore((s) => s.setPlaying);
  const setSpeed = usePlaybackStore((s) => s.setSpeed);
  const setCurrentIndex = usePlaybackStore((s) => s.setCurrentIndex);
  const setMaxIndex = usePlaybackStore((s) => s.setMaxIndex);
  const reset = usePlaybackStore((s) => s.reset);

  const candles = useMarketStore((s) => s.candles);
  const setCandles = useMarketStore((s) => s.setCandles);

  const allCandlesRef = useRef(candles);

  // Update max index when candles change
  useEffect(() => {
    if (candles.length > 0) {
      allCandlesRef.current = candles;
      setMaxIndex(candles.length - 1);
    }
  }, [candles, setMaxIndex]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || maxIndex === 0) return;

    const interval = setInterval(() => {
      const next = usePlaybackStore.getState().currentIndex + 1;
      if (next >= maxIndex) {
        setPlaying(false);
        setCurrentIndex(maxIndex);
      } else {
        setCurrentIndex(next);
      }
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, maxIndex, setPlaying, setCurrentIndex]);

  // When playing, slice candles to show only up to current index
  useEffect(() => {
    if (isPlaying && allCandlesRef.current.length > 0) {
      const sliced = allCandlesRef.current.slice(0, currentIndex + 1);
      if (sliced.length > 0) {
        setCandles(sliced);
      }
    }
  }, [currentIndex, isPlaying, setCandles]);

  // When stopping playback, restore all candles
  useEffect(() => {
    if (!isPlaying && allCandlesRef.current.length > 0 && candles.length < allCandlesRef.current.length) {
      setCandles(allCandlesRef.current);
    }
  }, [isPlaying, candles.length, setCandles]);

  const handleSliderChange = (value: number[]) => {
    const newIndex = value[0];
    setCurrentIndex(newIndex);
    if (allCandlesRef.current.length > 0) {
      const sliced = allCandlesRef.current.slice(0, newIndex + 1);
      setCandles(sliced);
    }
  };

  const handleReset = () => {
    reset();
    if (allCandlesRef.current.length > 0) {
      setCandles(allCandlesRef.current);
    }
  };

  const progress = maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[560px] max-w-[90vw]"
      >
        <div className="bg-gray-950/90 backdrop-blur-xl border border-white/[0.06] rounded-xl px-4 py-2.5 shadow-2xl">
          <div className="flex items-center gap-2">
            {/* Reset */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-500 hover:text-white h-7 w-7 p-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant={isPlaying ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPlaying(!isPlaying)}
              className={isPlaying
                ? 'bg-amber-500 text-white hover:bg-amber-600 h-8 w-8 p-0 rounded-full'
                : 'text-gray-400 hover:text-white h-8 w-8 p-0 rounded-full border border-white/10'
              }
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>

            {/* Skip buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 10))}
              className="text-gray-500 hover:text-white h-7 w-7 p-0"
            >
              <SkipBack className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(maxIndex, currentIndex + 10))}
              className="text-gray-500 hover:text-white h-7 w-7 p-0"
            >
              <SkipForward className="w-3 h-3" />
            </Button>

            {/* Progress Slider */}
            <div className="flex-1 flex items-center gap-2">
              <Slider
                value={[currentIndex]}
                min={0}
                max={maxIndex || 1}
                step={1}
                onValueChange={handleSliderChange}
                className="flex-1"
              />
            </div>

            {/* Counter */}
            <span className="text-[10px] text-gray-500 tabular-nums min-w-[60px] text-right">
              {currentIndex + 1}/{maxIndex + 1}
            </span>

            {/* Speed selector */}
            <div className="flex items-center bg-white/[0.04] rounded-md p-0.5 border border-white/[0.03]">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                    speed === s.value ? 'bg-amber-500/20 text-amber-400' : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress bar line */}
          <div className="h-[2px] bg-white/[0.03] rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
