# Project Configuration

> Project-specific settings for the current project.
> This file is NOT part of the toolkit standards -- it is created per project.
>
> Toolkit version: v1.9.1

---

## Stack Signature

```
Built with: Next.js 16 + React Three Fiber + Zustand + Tailwind CSS
```

> Format defined by: `MARKDOWN_STANDARD v2.1`
> Default value defined by: `README_TEMPLATE.md`

---

## Dev Server

| Setting | Value |
|---------|-------|
| Command | `npx next dev -p 3000` |
| Health check | `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000` |
| Host | `127.0.0.1` (NOT `localhost`) |
| Startup wait | 6 seconds (Turbopack compile time) |
| Output redirect | `</dev/null >/tmp/zdev.log 2>&1 &` |

### Error Handling

| Response | Action |
|----------|--------|
| 200 | Server running, proceed |
| 000 | Server down, restart with `dev-watchdog` skill |
| 500 | Server error, check logs, fix error, then restart |

---

## Project Paths

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router entry points and routes |
| `src/components/canvas/` | 3D scene components (React Three Fiber) |
| `src/components/panels/` | UI panels and overlays |
| `src/stores/` | Zustand state stores |
| `src/lib/` | Utilities and helpers |
| `src/types/` | TypeScript type definitions |
| `instructions/` | Agent behavioral instructions |
| `skills/` | Automated agent skills |
| `standards/` | Governance documents (Group B) |

---

## Component Library

- Use **shadcn/ui** components, do not build from scratch
- TypeScript throughout with strict typing
- React Three Fiber for 3D rendering

---

## Environment Variables

All environment variables must be documented in `.env.example`
per `REPRODUCIBILITY-STANDARD`.

---

## Notes

- This file is the single source of truth for project-specific configuration
- When switching to a different stack, update only this file
- AGENT_RULES.md references this file for all project-dependent settings
- 3D components consume significant memory (~1.3 GB in dev mode)
- Production mode recommended: `NODE_OPTIONS="--max-old-space-size=512" npm run start`
