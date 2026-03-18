# Integration Inventory (SpeedPlane)

Source of truth for all integration boundaries in MVP.

## Legend
- Type: `Internal Module`, `Browser API`, `UI Layer`, `Data`, `Testing`, `Future External`
- Priority: `P0`, `P1`, `P2`
- Risk: `High`, `Medium`, `Low`

## Inventory table
| ID | Integration | Type | Owner | PRD refs | TAD refs | Why needed | Contract (inputs/outputs) | Dependencies | Failure mode | Priority | Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|
| INT-001 | Speed object catalog (`data/speedObjects.ts`) | Data | Frontend | 5.3, FR2 | 6.1, 6 | Predefined objects and speeds for dropdown and labels | Input: static object array. Output: typed list with `id,name,category,averageSpeedKmh` | None | Missing or duplicate IDs break object binding | P0 | Low |
| INT-002 | Unit conversion utilities (`utils/unitConversion.ts`) | Internal Module | Frontend | 5.1, 5.4, 5.6 | 3.2, 8 | Correct speed/distance conversion | Input: speed km/h, distance+unit. Output: m/s and meters | INT-001 | Wrong conversion causes inaccurate simulation | P0 | High |
| INT-003 | Simulation engine (`engine/simulationEngine.ts`) | Internal Module | Frontend | 5.1, 5.5, 5.6, FR3 | 3.1, 3.2, 7 | Central deterministic time source and state transitions | Input: start/pause/reset/setDistance/clock ticks. Output: `elapsedTime`, running state, subscribers notified | INT-002 | Drift, non-determinism, or timer desync | P0 | High |
| INT-004 | Browser timing (`requestAnimationFrame`) | Browser API | Frontend | 5.6, FR3 | 7.3 | Frame updates driven by browser clock | Input: frame timestamp. Output: delta time to engine | INT-003 | Jank or pause/resume edge bugs | P0 | Medium |
| INT-005 | State orchestration (`store/simulationStore.ts` + reducer) | Internal Module | Frontend | FR1, FR2, FR3, FR4 | 4, 10 | One Zustand state flow for tracks, controls, and distance | Input: UI actions + engine events. Output: normalized app state to components | INT-001, INT-003 | UI and engine state divergence | P0 | Medium |
| INT-006 | Track rendering and scaling (`Track`, `TrackList`) | UI Layer | Frontend | 5.1, 5.2, FR4 | 9.1, 10 | Translate derived distance to pixel position and labels | Input: meters traveled + total track length + viewport width. Output: object position, finish state | INT-002, INT-005 | Incorrect clamping or scaling overflow | P0 | Medium |
| INT-007 | User controls and inputs (`Controls`, `ObjectSelector`, `DistanceInput`) | UI Layer | Frontend | 5.2, 5.4, 5.5, FR1, FR2 | 5, 10 | Allows feature interactions and state transitions | Input: user events. Output: reducer actions | INT-001, INT-005 | Invalid inputs or impossible state transitions | P0 | Medium |
| INT-008 | Styles and responsive layout (`styles/*.scss`) | UI Layer | Frontend | FR5 | 11 | Usable interface on desktop/tablet and consistent lane visuals | Input: state-driven classes + shadcn-style UI primitives. Output: responsive layout | INT-006, INT-007 | Layout breakage across viewports | P1 | Low |
| INT-009 | Test harness (unit/integration tests) | Testing | Frontend | 5.6, FR3, FR4 | 3.2, 7, 9 | Prevent regression in physics and UI bindings | Input: deterministic fixtures and simulated time. Output: pass/fail quality signal | INT-002, INT-003, INT-005, INT-006 | Hidden math bugs reach release | P0 | Medium |
| INT-010 | Future share links / presets / custom objects | Future External | Product | Secondary Goals | Future | Reserved for post-MVP features | TBD | TBD | Scope creep during MVP | P2 | Medium |

## Environment matrix
| Integration ID | Local | Dev | Staging | Prod | Config source | Secrets needed |
|---|---|---|---|---|---|---|
| INT-001 | Yes | Yes | Yes | Yes | Source code | No |
| INT-002 | Yes | Yes | Yes | Yes | Source code | No |
| INT-003 | Yes | Yes | Yes | Yes | Source code | No |
| INT-004 | Yes (browser) | Yes (browser) | Yes (browser) | Yes (browser) | Browser runtime | No |
| INT-005 | Yes | Yes | Yes | Yes | Source code | No |
| INT-006 | Yes | Yes | Yes | Yes | Source code | No |
| INT-007 | Yes | Yes | Yes | Yes | Source code | No |
| INT-008 | Yes | Yes | Yes | Yes | SCSS build config | No |
| INT-009 | Yes | Yes | Yes | Yes | Test config | No |
| INT-010 | No | No | No | No | TBD | TBD |

## Data and compliance notes
| Integration ID | Data classes touched | PII? | Retention | Region constraints | Audit/log requirements |
|---|---|---|---|---|---|
| INT-001 to INT-009 | Static speed data + transient simulation state | No | In-memory only | None | Dev logs only |
| INT-010 | TBD (future) | TBD | TBD | TBD | TBD |

## Open questions
- [ ] Confirm MVP max lane count hard limit (PRD suggests 10).
- [ ] Confirm V1 includes time multiplier (optional V1.1 in PRD).
- [ ] Confirm whether mobile support is in or out for initial release.
