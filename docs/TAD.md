Technical Architecture Document (TAD)
Product Name

SpeedPlane

1. Architecture Overview

SpeedPlane is a client-side React application that simulates speed comparisons between objects on a 2D track.

The system is:

Frontend-only (no backend in MVP)

Deterministic simulation-based

Single shared time engine

Component-driven UI

SCSS modular styling (no Tailwind)

2. High-Level Architecture
   ┌──────────────────────────┐
   │ React UI Layer │
   │ (Tracks, Controls, UI) │
   └──────────────┬───────────┘
   │
   ┌──────────────▼───────────┐
   │ Simulation Engine │
   │ (Time + Calculations) │
   └──────────────┬───────────┘
   │
   ┌──────────────▼───────────┐
   │ Data Definitions │
   │ (Speed Objects List) │
   └──────────────────────────┘

3. Core Design Principles
   3.1 Single Source of Truth for Time

All track positions must derive from:

distance = speed \* elapsedTime

There must NOT be per-track timers.

The simulation engine owns time.

3.2 Deterministic Physics

Movement must:

Be delta-time based

Use real-world speed conversion (km/h → m/s)

Avoid frame-based increments

Prevent floating drift accumulation

3.3 Separation of Concerns
Layer Responsibility
UI Rendering tracks, inputs, labels
Engine Time control + position calculation
Data Object definitions
Utils Unit conversion 4. Tech Stack
Frontend

React (latest stable)

TypeScript (strongly recommended)

SCSS (modular)

Vite (recommended for simplicity)

State Management

For MVP:

Zustand + reducer-style actions

Redux is not necessary.

5. Folder Structure
   src/
   │
   ├── app/
   │ ├── App.tsx
   │ ├── App.scss
   │
   ├── components/
   │ ├── Track/
   │ │ ├── Track.tsx
   │ │ ├── Track.scss
   │ │
   │ ├── TrackList/
   │ │
   │ ├── Controls/
   │ │
   │ ├── ObjectSelector/
   │ │
   │ ├── DistanceInput/
   │
   ├── engine/
   │ ├── simulationEngine.ts
   │ ├── timeController.ts
   │
   ├── store/
   │ ├── simulationStore.ts
   │ ├── simulationReducer.ts
   │
   ├── data/
   │ ├── speedObjects.ts
   │
   ├── utils/
   │ ├── unitConversion.ts
   │ ├── math.ts
   │
   ├── styles/
   │ ├── variables.scss
   │ ├── mixins.scss
   │ ├── global.scss

6. Data Layer
   6.1 Speed Object Model
   export type SpeedObject = {
   id: string;
   name: string;
   category: "human" | "vehicle" | "animal" | "fictional";
   averageSpeedKmh: number;
   };

6.2 Track Model
export type Track = {
id: string;
objectId: string;
};

Note:
Track does NOT store position.
Position is derived from time.

7. Simulation Engine Design
   7.1 Responsibilities

Maintain simulation state:

isRunning

startTimestamp

elapsedTime

trackLength

Convert speeds

Notify subscribers

Drive animation loop

7.2 Engine API
class SimulationEngine {
start(): void
pause(): void
reset(): void
setDistance(distance: number): void
subscribe(listener: () => void): () => void
getElapsedTime(): number
}

7.3 Time Implementation

Use:

requestAnimationFrame()

Time calculation:

const delta = currentTime - lastFrameTime
elapsedTime += delta / 1000

Important:
Never increment distance directly.
Always compute from:

distance = speedInMetersPerSecond \* elapsedTime

8. Speed Normalization

Convert once:

km/h → m/s
speedMs = speedKmh / 3.6

Stored internally in m/s.

9. Rendering Strategy
   9.1 Track Scaling

UI width = 100%

Object X position =

(distance / totalTrackLength) \* trackPixelWidth

Clamp at finish line.

9.2 Extreme Speed Differences

Airplane vs Human can cause:

One object instantly finishing.

Mitigation (future option):

Logarithmic visual scaling.

Adaptive time multiplier.

MVP: keep linear scaling.

10. App State Flow
    Zustand store
    ├── tracks[]
    ├── selectedObjects
    ├── distance
    ├── engineState

Flow:

User clicks Start

Engine updates elapsedTime

Store updates subscribers

Each Track computes its position

UI updates

11. Styling Architecture (SCSS)
    11.1 Structure

Global variables in variables.scss

Track-specific styles colocated

BEM naming convention recommended

Example:

.track
.track**object
.track**label
.track--finished

11.2 No Tailwind

Use shadcn-style component primitives (for example `Card`, `Badge`, `Progress`) but style them through SCSS modules/files only.
Do not use Tailwind utility classes in application code.

All styling must:

Be written in SCSS

Use variables for colors

Avoid inline styles except dynamic transform positioning

12. Performance Considerations

Target:

60 FPS

Optimizations:

Memoize Track components

Avoid recalculating heavy values

Use transform: translateX instead of left positioning

Avoid triggering layout reflow

13. Edge Cases
    13.1 Track Length Change During Simulation

Behavior:

Reset simulation automatically

13.2 Object Change Mid-Run

Behavior:

Recalculate instantly from same elapsedTime

13.3 Many Tracks (>10)

Potential FPS drop
Mitigation:

Soft limit warning

14. Future Extension Architecture

Prepared for:

Presets (JSON definitions)

Save/share via URL params

Backend persistence

Adding characters like:

Flash

Sonic the Hedgehog

Logarithmic comparison mode

Acceleration curves

3D rendering (Three.js migration path)

15. Testing Strategy
    Unit Tests

Speed conversion

Distance calculation

Scaling math

Integration Tests

Start / Pause logic

Multiple track correctness

Visual Verification

Known example:

Human (5 km/h)

Car (50 km/h)

At 1 km track

Car should finish 10x faster

16. Deployment

Static deployment (Vercel recommended)

No backend required

No server-side rendering necessary

17. Architectural Risks
    Risk Mitigation
    Time drift Always derive position from elapsedTime
    Floating precision Clamp values
    Extreme speed gaps Consider visual scaling later
    Overengineering Keep MVP simple
18. MVP Implementation Order

Setup Vite + React + SCSS

Define SpeedObject data

Implement SimulationEngine

Build Track component

Build TrackList

Add Controls

Add Distance input

Connect everything with Context

Polish UI

Performance pass
