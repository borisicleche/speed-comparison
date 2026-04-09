import { expect, test } from "@playwright/test";

test.describe("CH-006 track management", () => {
  test.setTimeout(120_000);

  test("adds/removes lanes and updates per-lane object selection", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit", timeout: 60_000 });

    const laneCount = page.getByTestId("track-count");
    const addLaneButton = page.getByTestId("add-track-button");

    await expect(laneCount).toContainText("Lanes: 2 / 10");
    await expect(page.getByTestId("track-object-select-track-1")).toHaveValue("human-walking");

    await addLaneButton.click();
    await expect(laneCount).toContainText("Lanes: 3 / 10");
    await expect(page.getByTestId("track-object-select-track-3")).toHaveValue("human-walking");

    await page.getByTestId("track-object-select-track-1").selectOption("airplane");
    await expect(page.getByTestId("track-card-track-1")).toContainText("Airplane");

    await page.getByTestId("remove-track-track-2").click();
    await expect(laneCount).toContainText("Lanes: 2 / 10");

    await page.getByTestId("remove-track-track-3").click();
    await expect(laneCount).toContainText("Lanes: 1 / 10");
    await expect(page.getByTestId("remove-track-track-1")).toBeDisabled();

    for (let lane = 2; lane <= 10; lane += 1) {
      await addLaneButton.click();
    }

    await expect(laneCount).toContainText("Lanes: 10 / 10");
    await expect(addLaneButton).toBeDisabled();
  });

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
});
