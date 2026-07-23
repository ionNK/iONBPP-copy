import { test, expect } from '@playwright/test';

/**
 * Live Monitoring is mounted within the Analytics & Reports route, rather than
 * having its own URL. Keep this check narrow: it proves the previously
 * untested tab mounts its promotions, controls, and primary navigation link.
 */
test('Live Monitoring tab renders promotions and can pause polling', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hasSeenTour', 'true'));
  await page.goto('/admin/reports', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Live Monitoring' }).click();

  const monitor = page.locator('.live-monitoring');
  await expect(monitor).toBeVisible();
  await expect(monitor.getByText('Real-time promotion funnel, outcomes and budget burn.')).toBeVisible();
  await expect(monitor.locator('.card')).toHaveCount(3);
  await expect(monitor.getByRole('link', { name: 'Ethiopia Acca Insurance' })).toHaveAttribute('href', '/admin/promotions/PRM-2024-001');
  await expect(monitor.locator('.oc-btn').first()).toBeVisible();

  const liveToggle = monitor.getByRole('button', { name: /Live/ });
  await liveToggle.click();
  await expect(monitor.getByRole('button', { name: /Paused/ })).toBeVisible();
});
