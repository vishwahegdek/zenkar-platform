import { test, expect } from '@playwright/test';

test.describe('Order Management', () => {
  test('should create a new order successfully', async ({ page }) => {
    // Navigate to Order Creation Page
    await page.goto('/orders/new');

    // Fill Customer Details
    // "Customer Name" is an Autocomplete with specific placeholder
    await page.getByPlaceholder('Search or type new name...').fill('Test Customer');
    
    // Select the option if it appears as "Create new..." or just filling is enough if it allows custom
    // Based on code: onChange sets customerName. 
    // We might need to press Enter or Tab to confirm if it's strictly a selection, 
    // but the code says `onChange={(val) => setFormData({...formData, customerName: val, ...` 
    // so typing might be enough for "New Customer" flow.

    await page.getByLabel('Phone').fill('9876543210');
    await page.getByLabel('Address').fill('123 Test St');

    // Add an Item
    // Button text is "+ Add Item"
    await page.getByRole('button', { name: '+ Add Item' }).click();
    
    // Fill Item Details (Assuming first item row)
    // We use .first() because "Add Item" might create a second row if one existed, 
    // but default state has one empty row? 
    // Code: `items: [{...}]` on mount if !isEdit. So there is already one row.
    // "Add Item" adds a *second* row. We should just fill the existing first row.
    
    await page.getByPlaceholder('Product Name').first().fill('Test Product');
    // Similarly, product name typing might be enough.
    
    await page.getByPlaceholder('Qty').first().fill('2');
    await page.getByPlaceholder('Price').first().fill('500');

    // Wait for auto-save or focus change
    await page.getByLabel('Internal Notes').click();

    // Verify Total (2 * 500 = 1000)
    // Verify Total (2 * 500 = 1000)
    // Total is displayed in a div with 'text-lg font-bold'
    await expect(page.locator('.text-lg.font-bold').getByText('₹1,000', { exact: false })).toBeVisible(); 

    // Submit Order
    await page.getByRole('button', { name: 'Save Order' }).click();

    // Verify Success
    // Expect redirection to /orders. 
    // Note: The app navigates to '/orders' on success.
    await expect(page).toHaveURL(/\/orders$/);
  });
});
