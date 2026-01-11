import { test, expect } from '@playwright/test';

test.describe('Finance Module - History', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    
  });

  test('full history flow', async ({ page }) => {
      await page.goto('/finance');
      
      // 1. Create Party
      await page.click('text=Add Party');
      const partyName = `History Check ${Date.now()}`;
      await page.fill('input[name="name"]', partyName);
      await page.click('button:has-text("Save Party")');
      await expect(page.getByText(partyName)).toBeVisible();

      // 2. Add Transaction
      const partyCard = page.locator('.group', { hasText: partyName });
      await partyCard.getByRole('button', { name: 'Transaction' }).click();
      await page.fill('input[name="amount"]', '1000');
      await page.fill('textarea[name="note"]', 'Test Note 123');
      await page.click('button:has-text("Save Transaction")');
      await expect(page.getByText('Transaction saved')).toBeVisible();

      // 3. Open History
      await partyCard.getByTitle('View History').click();
      
      // 4. Verify Modal
      await expect(page.getByText(`History - ${partyName}`)).toBeVisible();
      const modal = page.locator('.fixed.inset-0'); // Generic modal container based on class in Modal.jsx
      
      // 5. Verify Transaction in List and Balance
      // Should appear twice: once in summary, once in list
      await expect(modal.getByText('1,000.00')).toHaveCount(2);
      await expect(modal.getByText('Test Note 123')).toBeVisible();

      // 6. Close
      await modal.getByRole('button', { name: 'Close' }).click();
      await expect(modal).not.toBeVisible();
  });
});
