# SpeedPlane

SpeedPlane is a frontend-only React app for visual speed comparison of objects, animals, vehicles, and fictional characters on parallel lanes.

## Product summary
Moved from: [docs/PRD.md](./docs/PRD.md)

- Goal: visually compare speeds using deterministic movement, not static numbers.
- Core formula: `distance = speed * elapsedTime`.
- Simulation controls: Start, Pause, Reset.
- Per-lane selection: each lane binds to a selected object.
- Track length: configurable in meters or kilometers.
- MVP target users: students, educators, enthusiasts, and pop-culture users.

## Architecture summary
Moved from: [docs/TAD.md](./docs/TAD.md)

- Frontend-only (no backend in MVP).
- Single shared simulation engine (no per-track timers).
- React UI layer + engine layer + data definitions.
- Speed normalization: `km/h -> m/s` via `speedKmh / 3.6`.
- Styling: SCSS only (no Tailwind).

## Execution docs
Moved from integration docs hub and consolidated links:

- Product requirements: [docs/PRD.md](./docs/PRD.md)
- Technical architecture: [docs/TAD.md](./docs/TAD.md)
- Implementation plan: [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)
- Testing strategy: [docs/TESTING.md](./docs/TESTING.md)
- Integration docs hub: [docs/integration/README.md](./docs/integration/README.md)

## Workflow order
1. Confirm scope in PRD.
2. Confirm constraints in TAD.
3. Execute next chunk from implementation plan.
4. Ship one feature at a time from the integration feature map.
5. Run testing checklist before release.
