import { test, expect } from '@playwright/test';

test('create promotion wizard flow', async ({ page }) => {
    // 1. Navigate
    await page.addInitScript(() => {
        window.localStorage.setItem('hasSeenTour', 'true');
    });
    await page.goto('/admin/promotions/create');
    await expect(page).toHaveTitle(/Betika Promotions Platform/i);

    // 2. Basics
 await page.getByRole('textbox', { name: 'Promotion Name', exact: true }).fill('Playwright Auto-Test Promo');
 await page.getByPlaceholder('Description for internal team...').first().fill('Created by Playwright E2E Test');
 await page.locator('.type-card').filter({ hasText: 'Cashback' }).first().click();
 await page.getByRole('button', { name: 'Next Step' }).first().click();
await expect(page.getByRole('main', { name: 'Step 2 of 7' })).toBeVisible();

    // 3. Scope
 // multiCountry and segmentTargeting flags are off: the market and audience
 // pickers are hidden, and state defaults (ZM / no segment) keep the flow valid.
 await expect(page.locator('.seg-trigger')).toHaveCount(0);
 await expect(page.locator('button.market-trigger')).toHaveCount(0);
const allPlatforms = page.getByRole('button', { name: 'All', exact: true });
 await expect(allPlatforms).toHaveAttribute('aria-pressed', 'false');
 await allPlatforms.click();
 await expect(allPlatforms).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // 4. Triggers (Skip for now, defaults ok)
    await page.getByRole('button', { name: 'Next Step' }).click();

    // 5. Rewards (Skip for now, defaults ok)
    await page.getByRole('button', { name: 'Next Step' }).click();

    // 6. Schedule (Skip for now, defaults ok)
    await page.getByRole('button', { name: 'Next Step' }).click();

    // 7. Display (Skip for now, defaults ok)
    await page.getByRole('button', { name: 'Next Step' }).click();

    // 8. Review & Publish
    await page.getByRole('button', { name: 'Publish Promotion' }).click();

    // 9. Verify Success
    // Expect redirect to /promotions or a success toast
    await expect(page).toHaveURL(/\/promotions/);
});
