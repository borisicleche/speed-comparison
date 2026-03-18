# SpeedPlane

SpeedPlane is a frontend-only React app for visual speed comparison of objects, animals, vehicles, and fictional characters on parallel lanes.

## Product summary
Moved from: `/Users/nikolaborisic/Speed comparison/docs/PRD.md`

- Goal: visually compare speeds using deterministic movement, not static numbers.
- Core formula: `distance = speed * elapsedTime`.
- Simulation controls: Start, Pause, Reset.
- Per-lane selection: each lane binds to a selected object.
- Track length: configurable in meters or kilometers.
- MVP target users: students, educators, enthusiasts, and pop-culture users.

## Architecture summary
Moved from: `/Users/nikolaborisic/Speed comparison/docs/TAD.md`

- Frontend-only (no backend in MVP).
- Single shared simulation engine (no per-track timers).
- React UI layer + engine layer + data definitions.
- Speed normalization: `km/h -> m/s` via `speedKmh / 3.6`.
- Styling: SCSS only (no Tailwind).

## Execution docs
Moved from integration docs hub and consolidated links:

- Product requirements: `/Users/nikolaborisic/Speed comparison/docs/PRD.md`
- Technical architecture: `/Users/nikolaborisic/Speed comparison/docs/TAD.md`
- Implementation plan: `/Users/nikolaborisic/Speed comparison/docs/IMPLEMENTATION_PLAN.md`
- Testing strategy: `/Users/nikolaborisic/Speed comparison/docs/TESTING.md`
- Integration docs hub: `/Users/nikolaborisic/Speed comparison/docs/integration/README.md`

## Workflow order
1. Confirm scope in PRD.
2. Confirm constraints in TAD.
3. Execute next chunk from implementation plan.
4. Ship one feature at a time from the integration feature map.
5. Run testing checklist before release.
