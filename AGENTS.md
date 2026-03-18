# AGENTS

Codex operating rules for this repository.

## Source docs
- Product spec: `/Users/nikolaborisic/Speed comparison/docs/PRD.md`
- Architecture constraints: `/Users/nikolaborisic/Speed comparison/docs/TAD.md`
- Delivery plan: `/Users/nikolaborisic/Speed comparison/docs/IMPLEMENTATION_PLAN.md`
- Testing requirements: `/Users/nikolaborisic/Speed comparison/docs/TESTING.md`

## Hard invariants
Moved from TAD + integration docs:

- Use one shared simulation clock.
- Never implement per-track timers.
- Derive position from elapsed time (`speedMs * elapsedTime`).
- Convert speed with `speedKmh / 3.6`.
- Keep rendering deterministic and clamp at finish line.
- SCSS only; no Tailwind.
- UI primitives should use shadcn-style components from `src/components/ui` and be themed with SCSS (no Tailwind classes).

## Development rules
Moved from integration working rules and chunk criteria:

- Implement in small chunks with explicit dependencies.
- One chunk should produce one testable, shippable outcome.
- Every chunk must include failure mode and rollback path.
- Every feature must reference integration IDs and chunk IDs.
- Keep optional/future scope behind flags and outside MVP chunks.

## Code style rules
Use these style defaults for new code and refactors:

- Prefer ES6+ syntax (`const`/`let`, arrow functions, template literals, destructuring).
- Prefer `const` arrow function exports for components, selectors, utilities, and store helpers.
- Keep behavior changes separate from syntax-only refactors.
- Preserve public APIs during style refactors unless a task explicitly requests API changes.

## Type and unit modeling rules
Use these rules by default for all new code and refactors:

- Do not introduce magic strings for domain concepts.
- Use enums for:
  - Units (`distance`, `speed length`, `speed time`)
  - Reducer/store action types
  - Domain categories (e.g. speed object categories)
- Prefer imported enum members over inline literals in app code and tests.
- Keep normalized/canonical values explicit in state:
  - Store canonical numeric value under `value` (internal base unit).
  - Store user-facing amount under `amount`.
  - Store selected unit under `unit`.
- For speed/generalized dimensions, represent values as:
  - `speedValue`
  - `speedLengthUnit`
  - `speedTimeUnit`
- Keep conversion logic centralized in utility modules; no ad-hoc conversions in UI/store layers.
- Keep derived values pure and deterministic (selectors/helpers only).
- When adding new units (e.g. imperial), extend enums and conversion utilities first, then wire state/selectors/UI.
- Every enum/unit model change must include:
  - unit tests for conversions and round-trips
  - reducer/store tests for state transitions and sync behavior

## Documentation update rule
When making feature changes, update all impacted docs in the same PR:

1. Feature runbook in `/Users/nikolaborisic/Speed comparison/docs/integration/features/`
2. Chunk/feature status in `/Users/nikolaborisic/Speed comparison/docs/IMPLEMENTATION_PLAN.md`
3. Testing expectations in `/Users/nikolaborisic/Speed comparison/docs/TESTING.md`

# Mini-interviews during planning (chipton)

We prefer small PR-sized changes and deterministic behavior. To avoid rework, Codex should sometimes run a quick "mini-interview" before proposing an implementation plan.

This is NOT required for every prompt. Use judgment.

## When to run a mini-interview
Run a mini-interview when a request involves any of these:
- New feature/module or a new route (e.g. new folder under `src/*/`)
- Timing/scheduling behavior 
- Protocol or cross-thread behavior 
- Non-trivial UX / editing workflows (keyboard shortcuts, interaction rules)
- Data model decisions that may constrain future work 
- Multi-pattern arrangement semantics (pattern length, boundary timing, shared vs per-pattern state)
- Performance constraints (worklet allocations, hot paths, large grids)
- Any place where 1–2 wrong assumptions would cause refactors later

Skip the interview when:
- The change is local, mechanical, or clearly specified
- It’s a small bugfix with obvious intent
- The user already provided enough constraints + examples

## Interview cadence
- Ask **3–4 thoughtful questions per round** using **AskUserQuestion**.
- Prefer **1 round**. Use a **2nd round only** if needed for key uncertainties.
- Do not ask obvious questions (stack/framework basics, things already stated in rules).
- If remaining ambiguity is minor, proceed with reasonable defaults and clearly state assumptions.

## What to ask (good categories)
Ask about tradeoffs and edge-cases, not “best practices”.

Focus areas:
- UX flows: creation/edit/delete, selection, copy/paste/brush, preview/audition behavior
- Timing semantics: ordering, tie-breakers, boundaries, lookahead, pause/stop behavior
- Determinism: pure logic modules, test strategy, avoiding real-time dependence
- Extensibility: what must be future-proof vs what can be hardcoded for MVP
- Failure modes: queue overflow, stuck notes, invalid inputs, reset/panic behavior

## What to avoid
- Yes/no questions like “Should we handle errors?” (assume yes)
- Style-only questions (colors, spacing) unless it changes interaction semantics
- Asking for permission to follow existing project rules (just follow them)

## Output contract after the interview
After collecting answers:
1) Provide a concise **implementation plan** with:
   - Key decisions (bullets)
   - Data model notes (if relevant)
   - Scheduling/protocol notes (if relevant)
   - PR-sized slices (1..N) with clear boundaries
   - Unit tests to add/update (timing/order/determinism)
2) Call out any **rules/docs updates** needed:
   - Suggest updating existing `Agents.md` when behavior/contracts change
   - Suggest adding a new rules file only if it prevents repeated mistakes


## Reference checklists
Upon every change, run build command to see if there are errors. if so, go back and try to fix them
