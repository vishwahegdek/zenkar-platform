import { test, expect } from '@playwright/test';

test.describe('Quick Sale Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/$|\/orders/, { timeout: 30000 });
    await page.goto('/quick-sale');
  });

  test('Perform Quick Sale (Walk-In)', async ({ page, request }) => {
    // 0. Pre-requisite: Create a known product via API to ensure it exists
    const testProductName = 'Test Sale Product ' + Date.now();
    await request.post('/api/products', {
      data: {
        name: testProductName,
        defaultUnitPrice: 500,
        notes: 'E2E Test Product'
      }
    });

    // 1. Verify Default State
    await expect(page.locator('h1')).toContainText('Quick Sale');
    // Check "Walk-In" is default customer
    await expect(page.locator('text=Walk-In')).toBeVisible();
    await expect(page.locator('text=Default')).toBeVisible();

    // 2. Add Item
    // Product Name (Seeded Product)
    await page.fill('input[placeholder="Scan or Search Product"] >> nth=0', testProductName);
    
    // Wait for the search request to complete explicitly
    await page.waitForResponse(resp => resp.url().includes('/products?query=') && resp.status() === 200);
    
    // Select the existing product from list
    await page.click(`li:has-text("${testProductName}")`);
    
    // Auto-filled price should be 500
    await expect(page.locator('input[className*="text-right"]').first()).toHaveValue('500');

    // 3. Update Quantity
    const qtyInput = page.locator('input[type="number"]').first(); // Qty is first number input in row
    await qtyInput.fill('2');

    // 4. Verify Total
    // 500 * 2 = 1000
    await expect(page.locator('div:has-text("Total Amount:")').last()).toContainText('1,000');
    
    // 5. Select Payment Method
    // Default is Cash, let's switch to UPI
    await page.click('button:has-text("UPI")');
    // Verify selection visual change (bg-blue-600)
    const upiBtn = page.locator('button:has-text("UPI")');
    await expect(upiBtn).toHaveClass(/bg-blue-600/);

    // 6. Add Internal Note
    await page.fill('textarea[placeholder="Optional notes..."]', 'E2E Test Note');

    // 7. Complete Sale
    // Desktop button or Mobile FAB
    await page.locator('button:visible').filter({ hasText: /Complete Sale|✓/ }).first().click();

    // 8. Verify Success and Redirect
    await expect(page).toHaveURL(/\/orders$/);
    
    // 9. Verify Order in List
    // Should be "Walk-In"
    await expect(page.locator('body')).toContainText('Walk-In');
    
    // 10. Verify Order Details (Closed status)
    // Click on the matching row
    await page.locator('tr, div').filter({ hasText: 'Walk-In' }).first().click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    
    // Status should be Closed
    // Note: Quick Sale sets status='closed'
    // Depending on logic, it might not show status dropdown or it might show 'Closed'
    // Let's check for 'Closed' text
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toHaveValue('closed');
    
    // Verify Payment Note
    await expect(page.locator('body')).toContainText('UPI'); // Method stored
    await expect(page.locator('body')).toContainText('E2E Test Note');
  });
});
