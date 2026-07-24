import { test, expect } from '@playwright/test';

test.describe('Customer Home', () => {
  test('renders the customer-home surface with its preserved dynamic inline contracts', async ({ page }) => {
    await page.goto('/customer');

    const customerHome = page.locator('.customer-container.customer-home');
    await expect(customerHome).toBeVisible();
    await expect(customerHome.getByRole('heading', { name: 'Your 200% Deposit Match is Ready.' })).toBeVisible();
    await expect(customerHome.getByRole('heading', { name: 'Trending Now' })).toBeVisible();
    await expect(customerHome.getByRole('heading', { name: 'Live Action' })).toBeVisible();
    await expect(customerHome.getByRole('heading', { name: 'Player Promotions' })).toBeVisible();

    await expect(customerHome.locator('.game-card')).toHaveCount(10);
    await expect(customerHome.locator('.nudge-bar-fill')).toHaveAttribute('style', /width:\s*42%/);
    await expect(customerHome.locator('.game-image').first()).toHaveAttribute('style', /linear-gradient\(135deg, #fbcfe822/);
    await expect(customerHome.locator('.live-game-card .game-image').first()).toHaveAttribute('style', /linear-gradient\(135deg, #c084fc33/);

    await expect(customerHome.locator('.live-game-grid')).toHaveCount(1);
    await expect(customerHome.locator('.promotions-section-header')).toHaveCount(1);
    await expect(customerHome.locator('.promo-card-green')).toHaveCount(1);
    await expect(customerHome.locator('.promo-card-purple')).toHaveCount(1);
  });

  test('keeps customer navigation destinations and the 1200px responsive layout contract', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/customer');

    const customerHome = page.locator('.customer-container.customer-home');
    await expect(customerHome.getByRole('link', { name: /Redeem Rewards/ })).toHaveAttribute('href', '/customer/rewards');
    await expect(customerHome.getByRole('link', { name: 'View All', exact: true })).toHaveAttribute('href', '/customer/games');
    await expect(customerHome.getByRole('link', { name: 'View Live Casino' })).toHaveAttribute('href', '/customer/games');
    await expect(customerHome.getByRole('link', { name: 'View All Promos' })).toHaveAttribute('href', '/customer/promotions');

    const responsiveColumnCount = await customerHome.locator('.game-grid').first().evaluate((element) =>
 getComputedStyle(element).gridTemplateColumns.split(' ').length
);
expect(responsiveColumnCount).toBe(4);
await expect(customerHome.locator('.rewards-nudge-card')).toHaveCSS('flex-direction', 'column');
await expect(customerHome.locator('.nudge-right')).toHaveCSS('justify-content', 'space-between');
  });
});
