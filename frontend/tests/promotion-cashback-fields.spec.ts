import { expect, test, type Page } from '@playwright/test';

/**
 * 100% Cash Stake Back: additive qualifying-condition / reward fields.
 *
 * PR-002 is an active PROMO_SEED record, not a stored wizard draft, so its
 * `?ref=` route normally starts a new promotion. This spec deliberately
 * stores the Cashback-template working copy under PR-002 in the draft store;
 * that exercises the supported save/resume route without changing PROMO_SEED.
 */
const WIZARD = '/admin/promotions/new';
const DASHBOARD = '/admin/dashboard';
const SCRATCH_KEY = 'promo_draft_v2';
const DRAFTS_KEY = 'promo-drafts:v1';

async function resetStorage(page: Page) {
  await page.goto(DASHBOARD);
  await page.evaluate(([scratch, drafts]) => {
    window.localStorage.removeItem(scratch);
    window.localStorage.removeItem(drafts);
  }, [SCRATCH_KEY, DRAFTS_KEY] as const);
}

async function continueToReview(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Step 4 of 6 · Schedule')).toBeVisible();

  /* Dates use the project custom picker. Add valid template schedule data to
   * the autosaved draft, then reload through the normal sanitising restore. */
  await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    const draft = raw ? JSON.parse(raw) as Record<string, unknown> : {};
    window.localStorage.setItem(key, JSON.stringify({
      ...draft,
      startDate: '2026-10-01',
      startTime: '09:00',
      endMode: 'ongoing',
    }));
  }, SCRATCH_KEY);
  await page.goto(WIZARD);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Step 5 of 6 · Notifications')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Step 6 of 6 · Review')).toBeVisible();
}

test.describe('100% Cash Stake Back conditions and reward fields', () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test('Restrictions render once for the promotion and apply to every trigger', async ({ page }) => {
    await page.goto(WIZARD);
    await page.getByRole('button', { name: 'Use template' }).click();
    await page.getByRole('button', { name: /Sportsbook Cashback/ }).click();
    await page.getByLabel('Promotion name').fill('Restrictions once');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();

    const restrictions = page.getByRole('group', { name: 'Restrictions: bets that never qualify' });
    await expect(restrictions).toHaveCount(1);
    /* Free-bet stakes are no longer a restriction: the Stake Funding condition covers that. */
    await expect(restrictions.getByRole('checkbox')).toHaveCount(3);
    await expect(restrictions.getByText('Bets placed using free bets')).toHaveCount(0);
    const voided = restrictions.getByRole('checkbox', { name: 'Voided bets' });
    await expect(voided).toBeChecked();

    /* Untick before adding a trigger: the new trigger inherits the shared set.
     * The checkbox input is visually hidden under its label, so click the label text. */
    await restrictions.getByText('Voided bets').click();
    await expect(voided).not.toBeChecked();
    await page.getByRole('button', { name: 'Add trigger event' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^Bet Placed/ }).click();
    await expect(page.getByLabel('Trigger 2 event')).toBeVisible();

    /* Still one section, still reflecting the shared state. */
    await expect(page.getByRole('group', { name: 'Restrictions: bets that never qualify' })).toHaveCount(1);
    await expect(voided).not.toBeChecked();
    await expect(restrictions.getByRole('checkbox', { name: 'Cancelled bets' })).toBeChecked();

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 3 of 6 · Award')).toBeVisible();
    await page.getByRole('radio', { name: 'Percentage of stake' }).check();
    await page.getByLabel('Percentage of stake returned').fill('100');
    await page.getByLabel('Max awards per day').fill('1');

    await continueToReview(page);
    await expect(page.getByText('Excluded: cancelled bets, cashed-out bets')).toHaveCount(1);
    await expect(page.getByText('⚠ Voided bets are allowed to qualify')).toHaveCount(1);
  });

  test('persists qualifying conditions, renders both reward-cap summaries, and resumes PR-002', async ({ page }) => {
    await page.goto(WIZARD);
    await page.getByRole('button', { name: 'Use template' }).click();
    await page.getByRole('button', { name: /Sportsbook Cashback/ }).click();
    await page.getByLabel('Promotion name').fill('100% Cash Stake Back');

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();

    /* Stake funding and Selections are trigger conditions from the BET group. The template
     * already limits stakes to Cash (this replaces the old free-bet restriction). */
    const stakeFunding = page.getByLabel('Stake Funding value');
    await expect(stakeFunding).toHaveCount(1);
    await expect(stakeFunding).toHaveValue('Cash');

    await page.getByRole('button', { name: 'Add condition' }).click();
    await page.getByRole('button', { name: 'Selections', exact: true }).click();
    await page.getByLabel('Operator for Selections').selectOption('>=');
    await page.getByLabel('Selections value').fill('5');

    /* Combinable sits after "Channels" and defaults to off. */
    const combinable = page.getByRole('switch', { name: 'Combinable with other offers' });
    await expect(combinable).toHaveAttribute('aria-checked', 'false');
    await combinable.click();

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 3 of 6 · Award')).toBeVisible();
    await page.getByRole('radio', { name: 'Percentage of stake' }).check();
    await page.getByLabel('Percentage of stake returned').fill('100');
    await page.getByLabel('Max awards per day').fill('1');
    await page.getByLabel('Maximum value per award in ZMW').fill('10000');

    await continueToReview(page);
    await expect(page.getByText(/Stake Funding = Cash/)).toBeVisible();
    await expect(page.getByText(/Selections >= 5/)).toBeVisible();
    await expect(page.getByText('100% of stake, up to 10,000')).toBeVisible();
    await expect(page.getByText('Combinable with other offers')).toBeVisible();
    await expect(page.getByText('Yes', { exact: true })).toBeVisible();

    /* Clear the cap to cover the explicit no-cap presentation. */
    await page.locator('.np-review-card__head').filter({ hasText: 'Award' }).getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Step 3 of 6 · Award')).toBeVisible();
    await page.getByLabel('Maximum value per award in ZMW').fill('');
    await continueToReview(page);
    await expect(page.getByText('100% of stake, no cap')).toBeVisible();

    /* Store the real working copy under the requested active-promotion ref.
     * This is intentionally draft-store-only: PROMO_SEED remains untouched. */
    await page.evaluate(([scratchKey, draftsKey]) => {
      const raw = window.localStorage.getItem(scratchKey);
      if (!raw) throw new Error('Expected an autosaved Cashback draft.');
      const draft = JSON.parse(raw) as Record<string, unknown>;
      const saved = {
        ...draft,
        reference: 'PR-002',
        status: 'draft',
        lastStep: 6,
        lastStepId: 'review',
        savedAt: '2026-09-25T12:00:00.000Z',
      };
      window.localStorage.setItem(draftsKey, JSON.stringify({ 'PR-002': saved }));
    }, [SCRATCH_KEY, DRAFTS_KEY] as const);

    await page.goto(`${WIZARD}?ref=PR-002`);
    await expect(page.getByText(/Resumed PR-002 from step 6 of 6/)).toBeVisible();
    await expect(page.getByText(/Stake Funding = Cash/)).toBeVisible();
    await expect(page.getByText(/Selections >= 5/)).toBeVisible();
    await expect(page.getByText('100% of stake, no cap')).toBeVisible();
    await expect(page.getByText('Combinable with other offers')).toBeVisible();
  });

  test('has no "Who\'s eligible" section and drops legacy eligibility data from restored drafts', async ({ page }) => {
    await page.goto(WIZARD);
    await page.getByRole('button', { name: 'Use template' }).click();
    await page.getByRole('button', { name: /Sportsbook Cashback/ }).click();
    await page.getByLabel('Promotion name').fill('No audience section');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();

    await expect(page.getByRole('heading', { name: "Who's eligible" })).toHaveCount(0);
    await expect(page.getByRole('radiogroup', { name: 'Eligibility' })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'New customers' })).toHaveCount(0);

    /* A draft saved before the section was removed still restores; the removed key is not kept. */
    await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) throw new Error('Expected an autosaved Cashback draft.');
      const draft = JSON.parse(raw) as { qualification: Record<string, unknown> };
      draft.qualification.eligibility = { audience: 'new_customers', windowDays: 5, nonConsecutive: true };
      window.localStorage.setItem(key, JSON.stringify(draft));
    }, SCRATCH_KEY);
    await page.goto(WIZARD);
    await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();
    await expect(page.getByLabel('Stake Funding value')).toHaveValue('Cash');
    await expect(page.getByRole('heading', { name: "Who's eligible" })).toHaveCount(0);

    /* An edit re-autosaves the sanitised draft without the legacy key. */
    await page.getByRole('switch', { name: 'Combinable with other offers' }).click();
    await expect.poll(async () => page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      const draft = raw ? JSON.parse(raw) as { qualification: Record<string, unknown> } : null;
      return draft ? 'eligibility' in draft.qualification : null;
    }, SCRATCH_KEY)).toBe(false);

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 3 of 6 · Award')).toBeVisible();
    await page.getByRole('radio', { name: 'Percentage of stake' }).check();
    await page.getByLabel('Percentage of stake returned').fill('100');
    await page.getByLabel('Max awards per day').fill('1');
    await continueToReview(page);
    await expect(page.getByText('Eligibility', { exact: true })).toHaveCount(0);
    await expect(page.getByText('All players')).toHaveCount(0);
  });

  test('offers AND as well as OR when adding a trigger event, and the join is editable and persisted', async ({ page }) => {
    await page.goto(WIZARD);
    await page.getByRole('button', { name: 'Use template' }).click();
    await page.getByRole('button', { name: /Sportsbook Cashback/ }).click();
    await page.getByLabel('Promotion name').fill('AND OR triggers');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();

    /* The modal offers both joins; OR is the default. */
    await page.getByRole('button', { name: 'Add trigger event' }).click();
    const dialog = page.getByRole('dialog');
    const joinPicker = dialog.getByRole('radiogroup', { name: 'Join with previous trigger' });
    await expect(joinPicker.getByRole('radio', { name: 'AND' })).toHaveAttribute('aria-checked', 'false');
    await expect(joinPicker.getByRole('radio', { name: 'OR' })).toHaveAttribute('aria-checked', 'true');
    await joinPicker.getByRole('radio', { name: 'AND' }).click();
    await expect(dialog.getByText('AND: the player must complete both events to qualify.')).toBeVisible();
    await dialog.getByRole('button', { name: /^Bet Placed/ }).click();

    /* The divider between the two triggers shows the chosen join and lets it be switched. */
    const divider = page.getByRole('radiogroup', { name: 'Trigger 2 join' });
    await expect(divider.getByRole('radio', { name: 'AND' })).toHaveAttribute('aria-checked', 'true');
    await expect.poll(async () => page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      const draft = raw ? JSON.parse(raw) as { qualification: { triggers: { join?: string }[] } } : null;
      return draft ? draft.qualification.triggers.map((t) => t.join ?? null) : null;
    }, SCRATCH_KEY)).toEqual([null, 'and']);

    await divider.getByRole('radio', { name: 'OR' }).click();
    await expect(divider.getByRole('radio', { name: 'OR' })).toHaveAttribute('aria-checked', 'true');
    await divider.getByRole('radio', { name: 'AND' }).click();

    /* Review spells out the chain. */
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 3 of 6 · Award')).toBeVisible();
    await page.getByRole('radio', { name: 'Percentage of stake' }).check();
    await page.getByLabel('Percentage of stake returned').fill('100');
    await page.getByLabel('Max awards per day').fill('1');
    await continueToReview(page);
    await expect(page.getByText('Trigger logic')).toBeVisible();
    await expect(page.getByText('Bet Settled AND Bet Placed')).toBeVisible();
    await expect(page.getByText('Trigger 2 (AND)')).toBeVisible();
  });

  test('delivery channels list SMS first and enabled; Push, Email and In-app are disabled TBC and dropped from legacy drafts', async ({ page }) => {
    await page.goto(WIZARD);
    await page.getByRole('button', { name: 'Use template' }).click();
    await page.getByRole('button', { name: /Sportsbook Cashback/ }).click();
    await page.getByLabel('Promotion name').fill('SMS only delivery');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 3 of 6 · Award')).toBeVisible();
    await page.getByRole('radio', { name: 'Percentage of stake' }).check();
    await page.getByLabel('Percentage of stake returned').fill('100');
    await page.getByLabel('Max awards per day').fill('1');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 4 of 6 · Schedule')).toBeVisible();

    /* Seed a legacy draft that still carried push / in-app on the award message. */
    await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      const draft = raw ? JSON.parse(raw) as { notifications: { onAward: { channels: string[] } } } : null;
      if (!draft) throw new Error('Expected an autosaved Cashback draft.');
      draft.notifications.onAward.channels = ['push', 'sms', 'inapp'];
      window.localStorage.setItem(key, JSON.stringify({ ...draft, startDate: '2026-10-01', startTime: '09:00', endMode: 'ongoing' }));
    }, SCRATCH_KEY);
    await page.goto(WIZARD);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 5 of 6 · Notifications')).toBeVisible();

    const group = page.getByRole('group', { name: 'When a player is awarded delivery channels' });
    const boxes = group.getByRole('checkbox');
    await expect(boxes).toHaveCount(4);
    await expect(boxes.nth(0)).toHaveAccessibleName('SMS');
    await expect(boxes.nth(0)).toBeEnabled();
    await expect(boxes.nth(0)).toBeChecked();
    for (const [i, label] of ['Push (TBC)', 'Email (TBC)', 'In-app (TBC)'].entries()) {
      await expect(boxes.nth(i + 1)).toHaveAccessibleName(label);
      await expect(boxes.nth(i + 1)).toBeDisabled();
      await expect(boxes.nth(i + 1)).not.toBeChecked();
    }

    /* Review lists only the SMS channel. */
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 6 of 6 · Review')).toBeVisible();
    await expect(page.getByText(/^SMS · "Your Money Back has landed"/)).toBeVisible();
    await expect(page.getByText(/Push|In-app/)).toHaveCount(0);
  });


});
