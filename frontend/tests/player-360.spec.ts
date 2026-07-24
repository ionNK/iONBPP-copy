import { test, expect } from '@playwright/test';

test.describe('Player360', () => {
  test('loads player detail, switches tabs, and updates recent actions and notes', async ({ page }) => {
    await page.goto('/admin/crm/PL-100241');

    await expect(page.locator('.p360')).toBeVisible();
    await expect(page.locator('.hero h1')).toHaveText('Amara Njoroge');
    await expect(page.getByRole('button', { name: 'Overview', exact: true })).toHaveClass(/active/);

    for (const tab of ['Timeline', 'Financials', 'Bonuses & Offers', 'Campaigns', 'Notes']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await expect(page.getByRole('button', { name: tab, exact: true })).toHaveClass(/active/);
    }

    await page.getByRole('button', { name: 'Overview', exact: true }).click();
    await page.getByRole('button', { name: 'Target with Promotion' }).click();
    await expect(page.getByRole('heading', { name: 'Recent operator actions' }).locator('..')).toContainText('Targeted with a promotion');

    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await page.getByPlaceholder(/write a note/i).fill('Player360 test note');
    await page.getByRole('button', { name: /save note/i }).click();
    await expect(page.locator('.tab-panel')).toContainText('Player360 test note');
  });

  test('preserves loading/not-found handling and supports peer navigation', async ({ page }) => {
    await page.goto('/admin/crm/does-not-exist');
    await expect(page.getByText('Customer not found.')).toBeVisible();

    await page.goto('/admin/crm/PL-100241');
    const peer = page.locator('.peers a').first();
    await expect(peer).toBeVisible();
    const href = await peer.getAttribute('href');
    await peer.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator('.p360')).toBeVisible();
  });
});
