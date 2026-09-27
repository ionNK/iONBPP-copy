# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend/tests/promotion-cashback-fields.spec.ts >> 100% Cash Stake Back conditions and reward fields >> persists qualifying conditions, renders both reward-cap summaries, and resumes PR-002
- Location: frontend/tests/promotion-cashback-fields.spec.ts:52:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/admin/dashboard", waiting until "load"

```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * 100% Cash Stake Back: additive qualifying-condition / reward fields.
  5   |  *
  6   |  * PR-002 is an active PROMO_SEED record, not a stored wizard draft, so its
  7   |  * `?ref=` route normally starts a new promotion. This spec deliberately
  8   |  * stores the Cashback-template working copy under PR-002 in the draft store;
  9   |  * that exercises the supported save/resume route without changing PROMO_SEED.
  10  |  */
  11  | const WIZARD = '/admin/promotions/new';
  12  | const DASHBOARD = '/admin/dashboard';
  13  | const SCRATCH_KEY = 'promo_draft_v2';
  14  | const DRAFTS_KEY = 'promo-drafts:v1';
  15  | 
  16  | async function resetStorage(page: Page) {
> 17  |   await page.goto(DASHBOARD);
      |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  18  |   await page.evaluate(([scratch, drafts]) => {
  19  |     window.localStorage.removeItem(scratch);
  20  |     window.localStorage.removeItem(drafts);
  21  |   }, [SCRATCH_KEY, DRAFTS_KEY] as const);
  22  | }
  23  | 
  24  | async function continueToReview(page: Page) {
  25  |   await page.getByRole('button', { name: 'Continue' }).click();
  26  |   await expect(page.getByText('Step 4 of 6 · Schedule')).toBeVisible();
  27  | 
  28  |   /* Dates use the project custom picker. Add valid template schedule data to
  29  |    * the autosaved draft, then reload through the normal sanitising restore. */
  30  |   await page.evaluate((key) => {
  31  |     const raw = window.localStorage.getItem(key);
  32  |     const draft = raw ? JSON.parse(raw) as Record<string, unknown> : {};
  33  |     window.localStorage.setItem(key, JSON.stringify({
  34  |       ...draft,
  35  |       startDate: '2026-10-01',
  36  |       startTime: '09:00',
  37  |       endMode: 'ongoing',
  38  |     }));
  39  |   }, SCRATCH_KEY);
  40  |   await page.goto(WIZARD);
  41  |   await page.getByRole('button', { name: 'Continue' }).click();
  42  |   await expect(page.getByText('Step 5 of 6 · Notifications')).toBeVisible();
  43  |   await page.getByRole('button', { name: 'Continue' }).click();
  44  |   await expect(page.getByText('Step 6 of 6 · Review')).toBeVisible();
  45  | }
  46  | 
  47  | test.describe('100% Cash Stake Back conditions and reward fields', () => {
  48  |   test.beforeEach(async ({ page }) => {
  49  |     await resetStorage(page);
  50  |   });
  51  | 
  52  |   test('persists qualifying conditions, renders both reward-cap summaries, and resumes PR-002', async ({ page }) => {
  53  |     await page.goto(WIZARD);
  54  |     await page.getByRole('button', { name: 'Use template' }).click();
  55  |     await page.getByRole('button', { name: /Sportsbook Cashback/ }).click();
  56  |     await page.getByLabel('Promotion name').fill('100% Cash Stake Back');
  57  | 
  58  |     await page.getByRole('button', { name: 'Continue' }).click();
  59  |     await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();
  60  | 
  61  |     /* Stake funding and Selections are trigger conditions picked from the BET group. */
  62  |     await page.getByRole('button', { name: 'Add condition' }).click();
  63  |     await page.getByRole('button', { name: 'Stake Funding', exact: true }).click();
  64  |     await page.getByLabel('Stake Funding value').selectOption('Cash');
  65  | 
  66  |     await page.getByRole('button', { name: 'Add condition' }).click();
  67  |     await page.getByRole('button', { name: 'Selections', exact: true }).click();
  68  |     await page.getByLabel('Operator for Selections').selectOption('>=');
  69  |     await page.getByLabel('Selections value').fill('5');
  70  | 
  71  |     /* Combinable sits after "Who's eligible" and defaults to off. */
  72  |     await expect(page.getByLabel('Combinable with other offers')).toHaveAttribute('aria-checked', 'false');
  73  |     await page.getByLabel('Combinable with other offers').click();
  74  | 
  75  |     await page.getByRole('button', { name: 'Continue' }).click();
  76  |     await expect(page.getByText('Step 3 of 6 · Award')).toBeVisible();
  77  |     await page.getByRole('radio', { name: 'Percentage of stake' }).check();
  78  |     await page.getByLabel('Percentage of stake returned').fill('100');
  79  |     await page.getByLabel('Max awards per day').fill('1');
  80  |     await page.getByLabel('Maximum value per award in ZMW').fill('10000');
  81  | 
  82  |     await continueToReview(page);
  83  |     await expect(page.getByText(/Stake Funding = Cash/)).toBeVisible();
  84  |     await expect(page.getByText(/Selections >= 5/)).toBeVisible();
  85  |     await expect(page.getByText('100% of stake, up to 10,000')).toBeVisible();
  86  |     await expect(page.getByText('Combinable with other offers')).toBeVisible();
  87  |     await expect(page.getByText('Yes', { exact: true })).toBeVisible();
  88  | 
  89  |     /* Clear the cap to cover the explicit no-cap presentation. */
  90  |     await page.locator('.np-review-card__head').filter({ hasText: 'Award' }).getByRole('button', { name: 'Edit' }).click();
  91  |     await expect(page.getByText('Step 3 of 6 · Award')).toBeVisible();
  92  |     await page.getByLabel('Maximum value per award in ZMW').fill('');
  93  |     await continueToReview(page);
  94  |     await expect(page.getByText('100% of stake, no cap')).toBeVisible();
  95  | 
  96  |     /* Store the real working copy under the requested active-promotion ref.
  97  |      * This is intentionally draft-store-only: PROMO_SEED remains untouched. */
  98  |     await page.evaluate(([scratchKey, draftsKey]) => {
  99  |       const raw = window.localStorage.getItem(scratchKey);
  100 |       if (!raw) throw new Error('Expected an autosaved Cashback draft.');
  101 |       const draft = JSON.parse(raw) as Record<string, unknown>;
  102 |       const saved = {
  103 |         ...draft,
  104 |         reference: 'PR-002',
  105 |         status: 'draft',
  106 |         lastStep: 6,
  107 |         lastStepId: 'review',
  108 |         savedAt: '2026-09-25T12:00:00.000Z',
  109 |       };
  110 |       window.localStorage.setItem(draftsKey, JSON.stringify({ 'PR-002': saved }));
  111 |     }, [SCRATCH_KEY, DRAFTS_KEY] as const);
  112 | 
  113 |     await page.goto(`${WIZARD}?ref=PR-002`);
  114 |     await expect(page.getByText(/Resumed PR-002 from step 6 of 6/)).toBeVisible();
  115 |     await expect(page.getByText(/Stake Funding = Cash/)).toBeVisible();
  116 |     await expect(page.getByText(/Selections >= 5/)).toBeVisible();
  117 |     await expect(page.getByText('100% of stake, no cap')).toBeVisible();
```