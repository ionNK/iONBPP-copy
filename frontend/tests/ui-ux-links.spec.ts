import { test, expect, Page } from '@playwright/test';

/**
 * UI/UX audit: crawl every admin route, verify it renders (no 404, no
 * uncaught page errors), then collect every in-app <a href> link on the page
 * and assert each target route resolves without a Next.js 404 boundary.
 *
 * This test does not attempt to fix anything — it reports findings.
 */

const ROUTES: string[] = [
  '/admin',
  '/admin/crm',
  '/admin/crm/players',
  '/admin/crm/segments',
  '/admin/crm/intelligence',
  '/admin/crm/responsible-gaming',
  '/admin/crm/analytics',
  '/admin/promotions',
  '/admin/manual-award',
  '/admin/promotions/customer-lookup',
  '/admin/promotions/audit',
  '/admin/governance',
  '/admin/experiments',
  '/admin/reports',
  '/admin/predictions/churn',
  '/admin/predictions/promotions',
  '/admin/promotions/monitor',
  '/admin/promotions/create',
  '/admin/promotions/templates',
  '/admin/settings',
];

// Detect the Next.js "page could not be found" 404 boundary.
async function isNotFound(page: Page): Promise<boolean> {
  const body = (await page.locator('body').innerText()).toLowerCase();
  return (
    body.includes('404') &&
    (body.includes('this page could not be found') ||
      body.includes('page not found'))
  );
}

test.describe('UI/UX Link & Navigation Audit', () => {
  // Each route should load cleanly (no 404, no console/page errors).
  for (const route of ROUTES) {
    test(`route loads: ${route}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => pageErrors.push(err.message));

      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Next.js serves 404 pages with a 200/404; check both signal & content.
      const status = resp?.status() ?? 0;
      const notFound = await isNotFound(page);

      expect(
        notFound,
        `Route ${route} rendered a 404 boundary (http ${status})`,
      ).toBeFalsy();

      // Surface uncaught runtime errors (not just console noise).
      expect(
        pageErrors,
        `Route ${route} threw runtime error(s): ${pageErrors.join(' | ')}`,
      ).toHaveLength(0);
    });
  }

  // Crawl links on each route and verify every internal href resolves.
  test('all in-app links resolve (no dead links)', async ({ page }) => {
    const broken: string[] = [];
    const checked = new Set<string>();

    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      const hrefs = await page.$$eval('a[href]', (as) =>
        as
          .map((a) => a.getAttribute('href') || '')
          .filter(
            (h) =>
              h.startsWith('/') &&
              !h.startsWith('//') &&
              !h.startsWith('/api') &&
              !h.startsWith('/_next'),
          ),
      );

      for (const href of hrefs) {
        // Skip dynamic-detail duplicates already validated & external assets.
        const key = href.split('?')[0].split('#')[0];
        if (checked.has(key)) continue;
        checked.add(key);

        const dest = await page.goto(key, { waitUntil: 'domcontentloaded' }).catch(() => null);
        const status = dest?.status() ?? 0;
        const notFound = await isNotFound(page);
        if (notFound || status >= 400) {
          broken.push(`${key} (from ${route}, http ${status}${notFound ? ', 404 boundary' : ''})`);
        }
      }
    }

    expect(broken, `Broken/dead links found:\n${broken.join('\n')}`).toHaveLength(0);
  });

  // Sidebar navigation should be present and clickable on the dashboard.
  test('sidebar nav links are present and navigate', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    const navIds = [
      'nav-dashboard',
      'nav-crm',
      'nav-crm-players',
      'nav-crm-segments',
      'nav-promotions',
      'nav-manual-award',
      'nav-customer-lookup',
      'nav-audit',
      'nav-governance',
      'nav-experiments',
      'nav-reports',
      'nav-pred-churn',
      'nav-pred-promotions',
    ];

    const missing: string[] = [];
    for (const id of navIds) {
      const el = page.locator(`#${id}`);
      if ((await el.count()) === 0) missing.push(id);
    }

    expect(missing, `Sidebar nav items missing: ${missing.join(', ')}`).toHaveLength(0);

    // Click a representative sample and confirm URL changes.
    await page.locator('#nav-customer-lookup').click();
    await expect(page).toHaveURL(/\/admin\/promotions\/customer-lookup/);

    await page.locator('#nav-audit').click();
    await expect(page).toHaveURL(/\/admin\/promotions\/audit/);

    await page.locator('#nav-governance').click();
    await expect(page).toHaveURL(/\/admin\/governance/);
  });
});
