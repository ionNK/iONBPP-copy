import { test, expect } from '@playwright/test';

test.describe('Rewards Hub', () => {
  test('renders the loyalty surface with its calculated inline progress width', async ({ page }) => {
    await page.goto('/customer/rewards');

    const rewardsHub = page.locator('.rewards-hub-container');
    await expect(rewardsHub).toBeVisible();
    await expect(rewardsHub.getByRole('heading', { name: 'Loyalty Tier Benefits' })).toBeVisible();
    await expect(rewardsHub.getByRole('heading', { name: 'Redemption Store' })).toBeVisible();
    await expect(rewardsHub.locator('.progress-fill')).toHaveAttribute('style', /width:\s*12\.4%/);
  });

  test('filters store items and cancels the page-owned redemption modal', async ({ page }) => {
    await page.goto('/customer/rewards');

    const rewardsHub = page.locator('.rewards-hub-container');
    await rewardsHub.getByRole('button', { name: 'ODDS BOOST' }).click();
await expect(rewardsHub.locator('.reward-card')).toHaveCount(4);
await expect(rewardsHub.locator('.reward-badge-type')).toHaveText([
'ODDS BOOST',
'ODDS BOOST',
'ODDS BOOST',
'ODDS BOOST'
]);

await rewardsHub.getByRole('button', { name: 'Redeem Now' }).first().click();
    await expect(rewardsHub.getByRole('heading', { name: 'Confirm Redemption' })).toBeVisible();
    await rewardsHub.getByRole('button', { name: 'Cancel' }).click();
    await expect(rewardsHub.getByRole('heading', { name: 'Confirm Redemption' })).not.toBeVisible();
  });
});
