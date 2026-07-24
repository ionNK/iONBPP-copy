import { test, expect } from '@playwright/test';

async function openScheduleStep(page: import('@playwright/test').Page) {
 await page.addInitScript(() => {
 window.localStorage.setItem('hasSeenTour', 'true');
 });
 await page.goto('/admin/promotions/create');
 await page.waitForLoadState('networkidle');

 await page.getByPlaceholder('e.g. Welcome Bonus 2024').fill('Schedule Contract Test');
 await page.locator('.type-card').filter({ hasText: 'Cashback' }).click({ force: true });
 await page.getByRole('button', { name: 'Next Step' }).click();

 const marketTrigger = page.locator('button.market-trigger');
 if (!(await marketTrigger.textContent())?.includes('Kenya')) {
 await marketTrigger.click();
 await page.getByRole('listbox', { name: 'Target Market' }).getByRole('option', { name: /Kenya/i }).click();
 }

 for (let step = 0; step < 3; step += 1) {
 await page.getByRole('button', { name: 'Next Step' }).click();
 }

 await expect(page.locator('.wizard-schedule')).toBeVisible();
}

test.describe('Promotion wizard schedule step', () => {
 test('retains schedule inputs, recurrence controls, limits, and summary behavior', async ({ page }) => {
 await openScheduleStep(page);

 const schedule = page.locator('.wizard-schedule');
 await expect(schedule).toHaveCSS('max-width', '900px');
 await expect(schedule.locator('#promotion-start')).toBeVisible();
 await expect(schedule.locator('#promotion-end')).toBeVisible();

 await schedule.locator('#promotion-start').fill('2030-01-02T10:00');
 await schedule.locator('#promotion-end').fill('2030-01-01T10:00');
 await expect(schedule.locator('[role="status"]')).toContainText('End date must be after start date.');

 await schedule.locator('#promotion-end').fill('2030-01-05T10:00');
 await expect(schedule.locator('[role="status"]')).toContainText('This promotion will run for');

 const recurringToggle = schedule.getByRole('button', { name: /Recurring promotion/i });
 await recurringToggle.click();
 await expect(recurringToggle).toHaveAttribute('aria-pressed', 'true');

 const frequencyTrigger = schedule.locator('button.frequency-trigger');
 await frequencyTrigger.click();
 const frequencyList = schedule.getByRole('listbox', { name: 'Repeat frequency' });
 await expect(frequencyList).toBeVisible();
 await frequencyList.getByRole('option', { name: 'Monthly' }).click();
 await expect(frequencyTrigger).toContainText('Monthly');

 const monday = schedule.getByRole('button', { name: 'monday' });
 await monday.click();
 await expect(monday).toHaveAttribute('aria-pressed', 'true');

 await schedule.locator('#total-claims').fill('200');
 await schedule.locator('#per-player-claims').fill('3');
 await schedule.locator('#promotion-budget').fill('5000');
 await expect(schedule.locator('#total-claims')).toHaveValue('200');
 await expect(schedule.locator('#per-player-claims')).toHaveValue('3');
 await expect(schedule.locator('#promotion-budget')).toHaveValue('5000');
 });
});
