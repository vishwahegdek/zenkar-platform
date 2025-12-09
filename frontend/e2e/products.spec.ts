import { test, expect } from '@playwright/test';

test.describe('Product Management Flow', () => {

  const productName = 'Test Product ' + Date.now();
  const productPrice = '1500';
  const productNotes = 'This is a test product note.';

  test('Create, Search, and Edit Product', async ({ page }) => {
    // 1. Navigate to Products Page
    await page.goto('/products');
    await expect(page).toHaveURL(/.*\/products/);

    // 2. Click New Product
    await page.locator('a[href="/products/new"]').click();
    await expect(page.locator('h1')).toContainText('New Product');

    // 3. Fill Form
    // Name
    await page.fill('input[placeholder="e.g. Wooden Chair"]', productName);
    // Price - it's the second input, or we can find by label if we use locator strategies carefully
    // Using placeholder-less inputs is tricky, but we know the structure.
    // Price is the input after "Default Price (₹)" label.
    // Or we can just use order. Name is 1st input, Price is 2nd.
    // Let's use locators more robustly if possible.
    // The input has type="number"
    await page.locator('input[type="number"]').fill(productPrice);
    
    // Notes
    await page.fill('textarea[placeholder="Internal notes about this product..."]', productNotes);

    // 4. Save
    await page.click('button:has-text("Save Product")');

    // 5. Verify Redirection and List
    await expect(page).toHaveURL(/\/products$/);

    // Search
    await page.fill('input[placeholder="Search products..."]', productName);
    
    // Verify content
    // Check if name is visible
    await expect(page.locator('body')).toContainText(productName);
    // Check price formatted (comma separated if needed, but 1500 might be 1,500)
    // The list uses toLocaleString()
    await expect(page.locator('body')).toContainText('1,500');

    // 6. Edit Product
    // Locate the edit button. In desktop it's a link with pencil icon inside a table row.
    // In mobile it's a link "Edit".
    // We can look for the row/card with the product name.
    
    // Wait for the element to potentially stabilize
    const productContainer = page.locator('tr, div.space-y-2', { hasText: productName }).first();
    
    // Click edit. The link href contains /edit
    await productContainer.locator('a[href*="/edit"]').click();

    await expect(page.locator('h1')).toContainText('Edit Product');
    
    // Change price
    const newPrice = '2000';
    await page.locator('input[type="number"]').fill(newPrice);
    
    await page.click('button:has-text("Save Product")');
    
    // 7. Verify Update
    await expect(page).toHaveURL(/\/products$/);
    await page.fill('input[placeholder="Search products..."]', productName);
    
    await expect(page.locator('body')).toContainText('2,000');
  });
});
