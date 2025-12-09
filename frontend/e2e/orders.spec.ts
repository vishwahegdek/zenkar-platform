
import { test, expect } from '@playwright/test';

test.describe('Order Management Flow', () => {
  
  test('Create Order, Add Payment, and Close', async ({ page }) => {
    // 1. Navigate to Create Order
    await page.goto('/');
    await page.getByLabel('New Order').click();
    await expect(page).toHaveURL(/\/orders\/new/);

    // 2. Fill Customer Details (Priya Sharma)
    await page.getByPlaceholder('Search or type new name...').fill('Priya Sharma');
    // Select the "create new" option if it appears or just it fills the input
    // The InputWithSuggestions component might need special handling if it's a combobox
    // Assuming standard input behavior for now or typing + filtering
    
    await page.fill('#customerPhone', '9988776655');
    await page.fill('#customerAddress', 'Flat 404, Tech Park, Hyderabad');
    
    // 3. Add Item (King Size Bed)
    // Initially one row exists
    await page.getByPlaceholder('Product Name').first().fill('King Size Bed');
    await page.getByPlaceholder('Description/Size').first().fill('6x6 feet, hydraulic storage');
    await page.getByPlaceholder('Qty').first().fill('1');
    await page.getByPlaceholder('Price').first().fill('25000');
    // lineTotal auto-calcs?
    
    // 4. Advance
    // Find input near "Advance" text
    await page.locator('div', { hasText: 'Advance' }).locator('input[type="number"]').last().fill('5000');
    
    // 5. Save
    await page.click('button:has-text("Save Order")');
    
    // 6. Verify Redirection and List Presence
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.locator('body')).toContainText('Priya Sharma');
    
    // 7. Go to Details
    await page.click('text=Priya Sharma');
    // Verify Details
    await expect(page.locator('body')).toContainText('King Size Bed');
    await expect(page.locator('body')).toContainText('Balance Due');
    
    // Balance should be 25000 - 5000 = 20000
    await expect(page.locator('body')).toContainText('20,000');

    // 8. Record Payment
    await page.click('button:has-text("Record Payment")');
    await expect(page.locator('h2:has-text("Record Payment")')).toBeVisible(); // Modal title
    
    await page.fill('input[type="number"]:visible', '10000'); // Amount input in modal
    await page.fill('input[placeholder*="Note"]', 'Bank Transfer');
    await page.click('button:has-text("Save Payment")');
    
    // 9. Verify Balance Update
    // Total Paid: 15000. Balance: 10000.
    await expect(page.locator('body')).toContainText('Balance Due');
    await expect(page.locator('body')).toContainText('10,000');
    
    // 10. Close Order
    await page.click('text=Back to Orders');
    
    // Find row with Priya Sharma
    const row = page.locator('tr', { hasText: 'Priya Sharma' });
    // Or card on mobile. Tests run on multiple viewports.
    // Use generic locator strategies.
    
    // Handle Dialog for Closing
    page.on('dialog', dialog => dialog.accept());
    
    // Select Status "Closed"
    // Use "select" locator inside the row/card
    // We used StatusSelect component with <select>
    
    // Need to find the select associated with Priya Sharma
    // Best way: filter for container having "Priya Sharma" then find select
    const container = page.locator('div, tr').filter({ hasText: 'Priya Sharma' }).last();
    const select = container.locator('select');
    await select.selectOption('closed');
    
    // 11. Verify Status Closed
    // Wait for network content update? useQuery invalidation happens.
    await expect(select).toHaveValue('closed');
    
    // 12. Verify Zero Balance
    // Click to details
    await container.click();
    await expect(page.locator('body')).toContainText('Discount');
    await expect(page.locator('body')).toContainText('−₹10,000'); // Discount equal to remaining
    
    // Final check: Balance Due 0
    // It might be "₹0"
    await expect(page.locator('tfoot')).toContainText('₹0');
  });
});
