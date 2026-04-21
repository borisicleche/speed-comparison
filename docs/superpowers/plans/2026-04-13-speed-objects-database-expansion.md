# Speed Objects Database Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the speed objects database from 6 entries across 4 vague categories to ~75 entries across 10 specific, thematic categories.

**Architecture:** Replace the `VEHICLE` enum value with `CAR`, `MOTORCYCLE`, `TRAIN`, `PLANE`, `BOAT`, `SPACE`, and `NATURE`. Fill each category with real-world researched speed entries. Update the fixtures file so its one affected entry (`airplane` → `plane-boeing-737`) stays valid. No schema changes — only the enum and the data array grow.

**Tech Stack:** TypeScript, Bun test runner (`bun test`), Vite (no build step needed for data-only changes).

**Spec:** `docs/superpowers/specs/2026-04-13-speed-objects-database-expansion-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/data/speedObjects.ts` | Modify | Expand `SpeedObjectCategory` enum; replace `SPEED_OBJECTS` array |
| `src/data/speedObjects.fixtures.ts` | Modify | Update `airplane` fixture → `plane-boeing-737` with recalculated `expectedFinishSeconds` |

No other files need touching. Tests in `src/data/speedObjects.test.ts` are generic and will pass once the data is correct.

---

## Task 1: Expand the `SpeedObjectCategory` enum

**Files:**
- Modify: `src/data/speedObjects.ts`

- [ ] **Step 1: Replace the enum**

Open `src/data/speedObjects.ts`. Replace the entire `SpeedObjectCategory` enum (lines 1–6) with:

```ts
export enum SpeedObjectCategory {
  HUMAN = "human",
  ANIMAL = "animal",
  CAR = "car",
  MOTORCYCLE = "motorcycle",
  TRAIN = "train",
  PLANE = "plane",
  BOAT = "boat",
  SPACE = "space",
  NATURE = "nature",
  FICTIONAL = "fictional",
}
```

`VEHICLE` is intentionally removed. No existing runtime code references it — the old entries that used it will be replaced in Task 2.

- [ ] **Step 2: Run type-check to confirm no other file referenced `VEHICLE`**

```bash
bun run typecheck
```

Expected: passes with no errors. If any file imports `SpeedObjectCategory.VEHICLE`, fix those references before continuing.

---

## Task 2: Replace the `SPEED_OBJECTS` array

**Files:**
- Modify: `src/data/speedObjects.ts`

- [ ] **Step 1: Replace the entire `SPEED_OBJECTS` array**

Replace everything from `export const SPEED_OBJECTS` to the closing `];` with the full array below.
Keep all other exports (`SPEED_OBJECTS_BY_ID`, `DEFAULT_SPEED_OBJECT_IDS`, `getSpeedObjectById`) unchanged.

```ts
export const SPEED_OBJECTS: ReadonlyArray<SpeedObject> = [
  // ── HUMAN ──────────────────────────────────────────────────────────────
  { id: "human-walking",         name: "Human (walking)",                    category: SpeedObjectCategory.HUMAN,       averageSpeedKmh: 5 },
  { id: "human-jogging",         name: "Human (jogging)",                    category: SpeedObjectCategory.HUMAN,       averageSpeedKmh: 10 },
  { id: "human-running",         name: "Human (running)",                    category: SpeedObjectCategory.HUMAN,       averageSpeedKmh: 15 },
  { id: "human-sprinting",       name: "Human (sprinting, Usain Bolt)",      category: SpeedObjectCategory.HUMAN,       averageSpeedKmh: 44.7 },
  { id: "human-cycling-racing",  name: "Human (cycling, Tour de France)",    category: SpeedObjectCategory.HUMAN,       averageSpeedKmh: 45 },

  // ── ANIMAL ─────────────────────────────────────────────────────────────
  { id: "animal-garden-snail",      name: "Garden snail",                    category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 0.05 },
  { id: "animal-three-toed-sloth",  name: "Three-toed sloth",               category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 0.24 },
  { id: "animal-tortoise",          name: "Tortoise",                        category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 0.5 },
  { id: "animal-elephant",          name: "Elephant (charge)",               category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 25 },
  { id: "animal-dragonfly",         name: "Dragonfly",                       category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 58 },
  { id: "animal-horse",             name: "Horse (gallop)",                  category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 70 },
  { id: "animal-ostrich",           name: "Ostrich",                         category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 70 },
  { id: "animal-greyhound",         name: "Greyhound",                       category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 72 },
  { id: "animal-pronghorn",         name: "Pronghorn antelope",              category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 88 },
  { id: "animal-sailfish",          name: "Sailfish",                        category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 110 },
  { id: "animal-cheetah",           name: "Cheetah",                         category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 112 },
  { id: "animal-black-marlin",      name: "Black marlin",                    category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 130 },
  { id: "animal-golden-eagle",      name: "Golden eagle (hunting stoop)",    category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 240 },
  { id: "animal-peregrine-falcon",  name: "Peregrine falcon (dive)",         category: SpeedObjectCategory.ANIMAL,      averageSpeedKmh: 389 },

  // ── CAR ────────────────────────────────────────────────────────────────
  { id: "car-city-average",         name: "Car (city average)",              category: SpeedObjectCategory.CAR,         averageSpeedKmh: 50 },
  { id: "car-highway",              name: "Car (highway)",                   category: SpeedObjectCategory.CAR,         averageSpeedKmh: 130 },
  { id: "car-tesla-model-s-plaid",  name: "Tesla Model S Plaid",             category: SpeedObjectCategory.CAR,         averageSpeedKmh: 322 },
  { id: "car-porsche-911-turbo-s",  name: "Porsche 911 Turbo S",             category: SpeedObjectCategory.CAR,         averageSpeedKmh: 330 },
  { id: "car-lamborghini-aventador",name: "Lamborghini Aventador SVJ",       category: SpeedObjectCategory.CAR,         averageSpeedKmh: 350 },
  { id: "car-f1",                   name: "F1 race car",                     category: SpeedObjectCategory.CAR,         averageSpeedKmh: 372 },
  { id: "car-bugatti-chiron",       name: "Bugatti Chiron Super Sport 300+", category: SpeedObjectCategory.CAR,         averageSpeedKmh: 490 },
  { id: "car-koenigsegg-jesko",     name: "Koenigsegg Jesko Absolut",        category: SpeedObjectCategory.CAR,         averageSpeedKmh: 531 },
  { id: "car-top-fuel-dragster",    name: "Top Fuel Dragster",               category: SpeedObjectCategory.CAR,         averageSpeedKmh: 544 },

  // ── MOTORCYCLE ─────────────────────────────────────────────────────────
  { id: "motorcycle-scooter",          name: "Average scooter",              category: SpeedObjectCategory.MOTORCYCLE,  averageSpeedKmh: 80 },
  { id: "motorcycle-kawasaki-ninja400",name: "Kawasaki Ninja 400",           category: SpeedObjectCategory.MOTORCYCLE,  averageSpeedKmh: 180 },
  { id: "motorcycle-ducati-panigale",  name: "Ducati Panigale V4 R",         category: SpeedObjectCategory.MOTORCYCLE,  averageSpeedKmh: 320 },
  { id: "motorcycle-motogp",           name: "MotoGP bike",                  category: SpeedObjectCategory.MOTORCYCLE,  averageSpeedKmh: 366 },
  { id: "motorcycle-kawasaki-h2r",     name: "Kawasaki Ninja H2R",           category: SpeedObjectCategory.MOTORCYCLE,  averageSpeedKmh: 400 },

  // ── TRAIN ──────────────────────────────────────────────────────────────
  { id: "train-tram",           name: "Tram",                                category: SpeedObjectCategory.TRAIN,       averageSpeedKmh: 70 },
  { id: "train-commuter",       name: "Commuter train",                      category: SpeedObjectCategory.TRAIN,       averageSpeedKmh: 130 },
  { id: "train-amtrak-acela",   name: "Amtrak Acela",                        category: SpeedObjectCategory.TRAIN,       averageSpeedKmh: 240 },
  { id: "train-china-cr400",    name: "China CR400 Fuxing",                  category: SpeedObjectCategory.TRAIN,       averageSpeedKmh: 350 },
  { id: "train-shanghai-maglev",name: "Shanghai Maglev (commercial)",        category: SpeedObjectCategory.TRAIN,       averageSpeedKmh: 431 },
  { id: "train-tgv-record",     name: "TGV (world record)",                  category: SpeedObjectCategory.TRAIN,       averageSpeedKmh: 574.8 },
  { id: "train-japan-maglev-l0",name: "Japan Maglev L0 (record)",            category: SpeedObjectCategory.TRAIN,       averageSpeedKmh: 603 },

  // ── PLANE ──────────────────────────────────────────────────────────────
  { id: "plane-cessna-172",  name: "Cessna 172 (propeller)",                 category: SpeedObjectCategory.PLANE,       averageSpeedKmh: 230 },
  { id: "plane-boeing-737",  name: "Boeing 737 (cruising)",                  category: SpeedObjectCategory.PLANE,       averageSpeedKmh: 842 },
  { id: "plane-boeing-747",  name: "Boeing 747 (cruising)",                  category: SpeedObjectCategory.PLANE,       averageSpeedKmh: 988 },
  { id: "plane-concorde",    name: "Concorde",                               category: SpeedObjectCategory.PLANE,       averageSpeedKmh: 2179 },
  { id: "plane-f15-eagle",   name: "F-15 Eagle (fighter)",                   category: SpeedObjectCategory.PLANE,       averageSpeedKmh: 2655 },
  { id: "plane-mig-25",      name: "MiG-25 Foxbat",                          category: SpeedObjectCategory.PLANE,       averageSpeedKmh: 3395 },
  { id: "plane-sr71",        name: "SR-71 Blackbird",                        category: SpeedObjectCategory.PLANE,       averageSpeedKmh: 3540 },
  { id: "plane-x15",         name: "X-15 rocket plane",                      category: SpeedObjectCategory.PLANE,       averageSpeedKmh: 7270 },

  // ── BOAT ───────────────────────────────────────────────────────────────
  { id: "boat-rowing",             name: "Rowing boat",                      category: SpeedObjectCategory.BOAT,        averageSpeedKmh: 13 },
  { id: "boat-motorboat",          name: "Average motorboat",                category: SpeedObjectCategory.BOAT,        averageSpeedKmh: 50 },
  { id: "boat-navy-destroyer",     name: "Navy destroyer",                   category: SpeedObjectCategory.BOAT,        averageSpeedKmh: 60 },
  { id: "boat-americas-cup",       name: "America's Cup sailboat",           category: SpeedObjectCategory.BOAT,        averageSpeedKmh: 100 },
  { id: "boat-offshore-powerboat", name: "Offshore powerboat (racing)",      category: SpeedObjectCategory.BOAT,        averageSpeedKmh: 242 },
  { id: "boat-spirit-of-australia",name: "Spirit of Australia (record)",     category: SpeedObjectCategory.BOAT,        averageSpeedKmh: 511 },

  // ── SPACE ──────────────────────────────────────────────────────────────
  { id: "space-iss",               name: "International Space Station",      category: SpeedObjectCategory.SPACE,       averageSpeedKmh: 28000 },
  { id: "space-saturn-v",          name: "Saturn V rocket",                  category: SpeedObjectCategory.SPACE,       averageSpeedKmh: 38000 },
  { id: "space-new-horizons",      name: "New Horizons probe",               category: SpeedObjectCategory.SPACE,       averageSpeedKmh: 58500 },
  { id: "space-helios-2",          name: "Helios 2 probe",                   category: SpeedObjectCategory.SPACE,       averageSpeedKmh: 252000 },
  { id: "space-parker-solar-probe",name: "Parker Solar Probe",               category: SpeedObjectCategory.SPACE,       averageSpeedKmh: 692000 },

  // ── NATURE ─────────────────────────────────────────────────────────────
  { id: "nature-glacier",        name: "Glacier",                            category: SpeedObjectCategory.NATURE,      averageSpeedKmh: 0.0001 },
  { id: "nature-river-amazon",   name: "Amazon river current",               category: SpeedObjectCategory.NATURE,      averageSpeedKmh: 30 },
  { id: "nature-lava-flow",      name: "Lava flow (fast)",                   category: SpeedObjectCategory.NATURE,      averageSpeedKmh: 60 },
  { id: "nature-hurricane",      name: "Hurricane (category 5)",             category: SpeedObjectCategory.NATURE,      averageSpeedKmh: 252 },
  { id: "nature-avalanche",      name: "Avalanche",                          category: SpeedObjectCategory.NATURE,      averageSpeedKmh: 320 },
  { id: "nature-tornado",        name: "Tornado (EF5 record)",               category: SpeedObjectCategory.NATURE,      averageSpeedKmh: 512 },
  { id: "nature-speed-of-sound", name: "Speed of sound (air)",               category: SpeedObjectCategory.NATURE,      averageSpeedKmh: 1235 },

  // ── FICTIONAL ──────────────────────────────────────────────────────────
  { id: "fictional-batmobile",          name: "Batmobile",                   category: SpeedObjectCategory.FICTIONAL,   averageSpeedKmh: 240 },
  { id: "fictional-lightning-mcqueen",  name: "Lightning McQueen",           category: SpeedObjectCategory.FICTIONAL,   averageSpeedKmh: 320 },
  { id: "fictional-road-runner",        name: "Road Runner",                 category: SpeedObjectCategory.FICTIONAL,   averageSpeedKmh: 480 },
  { id: "fictional-sonic",              name: "Sonic the Hedgehog",          category: SpeedObjectCategory.FICTIONAL,   averageSpeedKmh: 768 },
  { id: "fictional-millennium-falcon",  name: "Millennium Falcon (sublight)",category: SpeedObjectCategory.FICTIONAL,   averageSpeedKmh: 1250 },
  { id: "fictional-the-flash",          name: "The Flash",                   category: SpeedObjectCategory.FICTIONAL,   averageSpeedKmh: 12000 },
];
```

- [ ] **Step 2: Run type-check**

```bash
bun run typecheck
```

Expected: no errors.

---

## Task 3: Update the fixtures file

The `FINISH_TIME_FIXTURES` array in `src/data/speedObjects.fixtures.ts` references `objectId: "airplane"` which no longer exists. Update it to reference `plane-boeing-737`.

**Files:**
- Modify: `src/data/speedObjects.fixtures.ts`

- [ ] **Step 1: Replace the `airplane` fixture entry**

Find this block in `FINISH_TIME_FIXTURES`:

```ts
  {
    objectId: "airplane",
    distance: { value: 1, unit: DistanceUnit.KILOMETERS },
    expectedFinishSeconds: 4,
  },
```

Replace with:

```ts
  {
    objectId: "plane-boeing-737",
    distance: { value: 1, unit: DistanceUnit.KILOMETERS },
    expectedFinishSeconds: 4.275593667546174,
  },
```

> **How the expected value was derived:**
> `distanceMeters / kmhToMs(averageSpeedKmh)` = `1000 / (842 / 3.6)` = `3600 / 842` = `4.275593667...`
> The test uses `toBeCloseTo(..., 8)` so this precision is required.

- [ ] **Step 2: Run the unit tests**

```bash
bun test src/data/speedObjects.test.ts
```

Expected output (all 4 tests pass):

```
✓ speedObjects catalog > contains unique ids
✓ speedObjects catalog > all items have positive average speed
✓ speedObjects catalog > default ids resolve to catalog entries
✓ speedObjects catalog > deterministic finish-time fixtures stay stable
```

- [ ] **Step 3: Run the full test suite**

```bash
bun run build
```

Expected: all tests pass, no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/speedObjects.ts src/data/speedObjects.fixtures.ts
git commit -m "feat: expand speed objects database to 75 entries across 10 categories"
```
