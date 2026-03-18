# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server
bun run dev

# Unit tests (Bun test runner)
bun test

# Run a single test file
bun test src/engine/simulationEngine.test.ts

# Type checking
bun run typecheck
bun run typecheck:test   # includes test-only tsconfig

# E2E tests (Playwright, Chromium only)
bun run test:e2e

# E2E manually: bundle then serve
bun run e2e:bundle && bun run e2e:serve
# then: npx playwright test

# Build check — runs bun test (intentional alias in package.json)
bun run build
```

After every change, run `bun run build` to catch type/test errors.

## Architecture

SpeedPlane is a frontend-only React + TypeScript app (Vite, Zustand, SCSS). No backend.

### Layer separation

```
React UI (components/)
    ↓ reads/dispatches
Zustand store (store/simulationStore.ts)
    ↓ owns
SimulationEngine (engine/simulationEngine.ts)   ← owns elapsed time
TimeController  (engine/timeController.ts)       ← drives rAF loop
    ↓
Data definitions (data/speedObjects.ts)
Utils (utils/unitConversion.ts, utils/trackPosition.ts)
```

### Simulation engine invariants

- **One shared clock.** `SimulationEngine` owns `elapsedTimeSeconds`. No per-track timers.
- **Position is always derived:** `distance = speedMs * elapsedTimeSeconds` — never stored, never incremented directly.
- **Speed conversion:** `speedMs = speedKmh / 3.6` (centralized in `utils/unitConversion.ts`).
- **Changing track distance resets the simulation** (engine.setDistance() enforces this).
- **TimeController** calls `engine.advanceTo(rafTimestamp)` each frame; the engine computes the delta and notifies subscribers.

### Store pattern

`createSimulationStore()` (in `store/simulationStore.ts`) wires `SimulationEngine` + `TimeController` together with a Zustand vanilla store. The store exposes action helpers (`startSimulation`, `pauseSimulation`, etc.) and a `dispatch` for raw `SimulationAction` objects. Engine state is synced into Zustand via `ENGINE_SYNC` actions on every rAF tick.

`useSimulationStore(selector)` is the React hook; `getSimulationStore()` gives the raw store for tests.

### State model

- `simulationState.engine` — `{ isRunning, elapsedTimeSeconds, trackLengthMeters }`
- `simulationState.tracks[]` — each track holds `id` + `objectId` only; position is derived at render time
- `simulationState.distance` — `{ value (meters, canonical), amount (user-facing), unit }`

### Testing

- **Unit tests:** colocated `.test.ts` files, run with `bun test`. Cover engine, reducer, selectors, utils.
- **E2E tests:** `e2e/*.e2e.ts`, run with Playwright against a static bundle served on port 4173.

## Code conventions

- SCSS only — no Tailwind classes anywhere.
- UI primitives follow shadcn-style components in `src/components/ui/`, themed via SCSS.
- `const` arrow function exports for components, selectors, utilities, store helpers.
- Enums for units (`DistanceUnit`, `SpeedLengthUnit`, `SpeedTimeUnit`) and action types (`SimulationActionType`). No magic strings.
- Canonical state uses `value` (base unit, meters or m/s), `amount` (user-facing), `unit` (enum).
- All conversion logic lives in `utils/`; no ad-hoc conversions in UI or store layers.
- `transform: translateX` for track object positioning (avoids layout reflow).

## Docs to update on feature changes

1. Feature runbook in `docs/integration/features/`
2. Chunk/feature status in `docs/IMPLEMENTATION_PLAN.md`
3. Testing expectations in `docs/TESTING.md`
