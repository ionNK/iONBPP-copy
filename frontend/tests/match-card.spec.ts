import { test, expect } from '@playwright/test';

test.describe('MatchCard', () => {
 test.beforeEach(async ({ page }) => {
 await page.goto('/customer/sports');
 });

 test('renders the reachable default decimal odds and preserves live/upcoming match details', async ({ page }) => {
 const liveCard = page.locator('.s-match-card').filter({ hasText: 'Real Madrid' });
 const upcomingCard = page.locator('.s-match-card').filter({ hasText: 'Arsenal' });

 await expect(liveCard).toContainText('UEFA Champions League');
 await expect(liveCard).toContainText('Live • 68:14');
 await expect(liveCard).toContainText('1');
 await expect(liveCard.getByRole('button', { name: /Real Madrid 2\.80/ })).toBeVisible();
 await expect(liveCard).not.toContainText('9/5');

 await expect(upcomingCard).toContainText('Tomorrow, 17:30');
 await expect(upcomingCard.getByRole('button', { name: /Arsenal 2\.50/ })).toBeVisible();
 });

 test('adds and removes an odds selection through the existing bet-slip flow', async ({ page }) => {
 const matchCard = page.locator('.s-match-card').filter({ hasText: 'Real Madrid' });
 const selection = matchCard.getByRole('button', { name: /Real Madrid 2\.80/ });

 await selection.click();
 await expect(selection).toHaveClass(/selected/);
 await expect(page.locator('.betslip-widget')).toContainText('Real Madrid');

 await selection.click();
 await expect(selection).not.toHaveClass(/selected/);
 });

 test('expands and collapses the additional match markets', async ({ page }) => {
 const matchCard = page.locator('.s-match-card').filter({ hasText: 'Real Madrid' });
 const moreMarkets = matchCard.getByRole('button', { name: '+1 More Markets' });

 await expect(matchCard).not.toContainText('Next Goal');
 await moreMarkets.click();
 await expect(matchCard).toContainText('Next Goal');
 await expect(matchCard.getByRole('button', { name: 'Fewer Markets' })).toBeVisible();

 await matchCard.getByRole('button', { name: 'Fewer Markets' }).click();
 await expect(matchCard).not.toContainText('Next Goal');
 });
});
