# FEAT-002 Multiple Tracks (Add/Remove)

## Scope
Allow users to add and remove lanes while preserving a shared simulation clock.

## Dependencies
- Chunks: CH-003, CH-005, CH-006
- Integrations: INT-005, INT-007

## Build steps
1. Add Zustand store actions (reducer-backed) for add/remove track.
2. Generate stable track IDs.
3. Enforce max-lane limit.
4. Keep elapsed-time source shared across all lanes.

## Acceptance criteria
- [x] Add track creates lane with valid default object.
- [x] Remove track updates UI and derived stats safely.
- [x] No per-track timer is introduced.

## Delivery notes (CH-006)
- Integrated `INT-007` + `INT-005` UI wiring through `TrackManagement` and per-lane remove actions.
- Add lane is bounded by `maxTracks` and exposes current lane count in UI.
- Rollback path: revert `TrackManagement` UI slice and keep fixed two-lane rendering.
