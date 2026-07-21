import { test, expect } from '@playwright/test';

/**
 * Audit view (admin/promotions/audit).
 *
 * Verifies:
 *  - The trail renders seeded events on first load.
 *  - Text search filters by promotion / actor / reason.
 *  - Action filter chips narrow the timeline.
 *  - Events recorded elsewhere (via the shared audit lib) show up after reload.
 */

test.describe('Audit view', () => {
  // Mark the onboarding tour as seen before boot so its full-screen backdrop
  // never intercepts pointer events on the audit filter chips / search box.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('hasSeenTour', 'true'));
  });


  test('renders the trail with seeded events', async ({ page }) => {
    await page.goto('/admin/promotions/audit', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Audit Trail/i })).toBeVisible();
    // At least one timeline entry from the seed.
    await expect(page.locator('.entry').first()).toBeVisible();
    const count = await page.locator('.entry').count();
    expect(count).toBeGreaterThan(0);
  });

  test('search narrows the timeline', async ({ page }) => {
    await page.goto('/admin/promotions/audit', { waitUntil: 'networkidle' });
    // Baseline: seed has both Ethiopia and Ghana events.
    const entries = page.locator('.entry');
    await expect(entries.first()).toBeVisible();
    const before = await entries.count();

    // Type character-by-character so at least one keystroke lands after React
    // hydration attaches the controlled input's onChange (a plain fill() can be
    // swallowed pre-hydration, leaving the query empty and the list unfiltered).
    const input = page.getByPlaceholder(/Search by promotion/i);
    await input.click();
    await input.pressSequentially('Ethiopia', { delay: 20 });

    // The list must actually shrink and every remaining entry must match.
    await expect(entries.first()).toBeVisible();
    await expect(async () => {
      const texts = await entries.allInnerTexts();
      expect(texts.length).toBeLessThan(before);
      for (const t of texts) {
        expect(t.toLowerCase()).toContain('ethiopia');
      }
    }).toPass();
  });


  test('filter chips restrict to a single action type', async ({ page }) => {
    await page.goto('/admin/promotions/audit', { waitUntil: 'networkidle' });

    // Wait for the timeline to render before interacting.
    const chip = page.getByRole('button', { name: 'Approvals' });
    await expect(chip).toBeVisible();
    await expect(page.locator('.entry').first()).toBeVisible();

    const tags = page.locator('.entry .tag');

    // The chip's onClick may not be attached until React hydrates, so a single
    // pre-hydration click can be swallowed (leaving the filter at "all" and
    // non-approval tags on screen). Re-click inside the poll until the filter
    // actually takes effect and every remaining tag reads "Approved".
    await expect(async () => {
      await chip.click();
      const n = await tags.count();
      expect(n).toBeGreaterThan(0);
      for (let i = 0; i < n; i++) {
        await expect(tags.nth(i)).toHaveText(/Approved/i);
      }
    }).toPass();
  });


  test('externally recorded events surface on reload', async ({ page }) => {
    await page.goto('/admin/promotions/audit', { waitUntil: 'domcontentloaded' });

    // Inject an event straight into the shared trail store.
    await page.evaluate(() => {
      const key = 'promotion_audit_trail';
      const raw = localStorage.getItem(key);
      const events = raw ? JSON.parse(raw) : [];
      events.unshift({
        id: 'AUD-TEST-XYZ',
        action: 'emergency_stop',
        summary: 'Emergency Stop Playwright Test Promo',
        actor: 'QA Bot',
        actorRole: 'Tester',
        targetId: 'PRM-TEST-999',
        targetName: 'Playwright Test Promo',
        market: 'Kenya',
        reason: 'Injected by automated test.',
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(events));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('.entry').filter({ hasText: 'Playwright Test Promo' }).first(),
    ).toBeVisible();
  });
});
