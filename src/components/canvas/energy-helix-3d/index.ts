/**
 * EnergyHelix 3D
 * Standalone 3D visualization component for energy futures
 */

// Main component
export { EnergyHelix } from './EnergyHelix';

// Sub-components (available for customization)
export { BuyerNodes, SellerNodes } from './Nodes';
export { SpiralBackbone, ConnectionBars } from './Backbone';
export { PriceLevelIndicators, FibonacciLevels } from './Indicators';
export { EIADayMarkers, WeatherParticles } from './Markers';
export { SelectionRing, SelectedCandleLabel } from './Selection';
export { VolumeHeatmap, AmbientGlowRing, PulsingEnergyCore, ConnectingEnergyArcs } from './Effects';

// Types
export type {
  HelixCandle,
  HelixSymbol,
  HelixSymbolConfig,
  HelixPoint,
  HelixData,
  HelixDisplayOptions,
  HelixCallbacks,
  EnergyHelixProps,
} from './types';

export { HELIX_SYMBOLS } from './types';

// Utilities
export { generateHelixData, generateSpiralCurve, HELIX_CONSTANTS } from './lib/helixMath';
export type { HelixMathOptions } from './lib/helixMath';
