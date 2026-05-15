/**
 * EnergyHelix 3D - Types
 * Independent types for standalone package
 */

// Core candle data
export interface HelixCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  delta?: number;
  buyVolume?: number;
  sellVolume?: number;
  weatherImpact?: number;
}

// Symbol configuration
export type HelixSymbol = 'CL' | 'NG' | 'RB' | 'HO';

export interface HelixSymbolConfig {
  symbol: HelixSymbol;
  name: string;
  buyerColor: string;
  sellerColor: string;
}

export const HELIX_SYMBOLS: Record<HelixSymbol, HelixSymbolConfig> = {
  CL: { symbol: 'CL', name: 'Crude Oil', buyerColor: '#FFD700', sellerColor: '#8B4513' },
  NG: { symbol: 'NG', name: 'Natural Gas', buyerColor: '#00CED1', sellerColor: '#FF6347' },
  RB: { symbol: 'RB', name: 'RBOB Gasoline', buyerColor: '#32CD32', sellerColor: '#FF4500' },
  HO: { symbol: 'HO', name: 'Heating Oil', buyerColor: '#9370DB', sellerColor: '#DC143C' },
};

// Helix point data
export interface HelixPoint {
  position: [number, number, number];
  color: string;
  scale: number;
  candle: HelixCandle;
  index: number;
}

export interface HelixData {
  buyers: HelixPoint[];
  sellers: HelixPoint[];
  connections: [number, number][];
}

// Display options
export interface HelixDisplayOptions {
  showBuyers?: boolean;
  showSellers?: boolean;
  showConnections?: boolean;
  showFibonacci?: boolean;
  showEIALayer?: boolean;
  showWeatherLayer?: boolean;
  showVolumeProfile?: boolean;
  autoRotate?: boolean;
}

// Interaction callbacks
export interface HelixCallbacks {
  onCandleSelect?: (index: number | null) => void;
  onCandleHover?: (index: number | null) => void;
}

// Main component props
export interface EnergyHelixProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
  selectedIndex?: number | null;
  options?: HelixDisplayOptions;
  callbacks?: HelixCallbacks;
}

// Individual component props
export interface BuyerNodesProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

export interface SellerNodesProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

export interface SpiralBackboneProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
}

export interface ConnectionBarsProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
}

export interface PriceLevelIndicatorsProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
}

export interface FibonacciLevelsProps {
  candles: HelixCandle[];
  showFibonacci: boolean;
}

export interface EIADayMarkersProps {
  candles: HelixCandle[];
  showEIALayer: boolean;
}

export interface WeatherParticlesProps {
  candles: HelixCandle[];
  showWeatherLayer: boolean;
}

export interface SelectionRingProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
  selectedIndex: number | null;
}

export interface SelectedCandleLabelProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
  selectedIndex: number | null;
}

export interface VolumeHeatmapProps {
  candles: HelixCandle[];
  showVolumeProfile: boolean;
}

export interface AmbientGlowRingProps {
  candles: HelixCandle[];
}

export interface PulsingEnergyCoreProps {
  candles: HelixCandle[];
}

export interface ConnectingEnergyArcsProps {
  candles: HelixCandle[];
  symbol: HelixSymbol;
}
