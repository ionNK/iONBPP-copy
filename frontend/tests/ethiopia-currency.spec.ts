import { test, expect } from '@playwright/test';

// Captures a real screenshot proving the reward currency follows the
// primary market (Ethiopia -> ETB) in Step 4 of the promotion wizard.
test('ethiopia primary market drives ETB currency in Step 4', async ({ page }) => {
  // Skip the onboarding tour so the backdrop doesn't intercept clicks.
  await page.addInitScript(() => {
    window.localStorage.setItem('hasSeenTour', 'true');
  });

  await page.goto('/admin/promotions/create');
  await expect(page).toHaveTitle(/Betika Promotions Platform/i);

  // --- Step 1: Basics ---
  await page.getByPlaceholder('e.g. Welcome Bonus 2024').fill('Ethiopia Currency Demo');
  await page.getByPlaceholder('Description for internal team...').fill('Screenshot proof: ETB follows primary market');
  await page.locator('.type-card').filter({ hasText: 'Cashback' }).click({ force: true });
  await page.getByRole('button', { name: 'Next Step' }).click();

  // --- Step 2: Scope & Eligibility -> pick Ethiopia as the (primary) market ---
  // Markets load async (from backend, or a static fallback). Wait until the
  // dropdown has actually been populated with the Ethiopia (ET) option.
  const marketSelect = page.locator('.market-selector select.form-select');
  await expect(marketSelect.locator('option[value="ET"]')).toHaveCount(1, { timeout: 20000 });
  await marketSelect.selectOption('ET');
  await expect(marketSelect).toHaveValue('ET');
  await page.getByRole('button', { name: 'Next Step' }).click();

  // --- Step 3: Triggers (defaults ok) ---
  await page.getByRole('button', { name: 'Next Step' }).click();

  // --- Step 4: Rewards ---
  await expect(page.getByText('Reward Configuration')).toBeVisible();

  // Choose "Freebets" so the currency prefix + hint render.
  await page.locator('.reward-card').filter({ hasText: 'Freebets' }).click();

  // Assert ETB is actually shown in the Unit Value prefix + helper hint.
  await expect(page.locator('.fb-prefix').first()).toHaveText('ETB');
  await expect(
    page.getByText('Value of a single free bet (ETB, auto-set by market).')
  ).toBeVisible();

  // Also assert the Simple Rule "Max Amount Cap" prefix shows ETB.
  await expect(page.locator('.prefix').first()).toHaveText('ETB');

  // Capture the screenshot of the whole Step 4 panel.
  await page.locator('.form-panel').screenshot({
    path: 'test-results/ethiopia-currency-step4.png',
  });
  // And a full-page version for context.
  await page.screenshot({
    path: 'test-results/ethiopia-currency-fullpage.png',
    fullPage: true,
  });
});
