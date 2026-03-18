# FEAT-006 Accurate Deterministic Physics

## Scope
Guarantee mathematically correct, deterministic movement derived from shared elapsed time.

## Dependencies
- Chunks: CH-001, CH-002, CH-008
- Integrations: INT-002, INT-003, INT-004, INT-009

## Build steps
1. Enforce `speedMs = speedKmh / 3.6` utility usage.
2. Use `requestAnimationFrame` delta-time accumulation.
3. Compute position as derived function, not incremental distance mutation.
4. Add deterministic tests for pause/resume/reset and elapsed time.

## Acceptance criteria
- [ ] Identical elapsed time yields identical positions.
- [ ] Long runs do not accumulate visible drift from wrong formulas.
- [ ] Unit tests cover conversion and time progression.
