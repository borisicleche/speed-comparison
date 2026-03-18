# FEAT-003 Object Selection

## Scope
Enable per-lane object selection from predefined speed catalog.

## Dependencies
- Chunks: CH-001, CH-003, CH-006
- Integrations: INT-001, INT-005, INT-007

## Build steps
1. Populate dropdown from speed object catalog.
2. Update selected `objectId` through Zustand store action (`SET_TRACK_OBJECT`).
3. Recompute derived speed and position immediately.
4. Guard against unknown or missing IDs.

## Acceptance criteria
- [x] Dropdown displays all predefined objects.
- [x] Changing object updates lane labels and speed instantly.
- [x] Invalid object IDs are rejected safely.

## Delivery notes (CH-006)
- Integrated `INT-001` + `INT-005` binding with per-lane object dropdowns.
- Object changes dispatch `SET_TRACK_OBJECT` and update lane labels/speed from shared elapsed time.
- Unknown IDs remain guarded in reducer/store tests.
