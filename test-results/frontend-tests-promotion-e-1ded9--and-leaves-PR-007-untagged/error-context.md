# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend/tests/promotion-experiments.spec.ts >> Promotion experiments >> 7. promotions list tags running arms (PR-002, PR-002-B) and leaves PR-007 untagged
- Location: frontend/tests/promotion-experiments.spec.ts:158:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/admin/promotions", waiting until "load"

```

# Test source

```ts
  59  |     expect(num(b[4])).toBeLessThan(num(a[4]));
  60  |     await expect(arms.nth(0)).toContainText('Directional');
  61  |     await expect(arms.nth(1)).toContainText('Directional');
  62  |     await expect(detail.getByTestId('experiment-result-holdout')).toContainText('Baseline');
  63  |     /* Counts and rates only — no currency. */
  64  |     await expect(detail.getByTestId('experiment-results')).not.toContainText(/ZMW|K\s?\d/);
  65  |   });
  66  | 
  67  |   test('3. EXP-002 is completed with a significant positive lift', async ({ page }) => {
  68  |     await page.goto(EXPERIMENTS);
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
> 159 |     await page.goto(PROMOTIONS);
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  160 |     const table = page.locator('table.promo-table');
  161 |     await expect(table).toBeVisible();
  162 | 
  163 |     const rowFor = (id: string) => table.locator('tr', { has: page.locator('.promo-id', { hasText: new RegExp(`^${id}$`) }) });
  164 |     await expect(rowFor('PR-002').getByTestId('promo-experiment-tag')).toHaveText('In experiment EXP-001');
  165 |     await expect(rowFor('PR-002-B').getByTestId('promo-experiment-tag')).toHaveText('In experiment EXP-001');
  166 |     await expect(rowFor('PR-002-B')).toContainText('Money Back (Sportsbook Cashback) B');
  167 |     await expect(rowFor('PR-007').getByTestId('promo-experiment-tag')).toHaveCount(0);
  168 |     /* Completed (EXP-002) and Draft (EXP-003) arms are not tagged. */
  169 |     await expect(rowFor('PR-006').getByTestId('promo-experiment-tag')).toHaveCount(0);
  170 |     await expect(page.getByTestId('promo-experiment-tag')).toHaveCount(2);
  171 |   });
  172 | });
  173 | 
```