import { expect, test } from '@playwright/test';

/**
 * Dashboard → Promotion health card (PROTOTYPE, mock data).
 * No network mocking: every number comes from
 * src/lib/observability/mockPromotionHealth.ts. Run with --workers=1: the
 * cases share localStorage semantics and the dev server.
 */

const DASHBOARD = '/admin/dashboard';
const STORAGE_KEY = 'promo-health:selection';

/* Promotions-list ids; the picker must mirror every `active` row of PROMO_SEED. */
const FIRST_DEPOSIT_BOOST = 'PR-006';
const ACTIVE_OPTIONS = [
  'All active',
  'Aviator Welcome Offer',
  'Money Back (Sportsbook Cashback)',
 'Money Back (Sportsbook Cashback) B',

  'First Deposit Boost',
  'Midweek Free Spins',
  'Cashout Insurance',
];

/* First Deposit Boost, 24h: hourly base × 24 (candidates 96, qualified 52, awarded 47, notified 39). */
const FIRST_DEPOSIT_BOOST_24H = { candidates: '2,304', qualified: '1,248', awarded: '1,128', notified: '936' };

test.describe('Promotion health card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DASHBOARD);
    await expect(page.getByTestId('promo-health-card')).toBeVisible();
  });

  test('1. defaults to All active + Funnel and only offers active promotions', async ({ page }) => {
    const service = page.getByTestId('promo-health-service-select');
    const view = page.getByTestId('promo-health-view-select');

    await expect(service).toHaveValue('all_active');
    await expect(service.locator('option:checked')).toHaveText('All active');
    await expect(view).toHaveValue('funnel');
    await expect(page.getByTestId('promo-health-body')).toHaveAttribute('data-view', 'funnel');
    await expect(page.getByTestId('promo-health-range-24h')).toHaveAttribute('aria-pressed', 'true');

    /* Exactly the six active promotions-list entries, in list order. */
    const options = await service.locator('option').allTextContents();
    expect(options).toEqual(ACTIVE_OPTIONS);
    const values = await service.locator('option').evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value));
    expect(values).toEqual(['all_active', 'PR-001', 'PR-002', 'PR-002-B', 'PR-006', 'PR-007', 'PR-011']);
    expect(options.join('|')).not.toContain('Refer & Chop');
    expect(options.join('|')).not.toContain('100% Cash Stake Back');
    /* Scheduled / draft / expired list rows never appear. */
    expect(options.join('|')).not.toContain('Aviator Free Rounds');
    expect(options.join('|')).not.toContain('Weekend Acca Boost');

    /* Awarded value is no longer a view: counts, rates and alerts only. */
    const views = await view.locator('option').allTextContents();
    expect(views).toEqual(['Funnel', 'Failure rate', 'Alerts', 'Infrastructure']);
    expect(views.join('|')).not.toContain('Awarded value');
    await expect(page.getByTestId('promo-health-card')).not.toContainText('GHS');
  });

  test('2. selecting First Deposit Boost shows its funnel and survives a reload', async ({ page }) => {
    const service = page.getByTestId('promo-health-service-select');
    await service.selectOption(FIRST_DEPOSIT_BOOST);
    await expect(service.locator('option:checked')).toHaveText('First Deposit Boost');

    const body = page.getByTestId('promo-health-body');
    await expect(body.getByTestId('promo-health-funnel-candidates')).toContainText(FIRST_DEPOSIT_BOOST_24H.candidates);
    await expect(body.getByTestId('promo-health-funnel-qualified')).toContainText(FIRST_DEPOSIT_BOOST_24H.qualified);
    await expect(body.getByTestId('promo-health-funnel-awarded')).toContainText(FIRST_DEPOSIT_BOOST_24H.awarded);
    await expect(body.getByTestId('promo-health-funnel-notified')).toContainText(FIRST_DEPOSIT_BOOST_24H.notified);

    await page.reload();
    await expect(page.getByTestId('promo-health-service-select')).toHaveValue(FIRST_DEPOSIT_BOOST);
    await expect(page.getByTestId('promo-health-funnel-candidates')).toContainText(FIRST_DEPOSIT_BOOST_24H.candidates);

    const stored = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    expect(JSON.parse(stored ?? '{}')).toMatchObject({ service: FIRST_DEPOSIT_BOOST, view: 'funnel', range: '24h' });
  });

  test('3. a stored non-active promotion falls back to All active and rewrites storage', async ({ page }) => {
    await page.evaluate((key) => {
      /* PR-003 (Aviator Free Rounds) is `scheduled` on the promotions list, so it is never selectable. */
      window.localStorage.setItem(key, JSON.stringify({ service: 'PR-003', view: 'awarded_value', range: '24h' }));
    }, STORAGE_KEY);
    await page.reload();

    const service = page.getByTestId('promo-health-service-select');
    await expect(service).toHaveValue('all_active');
    await expect(service.locator('option:checked')).toHaveText('All active');
    /* The retired `awarded_value` view is coerced back to the default as well. */
    await expect(page.getByTestId('promo-health-view-select')).toHaveValue('funnel');

    await expect
      .poll(async () => {
        const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
        return raw ? (JSON.parse(raw) as { service?: string; view?: string }) : null;
      })
      .toMatchObject({ service: 'all_active', view: 'funnel' });
  });

  test('4. shows "Metrics unavailable" when the mock throws', async ({ page }) => {
    await page.addInitScript(() => {
      window.__PROMO_HEALTH_ERROR__ = true;
    });
    await page.reload();

    const body = page.getByTestId('promo-health-body');
    await expect(body).toContainText('Metrics unavailable');
    await expect(body.getByRole('status')).toContainText('Metrics unavailable · dev');
  });

  test('5. Alerts view renders 8 chips; First Deposit Boost has exactly one firing', async ({ page }) => {
    await page.getByTestId('promo-health-view-select').selectOption('alerts');
    await expect(page.getByTestId('promo-health-body')).toHaveAttribute('data-view', 'alerts');

    const chips = page.getByTestId('promo-health-alert-chip');
    await expect(chips).toHaveCount(8);
    const firing = page.locator('[data-testid="promo-health-alert-chip"][data-state="firing"]');

    /* All active rolls the single firing alert up into the header badge. */
    await expect(firing).toHaveCount(1);
    await expect(page.getByTestId('promo-health-firing-badge')).toContainText('1 firing');

    await page.getByTestId('promo-health-service-select').selectOption(FIRST_DEPOSIT_BOOST);
    await expect(chips).toHaveCount(8);
    await expect(firing).toHaveCount(1);
    await expect(firing).toHaveAttribute('title', 'PromoNotificationFailureRateHigh');
    await expect(page.getByTestId('promo-health-firing-badge')).toContainText('1 firing');

    /* A healthy list promotion has no firing alert and therefore no badge. */
    await page.getByTestId('promo-health-service-select').selectOption('PR-007');
    await expect(firing).toHaveCount(0);
    await expect(page.getByTestId('promo-health-firing-badge')).toHaveCount(0);
  });
});
