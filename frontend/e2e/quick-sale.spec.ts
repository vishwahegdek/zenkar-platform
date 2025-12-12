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

  test('Perform Quick Sale (Walk-In)', async ({ page }) => {
    // 0. Pre-requisite: Create a known product via API to ensure it exists
    // Use page.request to share auth state from UI login
    // Retrieve token from localStorage (set during login)
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    const testProductName = 'Test Sale Product ' + Date.now();
    const createRes = await page.request.post('/api/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: testProductName,
        defaultUnitPrice: 500,
        notes: 'E2E Test Product'
      }
    });
    expect(createRes.ok()).toBeTruthy();

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
    
    // Wait for list item to be visible and stable
    // Ensure we select the actual product, not the "Create" option
    const productOption = page.locator('li').filter({ hasText: testProductName }).filter({ hasNotText: 'Create' });
    await expect(productOption).toBeVisible();
    await page.waitForTimeout(500); // Debounce stability
    await productOption.click();
    
    // Auto-filled price should be 500
    await expect(page.getByLabel('Price').first()).toHaveValue('500');

    // 3. Update Quantity
    const qtyInput = page.getByLabel('Quantity').first(); // Qty is first number input in row
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
    await page.getByPlaceholder('Add note...').fill('E2E Test Note');

    // 7. Complete Sale
    // Desktop button or Mobile FAB
    await page.locator('button:visible').filter({ hasText: /Complete Sale|✓/ }).first().click();

    // 8. Verify Success and Redirect
    await expect(page).toHaveURL(/\/orders/);
    
    // 9. Verify Order in List
    // Ensure loading is done
    await expect(page.getByText('Loading orders...')).toBeHidden();
    // Should be "Walk-In"
    await expect(page.locator('body')).toContainText('Walk-In');
    
    // 10. Verify Order Details (Closed status)
    // Click on the matching row
    // Use visible text match to handle Mobile (first in DOM) vs Desktop (second in DOM, first hidden)
    await page.locator(':text("Walk-In"):visible').first().click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    
    // Status should be Closed
    // Note: Quick Sale sets status='closed'
    // Depending on logic, it might not show status dropdown or it might show 'Closed'
    // Let's check for 'Closed' text
    // Let's check for 'Closed' text (OrderDetails uses a StatusBadge span, not select)
    await expect(page.locator('span').filter({ hasText: /^closed$/i })).toBeVisible();
    
    // Verify Payment Note
    await expect(page.locator('body')).toContainText('UPI'); // Method stored
    await expect(page.locator('body')).toContainText('E2E Test Note');
  });
});
