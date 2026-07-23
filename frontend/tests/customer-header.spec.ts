import { test, expect } from '@playwright/test';

test.describe('CustomerHeader', () => {
  test('is shared across customer routes and preserves navigation destinations', async ({ page }) => {
    await page.goto('/customer');
    await expect(page.locator('.customer-header')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lobby' })).toHaveClass(/active/);
    await expect(page.getByRole('link', { name: 'Sports' })).toHaveAttribute('href', '/customer/sports');
    await expect(page.getByRole('link', { name: 'Live In-Play' })).toHaveAttribute('href', '/customer/sports/live');
    await expect(page.locator('.header-nav').getByRole('link', { name: 'Rewards', exact: true })).toHaveAttribute('href', '/customer/rewards');

    await page.goto('/customer/rewards');
    await expect(page.locator('.customer-header')).toBeVisible();
    await expect(page.locator('.header-nav').getByRole('link', { name: 'Rewards', exact: true })).toHaveClass(/active/);
    await expect(page.getByRole('link', { name: 'Lobby' })).not.toHaveClass(/active/);
  });

  test('preserves prefix navigation behavior and theme persistence', async ({ page }) => {
    await page.goto('/customer/sports');
    await expect(page.getByRole('link', { name: 'Sports' })).toHaveClass(/active/);
    await expect(page.getByRole('link', { name: 'Live In-Play' })).not.toHaveClass(/active/);

    await page.goto('/customer');
    const themeToggle = page.getByTitle('Switch to dark mode');
    await themeToggle.click();
    await expect(page.getByTitle('Switch to light mode')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('keeps reward points and tier reactive in the shared header', async ({ page }) => {
    await page.goto('/customer/rewards');
    await expect(page.locator('.header-rewards-pill')).toContainText('6,240');
    await expect(page.locator('.header-rewards-pill .tier-icon')).toHaveText('G');
    await page.getByRole('button', { name: 'Redeem Now' }).first().click();
    await page.getByRole('button', { name: 'Confirm Redemption' }).click();
    await expect(page.locator('.header-rewards-pill')).toContainText('5,740', { timeout: 5000 });
  });
});
