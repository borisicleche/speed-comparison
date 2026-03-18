# Integration Chunk Plan (SpeedPlane)

Execution order for incremental, testable delivery.

## Dependency flow
1. Data and conversion foundations.
2. Deterministic engine and browser timing bridge.
3. App state orchestration.
4. Track rendering and baseline controls.
5. Track management and object selection.
6. Distance/unit controls and scaling.
7. Responsive polish and quality gates.

## Chunk backlog
| Chunk ID | Name | Goal | Integrations | Depends on | Deliverable | Exit criteria | Rollback |
|---|---|---|---|---|---|---|---|
| CH-001 | Domain Foundations | Define data contracts and math invariants | INT-001, INT-002 | None | `SpeedObject` model + conversion utils + fixtures | Conversion unit tests pass; typed catalog stable | Revert to static hardcoded values while preserving UI |
| CH-002 | Simulation Core | Build deterministic shared clock engine | INT-003, INT-004 | CH-001 | Engine with start/pause/reset/setDistance/subscribe | Engine tests pass for pause/resume/reset determinism | Disable engine loop; keep static lane previews |
| CH-003 | State Bridge | Connect engine to Zustand state via store/reducer | INT-005 | CH-002 | Zustand store + reducer actions + selectors | No per-track timers; all tracks read shared elapsed time | Freeze elapsed time updates and keep non-interactive view |
| CH-004 | Baseline Track UI | Render lanes and derived positions | INT-006, INT-008 | CH-003 | TrackList + Track components with clamp at finish | Position scales correctly for different track lengths | Fallback to textual stats without animation |
| CH-005 | Simulation Controls | Wire start/pause/reset actions to engine | INT-007, INT-005 | CH-003, CH-004 | Controls panel with valid state transitions | Control flow tests pass; reset aligns all tracks to 0 | Hide control panel and force idle state |
| CH-006 | Track Management | Add/remove tracks and per-lane object selection | INT-007, INT-001, INT-005 | CH-005 | Dynamic track list with object dropdown binding | Add/remove bounded by lane limit; object change updates instantly | Lock to default two-track scenario |
| CH-007 | Distance + Units | Support m/km input and dynamic rescaling | INT-002, INT-006, INT-007 | CH-006 | DistanceInput and unit conversion end-to-end | Distance change recalculates finish conditions safely | Revert to fixed distance preset |
| CH-008 | Hardening + Release Gates | Responsive pass, tests, and runbook | INT-008, INT-009 | CH-007 | Test suite + responsive fixes + release checklist completion | Physics, rendering, and interaction tests green | Ship desktop-only with disabled optional controls |

## Status board
| Chunk ID | Status (`Planned/In progress/Done/Blocked`) | Owner | ETA | Notes |
|---|---|---|---|---|
| CH-001 | Done | Codex | Complete | `SpeedObject` catalog + conversion utils + CH-001 unit tests |
| CH-002 | Done | Codex | Complete | Shared simulation engine + time controller + pause/resume/reset determinism tests |
| CH-003 | Done | Codex | Complete | `simulationStore` + reducer/actions/selectors with shared elapsed-time state sync |
| CH-004 | Done | Codex | Complete | `TrackList` + `Track` + SCSS baseline lanes + clamp/scale tests + text fallback rollback |
| CH-005 | Done | Codex | Complete | Controls panel + transition guards + reset alignment tests |
| CH-006 | Done | Codex | Complete | INT-007/INT-001/INT-005 track management and object-selection UI integrated with bounded lane limits |
| CH-007 | Done | Codex | Complete | INT-002/INT-006/INT-007 shipped: DistanceInput + apply-gated unit/amount edits + invalid-input guards + CH-007 e2e |
| CH-008 | Planned | TBD | TBD | Final stabilization chunk |

## Suggested chunk sizing
- Keep each chunk to 1-2 implementation days.
- Limit each chunk to one main risk area.
- Do not begin a chunk without explicit test exit criteria.
