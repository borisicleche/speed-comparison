import { expect, type Page, test } from "@playwright/test";

test.describe("CH-007 distance + units", () => {
  test.setTimeout(120_000);

  test("keeps unit edits as draft until apply and rescales on apply", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit", timeout: 60_000 });

    const simulationControls = page.getByLabel("Simulation controls");
    const startButton = simulationControls.getByRole("button", { name: "Start" });
    const status = simulationControls.locator(".simulation-controls__status");

    const distanceControls = page.getByLabel("Distance controls");
    const amountInput = page.getByTestId("distance-amount-input");
    const unitSelect = page.getByTestId("distance-unit-select");
    const applyButton = page.getByTestId("distance-apply-button");

    await expect(amountInput).toHaveValue("1");
    await expect(unitSelect).toHaveValue("km");
    await expect(page.getByTestId("distance-current-value")).toContainText("1 km");
    await expect(applyButton).toBeDisabled();

    await unitSelect.selectOption("m");
    await amountInput.fill("10");
    await expect(applyButton).toBeEnabled();
    await applyButton.click();
    await expect(status).toContainText("Status: Idle");
    await expect(unitSelect).toHaveValue("m");
    await expect(amountInput).toHaveValue("10");

    await startButton.click();
    await expect(status).toContainText("Status: Running");
    await page.waitForTimeout(350);
    const progressBeforeUnitDraftChange = await getProgressValue(page, "track-1");
    expect(progressBeforeUnitDraftChange).toBeGreaterThan(0);

    await unitSelect.selectOption("km");
    await expect(amountInput).toHaveValue("10");
    await expect(applyButton).toBeEnabled();
    await expect(status).toContainText("Status: Running");
    await page.waitForTimeout(350);
    const progressAfterUnitDraftChange = await getProgressValue(page, "track-1");
    expect(progressAfterUnitDraftChange).toBeGreaterThan(progressBeforeUnitDraftChange);

    await applyButton.click();
    await expect(status).toContainText("Status: Idle");
    expect(await getProgressValue(page, "track-1")).toBe(0);
    await expect(unitSelect).toHaveValue("km");
    await expect(amountInput).toHaveValue("10");

    await startButton.click();
    await expect(status).toContainText("Status: Running");
    await page.waitForTimeout(350);
    const progressAtTenKm = await getProgressValue(page, "track-1");
    expect(progressAtTenKm).toBeGreaterThan(0);

    await amountInput.fill("0");
    await expect(applyButton).toBeDisabled();
    await distanceControls.locator(".distance-input__status").click();
    await expect(amountInput).toHaveValue("10");
  });
});

const getProgressValue = async (page: Page, trackId: string): Promise<number> => {
  const value = await page
    .locator(`[data-testid="track-card-${trackId}"] .track-card__lane`)
    .getAttribute("data-progress");

  if (!value) {
    throw new Error(`Missing progress value for ${trackId}`);
  }

  return Number.parseFloat(value);
};
