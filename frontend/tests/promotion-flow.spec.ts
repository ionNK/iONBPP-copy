import { test, expect } from '@playwright/test';

test('create promotion wizard flow', async ({ page }) => {
    // 1. Navigate
    await page.addInitScript(() => {
        window.localStorage.setItem('hasSeenTour', 'true');
    });
    await page.goto('/admin/promotions/create');
    await expect(page).toHaveTitle(/Betika Promotions Platform/i);

    // 2. Basics
 await page.getByPlaceholder('e.g. Welcome Bonus 2024').first().fill('Playwright Auto-Test Promo');
 await page.getByPlaceholder('Description for internal team...').first().fill('Created by Playwright E2E Test');
 await page.locator('.type-card').filter({ hasText: 'Cashback' }).first().click();
 await page.getByRole('button', { name: 'Next Step' }).first().click();

    // 3. Scope
 // A plain create flow must not inherit an audience from a seed template,
 // a previously edited promotion, or descriptive CRM query metadata.
 const audiencePicker = page.locator('.seg-trigger');
 await expect(audiencePicker).toContainText('Select Segment (Optional)');
 await expect(audiencePicker).not.toContainText(/Sportsbook (Users|Players)/i);
    await page.waitForSelector('option[value="KE"]', { state: 'attached' });
    await page.locator('select').filter({ hasText: 'Select a Target Market' }).selectOption('KE');
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
