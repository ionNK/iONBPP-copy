import { test, expect } from '@playwright/test';

/**
 * Operational controls (promotion detail page → OperationalControls component).
 *
 * Verifies:
 *  - Pause / End / Emergency Stop each open the ActionModal requiring a mandatory reason.
 *  - Emergency Stop additionally requires typing the "STOP" confirmation phrase.
 *  - A successful action transitions the promotion state (badge updates) and records
 *    an entry to the shared audit trail.
 *  - Permission gating disables controls for roles lacking the permission.
 *
 * PRM-2024-001 (Ethiopia Acca Insurance) is an *active* seed promotion, so Pause/End/
 * Emergency Stop controls are all visible.
 */

const AUDIT_KEY = 'promotion_audit_trail';

async function openDetail(page: import('@playwright/test').Page, role = 'super_admin') {
  // Mark the onboarding tour as seen before boot — an active tour renders a
  // full-screen `.tour-backdrop` that intercepts pointer events and blocks the
  // operational-control buttons.
  await page.addInitScript(() => localStorage.setItem('hasSeenTour', 'true'));
  await page.goto('/admin/promotions/PRM-2024-001', { waitUntil: 'domcontentloaded' });
  await page.evaluate((r) => localStorage.setItem('admin_role', r), role);
  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.locator('.oc-btn').first()).toBeVisible();
}

test.describe('Operational controls', () => {
  test('Pause requires a reason and records to the audit trail', async ({ page }) => {
    await openDetail(page);

    await page.locator('.oc-btn', { hasText: 'Pause' }).click();
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    const confirm = modal.locator('.modal-actions .btn').last();
    await expect(confirm).toBeDisabled(); // reason mandatory
    await modal.locator('textarea.reason').fill('Pausing to review budget burn rate.');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    // State transition → badge now shows paused.
    await expect(page.locator('.status-badge')).toHaveText(/paused/i);

    const audit = await page.evaluate((k) => localStorage.getItem(k), AUDIT_KEY);
    expect(audit).toContain('"action":"pause"');
    expect(audit).toContain('Pausing to review budget burn rate.');
  });

  test('Emergency Stop requires the STOP confirmation phrase', async ({ page }) => {
    await openDetail(page);

    await page.locator('.oc-btn', { hasText: 'Emergency Stop' }).click();
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    const confirm = modal.locator('.modal-actions .btn').last();

    // Reason alone is not enough — the STOP phrase is still required.
    await modal.locator('textarea.reason').fill('Suspected coordinated abuse detected.');
    await expect(confirm).toBeDisabled();

    await modal.locator('input.phrase').fill('STOP');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page.locator('.status-badge')).toHaveText(/ended/i);

    const audit = await page.evaluate((k) => localStorage.getItem(k), AUDIT_KEY);
    expect(audit).toContain('"action":"emergency_stop"');
  });

  test('controls are disabled for roles lacking permission', async ({ page }) => {
    // 'support' has customer.lookup but not promotion.pause/end/etc.
    await openDetail(page, 'support');
    const buttons = page.locator('.oc-btn');
    const n = await buttons.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await expect(buttons.nth(i)).toBeDisabled();
    }
  });

  test('ended promotion exposes no operational controls', async ({ page }) => {
    await openDetail(page);
    // End it first.
    await page.locator('.oc-btn', { hasText: 'End' }).click();
    const modal = page.locator('.modal');
    await modal.locator('textarea.reason').fill('Campaign complete — ending as scheduled.');
    await modal.locator('.modal-actions .btn').last().click();

    await expect(page.locator('.status-badge')).toHaveText(/ended/i);
    await expect(page.locator('.oc-ended')).toBeVisible();
  });
});
