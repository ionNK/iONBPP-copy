import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

/**
 * Cashback template walkthrough: captures a full-page screenshot of every
 * visible wizard step (Budget and Content hidden for the demo) for
 * docs/cashback-template-flow.md. Also asserts the template prefill so the
 * pictures cannot silently drift from the flow they document.
 * Run with --workers=1: the case shares localStorage and the dev server.
 */

const WIZARD = '/admin/promotions/new';
const DASHBOARD = '/admin/dashboard';
/* Mirrors DRAFT_KEY in src/app/admin/promotions/new/draft.ts. */
const DRAFT_KEY = 'promo_draft_v2';
const OUT_DIR = path.resolve(__dirname, '..', '..', 'docs', 'images', 'cashback-flow');

/* The sidebar and top bar are position: fixed, so a full-page capture taken
 * while scrolled duplicates them. Reset scroll before every shot. */
async function capture(page: Page, name: string, fullPage = true) {
 await page.evaluate(() => window.scrollTo(0, 0));
 await page.waitForTimeout(150);
 await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage });
}

test.describe('Cashback template flow screenshots', () => {
 test.beforeEach(async ({ page }) => {
 await page.setViewportSize({ width: 1280, height: 900 });
 await page.goto(DASHBOARD);
 await page.evaluate((key) => window.localStorage.removeItem(key), DRAFT_KEY);
 });

 test('captures every visible step with the Cashback template applied', async ({ page }) => {
 await page.goto(WIZARD);
 await expect(page.getByText('Step 1 of 6 · Basics')).toBeVisible();
 await capture(page, '01-basics-blank');

 /* Open the template panel and pick Sportsbook Cashback. */
 await page.getByRole('button', { name: 'Use template' }).click();
 await expect(page.getByRole('button', { name: /Sportsbook Cashback/ })).toBeVisible();
 await capture(page, '02-basics-template-panel');

 await page.getByRole('button', { name: /Sportsbook Cashback/ }).click();
 await expect(page.getByText('Template: Sportsbook Cashback')).toBeVisible();
 await expect(page.getByLabel('Promotion type')).toHaveValue('cashback');
 await expect(page.getByLabel('Promotion type')).toBeDisabled();
 await expect(page.getByLabel('Product vertical')).toHaveValue('Sportsbook');

 await page.getByLabel('Promotion name').fill('Money Back (Sportsbook Cashback)');
 await capture(page, '03-basics-template-applied');

 /* Step 2: Qualification, prefilled multibet / one lost leg rules. */
 await page.getByRole('button', { name: 'Continue' }).click();
 await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();
 await expect(page.getByLabel('Bet Type value')).toHaveValue('Multibet');
 await expect(page.getByLabel('Losing Legs value')).toHaveValue('1');
 await capture(page, '04-qualification');

 /* Step 3: Award, cash + tier matrix with a K 1000 cap. */
 await page.getByRole('button', { name: 'Continue' }).click();
 await expect(page.getByText('Step 3 of 6 · Award')).toBeVisible();
 await expect(page.getByRole('radio', { name: 'Cash' })).toBeChecked();
 await expect(page.getByRole('radio', { name: 'Tier matrix' })).toBeChecked();
 await expect(page.getByLabel('Tier 1 odds threshold')).toHaveValue('25');
 await expect(page.getByLabel('Tier 7 multiplier')).toHaveValue('100');
 await capture(page, '05-award');

 /* Step 4: Schedule. Start is required, so set it through the persisted draft
 * (the date picker is a custom control) and reload before capturing. */
 await page.getByRole('button', { name: 'Continue' }).click();
 await expect(page.getByText('Step 4 of 6 · Schedule')).toBeVisible();
 await capture(page, '06-schedule-empty');

 await page.evaluate((key) => {
 const raw = window.localStorage.getItem(key);
 const draft = raw ? JSON.parse(raw) as Record<string, unknown> : {};
 window.localStorage.setItem(key, JSON.stringify({ ...draft, startDate: '2026-10-01', startTime: '09:00', endMode: 'ongoing' }));
 }, DRAFT_KEY);
 await page.goto(WIZARD);
 await expect(page.getByText('Step 4 of 6 · Schedule')).toBeVisible();
 await capture(page, '07-schedule-filled');

 /* Step 5: Notifications, both Money Back messages on. */
 await page.getByRole('button', { name: 'Continue' }).click();
 await expect(page.getByText('Step 5 of 6 · Notifications')).toBeVisible();
 await expect(page.getByLabel('When a player qualifies title')).toHaveValue('Money Back is on its way');
 await expect(page.getByLabel('When a player is awarded title')).toHaveValue('Your Money Back has landed');
 await capture(page, '08-notifications');

 /* Step 6: Review, five sections, no Budget or Content. */
 await page.getByRole('button', { name: 'Continue' }).click();
 await expect(page.getByText('Step 6 of 6 · Review')).toBeVisible();
 const reviewTitles = await page.locator('.np-review-card__head h3').allTextContents();
 expect(reviewTitles).toEqual(['Basics', 'Qualification', 'Award', 'Schedule', 'Notifications']);
 await capture(page, '09-review');

 /* Submit confirmation (maker-checker). Cancel so the mock list is untouched. */
 await page.getByRole('button', { name: 'Submit for approval' }).click();
 await expect(page.getByRole('heading', { name: /Submit .* for approval\?/ })).toBeVisible();
 /* Viewport shot: the modal is fixed-position, so a full-page capture would stretch it. */
 await capture(page, '10-submit-confirm', false);
 await page.getByRole('button', { name: 'Cancel' }).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 });
});
