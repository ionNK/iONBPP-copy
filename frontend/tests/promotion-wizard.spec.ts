import { expect, test } from '@playwright/test';

/**
 * Promotions → Create a promotion wizard (PROTOTYPE, mock data).
 * Guards the feature-flag gating in src/config/features.ts: with
 * `features.budgets` and `features.content` both false the stepper shows six
 * steps with no numbering gap, Back/Continue skip the hidden steps, the Review
 * step carries no Content summary, and content fields on a saved draft survive.
 * Run with --workers=1: the cases share localStorage and the dev server.
 */

const WIZARD = '/admin/promotions/new';
const DASHBOARD = '/admin/dashboard';
/* Mirrors DRAFT_KEY in src/app/admin/promotions/new/draft.ts. */
const DRAFT_KEY = 'promo_draft_v2';

const VISIBLE_STEPS = ['Basics', 'Qualification', 'Award', 'Schedule', 'Notifications', 'Review'];

test.describe('Promotion wizard (Budget and Content hidden for the demo)', () => {
  test.beforeEach(async ({ page }) => {
    /* Start from a same-origin page so localStorage can be cleared before the wizard mounts. */
    await page.goto(DASHBOARD);
    await page.evaluate((key) => window.localStorage.removeItem(key), DRAFT_KEY);
  });

  test('1. stepper shows six contiguous steps with no Budget or Content', async ({ page }) => {
    await page.goto(WIZARD);

    const stepper = page.getByRole('list', { name: 'Promotion setup progress' });
    const items = stepper.getByRole('listitem');
    await expect(items).toHaveCount(VISIBLE_STEPS.length);

    const labels = await stepper.locator('.np-stepper__label').allTextContents();
    expect(labels).toEqual(VISIBLE_STEPS);
    expect(labels).not.toContain('Content');
    expect(labels).not.toContain('Budget');

    /* Circles are numbered 1..6 in order: no gap where the hidden steps used to be. */
    const circles = await stepper.locator('.np-stepper__circle').allTextContents();
    expect(circles).toEqual(['1', '2', '3', '4', '5', '6']);

    await expect(page.getByText('Step 1 of 6 · Basics')).toBeVisible();
  });

  test('2. Continue from Schedule lands on Notifications and Back returns to Schedule', async ({ page }) => {
    /* Seed a draft parked on Schedule (visible step 4) with a valid, ongoing schedule. */
    await page.evaluate((key) => {
      window.localStorage.setItem(key, JSON.stringify({
        step: 4,
        name: 'Skip test',
        type: 'deposit_match',
        vertical: 'Sportsbook',
        startDate: '2026-10-01',
        startTime: '09:00',
        endMode: 'ongoing',
      }));
    }, DRAFT_KEY);
    await page.goto(WIZARD);

    await expect(page.getByText('Step 4 of 6 · Schedule')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Schedule' })).toBeVisible();

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 5 of 6 · Notifications')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Content' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByText('Step 4 of 6 · Schedule')).toBeVisible();
  });

  test('3. Review has no Content summary and a stale step-7 draft keeps its content data', async ({ page }) => {
    /* A draft saved while Content was visible: parked on old step 7 with content fields filled. */
    await page.evaluate((key) => {
      window.localStorage.setItem(key, JSON.stringify({
        step: 7,
        name: 'Content retained',
        shortDescription: 'Keep me on the draft',
        tcsFileName: 'terms.pdf',
      }));
    }, DRAFT_KEY);
    await page.goto(WIZARD);

    /* Clamped to the last visible step (Review), never past it. */
    await expect(page.getByText('Step 6 of 6 · Review')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Review' })).toBeVisible();

    const reviewTitles = await page.locator('.np-review-card__head h3').allTextContents();
    expect(reviewTitles).toEqual(['Basics', 'Qualification', 'Award', 'Schedule', 'Notifications']);
    expect(reviewTitles).not.toContain('Content');
    await expect(page.getByText('Content incomplete: required before publish')).toHaveCount(0);
    await expect(page.getByText('Keep me on the draft')).toHaveCount(0);

    /* The hidden step's data is still on the persisted draft after re-hydration. */
    await expect
      .poll(async () => {
        const raw = await page.evaluate((key) => window.localStorage.getItem(key), DRAFT_KEY);
        return raw ? (JSON.parse(raw) as { step?: number; shortDescription?: string; tcsFileName?: string }) : null;
      })
      .toMatchObject({ step: 6, shortDescription: 'Keep me on the draft', tcsFileName: 'terms.pdf' });
  });
});
