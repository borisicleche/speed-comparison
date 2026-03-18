Product Name

SpeedPlane

1. Overview

SpeedPlane is a web-based interactive visualization application that compares the speeds of different objects, animals, vehicles, and fictional characters on a two-dimensional plane.

The application allows users to select multiple objects and visualize their movement along parallel tracks ("lanes") over a configurable distance. Each object is positioned and animated according to its real-world average speed, enabling intuitive, visual speed comparison.

The frontend will be built using React with styling in SCSS (no Tailwind).

2. Problem Statement

Speed comparisons are typically presented numerically (e.g., km/h, mph), which makes it difficult to intuitively understand the differences between speeds.

There is no simple, visual, interactive way to compare how fast different real-world and fictional entities move relative to each other.

3. Goals
   Primary Goals

Provide a visual and interactive 2D speed comparison system.

Allow users to add multiple “lanes” for comparison.

Enable dynamic selection of objects per lane.

Accurately represent object position based on real-world average speeds.

Allow configurable track length.

Secondary Goals (Future)

Custom object creation.

Time scaling (slow motion / acceleration).

Shareable comparison links.

Preset comparison scenarios (e.g., “Land Vehicles”, “Animals”, “Fictional Speedsters”).

4. Target Users

Students

Educators

Science enthusiasts

Casual users curious about speed comparisons

Pop culture fans comparing fictional characters

5. Core Features
   5.1 Track Visualization

The main screen displays a 2D horizontal “track field.”

Each track (lane) represents one selected object.

Tracks are stacked vertically.

Objects move from left (start) to right (finish).

Position updates based on elapsed time and speed formula:

position = speed × time

Units should be consistent (e.g., meters, kilometers).

5.2 Multiple Tracks

Users can:

Add a new track.

Remove a track.

Reorder tracks (optional V2).

Each track contains:

Object selector dropdown.

Visual moving object.

Display of:

Name

Average speed

Current position

Distance remaining

5.3 Object Selection

Initial predefined objects with average speeds:

Object Average Speed
Human (walking) 5 km/h
Human (running) 15 km/h
Car (city average) 50 km/h
Train 120 km/h
Airplane 900 km/h
Cheetah 100 km/h

Optional fictional examples (future phase):

Flash

Sonic the Hedgehog

Each object definition contains:

id

name

category (human, vehicle, animal, fictional)

averageSpeed (km/h)

optional icon/image

5.4 Configurable Track Length

User can modify:

Total distance of comparison (e.g., 100m, 1km, 10km, custom value)

Distance unit (m or km)

Changing track length recalculates:

Finish time

Relative position scaling

5.5 Simulation Controls

Start

Pause

Reset

Time multiplier (1x, 2x, 5x) — optional V1.1

5.6 Accurate Position Representation

Position must:

Be calculated using real-world speed converted to consistent units (m/s).

Update using a time delta approach (not frame-based constant increments).

Be deterministic and mathematically correct.

Example conversion:

km/h → m/s = speed / 3.6

6. User Flow

User opens app.

Default tracks appear (e.g., Human vs Car).

User:

Adds new track.

Selects object from dropdown.

Sets track length.

User clicks “Start”.

Objects move according to real speeds.

First object reaching end visually finishes.

7. Functional Requirements
   FR1: Track Management

User can add unlimited tracks (reasonable UI limit recommended: 10).

Each track must independently bind to selected object.

FR2: Object Selection

Dropdown populated from predefined object list.

Changing object updates speed instantly.

FR3: Simulation Engine

Central time controller.

Shared simulation clock.

Position calculation per object using same time reference.

FR4: Scaling

Track UI scales proportionally to selected total distance.

Objects visually aligned at 0 at reset.

FR5: Responsive Design

Desktop-first.

Functional on tablet.

Mobile support optional V1.

8. Non-Functional Requirements

Smooth animation (60 FPS target).

Deterministic movement (no randomization).

Clean modular React architecture.

SCSS-based styling (no Tailwind).

No heavy animation libraries required (prefer native requestAnimationFrame).

9. Technical Requirements
   9.1 Frontend Stack

React (latest stable)

SCSS (modular structure)

No Tailwind

Optional:

Zustand or Redux (state management)

React Context (if state is simple)

Vite or Next.js (optional)

9.2 Suggested Architecture
src/
├── components/
│ ├── Track/
│ ├── TrackList/
│ ├── Controls/
│ ├── ObjectSelector/
│ ├── SimulationCanvas/
│
├── engine/
│ ├── simulationEngine.ts
│ ├── speedUtils.ts
│
├── data/
│ ├── objects.ts
│
├── styles/
│ ├── variables.scss
│ ├── mixins.scss
│
├── App.tsx

9.3 Simulation Engine Responsibilities

Maintain:

globalTime

isRunning

trackLength

Provide:

start()

pause()

reset()

subscribe(listener)

Use:

requestAnimationFrame()

to drive updates.

9.4 Data Model
Object Definition
type SpeedObject = {
id: string;
name: string;
category: "human" | "vehicle" | "animal" | "fictional";
averageSpeedKmh: number;
};

Track Definition
type Track = {
id: string;
objectId: string;
currentDistance: number;
};

10. UI / UX Guidelines

Clean, minimalistic.

Neutral background.

Clearly visible finish line.

Distinct color per track.

Smooth horizontal animation.

Speed label displayed next to object.

11. MVP Scope

Included:

Multiple tracks

Object selection

Configurable distance

Start/Pause/Reset

Real-world speeds (basic objects)

React + SCSS implementation

Excluded (V2):

Physics effects

Acceleration curves

Multiplayer

3D visualization

Backend

12. Risks

Incorrect speed normalization.

Poor scaling for extreme speed differences (e.g., airplane vs walking human).

Performance issues with many tracks.

Mitigation:

Logarithmic scaling option (future).

Frame-based delta time calculation.

13. Success Metrics

User can visually understand relative speeds within 5 seconds.

Smooth animation with no stutter.

No calculation drift over time.

If you'd like, I can next generate:

Technical Architecture Document (TAD)

Database schema (if future backend)

UI wireframe description

Initial object dataset with verified real-world speeds

Or a starter project structure with example code
