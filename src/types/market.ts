import { EnergySymbol, EIAExpectation, SignalType, DecompositionLevel, Timeframe } from './energy';

export interface OHLCV {
  time: number; // unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInterest: number;
}

export interface EnergyCandle extends OHLCV {
  eiaExpectation?: EIAExpectation;
  weatherImpact?: number; // -100 to 100
  seasonalFactor?: number; // 0.5 to 1.5
  delta?: number; // buy volume - sell volume
  buyVolume?: number;
  sellVolume?: number;
}

export interface HelixPoint {
  position: [number, number, number]; // x=volume scale, y=price, z=time
  color: string;
  scale: number;
  candle: EnergyCandle;
  index: number;
}

export interface HelixData {
  buyers: HelixPoint[];
  sellers: HelixPoint[];
  connections: [number, number][]; // pairs of indices
}

export interface MarketProfileLevel {
  price: number;
  volume: number;
  tpoCount: number;
  delta: number;
}

export interface VolumeProfile {
  levels: MarketProfileLevel[];
  poc: number; // Point of Control
  vah: number; // Value Area High
  val: number; // Value Area Low
}

export interface FootprintLevel {
  price: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  imbalance?: 'buy' | 'sell'; // if ratio > 3:1
}

export interface OrderFlowData {
  levels: FootprintLevel[];
  cumulativeDelta: number;
  largeTrades: LargeTrade[];
  velocity: number; // contracts/sec
}

export interface LargeTrade {
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface AICompositeScore {
  score: number; // 0-100
  signal: SignalType;
  confidence: number; // 0-100
  components: ScoreComponent[];
}

export interface ScoreComponent {
  name: string;
  weight: number;
  value: number;
  signal: SignalType;
}

export interface MarketState {
  symbol: EnergySymbol;
  timeframe: Timeframe;
  decompositionLevel: DecompositionLevel;
  candles: EnergyCandle[];
  selectedCandleIndex: number | null;
  isLive: boolean;
  volumeProfile: VolumeProfile | null;
  orderFlow: OrderFlowData | null;
  aiScore: AICompositeScore | null;
}
