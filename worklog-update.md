
---
Task ID: 16
Agent: Main Orchestrator (Fix 502 Bug)
Task: Fix HTTP 502 Bad Gateway error - dev server instability causing application to be inaccessible

Work Log:
- User reported "не работает" (doesn't work) - HTTP 502 Bad Gateway
- Diagnosed: Dev server process was dead (not running)
- Root cause: Next.js Turbopack dev server grows to 1.3-1.5GB RSS, sandbox kills process
- Solution: NODE_OPTIONS="--max-old-space-size=768" limits V8 heap, keeping RSS ~1.1GB stable
- Converted all panel imports in page.tsx to dynamic imports with ssr:false (10 components)
- Added allowedDevOrigins for .space.z.ai in next.config.ts
- Created start-server.sh for reliable startup
- Set up cron watchdog (job 107831) with 5-minute interval
- Verified: App loads correctly in browser with 3D scene + all panels

Stage Summary:
- Fixed: 502 Bad Gateway by using NODE_OPTIONS="--max-old-space-size=768"
- Optimized: 10 heavy components converted to dynamic imports
- Added: allowedDevOrigins, start-server.sh, cron watchdog
- Verified: App works (3D DNA helix, Header, Right/Left/Bottom panels, Footer)
