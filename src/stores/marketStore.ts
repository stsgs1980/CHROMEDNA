import { create } from 'zustand';
import { EnergySymbol, Timeframe, DecompositionLevel } from '@/types/energy';
import { EnergyCandle, VolumeProfile, OrderFlowData, AICompositeScore } from '@/types/market';

interface MarketState {
  // Data
  symbol: EnergySymbol;
  timeframe: Timeframe;
  decompositionLevel: DecompositionLevel;
  candles: EnergyCandle[];
  selectedCandleIndex: number | null;
  isLive: boolean;
  volumeProfile: VolumeProfile | null;
  orderFlow: OrderFlowData | null;
  aiScore: AICompositeScore | null;
  isLoading: boolean;

  // Actions
  setSymbol: (symbol: EnergySymbol) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setDecompositionLevel: (level: DecompositionLevel) => void;
  setCandles: (candles: EnergyCandle[]) => void;
  selectCandle: (index: number | null) => void;
  setLive: (live: boolean) => void;
  setVolumeProfile: (vp: VolumeProfile | null) => void;
  setOrderFlow: (of: OrderFlowData | null) => void;
  setAiScore: (score: AICompositeScore | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  symbol: 'CL',
  timeframe: '1D',
  decompositionLevel: 'D4',
  candles: [],
  selectedCandleIndex: null,
  isLive: false,
  volumeProfile: null,
  orderFlow: null,
  aiScore: null,
  isLoading: true,

  setSymbol: (symbol) => set({ symbol, selectedCandleIndex: null, isLoading: true }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setDecompositionLevel: (decompositionLevel) => set({ decompositionLevel }),
  setCandles: (candles) => set({ candles, isLoading: false }),
  selectCandle: (selectedCandleIndex) => set({ selectedCandleIndex }),
  setLive: (isLive) => set({ isLive }),
  setVolumeProfile: (volumeProfile) => set({ volumeProfile }),
  setOrderFlow: (orderFlow) => set({ orderFlow }),
  setAiScore: (aiScore) => set({ aiScore }),
  setLoading: (isLoading) => set({ isLoading }),
}));
