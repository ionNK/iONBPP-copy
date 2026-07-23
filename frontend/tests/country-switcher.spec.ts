import { test, expect, type Page } from '@playwright/test';

const COUNTRY_SCOPE_KEY = 'crm_country_scope';

async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('hasSeenTour', 'true');
  });
}

test.describe('CountrySwitcher', () => {
  test('opens and closes from the trigger, outside click, and Tab path', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/admin/experiments');

    const trigger = page.getByRole('button', { name: /All Countries/i });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('listbox')).toBeVisible();

    await page.getByRole('heading', { name: 'Experiments', exact: true }).click();
    await expect(page.getByRole('listbox')).toBeHidden();

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();

 await page.keyboard.press('Tab');
 await expect(page.getByRole('option', { name: /All Countries Aggregate/i })).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('listbox')).toBeHidden();
  });

  test('shows only permitted market options and selects a market through Space', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/admin/experiments');

    const trigger = page.getByRole('button', { name: /All Countries/i });
    await trigger.focus();
    await page.keyboard.press('Space');

    const options = page.getByRole('option');
    await expect(options).toHaveCount(8);
    await expect(page.getByRole('option', { name: /All Countries Aggregate/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Kenya KES/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Ghana GHS/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Tanzania TZS/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Ethiopia ETB/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Nigeria NGN/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Uganda UGX/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Zambia ZMW/i })).toBeVisible();

    const kenya = page.getByRole('option', { name: /Kenya KES/i });
    await kenya.click();

    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(page.getByRole('button', { name: /Kenya/i })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('button', { name: /Kenya/i })).toContainText('Kenya');
    await expect(page.getByText('Test, validate, and scale campaign decisions · Kenya.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Kenya/i })).toHaveAccessibleName(/Kenya/);
  });

  test('persists the selected market and updates a reactive consumer after reload', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hasSeenTour', 'true');
      window.localStorage.setItem('crm_country_scope', 'KE');
    });
    await page.goto('/admin/experiments');

    await expect(page.getByRole('button', { name: /Kenya/i })).toBeVisible();
    await expect(page.getByText('Test, validate, and scale campaign decisions · Kenya.')).toBeVisible();
    await expect(page.locator('.metric-item').filter({ hasText: /^1Active experiments$/ })).toHaveCount(1);

    await page.reload();

    await expect(page.getByRole('button', { name: /Kenya/i })).toBeVisible();
    await expect(page.getByText('Test, validate, and scale campaign decisions · Kenya.')).toBeVisible();
    await expect(page.locator('.metric-item').filter({ hasText: /^1Active experiments$/ })).toHaveCount(1);
    await expect(page.evaluate((key) => window.localStorage.getItem(key), COUNTRY_SCOPE_KEY)).resolves.toBe('KE');
  });
});
