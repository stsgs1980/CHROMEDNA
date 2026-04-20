import { create } from 'zustand';
import { EnergySymbol, Timeframe, DecompositionLevel } from '@/types/energy';
import { EnergyCandle, VolumeProfile, OrderFlowData, AICompositeScore } from '@/types/market';

export interface PriceAlert {
  id: string;
  symbol: EnergySymbol;
  price: number;
  direction: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
}

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

  // Price Alerts
  priceAlerts: PriceAlert[];

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

  // Price Alert Actions
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  removePriceAlert: (id: string) => void;
  triggerPriceAlert: (id: string) => void;
  clearTriggeredAlerts: () => void;
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

  priceAlerts: [],

  setSymbol: (symbol) => set({ symbol, selectedCandleIndex: null }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setDecompositionLevel: (decompositionLevel) => set({ decompositionLevel }),
  setCandles: (candles) => set({ candles, isLoading: false }),
  selectCandle: (selectedCandleIndex) => set({ selectedCandleIndex }),
  setLive: (isLive) => set({ isLive }),
  setVolumeProfile: (volumeProfile) => set({ volumeProfile }),
  setOrderFlow: (orderFlow) => set({ orderFlow }),
  setAiScore: (aiScore) => set({ aiScore }),
  setLoading: (isLoading) => set({ isLoading }),

  addPriceAlert: (alert) => set((state) => ({
    priceAlerts: [
      ...state.priceAlerts,
      {
        ...alert,
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
        triggered: false,
      },
    ],
  })),
  removePriceAlert: (id) => set((state) => ({
    priceAlerts: state.priceAlerts.filter((a) => a.id !== id),
  })),
  triggerPriceAlert: (id) => set((state) => ({
    priceAlerts: state.priceAlerts.map((a) => a.id === id ? { ...a, triggered: true } : a),
  })),
  clearTriggeredAlerts: () => set((state) => ({
    priceAlerts: state.priceAlerts.filter((a) => !a.triggered),
  })),
}));
