import { test, expect } from '@playwright/test';

test.describe('Light Mode & Promotion Wizard Audit', () => {
    test.beforeEach(async ({ page }) => {
    // Skip the onboarding tour so its backdrop does not intercept clicks,
    // and force Light Mode via the same localStorage key the app reads.
    await page.addInitScript(() => {
      window.localStorage.setItem('hasSeenTour', 'true');
      window.localStorage.setItem('betika-theme', 'light');
    });
    await page.goto('http://localhost:3000/admin/settings');
  });

    test('should have higher contrast text in light mode', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        const bgColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg-app').trim());
        expect(bgColor).toBe('#f6f7f9');
        const primaryText = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim());
        expect(primaryText).toBe('#17212f');
    });

  test('should display banner URL correctly in Step 6 preview', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/promotions/create');
    await page.waitForLoadState('networkidle');

    // Step 1 — Basics (name + type are required to advance)
    await page.getByPlaceholder('e.g. Welcome Bonus 2024').fill('Banner Preview Test');
    await page.locator('.type-card').filter({ hasText: 'Cashback' }).click({ force: true });
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 2 — Scope (market required)
    await page.waitForSelector('option[value="KE"]', { state: 'attached' });
    await page.locator('select').filter({ hasText: 'Select a Target Market' }).selectOption('KE');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Steps 3, 4, 5 — defaults are valid, just advance to Step 6 (Display)
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Next Step' }).click();
      await page.waitForTimeout(400);
    }

    // Enter Banner URL
    const bannerUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475';
    await page.fill('input[placeholder="https://example.com/image.jpg"]', bannerUrl);

    // Verify Live Preview Image renders the banner
    const previewImg = page.locator('.betika-card-media img.card-img-cover').first();
    await expect(previewImg).toHaveAttribute('src', bannerUrl);
  });

  test('should show edit links in Step 7 and navigate back', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/promotions/create');
    await page.waitForLoadState('networkidle');

    // Step 1 — Basics (name + type required)
    await page.getByPlaceholder('e.g. Welcome Bonus 2024').fill('Review Step Test');
    await page.locator('.type-card').filter({ hasText: 'Cashback' }).click({ force: true });
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 2 — Scope (market required)
    await page.waitForSelector('option[value="KE"]', { state: 'attached' });
    await page.locator('select').filter({ hasText: 'Select a Target Market' }).selectOption('KE');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Steps 3, 4, 5, 6 — advance with valid defaults to reach Step 7 (Review)
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Next Step' }).click();
      await page.waitForTimeout(400);
    }

    // Verify ARIA region for summary cards is present
    const summaryRegion = page.locator('[role="region"][aria-label="Promotion Summary Overview"]');
    await expect(summaryRegion).toBeVisible({ timeout: 5000 });

    // Verify Edit links exist (one per summary card)
    const editLinks = page.locator('button.edit-link');
    await expect(editLinks).toHaveCount(7, { timeout: 5000 });

    // Click Edit on Basics (Step 1) and confirm we navigate back
    await editLinks.first().click();
    await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible({ timeout: 5000 });
  });

    test('should have accessible focus rings', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/settings');
    // Tab through elements to reach a theme card
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        const focusedElement = page.locator(':focus');
        const boxShadow = await focusedElement.evaluate((el) => getComputedStyle(el).boxShadow);
    // Our focus-ring variable: 0 0 0 2px var(--color-bg-app), 0 0 0 4px var(--color-betika-green)
    // The browser may render the color as rgb() or rgba(); match the RGB channels either way.
    expect(boxShadow).toContain('105, 153, 81'); // Betika Green
    });
});
