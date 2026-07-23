import { test, expect } from '@playwright/test';

/**
 * Approvals review (admin/governance → Approvals Queue tab).
 *
 * Verifies:
 *  - Approve / Reject / Request Changes each open the ActionModal comment box.
 *  - Reject & Request Changes require a reason (>= 3 chars) before confirming;
 *    Approve allows an optional note.
 *  - Confirming writes an entry into the shared audit trail (localStorage
 *    `promotion_audit_trail`) which then appears on the /admin/promotions/audit view.
 *  - Approve / Reject remove the item from the queue; Request Changes keeps it.
 */

const AUDIT_KEY = 'promotion_audit_trail';

async function openGovernanceApprovals(page: import('@playwright/test').Page) {
  // Seed super_admin *before* the app boots so approve/reject are enabled on the
  // first render — avoids the reload race where the Approvals Queue tab was
  // clicked before React had hydrated and attached its onClick handler.
  // Seed the role and mark the onboarding tour as seen *before* boot: an active
  // tour renders a full-screen `.tour-backdrop` that intercepts pointer events
  // and blocks clicks on the approval action buttons.
  await page.addInitScript(() => {
    localStorage.setItem('admin_role', 'super_admin');
    localStorage.setItem('hasSeenTour', 'true');
  });

  await page.goto('/admin/governance', { waitUntil: 'networkidle' });
  const tab = page.getByRole('button', { name: /Approvals Queue/i });
  await tab.click();
  await expect(page.getByText('Pending Approvals')).toBeVisible();
}


test.describe('Governance — Approvals review', () => {
  test('Request Changes opens comment box and requires a reason', async ({ page }) => {
    await openGovernanceApprovals(page);

    // First row's Request Changes button.
    await page.locator('.action-btn.changes').first().click();

    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Request Changes')).toBeVisible();

    const confirm = modal.getByRole('button', { name: 'Send Request' });
    // Reason required → disabled until >= 3 chars.
    await expect(confirm).toBeDisabled();

    await modal.locator('textarea.reason').fill('Please tighten the budget cap and resubmit.');
    await expect(confirm).toBeEnabled();
  });

  test('Reject requires a reason and records to the audit trail', async ({ page }) => {
    await openGovernanceApprovals(page);

    const rowCountBefore = await page.locator('table.data-table tbody tr').count();

    await page.locator('.action-btn.reject').first().click();
    const modal = page.locator('.modal');
    await expect(modal.getByText('Reject Request')).toBeVisible();

    const confirm = modal.getByRole('button', { name: 'Reject' });
    await expect(confirm).toBeDisabled();
    await modal.locator('textarea.reason').fill('Exceeds market budget allocation.');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    // Item removed from the queue.
    await expect(page.locator('table.data-table tbody tr')).toHaveCount(rowCountBefore - 1);

    // Audit trail contains a reject event with our reason.
    const audit = await page.evaluate((k) => localStorage.getItem(k), AUDIT_KEY);
    expect(audit).toContain('"action":"reject"');
    expect(audit).toContain('Exceeds market budget allocation.');
  });

  test('Approve allows an optional note and appears on the audit view', async ({ page }) => {
    await openGovernanceApprovals(page);

    await page.locator('.action-btn.approve').first().click();
    const modal = page.locator('.modal');
    await expect(modal.getByText('Approve Request')).toBeVisible();

    // Approve does not require a reason → confirm enabled immediately.
    const confirm = modal.getByRole('button', { name: 'Approve' });
    await expect(confirm).toBeEnabled();
    await modal.locator('textarea.reason').fill('Reviewed mechanics — good to go.');
    await confirm.click();

    // Navigate to the audit view and confirm the approve event shows up.
    await page.goto('/admin/promotions/audit', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.promotion-audit-page__entry').filter({ hasText: 'Approved' }).first()).toBeVisible();
  });

  test('Request Changes keeps the item in the queue', async ({ page }) => {
    await openGovernanceApprovals(page);
    const rowCountBefore = await page.locator('table.data-table tbody tr').count();

    await page.locator('.action-btn.changes').first().click();
    const modal = page.locator('.modal');
    await modal.locator('textarea.reason').fill('Need clearer terms and conditions.');
    await modal.getByRole('button', { name: 'Send Request' }).click();

    // Row count unchanged (request_changes does not remove from queue).
    await expect(page.locator('table.data-table tbody tr')).toHaveCount(rowCountBefore);
  });
});
