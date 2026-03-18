# FEAT-004 Configurable Track Length + Units

## Scope
Allow users to configure total distance in meters or kilometers.

## Dependencies
- Chunks: CH-001, CH-003, CH-007
- Integrations: INT-002, INT-005, INT-006, INT-007

## Build steps
1. [x] Add distance value + unit in state.
2. [x] Convert input to meters for engine/rendering.
3. [x] Rescale lane position formula with new total distance.
4. [x] Validate inputs and normalize edge cases.

## Acceptance criteria
- [x] Unit/amount edits stay draft-only and apply on explicit confirmation.
- [x] Distance changes rescale active lanes correctly.
- [x] Invalid input is blocked or corrected.

## Delivery notes (CH-007)
- Added `DistanceInput` control panel with amount input + `m/km` selector and apply action.
- Unit and amount edits now remain local draft state; engine/store distance updates only on `Apply`.
- Store `setDistance` now ignores invalid values (`<= 0`, non-finite) and avoids engine reset for unit-only changes.
- Distance changes trigger safe rescaling through existing derived selectors and clamped track-position rendering.
- Added CH-007 Playwright coverage for draft unit changes, apply-gated rescaling, and invalid-input correction.
