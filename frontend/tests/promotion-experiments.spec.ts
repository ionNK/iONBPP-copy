import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

/**
 * Promotions → Experiments (PROTOTYPE, mock data, demo flag `features.experiments`).
 * No network mocking: every value comes from src/lib/experiments/mockExperiments.ts
 * and the PR-002-B seed in src/lib/promotions.ts. Run with --workers=1: the
 * cases share the dev server and the promotions list reads localStorage.
 */

const EXPERIMENTS = '/admin/promotions/experiments';
const PROMOTIONS = '/admin/promotions';

const num = (text: string) => Number(text.replace(/[^0-9.-]/g, ''));

/* Unity Checkbox hides the native input under its label; click the label, assert on the input. */
const armCheckbox = (modal: Locator, promoId: string) => modal.locator(`[data-promo-id="${promoId}"] input[type="checkbox"]`);
const toggleArm = (modal: Locator, promoId: string) => modal.locator(`[data-promo-id="${promoId}"] label.ui-checkbox`).click();

test.describe('Promotion experiments', () => {
  test('1. sidebar shows Experiments after Approvals and the list renders the three seeds', async ({ page }) => {
    await page.goto(EXPERIMENTS);

    /* Both items carry the "TBC" pill, so match on the label span rather than the full link text. */
    const promotionsLinks = page.locator('nav a', { has: page.locator('.ds-sidenav__label', { hasText: /^(Approvals|Experiments)$/ }) });
    await expect(promotionsLinks.locator('.ds-sidenav__label')).toHaveText(['Approvals', 'Experiments']);
    await expect(promotionsLinks.locator('.ds-sidenav__pill')).toHaveText(['TBC', 'TBC']);
    await expect(page.getByRole('link', { name: 'Experiments' })).toHaveAttribute('href', EXPERIMENTS);

    const rows = page.getByTestId('experiment-row');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('EXP-001');
    await expect(rows.nth(0)).toContainText('Money Back (Sportsbook Cashback) · Money Back (Sportsbook Cashback) B');
    await expect(rows.nth(0)).toContainText('10%');
    await expect(rows.nth(0)).toContainText('Running');
    await expect(rows.nth(0)).toContainText('2026-09-01 → 2026-10-31');
    await expect(rows.nth(1)).toContainText('EXP-002');
    await expect(rows.nth(1)).toContainText('15%');
    await expect(rows.nth(1)).toContainText('Completed');
    await expect(rows.nth(2)).toContainText('EXP-003');
    await expect(rows.nth(2)).toContainText('Draft');
    await expect(rows.nth(2)).toContainText('Not scheduled');
  });

  test('2. EXP-001 results are directional: B has higher uptake but lower 7-day repeat', async ({ page }) => {
    await page.goto(EXPERIMENTS);
    await page.getByTestId('experiment-row').nth(0).click();

    const detail = page.getByTestId('experiment-detail');
    await expect(detail.locator('.promo-drawer__panel')).toBeVisible();
    await expect(detail.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await expect(detail).toContainText('Repeat rate 7d');
    await expect(detail).toContainText('Holdout');

    await detail.getByRole('tab', { name: 'Results' }).click();
    const arms = detail.getByTestId('experiment-result-arm');
    await expect(arms).toHaveCount(2);

    const a = await arms.nth(0).locator('td').allInnerTexts();
    const b = await arms.nth(1).locator('td').allInnerTexts();
    expect(a[0]).toBe('Money Back (Sportsbook Cashback)');
    expect(b[0]).toBe('Money Back (Sportsbook Cashback) B');
    /* Uptake (qualified, awarded): B higher. Repeat rate 7d: B lower. */
    expect(num(b[2])).toBeGreaterThan(num(a[2]));
    expect(num(b[3])).toBeGreaterThan(num(a[3]));
    expect(num(b[4])).toBeLessThan(num(a[4]));
    await expect(arms.nth(0)).toContainText('Directional');
    await expect(arms.nth(1)).toContainText('Directional');
    await expect(detail.getByTestId('experiment-result-holdout')).toContainText('Baseline');
    /* Counts and rates only — no currency. */
    await expect(detail.getByTestId('experiment-results')).not.toContainText(/ZMW|K\s?\d/);
  });

  test('3. EXP-002 is completed with a significant positive lift', async ({ page }) => {
    await page.goto(EXPERIMENTS);
    await page.getByTestId('experiment-row').nth(1).click();
    const detail = page.getByTestId('experiment-detail');
    await detail.getByRole('tab', { name: 'Results' }).click();

    const arm = detail.getByTestId('experiment-result-arm');
    await expect(arm).toHaveCount(1);
    await expect(arm).toContainText('First Deposit Boost');
    await expect(arm).toContainText('+11.2%');
    await expect(arm).toContainText('Significant');
  });

  test('4. EXP-003 draft has no results and shows the empty state', async ({ page }) => {
    await page.goto(EXPERIMENTS);
    await page.getByTestId('experiment-row').nth(2).click();
    const detail = page.getByTestId('experiment-detail');
    await expect(detail).toContainText('Draft');
    await detail.getByRole('tab', { name: 'Results' }).click();
    await expect(detail.getByTestId('experiment-results-empty')).toContainText('No results yet');
    await expect(detail.getByTestId('experiment-results')).toHaveCount(0);
  });

  test('5. create: only active arms, same type + vertical after the first pick, running arms disabled', async ({ page }) => {
    await page.goto(EXPERIMENTS);
    await page.getByRole('button', { name: 'New experiment' }).click();
    const modal = page.getByTestId('experiment-create');
    await expect(modal.locator('.promo-modal__card')).toBeVisible();

    const options = modal.getByTestId('experiment-arm-option');
    /* Six active promotions incl. PR-002-B; scheduled/draft/expired rows never appear. */
    await expect(options).toHaveCount(6);
    await expect(modal.locator('[data-promo-id="PR-004"]')).toHaveCount(0);
    await expect(modal.locator('[data-promo-id="PR-012"]')).toHaveCount(0);

    /* PR-002 / PR-002-B are already in Running EXP-001 → disabled and tagged. */
    await expect(armCheckbox(modal, 'PR-002')).toBeDisabled();
    await expect(armCheckbox(modal, 'PR-002-B')).toBeDisabled();
    await expect(modal.locator('[data-promo-id="PR-002"]')).toContainText('In experiment EXP-001');

    /* Picking Cashout Insurance (Cashback · Bet Insurance, Sportsbook) narrows the picker to that combo. */
    await toggleArm(modal, 'PR-011');
    await expect(armCheckbox(modal, 'PR-011')).toBeChecked();
    await expect(options).toHaveCount(1);
    await expect(modal.locator('[data-promo-id="PR-011"]')).toBeVisible();
    await expect(modal.locator('[data-promo-id="PR-007"]')).toHaveCount(0);

    /* Unchecking restores the full active set. */
    await toggleArm(modal, 'PR-011');
    await expect(armCheckbox(modal, 'PR-011')).not.toBeChecked();
    await expect(options).toHaveCount(6);
  });

  test('6. create: allocations plus holdout must total 100 and holdout is capped at 50', async ({ page }) => {
    await page.goto(EXPERIMENTS);
    await page.getByRole('button', { name: 'New experiment' }).click();
    const modal = page.getByTestId('experiment-create');

    await modal.getByLabel('Name').fill('Free spins cadence');
    await modal.getByLabel('Hypothesis').fill('Midweek free spins improve repeat rate.');
    await toggleArm(modal, 'PR-007');
    await expect(armCheckbox(modal, 'PR-007')).toBeChecked();
    await modal.getByLabel('Midweek Free Spins allocation %').fill('80');
    await modal.getByLabel('Start').fill('2026-11-01');
    await modal.getByLabel('End').fill('2026-11-30');

    await expect(modal.getByTestId('experiment-allocation-total')).toHaveText('Total 80%');
    await modal.getByRole('button', { name: 'Create draft' }).click();
    await expect(modal.getByRole('alert')).toContainText('must total 100% (currently 80%)');
    await expect(page.getByTestId('experiment-row')).toHaveCount(3);

    /* Holdout above the cap is rejected even when the total is 100. */
    await modal.getByRole('switch', { name: 'Holdout' }).click();
    await modal.getByLabel('Holdout %').fill('60');
    await modal.getByLabel('Midweek Free Spins allocation %').fill('40');
    await expect(modal.getByTestId('experiment-allocation-total')).toHaveText('Total 100%');
    await modal.getByRole('button', { name: 'Create draft' }).click();
    await expect(modal.getByRole('alert')).toContainText('Holdout must be between 0% and 50%');

    /* Valid: 80 + 20 holdout. */
    await modal.getByLabel('Holdout %').fill('20');
    await modal.getByLabel('Midweek Free Spins allocation %').fill('80');
    await modal.getByRole('button', { name: 'Create draft' }).click();
    await expect(page.getByTestId('experiment-create')).toHaveCount(0);

    const rows = page.getByTestId('experiment-row');
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText('EXP-004');
    await expect(rows.nth(0)).toContainText('Free spins cadence');
    await expect(rows.nth(0)).toContainText('20%');
    await expect(rows.nth(0)).toContainText('Draft');
    await expect(rows.nth(0)).toContainText('2026-11-01 → 2026-11-30');
  });

  test('7. promotions list tags running arms (PR-002, PR-002-B) and leaves PR-007 untagged', async ({ page }) => {
    await page.goto(PROMOTIONS);
    const table = page.locator('table.promo-table');
    await expect(table).toBeVisible();

    const rowFor = (id: string) => table.locator('tr', { has: page.locator('.promo-id', { hasText: new RegExp(`^${id}$`) }) });
    await expect(rowFor('PR-002').getByTestId('promo-experiment-tag')).toHaveText('In experiment EXP-001');
    await expect(rowFor('PR-002-B').getByTestId('promo-experiment-tag')).toHaveText('In experiment EXP-001');
    await expect(rowFor('PR-002-B')).toContainText('Money Back (Sportsbook Cashback) B');
    await expect(rowFor('PR-007').getByTestId('promo-experiment-tag')).toHaveCount(0);
    /* Completed (EXP-002) and Draft (EXP-003) arms are not tagged. */
    await expect(rowFor('PR-006').getByTestId('promo-experiment-tag')).toHaveCount(0);
    await expect(page.getByTestId('promo-experiment-tag')).toHaveCount(2);
  });
});
