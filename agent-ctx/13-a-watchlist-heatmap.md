# Task 13-a: Watchlist Panel + 3D Volume Heatmap Layer

**Agent:** Feature Implementation Agent
**Date:** 2025-04-20

## Work Completed

### Feature 1: Watchlist Panel Component

Created new file: `src/components/panels/Watchlist.tsx`

A Bloomberg-terminal-style watchlist showing all 4 energy symbols (CL, NG, RB, HO) in a compact 2x2 mini-card grid layout. Each card displays:

- **Symbol name** (CL, NG, RB, HO) with its `buyerColor` dot and glow effect
- **Current price** - from active symbol's candles (via marketStore), or generated via `generateEnergyData` for non-active symbols
- **Change %** from first to last candle - color-coded green/red badge
- **Mini 20-point sparkline** - SVG polyline with gradient area fill, color matches direction (green for up, red for down)
- **Volume indicator bar** - horizontal bar scaled relative to max volume in recent 20 candles, with volume text label (e.g., "250K")

Interactions & Styling:
- **Active symbol highlight**: Amber border glow (`border-amber-500/60`, `ring-1 ring-amber-500/30`, `shadow-[0_0_12px_rgba(245,158,11,0.15)]`)
- **Hover effects**: `whileHover` scale 1.02, border brighten to `rgba(245,158,11,0.4)`
- **Tap feedback**: `whileTap` scale 0.98
- **Glass-card-enhanced** styling
- **Framer-motion staggered animation**: Cards enter with `opacity: 0, x: 20` → `opacity: 1, x: 0` with `delay: index * 0.07`
- **Click handler**: Calls `setSymbol(sym)` from marketStore to switch active symbol
- **Eye icon** header with "Watchlist" label and "4 symbols" subtitle

Integrated into `RightPanel.tsx`:
- Added import: `import { Watchlist } from '@/components/panels/Watchlist';`
- Inserted AFTER `MarketRegimeIndicator` section with a `section-divider-enhanced` divider before it

### Feature 2: 3D Volume Heatmap Layer

Modified: `src/components/canvas/EnergyHelix.tsx`

Added new `VolumeHeatmap` component that creates a cylindrical heatmap around the DNA helix showing volume intensity:

- **Ring placement**: Horizontal torus rings at each sampled candle's Y (time) position, positioned at `[0, y, 0]` to properly wrap around the helix's central axis
- **Ring radius**: `HELIX_RADIUS + 0.3` (offset from helix for visual separation)
- **Sampling**: Every Nth candle sampled (max ~60 rings) for performance
- **Color gradient based on volume intensity**:
  - Low volume (normalizedVol ≤ 0.5): Dim amber `#92400e`
  - Medium volume (0.5 < normalizedVol ≤ 0.8): Bright amber `#fbbf24`
  - High volume (normalizedVol > 0.8): Near white `#fff7ed`
- **Tube radius**: Varies from 0.015 (low vol) to 0.055 (high vol) - thicker rings for higher volume
- **Opacity**: Scales with volume (0.15 for low → 0.60 for high), with per-ring pulsing animation
- **Emissive intensity**: 0.2 to 1.0, scaled by volume - high volume rings glow brighter
- **Animation**: Each ring pulses opacity ±10% using `useFrame`, with phase offset per ring (`sin(time * 0.8 + i * 0.3)`) creating a flowing wave effect
- **Visibility**: Only rendered when `showVolumeProfile` is true in uiStore
- **Performance**: Material refs stored in array for efficient per-ring animation; `depthWrite: false` to avoid z-fighting

Added to EnergyHelix's group: `<VolumeHeatmap />` placed after `<WeatherParticles />`

## Verification
- `bun run lint` passes with zero errors
- Dev server running successfully on port 3000
- All existing functionality preserved (buyers, sellers, connections, price levels, fibonacci, selection ring, EIA markers, weather particles)
- No blue/indigo colors used - only amber/gold/green/red/cyan/copper palette

## Files Changed
- NEW: `src/components/panels/Watchlist.tsx` (155 lines)
- MODIFIED: `src/components/panels/RightPanel.tsx` (added Watchlist import + rendering after MarketRegimeIndicator)
- MODIFIED: `src/components/canvas/EnergyHelix.tsx` (added VolumeHeatmap component + rendering in EnergyHelix group)
