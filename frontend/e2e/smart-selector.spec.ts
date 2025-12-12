import { test, expect } from '@playwright/test';

test.describe('Smart Selector & On-the-go Creation', () => {
    
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByLabel('Username').fill('admin');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(/\/$|\/dashboard|\/orders/);
    });

    test('Expense Creation with New Recipient via Smart Selector', async ({ page }) => {
        const uniqueName = `Test Recipient ${Date.now()}`;
        
        await page.goto('/expenses/new');
        
        // Fill Date (default is today)
        // Fill Amount
        await page.getByLabel('Amount').fill('150.50');
        
        // Smart Selector
        await page.getByPlaceholder('Search recipient...').fill(uniqueName);
        // Wait for search debounce
        await page.waitForTimeout(1000); 
        
        // Expect "Create New" option
        const createOption = page.getByText(`+ Create "${uniqueName}"`);
        await expect(createOption).toBeVisible();
        await createOption.click();
        
        // Selector should now show selected name (value of input)
        await expect(page.getByPlaceholder('Search recipient...')).toHaveValue(uniqueName);
        
        // Select Category
        await page.getByLabel('Category').selectOption({ index: 1 }); // Select second option (index 0 is placeholder)
        
        await page.getByLabel('Description').fill('E2E Test Expense');
        
        // Save
        await page.getByRole('button', { name: 'Save Expense' }).click();
        
        // Check redirect to list
        await expect(page).toHaveURL(/\/expenses$/);
        
        // Verify in list
        await expect(page.getByText('E2E Test Expense')).toBeVisible();
        await expect(page.getByText(`-₹150.50`)).toBeVisible();
    });

    test('Quick Sale with New Customer via Smart Selector', async ({ page }) => {
        const uniqueName = `Test Customer ${Date.now()}`;

        await page.goto('/quick-sale');
        
        // Smart Selector for Customer
        // Initially "Walk-In". Click Change or Search input might be visible if I adjusted logic?
        // Logic: {customer.id || customer.name === 'Walk-In' ? (Change Button) : (Selector)}
        // By default "Walk-In" is selected.
        
        // Click "Change"
        await page.getByText('Change').click();
        
        const searchInput = page.getByPlaceholder('Search Customer...');
        await expect(searchInput).toBeVisible();
        
        await searchInput.fill(uniqueName);
        await page.waitForTimeout(1000);
        
        const createOption = page.getByText(`+ Create "${uniqueName}"`);
        await expect(createOption).toBeVisible();
        await createOption.click();
        
        // Verify selection (Input replaced by "Selected" view again?)
        // Logic: onSelect -> setCustomer({ name: uniqueName, id: null ... })
        // If name != '', it renders the "Selected" view (blue box)
        await expect(page.getByText(uniqueName, { exact: true })).toBeVisible();
        
        // Add Item
        // For Quick Sale, we need valid item?
        // Default item exists. Need to set Product.
        // Product Autocomplete inside.
        // Let's just create a dummy product or use existing.
        // Or type explicit values if allowed?
        // Autocomplete uses "productName". If I type "Test Product", checks productId.
        // QuickSale.jsx item logic:
        // onChange 'productName' -> set productId null.
        // It allows free text?
        // Logic: validItems = items.filter(i => i.productName && Number(i.quantity) > 0);
        // processItems in backend creates product if not exists.
        
        const productInput = page.getByPlaceholder('Scan or Search Product');
        await productInput.fill('Test Product E2E');
        // Click away or tab to ensure change registered?
        await page.getByPlaceholder('Notes').first().click(); // focus elsewhere
        
        await page.getByPlaceholder('0.00').first().fill('100'); // Price
        
        // Verify total
        await expect(page.getByText('₹100')).toBeVisible();
        
        // Complete Sale
        await page.getByRole('button', { name: /Complete Sale/ }).click();
        
        // Check redirect
        await expect(page).toHaveURL(/\/orders$/);
        
        // Verify Order in list?
        // It might be top of list.
        // await expect(page.getByText(uniqueName)).toBeVisible(); // Might be in table
    });

});
