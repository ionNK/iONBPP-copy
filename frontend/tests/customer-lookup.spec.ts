import { test, expect } from '@playwright/test';

/**
 * Customer lookup (admin/promotions/customer-lookup).
 *
 * Verifies:
 *  - Support-scoped search by ID and by phone returns the customer record with
 *    promotion status & outcomes.
 *  - No-match query shows the empty state.
 *  - Permission gating: a role without `customer.lookup` sees Access Restricted.
 */

async function openLookup(page: import('@playwright/test').Page, role = 'support') {
  // Seed the role *before* the app boots so the client reads it on first render,
  // avoiding a denied→allowed flip (and the layout shift that made the Search
  // button briefly unstable for Playwright's actionability checks).
    await page.addInitScript((r) => {
      localStorage.setItem('admin_role', r);
      localStorage.setItem('hasSeenTour', 'true');
    }, role);

  await page.goto('/admin/promotions/customer-lookup', { waitUntil: 'networkidle' });
}

// The Search button is disabled until the controlled `query` state is non-empty.
// `input.fill()` can land before React finishes hydrating and attaches its
// onChange handler, leaving the state at "" and the button stuck disabled.
// `pressSequentially` types character-by-character, so at least one keystroke is
// guaranteed to fire after hydration; we then wait for the button to enable.
async function search(page: import('@playwright/test').Page, q: string) {
  const input = page.getByPlaceholder(/Enter phone/i);
  await input.click();
  await input.fill('');
  await input.pressSequentially(q, { delay: 20 });
  const btn = page.getByRole('button', { name: 'Search' });
  await expect(btn).toBeEnabled();
  await btn.click();
}




test.describe('Customer lookup', () => {
  test('search by customer ID returns record with promotion history', async ({ page }) => {
    await openLookup(page);

    await search(page, 'CUS-100482');

    // Profile card + promotion history section render.
    await expect(page.locator('.card')).toBeVisible();

    await expect(page.locator('.section')).toContainText(/Promotion History/i);
    await expect(page.locator('.promo').first()).toBeVisible();
  });

  test('search by phone number resolves a customer', async ({ page }) => {
    await openLookup(page);

    // Phone / customer pair are fixtures from src/data/customerLookup.ts.
    // Searching by the phone must resolve the same customer as the ID does.
    const phone = '+254712345678';
    const expectedId = 'CUS-100482';
    const expectedName = 'James Mwangi';

    await search(page, phone);

    const card = page.locator('.card');
    await expect(card).toBeVisible();
    await expect(card).toContainText(expectedName);
    await expect(card).toContainText(expectedId);
  });


  test('unknown query shows empty state', async ({ page }) => {
    await openLookup(page);
    await search(page, 'CUS-000000');
    await expect(page.locator('.empty')).toContainText(/No customer found/i);

  });

  test('permission gating blocks roles without customer.lookup', async ({ page }) => {
    await openLookup(page, 'approver'); // approver lacks customer.lookup
    await expect(page.locator('.denied')).toBeVisible();
    await expect(page.locator('.denied')).toContainText(/Access Restricted/i);
  });
});
