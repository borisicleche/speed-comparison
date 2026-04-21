# Speed Objects Database Expansion — Design Spec

**Date:** 2026-04-13  
**Status:** Approved

---

## Summary

Expand the `SPEED_OBJECTS` database from 6 entries across 4 broad categories to ~75 entries across 10 specific, thematic categories. The data structure (`SpeedObject` type) stays unchanged — only the `SpeedObjectCategory` enum and the `SPEED_OBJECTS` array grow.

---

## Category Changes

### Remove

- `VEHICLE` — too vague; all entries are redistributed into specific categories below.

### Keep

- `HUMAN`
- `ANIMAL`
- `FICTIONAL`

### Add

- `CAR`
- `MOTORCYCLE`
- `TRAIN`
- `PLANE`
- `BOAT`
- `SPACE`
- `NATURE`

---

## Full Entry List (~75 entries)

### HUMAN (5)

| id | name | km/h |
|---|---|---|
| human-walking | Human (walking) | 5 |
| human-jogging | Human (jogging) | 10 |
| human-running | Human (running) | 15 |
| human-sprinting | Human (sprinting, Usain Bolt) | 44.7 |
| human-cycling-racing | Human (cycling, Tour de France) | 45 |

### ANIMAL (14)

| id | name | km/h |
|---|---|---|
| animal-garden-snail | Garden snail | 0.05 |
| animal-three-toed-sloth | Three-toed sloth | 0.24 |
| animal-tortoise | Tortoise | 0.5 |
| animal-elephant | Elephant (charge) | 25 |
| animal-dragonfly | Dragonfly | 58 |
| animal-horse | Horse (gallop) | 70 |
| animal-ostrich | Ostrich | 70 |
| animal-greyhound | Greyhound | 72 |
| animal-pronghorn | Pronghorn antelope | 88 |
| animal-sailfish | Sailfish | 110 |
| animal-cheetah | Cheetah | 112 |
| animal-black-marlin | Black marlin | 130 |
| animal-golden-eagle | Golden eagle (hunting stoop) | 240 |
| animal-peregrine-falcon | Peregrine falcon (dive) | 389 |

### CAR (9)

| id | name | km/h |
|---|---|---|
| car-city-average | Car (city average) | 50 |
| car-highway | Car (highway) | 130 |
| car-tesla-model-s-plaid | Tesla Model S Plaid | 322 |
| car-porsche-911-turbo-s | Porsche 911 Turbo S | 330 |
| car-lamborghini-aventador | Lamborghini Aventador SVJ | 350 |
| car-f1 | F1 race car | 372 |
| car-bugatti-chiron | Bugatti Chiron Super Sport 300+ | 490 |
| car-koenigsegg-jesko | Koenigsegg Jesko Absolut | 531 |
| car-top-fuel-dragster | Top Fuel Dragster | 544 |

### MOTORCYCLE (5)

| id | name | km/h |
|---|---|---|
| motorcycle-scooter | Average scooter | 80 |
| motorcycle-kawasaki-ninja-400 | Kawasaki Ninja 400 | 180 |
| motorcycle-ducati-panigale | Ducati Panigale V4 R | 320 |
| motorcycle-motogp | MotoGP bike | 366 |
| motorcycle-kawasaki-h2r | Kawasaki Ninja H2R | 400 |

### TRAIN (7)

| id | name | km/h |
|---|---|---|
| train-tram | Tram | 70 |
| train-commuter | Commuter train | 130 |
| train-amtrak-acela | Amtrak Acela | 240 |
| train-china-cr400 | China CR400 Fuxing | 350 |
| train-shanghai-maglev | Shanghai Maglev (commercial) | 431 |
| train-tgv-record | TGV (world record) | 574.8 |
| train-japan-maglev-l0 | Japan Maglev L0 (record) | 603 |

### PLANE (8)

| id | name | km/h |
|---|---|---|
| plane-cessna-172 | Cessna 172 (propeller) | 230 |
| plane-boeing-737 | Boeing 737 (cruising) | 842 |
| plane-boeing-747 | Boeing 747 (cruising) | 988 |
| plane-concorde | Concorde | 2179 |
| plane-f15-eagle | F-15 Eagle (fighter) | 2655 |
| plane-mig-25 | MiG-25 Foxbat | 3395 |
| plane-sr71 | SR-71 Blackbird | 3540 |
| plane-x15 | X-15 rocket plane | 7270 |

### BOAT (6)

| id | name | km/h |
|---|---|---|
| boat-rowing | Rowing boat | 13 |
| boat-motorboat | Average motorboat | 50 |
| boat-navy-destroyer | Navy destroyer | 60 |
| boat-americas-cup | America's Cup sailboat | 100 |
| boat-offshore-powerboat | Offshore powerboat (racing) | 242 |
| boat-spirit-of-australia | Spirit of Australia (record) | 511 |

### SPACE (5)

| id | name | km/h |
|---|---|---|
| space-iss | International Space Station | 28000 |
| space-saturn-v | Saturn V rocket | 38000 |
| space-new-horizons | New Horizons probe | 58500 |
| space-helios-2 | Helios 2 probe | 252000 |
| space-parker-solar-probe | Parker Solar Probe | 692000 |

### NATURE (7)

| id | name | km/h |
|---|---|---|
| nature-glacier | Glacier | 0.0001 |
| nature-river-amazon | Amazon river current | 30 |
| nature-lava-flow | Lava flow (fast) | 60 |
| nature-hurricane | Hurricane (category 5) | 252 |
| nature-avalanche | Avalanche | 320 |
| nature-tornado | Tornado (EF5 record) | 512 |
| nature-speed-of-sound | Speed of sound (air) | 1235 |

### FICTIONAL (6)

| id | name | km/h |
|---|---|---|
| fictional-lightning-mcqueen | Lightning McQueen | 320 |
| fictional-batmobile | Batmobile | 240 |
| fictional-road-runner | Road Runner | 480 |
| fictional-sonic | Sonic the Hedgehog | 768 |
| fictional-millennium-falcon | Millennium Falcon (sublight) | 1250 |
| fictional-the-flash | The Flash | 12000 |

---

## Schema

No changes to `SpeedObject` type:

```ts
export type SpeedObject = {
  id: string;
  name: string;
  category: SpeedObjectCategory;
  averageSpeedKmh: number;
};
```

---

## Implementation Scope

1. Expand `SpeedObjectCategory` enum — remove `VEHICLE`, add `CAR`, `MOTORCYCLE`, `TRAIN`, `PLANE`, `BOAT`, `SPACE`, `NATURE`.
2. Replace the `SPEED_OBJECTS` array with all ~75 entries above.
3. Update `DEFAULT_SPEED_OBJECT_IDS` if needed (current defaults `human-walking` + `car-city-average` still valid).
4. Update `SPEED_OBJECTS_BY_ID` map — auto-derived, no manual change needed.
5. Fix any unit tests or fixtures referencing old category values (`VEHICLE`, `FICTIONAL` entries that changed IDs).
6. Run `bun run build` to verify.

---

## Out of Scope

- UI category filtering/grouping changes (separate feature)
- Adding emoji or icons per category
- `subcategory` field
- Any new `SpeedObject` fields (description, image, etc.)
