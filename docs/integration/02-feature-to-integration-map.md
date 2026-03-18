# Feature to Integration Map (SpeedPlane)

Use this file to ship features one by one with traceable dependencies.

## Feature map
| Feature ID | Feature name | PRD section | Required integrations | Required chunks | Rollout mode | Test plan ref | Release guardrails |
|---|---|---|---|---|---|---|---|
| FEAT-001 | Track Visualization | 5.1 | INT-002, INT-003, INT-005, INT-006 | CH-001, CH-002, CH-003, CH-004 | Always-on MVP | `/Users/nikolaborisic/Speed comparison/docs/integration/features/FEAT-001-track-visualization.md` | Clamp at finish; no negative positions |
| FEAT-002 | Multiple Tracks (Add/Remove) | 5.2, FR1 | INT-005, INT-007 | CH-003, CH-005, CH-006 | Always-on MVP | `/Users/nikolaborisic/Speed comparison/docs/integration/features/FEAT-002-multiple-tracks.md` | Enforce lane limit; preserve deterministic timer |
| FEAT-003 | Object Selection | 5.3, FR2 | INT-001, INT-005, INT-007 | CH-001, CH-003, CH-006 | Always-on MVP | `/Users/nikolaborisic/Speed comparison/docs/integration/features/FEAT-003-object-selection.md` | Reject unknown object IDs |
| FEAT-004 | Configurable Track Length + Units | 5.4, FR4 | INT-002, INT-005, INT-006, INT-007 | CH-001, CH-003, CH-007 | Always-on MVP | `/Users/nikolaborisic/Speed comparison/docs/integration/features/FEAT-004-distance-and-units.md` | Validate input range and unit conversion |
| FEAT-005 | Simulation Controls | 5.5 | INT-003, INT-005, INT-007 | CH-002, CH-003, CH-005 | Always-on MVP | `/Users/nikolaborisic/Speed comparison/docs/integration/features/FEAT-005-simulation-controls.md` | Valid state transitions only |
| FEAT-006 | Accurate Deterministic Physics | 5.6, FR3 | INT-002, INT-003, INT-004, INT-009 | CH-001, CH-002, CH-008 | Always-on MVP | `/Users/nikolaborisic/Speed comparison/docs/integration/features/FEAT-006-physics-accuracy.md` | Engine uses elapsed-time derivation only |
| FEAT-007 | Responsive Layout | FR5 | INT-006, INT-007, INT-008 | CH-004, CH-006, CH-008 | Always-on MVP | `/Users/nikolaborisic/Speed comparison/docs/integration/features/FEAT-007-responsive-layout.md` | Desktop + tablet must be fully usable |
| FEAT-008 | Future Enhancements (Presets/Sharing/Custom Objects) | Secondary Goals | INT-010 | Post-MVP | Post-MVP branch only | `/Users/nikolaborisic/Speed comparison/docs/integration/features/FEAT-008-future-enhancements.md` | Keep out of MVP branch |

## Execution workflow per feature
1. Open the feature doc in `/Users/nikolaborisic/Speed comparison/docs/integration/features/`.
2. Confirm required chunks are in `Done` state.
3. Implement in a PR-sized, reversible slice aligned with rollout mode above.
4. Run the feature test plan and chunk exit checks.
5. Complete release checklist: `/Users/nikolaborisic/Speed comparison/docs/integration/checklists/feature-release-checklist.md`.

## Definition of done (feature + integration)
- [ ] All required chunks are `Done`.
- [ ] Integration contracts match documented models.
- [ ] Physics invariants validated (elapsed-time based).
- [ ] Error/edge handling implemented for user input.
- [ ] Tests cover happy path and key failure modes.
- [ ] Rollback path verified.
