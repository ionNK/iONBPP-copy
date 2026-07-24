import { test, expect } from '@playwright/test';

test.describe('Onboarding Tour', () => {
 test('renders the portal overlay with its retained layering and pointer contracts', async ({ page }) => {
 await page.addInitScript(() => window.localStorage.removeItem('hasSeenTour'));
 await page.goto('/admin/settings');

 const tour = page.locator('.onboarding-tour');
 const backdrop = tour.locator('.tour-backdrop');
 const card = tour.locator('.tour-card');

 await expect(backdrop).toBeVisible({ timeout: 2500 });
 await expect(card).toBeVisible();
 await expect(backdrop).toHaveCSS('position', 'fixed');
 await expect(backdrop).toHaveCSS('z-index', '99999');
 await expect(backdrop).toHaveCSS('pointer-events', 'auto');
 await expect(card).toHaveCSS('position', 'fixed');
 await expect(card).toHaveCSS('z-index', '100001');

 await card.getByRole('button', { name: 'Get Started' }).click();
 const spotlight = tour.locator('.tour-spotlight');
 await expect(spotlight).toBeVisible();
 await expect(spotlight).toHaveCSS('z-index', '100000');
 await expect(spotlight).toHaveCSS('pointer-events', 'none');
 });

 test('dismissal persists suppression for the next page load', async ({ page }) => {
 await page.addInitScript(() => window.localStorage.removeItem('hasSeenTour'));
 await page.goto('/admin/settings');

 const backdrop = page.locator('.onboarding-tour .tour-backdrop');
 await expect(backdrop).toBeVisible({ timeout: 2500 });
 await backdrop.click({ position: { x: 5, y: 5 } });
 await expect(backdrop).toHaveCount(0);
 await expect.poll(() => page.evaluate(() => window.localStorage.getItem('hasSeenTour'))).toBe('true');

 await page.reload();
 await expect(page.locator('.onboarding-tour .tour-backdrop')).toHaveCount(0);
 });

 test('does not render when the tour has already been seen', async ({ page }) => {
 await page.addInitScript(() => window.localStorage.setItem('hasSeenTour', 'true'));
 await page.goto('/admin/settings');
 await page.waitForTimeout(1700);
 await expect(page.locator('.onboarding-tour .tour-backdrop')).toHaveCount(0);
 });
});
