import { test, expect } from '@playwright/test';

test.describe('Expenses Management', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Username').fill('admin');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(/\/$|\/dashboard/);
    });

    test('Search and Edit Expense', async ({ page }) => {
        const uniqueDesc = `SearchTest_${Date.now()}`;
        
        // 1. Create Expense
        await page.goto('/expenses/new');
        await page.fill('input[name="amount"]', '150');
        await page.fill('textarea[name="description"]', uniqueDesc);
        // Select Category (assuming ids exist, selecting 2nd option)
        await page.selectOption('select[name="categoryId"]', { index: 1 });
        await page.getByRole('button', { name: 'Save Expense' }).click();
        await expect(page).toHaveURL(/\/expenses$/);

        // 2. Test Search (Debounced)
        const searchInput = page.getByPlaceholder('Search expenses...');
        await expect(searchInput).toBeVisible();
        await searchInput.fill(uniqueDesc);
        
        // Wait for row with unique desc. 
        // Use specific row class to avoid matching parent containers
        // The row in ExpensesBook has 'p-4 hover:bg-gray-50'
        const row = page.locator('.p-4.hover\\:bg-gray-50').filter({ hasText: uniqueDesc }).first();
        await expect(row).toBeVisible();
        await expect(row).toContainText(`-₹150`); 

        // 3. Click Edit
        // Scope specifically to this row
        await row.getByRole('link', { name: 'EDIT', exact: true }).click();
        
        // Verify we are on edit page
        await expect(page).toHaveURL(/\/expenses\/\d+\/edit/);
        
        // Change Amount
        const newAmount = '250.00';
        await page.getByPlaceholder('0.00').fill(newAmount);

        // Wait for Patch response
        const savePromise = page.waitForResponse(resp => resp.url().includes('/expenses') && resp.request().method() === 'PATCH' && resp.status() === 200);
        await page.getByRole('button', { name: 'Save Expense' }).click();
        await savePromise;

        // Verify Redirect
        await expect(page).toHaveURL(/\/expenses$/);
        
        // Wait for List reload
        await page.waitForResponse(resp => resp.url().includes('/expenses?') && resp.status() === 200);

        // Search again 
        await searchInput.fill(uniqueDesc);
        
        const updatedRow = page.locator('.p-4.hover\\:bg-gray-50').filter({ hasText: uniqueDesc }).first();
        await expect(updatedRow).toBeVisible();
        // Wait for it to NOT be 150 first (stale check)
        await expect(updatedRow).not.toContainText(`-₹150`);
        await expect(updatedRow).toContainText(`-₹${newAmount}`);
    });

    test('Date Navigation', async ({ page }) => {
        await page.goto('/expenses');
        
        // Check current date header is displayed
        // It shows 'Today' by default now.
        const header = page.locator('.text-base.font-bold.text-gray-900').first();
        await expect(header).toBeVisible();
        // Should contain 'Today' OR a year 
        await expect(header).toHaveText(/Today|202\d/);

        // Click Prev Day (Icon button) -- Go to Yesterday
        await page.getByTitle('Previous Day').click();
        
        // Should show 'Yesterday' or full date
        await expect(header).toHaveText(/Yesterday|202\d/);
        
        // Click Prev Day again -- Go to specific date
        await page.getByTitle('Previous Day').click();
        await expect(header).toHaveText(/202\d/);

        // Click Next Day twice to get back to Today
        await page.getByTitle('Next Day').click();
        await page.getByTitle('Next Day').click();
        
    });
});
