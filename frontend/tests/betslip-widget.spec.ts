import { test, expect } from '@playwright/test';

test.describe('BetSlipWidget', () => {
  test('places a wager, exposes it in My Bets, and cashes it out into Settled history', async ({ page }) => {
    await page.goto('/customer/sports');

    const matchCard = page.locator('.s-match-card').filter({ hasText: 'Real Madrid' });
    await matchCard.getByRole('button', { name: /Real Madrid 2\.80/ }).click();

    const betSlip = page.locator('.betslip-widget');
    await expect(betSlip).toHaveClass(/open/);
    await expect(betSlip).toContainText('Real Madrid');

    await betSlip.getByRole('button', { name: '+100' }).click();
    await expect(betSlip.getByRole('button', { name: 'Review & Place Bet' })).toBeEnabled();
    await betSlip.getByRole('button', { name: 'Review & Place Bet' }).click();

    await expect(betSlip.getByRole('heading', { name: 'Placement Summary' })).toBeVisible();
    await expect(betSlip).toContainText('KRA Excise Duty');
    await betSlip.getByRole('button', { name: 'Place Bet Now' }).click();

    await expect(betSlip.getByRole('heading', { name: 'Bet Placed' })).toBeVisible({ timeout: 5000 });
    await expect(betSlip).toContainText('Net Potential Payout');
    await betSlip.getByRole('button', { name: 'Go to My Bets' }).click();

    await expect(betSlip.getByRole('button', { name: /My Bets/ })).toHaveClass(/active/);
    const cashOut = betSlip.getByRole('button', { name: /Cash Out KES/ });
    await expect(cashOut).toBeVisible();
    await cashOut.click();

    await betSlip.getByRole('button', { name: 'Settled' }).click();
    await expect(betSlip).toContainText('CASHED_OUT');
    await expect(betSlip).toContainText('Net Payout');
  });
});
