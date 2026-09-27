import { expect, test, type Page } from '@playwright/test';

/**
 * Promotions → Draft save / resume by reference (PROTOTYPE, localStorage).
 * Covers: Save draft assigns a stable PR-xxx reference and a list row; resume
 * via ?ref= lands on the saved step; repeated saves never duplicate rows; a
 * seeded Draft row (PR-004) resumes and saves under its own reference; save
 * needs only a name (and focuses it); hidden-step positions map to a visible
 * step; the list shows "Continue editing" + "Last saved …"; the leave guard
 * (Step 1 Back, sidebar link, browser back) offers save / leave / keep editing.
 * Run with --workers=1: the cases share localStorage and the dev server.
 */

const WIZARD = '/admin/promotions/new';
const LIST = '/admin/promotions';
const DASHBOARD = '/admin/dashboard';

/* Mirror the storage keys in src/app/admin/promotions/new/draft.ts,
 * src/lib/promotions/draftStore.ts and src/lib/promotions.ts. */
const SCRATCH_KEY = 'promo_draft_v2';
const DRAFTS_KEY = 'promo-drafts:v1';
const LIST_KEY = 'promo_list_v1';
const NOTICE_KEY = 'promo_notice_v1';

/* Seeded Draft row from PROMO_SEED (name / type / vertical). */
const SEEDED_DRAFT = { id: 'PR-004', name: 'Weekend Acca Boost' };
/* Highest seeded id is PR-013, so the first wizard-created reference is PR-014. */
const FIRST_NEW_REF = 'PR-014';

type StoredDraft = {
  reference: string | null;
  name: string;
  lastStep: number;
  lastStepId: string | null;
  savedAt: string | null;
  vertical: string;
  shortDescription: string;
};

async function resetStorage(page: Page) {
  await page.goto(DASHBOARD);
  await page.evaluate(
    ([keys, noticeKey]) => {
      for (const key of keys) window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(noticeKey);
    },
    [[SCRATCH_KEY, DRAFTS_KEY, LIST_KEY], NOTICE_KEY] as const,
  );
}

async function readDrafts(page: Page): Promise<Record<string, StoredDraft>> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), DRAFTS_KEY);
  return raw ? (JSON.parse(raw) as Record<string, StoredDraft>) : {};
}

async function readListIds(page: Page): Promise<string[]> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), LIST_KEY);
  return raw ? (JSON.parse(raw) as { id: string }[]).map((p) => p.id) : [];
}

const saveState = (page: Page) => page.getByTestId('draft-save-state');
const nameInput = (page: Page) => page.locator('#np-field-name');
/* The dialog wrapper has no box of its own; assert on its card (same as the experiments spec). */
const leaveGuard = (page: Page) => page.getByTestId('draft-leave-guard').locator('.promo-modal__card');

/* Draft rows sit past the first page in the default sort; the Draft stat chip narrows the table. */
async function showDraftRows(page: Page) {
  await page.goto(LIST);
  await page.getByRole('button', { name: /Draft$/ }).click();
}

/* ---- SAVE / RESUME ---- */

test.describe('Promotion drafts: save and resume by reference', () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test('1. Save draft assigns a reference, adds one list row and resumes on the saved step', async ({ page }) => {
    await page.goto(WIZARD);
    await expect(saveState(page)).toHaveText('Not saved yet');
    await expect(page.getByRole('heading', { level: 1, name: 'Create a promotion' })).toBeVisible();

    await nameInput(page).fill('Reference resume test');
    await expect(saveState(page)).toHaveText('Unsaved changes');
    await page.getByLabel('Promotion type').selectOption('welcome_offer');
    await page.getByLabel('Product vertical').selectOption('Sportsbook');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();

    /* Save from Step 2: only the name is required, the step's own validation is deferred. */
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(saveState(page)).toHaveText('Saved just now');
    await expect(saveState(page)).toHaveAttribute('data-state', 'saved');
    await expect(page.getByRole('heading', { level: 1, name: `Edit draft ${FIRST_NEW_REF}` })).toBeVisible();

    const drafts = await readDrafts(page);
    expect(Object.keys(drafts)).toEqual([FIRST_NEW_REF]);
    expect(drafts[FIRST_NEW_REF]).toMatchObject({ reference: FIRST_NEW_REF, name: 'Reference resume test', lastStep: 2, lastStepId: 'qualification' });
    expect(drafts[FIRST_NEW_REF].savedAt).toBeTruthy();

    /* Re-saving updates the same entry and the same row: no duplicates. */
    await page.getByRole('button', { name: 'Save draft' }).click();
    const listIds = await readListIds(page);
    expect(listIds.filter((id) => id === FIRST_NEW_REF)).toHaveLength(1);
    expect(listIds[0]).toBe(FIRST_NEW_REF);

    /* Resume: a fresh navigation with ?ref= lands on the saved step with a resume note. */
    await page.goto(`${WIZARD}?ref=${FIRST_NEW_REF}`);
    await expect(page.getByText('Step 2 of 6 · Qualification')).toBeVisible();
    await expect(page.getByTestId('draft-resume-note')).toContainText(`Resumed ${FIRST_NEW_REF} from step 2 of 6`);
    await expect(saveState(page)).toHaveAttribute('data-state', 'saved');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(nameInput(page)).toHaveValue('Reference resume test');
  });

  test('2. seeded Draft PR-004 resumes from the list and saves under its own reference', async ({ page }) => {
    await showDraftRows(page);
    const row = page.locator('tr.promo-row', { hasText: SEEDED_DRAFT.id });
    await expect(row).toBeVisible();
    /* A seeded draft has never been saved from the wizard, so no "Last saved" yet. */
    await expect(row.getByTestId('promo-last-saved')).toHaveCount(0);

    await row.getByRole('button', { name: `Continue editing ${SEEDED_DRAFT.name}` }).click();
    await expect(page).toHaveURL(new RegExp(`${WIZARD}\\?ref=${SEEDED_DRAFT.id}$`));
    await expect(page.getByRole('heading', { level: 1, name: `Edit draft ${SEEDED_DRAFT.id}` })).toBeVisible();
    await expect(page.getByTestId('draft-resume-note')).toContainText(`Editing ${SEEDED_DRAFT.id}`);
    await expect(nameInput(page)).toHaveValue(SEEDED_DRAFT.name);
    /* Nothing has changed yet: opening a seeded row is not an unsaved edit. */
    await expect(saveState(page)).toHaveText('Not saved yet');

    await nameInput(page).fill(`${SEEDED_DRAFT.name} · edited`);
    await expect(saveState(page)).toHaveText('Unsaved changes');
    await page.getByRole('button', { name: 'Save and exit' }).click();

    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    await expect(page.getByRole('status').filter({ hasText: `saved as draft (${SEEDED_DRAFT.id})` })).toBeVisible();

    /* Same row, renamed, with a "Last saved" hint; still exactly one PR-004. */
    await page.getByRole('button', { name: /Draft$/ }).click();
    const rows = page.locator('tr.promo-row', { hasText: SEEDED_DRAFT.id });
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(`${SEEDED_DRAFT.name} · edited`);
    await expect(rows.first().getByTestId('promo-last-saved')).toHaveText(/Last saved just now/);
    expect((await readListIds(page)).filter((id) => id === SEEDED_DRAFT.id)).toHaveLength(1);

    const drafts = await readDrafts(page);
    expect(Object.keys(drafts)).toEqual([SEEDED_DRAFT.id]);
    expect(drafts[SEEDED_DRAFT.id]).toMatchObject({ reference: SEEDED_DRAFT.id, vertical: 'Sportsbook' });
  });

  test('3. saving without a name returns to Basics, shows the error and focuses the Name field', async ({ page }) => {
    /* Park the scratch copy on Schedule with no name. */
    await page.evaluate((key) => {
      window.localStorage.setItem(key, JSON.stringify({ step: 4, name: '', vertical: 'Casino' }));
    }, SCRATCH_KEY);
    await page.goto(WIZARD);
    await expect(page.getByText('Step 4 of 6 · Schedule')).toBeVisible();

    await page.getByRole('button', { name: 'Save draft' }).click();

    await expect(page.getByText('Step 1 of 6 · Basics')).toBeVisible();
    await expect(page.getByText('Add a name to save this draft.')).toBeVisible();
    await expect(nameInput(page)).toBeFocused();
    expect(await readDrafts(page)).toEqual({});
    await expect(saveState(page)).toHaveAttribute('data-state', 'unsaved');
  });

  test('4. a draft saved on the hidden Content step resumes on the nearest visible step and keeps its data', async ({ page }) => {
    const ref = 'PR-050';
    await page.evaluate(
      ([key, reference]) => {
        window.localStorage.setItem(key, JSON.stringify({
          [reference]: {
            reference,
            name: 'Hidden step draft',
            vertical: 'Sportsbook',
            lastStep: 7,
            lastStepId: 'content',
            shortDescription: 'Kept while Content is hidden',
            savedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
          },
        }));
      },
      [DRAFTS_KEY, ref] as const,
    );

    await page.goto(`${WIZARD}?ref=${ref}`);
    /* Content sits after Schedule in the catalogue → resumes on Schedule (visible step 4). */
    await expect(page.getByText('Step 4 of 6 · Schedule')).toBeVisible();
    await expect(page.getByTestId('draft-resume-note')).toContainText('last saved 5 min ago');
    await expect(saveState(page)).toHaveText('Saved 5 min ago');

    /* Re-saving keeps the hidden step's content and records the visible position. */
    await page.getByRole('button', { name: 'Save draft' }).click();
    const drafts = await readDrafts(page);
    expect(drafts[ref]).toMatchObject({ lastStep: 4, lastStepId: 'schedule', shortDescription: 'Kept while Content is hidden' });
  });

  test('5. an unknown reference starts a new promotion with a dismissible note', async ({ page }) => {
    await page.goto(`${WIZARD}?ref=PR-999`);
    await expect(page.getByTestId('draft-resume-note')).toHaveText(/Draft PR-999 was not found/);
    await expect(page.getByRole('heading', { level: 1, name: 'Create a promotion' })).toBeVisible();
    await expect(nameInput(page)).toHaveValue('');
    await page.getByTestId('draft-resume-note').getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByTestId('draft-resume-note')).toHaveCount(0);
  });
});

/* ---- LEAVE GUARD ---- */

test.describe('Promotion drafts: leave guard', () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test('6. Back on Step 1 with unsaved edits asks first; Keep editing stays, Leave without saving discards', async ({ page }) => {
    await page.goto(WIZARD);
    /* Untouched draft: Back leaves straight away. */
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));

    await page.goto(WIZARD);
    await nameInput(page).fill('Guarded draft');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(leaveGuard(page)).toBeVisible();
    await expect(leaveGuard(page)).toContainText('This promotion has not been saved yet');

    await leaveGuard(page).getByRole('button', { name: 'Keep editing' }).click();
    await expect(leaveGuard(page)).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`${WIZARD}$`));
    await expect(nameInput(page)).toHaveValue('Guarded draft');

    await page.getByRole('button', { name: 'Back' }).click();
    await leaveGuard(page).getByRole('button', { name: 'Leave without saving' }).click();
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    expect(await readDrafts(page)).toEqual({});
    expect(await page.evaluate((key) => window.localStorage.getItem(key), SCRATCH_KEY)).toBeNull();
  });

  test('7. a sidebar link while unsaved is intercepted; Save and exit saves then follows the link', async ({ page }) => {
    await page.goto(WIZARD);
    await nameInput(page).fill('Sidebar guarded draft');

    await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Dashboard' }).click();
    await expect(leaveGuard(page)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${WIZARD}$`));

    await leaveGuard(page).getByRole('button', { name: 'Save and exit' }).click();
    await expect(page).toHaveURL(new RegExp(`${DASHBOARD}$`));

    const drafts = await readDrafts(page);
    expect(Object.keys(drafts)).toEqual([FIRST_NEW_REF]);
    expect(drafts[FIRST_NEW_REF].name).toBe('Sidebar guarded draft');
    expect((await readListIds(page)).filter((id) => id === FIRST_NEW_REF)).toHaveLength(1);

    /* The list shows the new Draft row with its Continue editing action and last-saved hint. */
    await showDraftRows(page);
    const row = page.locator('tr.promo-row', { hasText: FIRST_NEW_REF });
    await expect(row).toHaveCount(1);
    await expect(row.getByTestId('promo-last-saved')).toHaveText(/Last saved just now/);
    await expect(row.getByRole('button', { name: 'Continue editing Sidebar guarded draft' })).toBeVisible();
  });

  test('8. browser back with unsaved edits is intercepted; Leave without saving returns to the origin page', async ({ page }) => {
    await page.goto(LIST);
    await page.getByRole('button', { name: 'New promotion' }).click();
    await expect(page).toHaveURL(new RegExp(`${WIZARD}$`));

    await nameInput(page).fill('Back guarded draft');
    await page.goBack();
    await expect(leaveGuard(page)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${WIZARD}$`));

    /* Keep editing re-arms the guard: another back press asks again. */
    await leaveGuard(page).getByRole('button', { name: 'Keep editing' }).click();
    await expect(leaveGuard(page)).toHaveCount(0);
    await page.goBack();
    await expect(leaveGuard(page)).toBeVisible();

    await leaveGuard(page).getByRole('button', { name: 'Leave without saving' }).click();
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    expect(await readDrafts(page)).toEqual({});
  });

  test('9. browser back after saving leaves without a prompt', async ({ page }) => {
    await page.goto(LIST);
    await page.getByRole('button', { name: 'New promotion' }).click();
    await expect(page).toHaveURL(new RegExp(`${WIZARD}$`));
    await nameInput(page).fill('Saved then back');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(saveState(page)).toHaveAttribute('data-state', 'saved');

    await page.goBack();
    await expect(leaveGuard(page)).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
  });
});
