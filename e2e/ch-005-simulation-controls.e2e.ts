import { expect, type Page, test } from "@playwright/test";

test.describe("CH-005 simulation controls", () => {
  test.setTimeout(120_000);

  test("start/pause/reset enforce valid control states and track progression", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "commit", timeout: 60_000 });

    const controls = page.getByLabel("Simulation controls");
    const startButton = controls.getByRole("button", { name: "Start" });
    const pauseButton = controls.getByRole("button", { name: "Pause" });
    const resetButton = controls.getByRole("button", { name: "Reset" });
    const status = controls.locator(".simulation-controls__status");

    await expect(status).toContainText("Status: Idle");
    await expect(startButton).toBeEnabled();
    await expect(pauseButton).toBeDisabled();
    await expect(resetButton).toBeDisabled();

    const initialProgressTrackOne = await getProgressValue(page, "track-1");
    const initialProgressTrackTwo = await getProgressValue(page, "track-2");
    expect(initialProgressTrackOne).toBe(0);
    expect(initialProgressTrackTwo).toBe(0);

    await startButton.click();
    await expect(status).toContainText("Status: Running");
    await expect(startButton).toBeDisabled();
    await expect(pauseButton).toBeEnabled();
    await expect(resetButton).toBeEnabled();

    await page.waitForTimeout(1200);

    const runningProgressTrackOne = await getProgressValue(page, "track-1");
    const runningProgressTrackTwo = await getProgressValue(page, "track-2");
    expect(runningProgressTrackOne).toBeGreaterThan(0);
    expect(runningProgressTrackTwo).toBeGreaterThan(runningProgressTrackOne);

    const runningElapsedTrackOne = await getElapsedSeconds(page, "track-1");
    const runningElapsedTrackTwo = await getElapsedSeconds(page, "track-2");
    expect(Math.abs(runningElapsedTrackOne - runningElapsedTrackTwo)).toBeLessThan(0.05);

    await pauseButton.click();
    await expect(status).toContainText("Status: Paused");
    await expect(startButton).toBeEnabled();
    await expect(pauseButton).toBeDisabled();
    await expect(resetButton).toBeEnabled();

    const pausedProgressTrackOne = await getProgressValue(page, "track-1");
    await page.waitForTimeout(700);
    const pausedProgressTrackOneAfterWait = await getProgressValue(page, "track-1");
    expect(Math.abs(pausedProgressTrackOneAfterWait - pausedProgressTrackOne)).toBeLessThan(0.01);

    await resetButton.click();
    await expect(status).toContainText("Status: Idle");
    await expect(startButton).toBeEnabled();
    await expect(pauseButton).toBeDisabled();
    await expect(resetButton).toBeDisabled();

    const resetProgressTrackOne = await getProgressValue(page, "track-1");
    const resetProgressTrackTwo = await getProgressValue(page, "track-2");
    expect(resetProgressTrackOne).toBe(0);
    expect(resetProgressTrackTwo).toBe(0);

    const resetElapsedTrackOne = await getElapsedSeconds(page, "track-1");
    const resetElapsedTrackTwo = await getElapsedSeconds(page, "track-2");
    expect(resetElapsedTrackOne).toBe(0);
    expect(resetElapsedTrackTwo).toBe(0);
  });
});

const getProgressValue = async (page: Page, trackId: string): Promise<number> => {
  const value = await page
    .locator(`[data-testid="track-card-${trackId}"] .ui-progress`)
    .getAttribute("aria-valuenow");

  if (!value) {
    throw new Error(`Missing progress value for ${trackId}`);
  }

  return Number.parseFloat(value);
};

const getElapsedSeconds = async (page: Page, trackId: string): Promise<number> => {
  const elapsedText = await page
    .locator(`[data-testid="track-card-${trackId}"] .track-card__metrics div`)
    .filter({ hasText: "Elapsed" })
    .locator("dd")
    .innerText();

  return Number.parseFloat(elapsedText.replace("s", ""));
};
