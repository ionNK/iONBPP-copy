import { test, expect } from '@playwright/test';

// Utility capture spec: walks the promotion setup wizard and saves a
// full-page screenshot of each step to screenshots/promotion-wizard/.
test('capture promotion wizard step screenshots', async ({ page }) => {
  const dir = 'screenshots/promotion-wizard';
  const shot = async (name: string) => {
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  };

  await page.addInitScript(() => {
    window.localStorage.setItem('hasSeenTour', 'true');
    window.localStorage.setItem('betika-theme', 'dark');
      });
  await page.goto('/admin/promotions/create');
  await expect(page).toHaveTitle(/Betika Promotions Platform/i);

  // Step 1: Basics
  await page.getByPlaceholder('e.g. Welcome Bonus 2024').first().fill('Screenshot Walkthrough Promo');
  await page.getByPlaceholder('Description for internal team...').first().fill('Captured for design review');
  await page.locator('.type-card').filter({ hasText: 'Cashback' }).first().click();
  await shot('01-basics');
  await page.getByRole('button', { name: 'Next Step' }).first().click();

  // Step 2: Scope
  const marketTrigger = page.locator('button.market-trigger');
  await expect(marketTrigger).toBeVisible();
  await shot('02-scope');
  await page.getByRole('button', { name: 'Next Step' }).click();

  // Step 3: Qualification
  await shot('03-qualification');
  await page.getByRole('button', { name: 'Next Step' }).click();

  // Step 4: Rewards
  await shot('04-rewards');
  await page.getByRole('button', { name: 'Next Step' }).click();

  // Step 5: Schedule
  await shot('05-schedule');
  await page.getByRole('button', { name: 'Next Step' }).click();

  // Step 6: Display
  await shot('06-display');
  await page.getByRole('button', { name: 'Next Step' }).click();

  // Step 7: Review
  await expect(page.getByRole('button', { name: 'Publish Promotion' })).toBeVisible();
  await shot('07-review');
});
