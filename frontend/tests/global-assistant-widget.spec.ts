import { test, expect } from '@playwright/test';

test.describe('Global Assistant Widget', () => {
 test('mounts above the application and preserves its open and close state flow', async ({ page }) => {
 await page.goto('/customer');

 const widget = page.locator('.assistant-widget');
 const trigger = widget.locator('.assistant-widget__trigger');
 const window = widget.locator('.assistant-widget__window');

 await expect(widget).toBeVisible();
 await expect(trigger).toBeVisible();
 await expect(window).toHaveCount(0);
 await expect(widget).toHaveCSS('position', 'fixed');
 await expect(widget).toHaveCSS('z-index', '99999');
 await expect(widget).toHaveCSS('pointer-events', 'auto');

 await trigger.click();
 await expect(window).toBeVisible();
 await expect(window).toHaveCSS('z-index', '100001');
 await expect(trigger).toHaveClass(/is-open/);
 await expect(window.getByRole('heading', { name: 'Betika AI Assistant' })).toBeVisible();

 await window.locator('.assistant-widget__icon-button').first().click();
 await expect(window).toHaveCount(0);
 await expect(trigger).not.toHaveClass(/is-open/);
 });

 test('preserves controlled input, send enablement, and immediate user-message state', async ({ page }) => {
 await page.goto('/customer');

 const widget = page.locator('.assistant-widget');
 await widget.locator('.assistant-widget__trigger').click();

 const input = widget.getByPlaceholder('Type your question...');
 const sendButton = widget.locator('.assistant-widget__send-button');
 await expect(sendButton).toBeDisabled();

 await input.fill('Where are my rewards?');
 await expect(sendButton).toBeEnabled();
 await input.press('Enter');

 await expect(input).toHaveValue('');
 await expect(widget.locator('.assistant-widget__message-row--user')).toContainText('Where are my rewards?');
 await expect(widget.locator('.assistant-widget__typing-bubble')).toBeVisible();
 });
});
