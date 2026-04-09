# Lock Lane Controls After Simulation Start — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable per-lane distance editing and object selection whenever the simulation has been started at least once (`elapsedTimeSeconds > 0`), not just while it is actively running.

**Architecture:** Replace the `isRunning` prop flowing through `App → TrackList → Track` with `isLocked`, computed as `elapsedTimeSeconds > 0` at the App level. All five `disabled={isRunning}` usages in `Track` become `disabled={isLocked}`. No store changes required.

**Tech Stack:** React, TypeScript, Zustand, Playwright (E2E), Bun test runner

---

## File Map

| File | Change |
|------|--------|
| `src/app/App.tsx` | Swap `isRunning` selector for `elapsedTimeSeconds`, compute `isLocked`, pass to `TrackList` |
| `src/components/TrackList/TrackList.tsx` | Rename prop `isRunning → isLocked` in type + JSX |
| `src/components/Track/Track.tsx` | Rename prop `isRunning → isLocked` in type + all five `disabled` usages |
| `e2e/ch-006-track-management.e2e.ts` | Add assertions: object select and edit button are disabled after start, re-enabled after reset |

---

### Task 1: Thread `isLocked` through App → TrackList → Track

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/components/TrackList/TrackList.tsx`
- Modify: `src/components/Track/Track.tsx`

- [ ] **Step 1: Update `App.tsx`**

Replace the `isRunning` selector with `elapsedTimeSeconds` and compute `isLocked`:

```tsx
// Remove this:
const isRunning = useSimulationStore(
  (state) => state.simulationState.engine.isRunning,
);

// Add this:
const elapsedTimeSeconds = useSimulationStore(
  (state) => state.simulationState.engine.elapsedTimeSeconds,
);
const isLocked = elapsedTimeSeconds > 0;
```

And in the JSX, pass `isLocked` instead of `isRunning`:

```tsx
<TrackList
  tracks={trackVisualStates}
  canRemoveTrack={trackCount > 1}
  isLocked={isLocked}
  onRemoveTrack={removeTrack}
  onSetTrackDistance={setTrackDistance}
  onClearTrackDistance={clearTrackDistance}
  onSetTrackObject={setTrackObject}
/>
```

- [ ] **Step 2: Update `TrackList.tsx`**

Rename the prop in the type and in the component signature and JSX:

```tsx
type TrackListProps = {
  tracks: TrackVisualState[];
  canRemoveTrack: boolean;
  isLocked: boolean;
  onRemoveTrack: (trackId: string) => void;
  onSetTrackDistance: (trackId: string, amount: number, unit: DistanceUnit) => void;
  onClearTrackDistance: (trackId: string) => void;
  onSetTrackObject: (trackId: string, objectId: string) => void;
};

export const TrackList = ({
  tracks,
  canRemoveTrack,
  isLocked,
  onRemoveTrack,
  onSetTrackDistance,
  onClearTrackDistance,
  onSetTrackObject,
}: TrackListProps) => {
  // ...
  return (
    <section className="track-list" aria-label="Speed comparison lanes">
      {tracks.map((track) => (
        <Track
          key={track.trackId}
          track={track}
          canRemoveTrack={canRemoveTrack}
          isLocked={isLocked}
          onRemoveTrack={onRemoveTrack}
          onSetTrackDistance={onSetTrackDistance}
          onClearTrackDistance={onClearTrackDistance}
          onSetTrackObject={onSetTrackObject}
        />
      ))}
    </section>
  );
};
```

- [ ] **Step 3: Update `Track.tsx`**

Rename the prop in the type and component signature:

```tsx
type TrackProps = {
  track: TrackVisualState;
  canRemoveTrack: boolean;
  isLocked: boolean;
  onRemoveTrack: (trackId: string) => void;
  onSetTrackDistance: (trackId: string, amount: number, unit: DistanceUnit) => void;
  onClearTrackDistance: (trackId: string) => void;
  onSetTrackObject: (trackId: string, objectId: string) => void;
};

export const Track = ({
  track,
  canRemoveTrack,
  isLocked,
  onRemoveTrack,
  onSetTrackDistance,
  onClearTrackDistance,
  onSetTrackObject,
}: TrackProps) => {
```

Then replace all five `disabled={isRunning}` usages with `disabled={isLocked}`:

1. Object select (line ~105):
```tsx
<Select
  value={track.objectId}
  disabled={isLocked}
  onChange={(e) => onSetTrackObject(track.trackId, e.target.value)}
  data-testid={`track-object-select-${track.trackId}`}
  aria-label={`Object for ${track.trackId}`}
>
```

2. "Use global" button (line ~145):
```tsx
<button
  type="button"
  className="track-card__use-global"
  onClick={() => {
    onClearTrackDistance(track.trackId);
    setIsEditingDistance(false);
  }}
  disabled={isLocked}
  aria-label="Use global track length"
  data-testid={`clear-distance-${track.trackId}`}
>
```

3. Distance amount Input (line ~162):
```tsx
<Input
  id={distanceInputId}
  type="number"
  inputMode="decimal"
  min="0.001"
  step="1"
  value={draftAmount}
  disabled={isLocked}
  onChange={(e) => setDraftAmount(e.target.value)}
  onBlur={handleDistanceBlur}
  data-testid={`track-distance-amount-${track.trackId}`}
  autoFocus
/>
```

4. Distance unit Select (line ~171):
```tsx
<Select
  value={draftUnit}
  disabled={isLocked}
  onChange={(e) => {
    const newUnit = e.target.value as DistanceUnit;
    setDraftUnit(newUnit);
    const parsed = Number.parseFloat(draftAmount.trim());
    if (Number.isFinite(parsed) && parsed > 0) {
      onSetTrackDistance(track.trackId, parsed, newUnit);
    }
  }}
  data-testid={`track-distance-unit-${track.trackId}`}
>
```

5. Edit distance button (line ~202):
```tsx
<button
  type="button"
  className="track-card__distance-edit-btn"
  onClick={() => setIsEditingDistance(true)}
  disabled={isLocked}
  data-testid={`edit-distance-${track.trackId}`}
>
```

- [ ] **Step 4: Type-check**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 5: Run unit tests**

```bash
bun run build
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/App.tsx src/components/TrackList/TrackList.tsx src/components/Track/Track.tsx
git commit -m "feat: disable lane controls when simulation is not at zero position"
```

---

### Task 2: E2E test — controls lock after start, unlock after reset

**Files:**
- Modify: `e2e/ch-006-track-management.e2e.ts`

- [ ] **Step 1: Add the test**

Append a new test inside the `test.describe("CH-006 track management")` block:

```ts
test("lane object select and distance edit are disabled after start and re-enabled after reset", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "commit", timeout: 60_000 });

  const controls = page.getByLabel("Engine controls");
  const startButton = controls.getByRole("button", { name: "Start" });
  const pauseButton = controls.getByRole("button", { name: "Pause" });
  const resetButton = controls.getByRole("button", { name: "Reset" });

  const objectSelect = page.getByTestId("track-object-select-track-1");
  const editDistanceButton = page.getByTestId("edit-distance-track-1");

  // At idle (zero position): controls are enabled
  await expect(objectSelect).toBeEnabled();
  await expect(editDistanceButton).toBeEnabled();

  // Start then immediately pause
  await startButton.click();
  await pauseButton.click();

  // Paused (non-zero position): controls are disabled
  await expect(objectSelect).toBeDisabled();
  await expect(editDistanceButton).toBeDisabled();

  // Reset (back to zero position): controls re-enabled
  await resetButton.click();
  await expect(objectSelect).toBeEnabled();
  await expect(editDistanceButton).toBeEnabled();
});
```

- [ ] **Step 2: Bundle and serve for E2E**

```bash
bun run e2e:bundle && bun run e2e:serve &
```

- [ ] **Step 3: Run only the new E2E test to verify it passes**

```bash
npx playwright test e2e/ch-006-track-management.e2e.ts --grep "disabled after start"
```

Expected: 1 passed.

- [ ] **Step 4: Run all E2E tests to check nothing regressed**

```bash
npx playwright test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add e2e/ch-006-track-management.e2e.ts
git commit -m "test(e2e): verify lane controls lock when simulation leaves zero position"
```
