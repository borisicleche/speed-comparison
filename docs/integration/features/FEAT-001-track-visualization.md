# FEAT-001 Track Visualization

## Scope
Render horizontal lanes and animate object position from left to right using derived distance over time.

## Dependencies
- Chunks: CH-001, CH-002, CH-003, CH-004
- Integrations: INT-002, INT-003, INT-005, INT-006

## Build steps
1. Render track container and lane rows.
2. Derive `distanceMeters = speedMs * elapsedTime`.
3. Convert to pixel position using current track length.
4. Clamp at finish line and show finish state.
5. Render lane cards via shadcn-style `Card/Badge/Progress` primitives with SCSS styling.
6. Keep rendering deterministic and always-on in MVP.

## Acceptance criteria
- [x] Position begins at 0 after reset.
- [x] Faster objects progress proportionally faster.
- [x] Position never exceeds track end.
