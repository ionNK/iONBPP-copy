# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend/tests/promotion-experiments.spec.ts >> Promotion experiments >> 3. EXP-002 is completed with a significant positive lift
- Location: frontend/tests/promotion-experiments.spec.ts:67:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/admin/promotions/experiments", waiting until "load"

```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Promotions → Experiments (PROTOTYPE, mock data, demo flag `features.experiments`).
  5   |  * No network mocking: every value comes from src/lib/experiments/mockExperiments.ts
  6   |  * and the PR-002-B seed in src/lib/promotions.ts. Run with --workers=1: the
  7   |  * cases share the dev server and the promotions list reads localStorage.
  8   |  */
  9   | 
  10  | const EXPERIMENTS = '/admin/promotions/experiments';
  11  | const PROMOTIONS = '/admin/promotions';
  12  | 
  13  | const num = (text: string) => Number(text.replace(/[^0-9.-]/g, ''));
  14  | 
  15  | test.describe('Promotion experiments', () => {
  16  |   test('1. sidebar shows Experiments after Approvals and the list renders the three seeds', async ({ page }) => {
  17  |     await page.goto(EXPERIMENTS);
  18  | 
  19  |     const promotionsLinks = page.locator('nav a', { hasText: /^(Approvals|Experiments)$/ });
  20  |     await expect(promotionsLinks).toHaveText(['Approvals', 'Experiments']);
  21  |     await expect(page.getByRole('link', { name: 'Experiments' })).toHaveAttribute('href', EXPERIMENTS);
  22  | 
  23  |     const rows = page.getByTestId('experiment-row');
  24  |     await expect(rows).toHaveCount(3);
  25  |     await expect(rows.nth(0)).toContainText('EXP-001');
  26  |     await expect(rows.nth(0)).toContainText('Money Back (Sportsbook Cashback) · Money Back (Sportsbook Cashback) B');
  27  |     await expect(rows.nth(0)).toContainText('10%');
  28  |     await expect(rows.nth(0)).toContainText('Running');
  29  |     await expect(rows.nth(0)).toContainText('2026-09-01 → 2026-10-31');
  30  |     await expect(rows.nth(1)).toContainText('EXP-002');
  31  |     await expect(rows.nth(1)).toContainText('15%');
  32  |     await expect(rows.nth(1)).toContainText('Completed');
  33  |     await expect(rows.nth(2)).toContainText('EXP-003');
  34  |     await expect(rows.nth(2)).toContainText('Draft');
  35  |     await expect(rows.nth(2)).toContainText('Not scheduled');
  36  |   });
  37  | 
  38  |   test('2. EXP-001 results are directional: B has higher uptake but lower 7-day repeat', async ({ page }) => {
  39  |     await page.goto(EXPERIMENTS);
  40  |     await page.getByTestId('experiment-row').nth(0).click();
  41  | 
  42  |     const detail = page.getByTestId('experiment-detail');
  43  |     await expect(detail).toBeVisible();
  44  |     await expect(detail.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  45  |     await expect(detail).toContainText('Repeat rate 7d');
  46  |     await expect(detail).toContainText('Holdout');
  47  | 
  48  |     await detail.getByRole('tab', { name: 'Results' }).click();
  49  |     const arms = detail.getByTestId('experiment-result-arm');
  50  |     await expect(arms).toHaveCount(2);
  51  | 
  52  |     const a = await arms.nth(0).locator('td').allInnerTexts();
  53  |     const b = await arms.nth(1).locator('td').allInnerTexts();
  54  |     expect(a[0]).toBe('Money Back (Sportsbook Cashback)');
  55  |     expect(b[0]).toBe('Money Back (Sportsbook Cashback) B');
  56  |     /* Uptake (qualified, awarded): B higher. Repeat rate 7d: B lower. */
  57  |     expect(num(b[2])).toBeGreaterThan(num(a[2]));
  58  |     expect(num(b[3])).toBeGreaterThan(num(a[3]));
  59  |     expect(num(b[4])).toBeLessThan(num(a[4]));
  60  |     await expect(arms.nth(0)).toContainText('Directional');
  61  |     await expect(arms.nth(1)).toContainText('Directional');
  62  |     await expect(detail.getByTestId('experiment-result-holdout')).toContainText('Baseline');
  63  |     /* Counts and rates only — no currency. */
  64  |     await expect(detail.getByTestId('experiment-results')).not.toContainText(/ZMW|K\s?\d/);
  65  |   });
  66  | 
  67  |   test('3. EXP-002 is completed with a significant positive lift', async ({ page }) => {
> 68  |     await page.goto(EXPERIMENTS);
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  69  |     await page.getByTestId('experiment-row').nth(1).click();
  70  |     const detail = page.getByTestId('experiment-detail');
  71  |     await detail.getByRole('tab', { name: 'Results' }).click();
  72  | 
  73  |     const arm = detail.getByTestId('experiment-result-arm');
  74  |     await expect(arm).toHaveCount(1);
  75  |     await expect(arm).toContainText('First Deposit Boost');
  76  |     await expect(arm).toContainText('+11.2%');
  77  |     await expect(arm).toContainText('Significant');
  78  |   });
  79  | 
  80  |   test('4. EXP-003 draft has no results and shows the empty state', async ({ page }) => {
  81  |     await page.goto(EXPERIMENTS);
  82  |     await page.getByTestId('experiment-row').nth(2).click();
  83  |     const detail = page.getByTestId('experiment-detail');
  84  |     await expect(detail).toContainText('Draft');
  85  |     await detail.getByRole('tab', { name: 'Results' }).click();
  86  |     await expect(detail.getByTestId('experiment-results-empty')).toContainText('No results yet');
  87  |     await expect(detail.getByTestId('experiment-results')).toHaveCount(0);
  88  |   });
  89  | 
  90  |   test('5. create: only active arms, same type + vertical after the first pick, running arms disabled', async ({ page }) => {
  91  |     await page.goto(EXPERIMENTS);
  92  |     await page.getByRole('button', { name: 'New experiment' }).click();
  93  |     const modal = page.getByTestId('experiment-create');
  94  |     await expect(modal).toBeVisible();
  95  | 
  96  |     const options = modal.getByTestId('experiment-arm-option');
  97  |     /* Six active promotions incl. PR-002-B; scheduled/draft/expired rows never appear. */
  98  |     await expect(options).toHaveCount(6);
  99  |     await expect(modal.locator('[data-promo-id="PR-004"]')).toHaveCount(0);
  100 |     await expect(modal.locator('[data-promo-id="PR-012"]')).toHaveCount(0);
  101 | 
  102 |     /* PR-002 / PR-002-B are already in Running EXP-001 → disabled and tagged. */
  103 |     await expect(modal.locator('[data-promo-id="PR-002"] input[type="checkbox"]')).toBeDisabled();
  104 |     await expect(modal.locator('[data-promo-id="PR-002-B"] input[type="checkbox"]')).toBeDisabled();
  105 |     await expect(modal.locator('[data-promo-id="PR-002"]')).toContainText('In experiment EXP-001');
  106 | 
  107 |     /* Picking Cashout Insurance (Cashback · Bet Insurance, Sportsbook) narrows the picker to that combo. */
  108 |     await modal.locator('[data-promo-id="PR-011"] input[type="checkbox"]').check();
  109 |     await expect(options).toHaveCount(1);
  110 |     await expect(modal.locator('[data-promo-id="PR-011"]')).toBeVisible();
  111 |     await expect(modal.locator('[data-promo-id="PR-007"]')).toHaveCount(0);
  112 | 
  113 |     /* Unchecking restores the full active set. */
  114 |     await modal.locator('[data-promo-id="PR-011"] input[type="checkbox"]').uncheck();
  115 |     await expect(options).toHaveCount(6);
  116 |   });
  117 | 
  118 |   test('6. create: allocations plus holdout must total 100 and holdout is capped at 50', async ({ page }) => {
  119 |     await page.goto(EXPERIMENTS);
  120 |     await page.getByRole('button', { name: 'New experiment' }).click();
  121 |     const modal = page.getByTestId('experiment-create');
  122 | 
  123 |     await modal.getByLabel('Name').fill('Free spins cadence');
  124 |     await modal.getByLabel('Hypothesis').fill('Midweek free spins improve repeat rate.');
  125 |     await modal.locator('[data-promo-id="PR-007"] input[type="checkbox"]').check();
  126 |     await modal.getByLabel('Midweek Free Spins allocation %').fill('80');
  127 |     await modal.getByLabel('Start').fill('2026-11-01');
  128 |     await modal.getByLabel('End').fill('2026-11-30');
  129 | 
  130 |     await expect(modal.getByTestId('experiment-allocation-total')).toHaveText('Total 80%');
  131 |     await modal.getByRole('button', { name: 'Create draft' }).click();
  132 |     await expect(modal.getByRole('alert')).toContainText('must total 100% (currently 80%)');
  133 |     await expect(page.getByTestId('experiment-row')).toHaveCount(3);
  134 | 
  135 |     /* Holdout above the cap is rejected even when the total is 100. */
  136 |     await modal.getByRole('switch', { name: 'Holdout' }).click();
  137 |     await modal.getByLabel('Holdout %').fill('60');
  138 |     await modal.getByLabel('Midweek Free Spins allocation %').fill('40');
  139 |     await expect(modal.getByTestId('experiment-allocation-total')).toHaveText('Total 100%');
  140 |     await modal.getByRole('button', { name: 'Create draft' }).click();
  141 |     await expect(modal.getByRole('alert')).toContainText('Holdout must be between 0% and 50%');
  142 | 
  143 |     /* Valid: 80 + 20 holdout. */
  144 |     await modal.getByLabel('Holdout %').fill('20');
  145 |     await modal.getByLabel('Midweek Free Spins allocation %').fill('80');
  146 |     await modal.getByRole('button', { name: 'Create draft' }).click();
  147 |     await expect(modal).toHaveCount(0);
  148 | 
  149 |     const rows = page.getByTestId('experiment-row');
  150 |     await expect(rows).toHaveCount(4);
  151 |     await expect(rows.nth(0)).toContainText('EXP-004');
  152 |     await expect(rows.nth(0)).toContainText('Free spins cadence');
  153 |     await expect(rows.nth(0)).toContainText('20%');
  154 |     await expect(rows.nth(0)).toContainText('Draft');
  155 |     await expect(rows.nth(0)).toContainText('2026-11-01 → 2026-11-30');
  156 |   });
  157 | 
  158 |   test('7. promotions list tags running arms (PR-002, PR-002-B) and leaves PR-007 untagged', async ({ page }) => {
  159 |     await page.goto(PROMOTIONS);
  160 |     const table = page.locator('table.promo-table');
  161 |     await expect(table).toBeVisible();
  162 | 
  163 |     const rowFor = (id: string) => table.locator('tr', { has: page.locator('.promo-id', { hasText: new RegExp(`^${id}$`) }) });
  164 |     await expect(rowFor('PR-002').getByTestId('promo-experiment-tag')).toHaveText('In experiment EXP-001');
  165 |     await expect(rowFor('PR-002-B').getByTestId('promo-experiment-tag')).toHaveText('In experiment EXP-001');
  166 |     await expect(rowFor('PR-002-B')).toContainText('Money Back (Sportsbook Cashback) B');
  167 |     await expect(rowFor('PR-007').getByTestId('promo-experiment-tag')).toHaveCount(0);
  168 |     /* Completed (EXP-002) and Draft (EXP-003) arms are not tagged. */
```