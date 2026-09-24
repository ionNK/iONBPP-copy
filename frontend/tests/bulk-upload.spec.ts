import { expect, test } from '@playwright/test';
import path from 'path';

/**
 * Manual Award → Bulk award upload (PROTOTYPE, mock data): Cash / FreeBet /
 * Bonus with column mapping, expiry, terms, SMS and recipient-list output.
 * Run serially: cases clear and inspect the localStorage-backed batch and
 * Governance approvals stores without any API/network dependency.
 */

const PAGE = '/admin/promotions/bulk-upload';
const DASHBOARD = '/admin/dashboard';
const FIXTURES = path.join(__dirname, 'fixtures', 'bulk-upload');
const fixture = (name: string) => path.join(FIXTURES, name);
const BATCHES_KEY = 'bulk-award:batches';
const APPROVALS_KEY = 'governance:approvals';

async function openBulk(page: import('@playwright/test').Page) {
  await page.goto(PAGE);
  await page.getByTestId('bulk-mode-bulk').click();
  await expect(page.getByTestId('bulk-upload-stepper')).toBeVisible();
}

/** Default award type is FreeBet: name + expiry (7d preset) + minimum odds + maximum win are required. */
async function enterDetails(page: import('@playwright/test').Page, name: string) {
  await page.getByTestId('bulk-details-name').fill(name);
  await page.getByTestId('bulk-details-min-odds').fill('1.5');
  await page.getByTestId('bulk-details-max-win').fill('500');
  await page.getByTestId('bulk-next').getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('bulk-panel-2')).toBeVisible();
}

/** Decode the CSV behind a data: download link (no filesystem round-trip needed). */
async function readCsvLink(link: import('@playwright/test').Locator): Promise<string> {
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^data:text\/csv;charset=utf-8,/);
  return decodeURIComponent((href as string).replace(/^data:text\/csv;charset=utf-8,/, ''));
}

async function upload(page: import('@playwright/test').Page, name: string) {
  await page.getByTestId('bulk-file-input').setInputFiles(fixture(name));
}

async function goToValidate(page: import('@playwright/test').Page) {
  await page.getByTestId('bulk-next').getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('bulk-panel-3')).toBeVisible();
}

async function goToReview(page: import('@playwright/test').Page) {
  await page.getByTestId('bulk-next').getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('bulk-panel-4')).toBeVisible();
}

test.describe('Bulk award upload', () => {
  test.beforeEach(async ({ page }) => {
    /* Start same-origin, then clean only the stores introduced by this surface. */
    await page.goto(DASHBOARD);
    await page.evaluate(([batches, approvals]) => {
      window.localStorage.removeItem(batches);
      window.localStorage.removeItem(approvals);
    }, [BATCHES_KEY, APPROVALS_KEY]);
  });

  test('1. Details defaults to FreeBet with 7d expiry; name + terms gate Next, Cash needs only a name', async ({ page }) => {
    const next = page.getByTestId('bulk-next').getByRole('button', { name: 'Next' });
    await openBulk(page);
    await expect(page.getByTestId('bulk-step-1')).toHaveAttribute('data-state', 'current');
    await expect(page.getByTestId('bulk-award-freebet')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('bulk-details-expiry-preset')).toHaveValue('7d');
    await expect(next).toBeDisabled();

    /* FreeBet: name alone is not enough — minimum odds and maximum win are required. */
    await page.getByTestId('bulk-details-name').fill('Week 12 winners');
    await expect(next).toBeDisabled();
    await page.getByTestId('bulk-details-min-odds').fill('1.5');
    await expect(next).toBeDisabled();
    await page.getByTestId('bulk-details-max-win').fill('500');
    await expect(next).toBeEnabled();

    /* Bonus adds a rollover field but keeps the same required set. */
    await page.getByTestId('bulk-award-bonus').click();
    await expect(page.getByTestId('bulk-details-rollover')).toBeVisible();
    await expect(next).toBeEnabled();

    /* Cash: expiry and terms disappear and the SMS default swaps to the cash template. */
    await page.getByTestId('bulk-award-cash').click();
    await expect(page.getByTestId('bulk-details-expiry-mode')).toHaveCount(0);
    await expect(page.getByTestId('bulk-details-terms')).toHaveCount(0);
    await expect(page.getByTestId('bulk-details-sms-message')).toHaveValue(/cash has been credited/);
    await expect(next).toBeEnabled();
  });

  test('2. file without an amount column shows a recoverable mapping notice and routes to Map columns', async ({ page }) => {
    await openBulk(page);
    await enterDetails(page, 'Bad headers batch');
    await upload(page, 'bad-headers.csv');
    await expect(page.getByTestId('bulk-file-error')).toHaveAttribute('data-tone', 'info');
    await expect(page.getByTestId('bulk-file-error')).toContainText('Amount');
    await page.getByTestId('bulk-next').getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('bulk-panel-2b')).toBeVisible();
    await expect(page.getByTestId('bulk-mapping-row-customerId')).toHaveAttribute('data-mapped', 'true');
    await expect(page.getByTestId('bulk-mapping-row-amount')).toHaveAttribute('data-mapped', 'false');
    await expect(page.getByTestId('bulk-mapping-status')).toContainText('Still needed: Amount');
    await expect(page.getByTestId('bulk-next').getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  test('3. template marker is skipped in GH and TZ and cannot be confirmed', async ({ page }) => {
    await openBulk(page);
    await enterDetails(page, 'Blank template batch');
    await upload(page, 'tz-template.csv');
    await goToValidate(page);
    await expect(page.getByTestId('bulk-summary-marker')).toHaveText('1');
    await expect(page.getByTestId('bulk-summary-rows')).toHaveText('0');
    await expect(page.getByTestId('bulk-preview-empty')).toContainText('template marker row');
    await goToReview(page);
    await expect(page.getByTestId('bulk-confirm').getByRole('button', { name: 'Confirm and submit' })).toBeDisabled();

    /* Return to Details (Review → Validate → Upload → Details), change the
     * normalisation market, then re-upload the same template. */
    await page.getByTestId('bulk-back').getByRole('button', { name: 'Back' }).click();
    await page.getByTestId('bulk-back').getByRole('button', { name: 'Back' }).click();
    await page.getByTestId('bulk-back').getByRole('button', { name: 'Back' }).click();
    await expect(page.getByTestId('bulk-panel-1')).toBeVisible();
    await page.getByTestId('bulk-details-market').selectOption('TZ');
    await page.getByTestId('bulk-next').getByRole('button', { name: 'Next' }).click();
    await upload(page, 'tz-template.csv');
    await goToValidate(page);
    await expect(page.getByTestId('bulk-summary-marker')).toHaveText('1');
    await expect(page.getByTestId('bulk-summary-rows')).toHaveText('0');
  });

  test('4. mixed Ghana file reports valid, warning and error counts; only later duplicate errors', async ({ page }) => {
    await openBulk(page);
    await enterDetails(page, 'Mixed integrity batch');
    await upload(page, 'mixed-gh.csv');
    await goToValidate(page);
    await expect(page.getByTestId('bulk-summary-valid')).toHaveText('3');
    await expect(page.getByTestId('bulk-summary-warning')).toHaveText('2');
    await expect(page.getByTestId('bulk-summary-error')).toHaveText('4');
    await expect(page.getByTestId('bulk-summary-marker')).toHaveText('1');

    const duplicates = page.getByTestId('bulk-preview-row').filter({ hasText: 'Duplicate msisdn + bet_id' });
    await expect(duplicates).toHaveCount(1);
  });

  test('5. valid Ghana file awards without approval and appears in history', async ({ page }) => {
    const name = 'Valid Ghana winners';
    await openBulk(page);
    await enterDetails(page, name);
    await upload(page, 'valid-gh.csv');
    await goToValidate(page);
    await expect(page.getByTestId('bulk-summary-total')).toHaveText('GHS 130.50');
    await goToReview(page);
    await expect(page.getByTestId('bulk-approval-notice')).toHaveCount(0);
    await page.getByTestId('bulk-confirm').getByRole('button', { name: 'Confirm and submit' }).click();
    await expect(page.getByTestId('bulk-result-status')).toHaveAttribute('data-status', 'awarded');
    await expect(page.getByTestId('bulk-history-row')).toHaveCount(1);
    await expect(page.getByTestId('bulk-history-row')).toContainText(name);
  });

  test('6. large Ghana file requires approval and pushes an approvals item', async ({ page }) => {
    const name = 'Large Ghana approval batch';
    await openBulk(page);
    await enterDetails(page, name);
    await upload(page, 'large-gh.csv');
    await goToValidate(page);
    await expect(page.getByTestId('bulk-summary-valid')).toHaveText('1,200');
    await goToReview(page);
    await expect(page.getByTestId('bulk-approval-notice')).toBeVisible();
    await page.getByTestId('bulk-confirm').getByRole('button', { name: 'Confirm and submit' }).click();
    await expect(page.getByTestId('bulk-result-status')).toHaveAttribute('data-status', 'pending_approval');
    await expect(page.getByTestId('bulk-history-row')).toHaveCount(1);
    await expect(page.getByTestId('bulk-history-row')).toHaveAttribute('data-status', 'pending_approval');
    await expect(page.getByTestId('bulk-history-row')).toContainText(name);

    const approvals = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '[]'), APPROVALS_KEY);
    expect(approvals).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'bulk_freebet_award', name })]));
  });

  test('7. Cash batch: no expiry or terms, review shows Cash, result reports "no expiry" and Cash in history', async ({ page }) => {
    const name = 'Cash VIP top-up';
    await openBulk(page);
    await page.getByTestId('bulk-award-cash').click();
    await page.getByTestId('bulk-details-name').fill(name);
    await page.getByTestId('bulk-next').getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('bulk-panel-2')).toBeVisible();
    await upload(page, 'valid-gh.csv');
    await goToValidate(page);
    await goToReview(page);
    await expect(page.getByTestId('bulk-review-award-type')).toHaveText('Cash');
    await expect(page.getByTestId('bulk-review-expiry')).toHaveText('No expiry');
    await expect(page.getByTestId('bulk-review-terms')).toHaveCount(0);
    await expect(page.getByTestId('bulk-review-sms-method')).toContainText('Automated');
    await page.getByTestId('bulk-confirm').getByRole('button', { name: 'Confirm and submit' }).click();
    await expect(page.getByTestId('bulk-result-status')).toHaveAttribute('data-status', 'awarded');
    await expect(page.getByTestId('bulk-result-sub')).toContainText('Cash · no expiry');
    await expect(page.getByTestId('bulk-result-units')).toHaveCount(0);
    await expect(page.getByTestId('bulk-history-type')).toHaveText('Cash');
  });

  test('8. profile_id + rounds file: units are totalled on Validate, Review and Result', async ({ page }) => {
    await openBulk(page);
    await enterDetails(page, 'VIP rounds batch');
    await upload(page, 'vip-gh.csv');
    await expect(page.getByTestId('bulk-file-error')).toHaveCount(0);
    await goToValidate(page);
    await expect(page.getByTestId('bulk-summary-valid')).toHaveText('6');
    await expect(page.getByTestId('bulk-summary-error')).toHaveText('0');
    await expect(page.getByTestId('bulk-summary-total')).toHaveText('GHS 1,000.00');
    await expect(page.getByTestId('bulk-summary-units')).toHaveText('1,200');
    await expect(page.getByTestId('bulk-preview-units-header')).toBeVisible();
    await expect(page.getByTestId('bulk-preview-row').first()).toContainText('GH-VIP-1001');
    await goToReview(page);
    await expect(page.getByTestId('bulk-review-units')).toHaveText('1,200');
    await expect(page.getByTestId('bulk-review-customers')).toHaveText('6');
    await page.getByTestId('bulk-confirm').getByRole('button', { name: 'Confirm and submit' }).click();
    await expect(page.getByTestId('bulk-result-status')).toHaveAttribute('data-status', 'awarded');
    await expect(page.getByTestId('bulk-result-units')).toHaveText('1,200');
  });

  test('9. unknown headers are mapped manually on step 2b; Back from Validate returns to the mapping', async ({ page }) => {
    await openBulk(page);
    await enterDetails(page, 'Mapped columns batch');
    await upload(page, 'mapping-needed.csv');
    await expect(page.getByTestId('bulk-file-error')).toHaveAttribute('data-tone', 'info');
    await expect(page.getByTestId('bulk-file-error')).toContainText('Customer ID and Amount');
    await page.getByTestId('bulk-next').getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('bulk-panel-2b')).toBeVisible();
    await expect(page.getByTestId('bulk-caption')).toContainText('Map columns');

    const cont = page.getByTestId('bulk-next').getByRole('button', { name: 'Continue' });
    await expect(cont).toBeDisabled();
    await page.getByTestId('bulk-mapping-select-customerId').selectOption({ label: 'player' });
    await expect(page.getByTestId('bulk-mapping-status')).toContainText('Still needed: Amount');
    await expect(cont).toBeDisabled();
    await page.getByTestId('bulk-mapping-select-amount').selectOption({ label: 'value' });
    await page.getByTestId('bulk-mapping-select-betId').selectOption({ label: 'ref' });
    await expect(page.getByTestId('bulk-mapping-status')).toContainText('All required fields are mapped');
    /* A column claimed by one field is disabled for the others. */
    await expect(page.getByTestId('bulk-mapping-select-turnover').locator('option', { hasText: 'value' })).toBeDisabled();

    await cont.click();
    await expect(page.getByTestId('bulk-panel-3')).toBeVisible();
    await expect(page.getByTestId('bulk-summary-valid')).toHaveText('3');
    await expect(page.getByTestId('bulk-summary-total')).toHaveText('GHS 60.00');
    await expect(page.getByTestId('bulk-preview-row').first()).toContainText('MAP-1');

    await page.getByTestId('bulk-back').getByRole('button', { name: 'Back' }).click();
    await expect(page.getByTestId('bulk-panel-2b')).toBeVisible();
    await expect(page.getByTestId('bulk-mapping-select-amount')).toHaveValue('1');

    /* Selecting a new file resets the per-upload mapping. */
    await page.getByTestId('bulk-back').getByRole('button', { name: 'Back' }).click();
    await expect(page.getByTestId('bulk-panel-2')).toBeVisible();
    await upload(page, 'valid-gh.csv');
    await expect(page.getByTestId('bulk-file-error')).toHaveCount(0);
    await goToValidate(page);
    await expect(page.getByTestId('bulk-summary-valid')).toHaveText('5');
  });

  test('10. fixed GMT expiry + manual SMS owner flow through Review and the recipient list download', async ({ page }) => {
    const name = 'Bonus fixed cut-off';
    const next = page.getByTestId('bulk-next').getByRole('button', { name: 'Next' });
    await openBulk(page);
    await page.getByTestId('bulk-award-bonus').click();
    await page.getByTestId('bulk-details-name').fill(name);
    await page.getByTestId('bulk-details-min-odds').fill('2');
    await page.getByTestId('bulk-details-max-win').fill('1000');
    await page.getByTestId('bulk-details-rollover').fill('5');

    /* Fixed date: Next is gated until a valid GMT date-time is entered. */
    await page.getByTestId('bulk-expiry-mode-absolute').click();
    await expect(next).toBeDisabled();
    await page.getByTestId('bulk-details-expiry-absolute').fill('2027-06-04T23:59');
    await expect(page.getByTestId('bulk-details-expiry-absolute-hint')).toContainText('4 Jun 2027, 23:59 GMT');
    await expect(next).toBeEnabled();

    /* Manual SMS: the owner is mandatory. */
    await page.getByTestId('bulk-sms-method-manual').check();
    await expect(next).toBeDisabled();
    await page.getByTestId('bulk-details-sms-owner').fill('CRM team');
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByTestId('bulk-panel-2')).toBeVisible();

    await upload(page, 'valid-gh.csv');
    await goToValidate(page);
    await goToReview(page);
    await expect(page.getByTestId('bulk-review-award-type')).toHaveText('Bonus');
    await expect(page.getByTestId('bulk-review-expiry')).toContainText('4 Jun 2027, 23:59 GMT');
    await expect(page.getByTestId('bulk-review-min-odds')).toHaveText('2.00');
    await expect(page.getByTestId('bulk-review-max-win')).toHaveText('GHS 1,000.00');
    await expect(page.getByTestId('bulk-review-terms')).toContainText('5×');
    await expect(page.getByTestId('bulk-review-sms-method')).toHaveText('Manual · CRM team');

    await page.getByTestId('bulk-confirm').getByRole('button', { name: 'Confirm and submit' }).click();
    await expect(page.getByTestId('bulk-result-status')).toHaveAttribute('data-status', 'awarded');
    await expect(page.getByTestId('bulk-result-sms')).toHaveAttribute('data-sms-method', 'manual');
    await expect(page.getByTestId('bulk-result-sms')).toContainText('CRM team to send to 5 recipients');
    await expect(page.getByTestId('bulk-result-sub')).toContainText('expiry 4 Jun 2027, 23:59 GMT');

    const link = page.getByTestId('bulk-recipients-download');
    await expect(link).toContainText('(5)');
    await expect(link).toHaveAttribute('download', /-sms-recipients\.csv$/);
    await expect(link).not.toHaveAttribute('aria-disabled', 'true');
    const csv = await readCsvLink(link);
    const lines = csv.trim().split(/\r?\n/);
    expect(lines[0]).toBe('customer,amount,expiry,message');
    expect(lines).toHaveLength(6);
    expect(lines[1]).toContain('233241234567');
    expect(lines[1]).toContain('GHS 25.00');
    expect(lines[1]).toContain('4 Jun 2027, 23:59 GMT');
  });
});
