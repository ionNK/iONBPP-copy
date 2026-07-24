import { test, expect } from '@playwright/test';

test.describe('PlayerTabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/crm/PL-100241');
  });

  test('switches Player360 tab state and reveals the corresponding static tab content', async ({ page }) => {
    const tabs = page.locator('.p360 .tabs');

    await expect(tabs.getByRole('button', { name: 'Overview' })).toHaveClass(/active/);
    await expect(page.locator('.p-tabs.ov')).toContainText('Next Best Action');

    await tabs.getByRole('button', { name: 'Financials' }).click();
    await expect(tabs.getByRole('button', { name: 'Financials' })).toHaveClass(/active/);
    await expect(page.locator('.p-tabs.fin')).toContainText('Total deposits');

    await tabs.getByRole('button', { name: 'Campaigns' }).click();
    await expect(tabs.getByRole('button', { name: 'Campaigns' })).toHaveClass(/active/);
    await expect(page.locator('.p-tabs.cmp')).toContainText('Weekend Acca Boost');
  });

  test('renders timeline and bonus progress through their component-owned inline state', async ({ page }) => {
    const tabs = page.locator('.p360 .tabs');

    await tabs.getByRole('button', { name: 'Timeline' }).click();
    const timeline = page.locator('.p-tabs.tl');
    await expect(timeline).toContainText('Claimed "Acca Insurance" bonus');
    await expect(timeline.locator('.row .dot').first()).toHaveAttribute('style', /background/);

    await tabs.getByRole('button', { name: 'Bonuses & Offers' }).click();
    const bonuses = page.locator('.p-tabs.bn');
    await expect(bonuses).toContainText('Acca Insurance');
    await expect(bonuses.locator('.wag .track span').first()).toHaveAttribute('style', /width/);
  });
});
