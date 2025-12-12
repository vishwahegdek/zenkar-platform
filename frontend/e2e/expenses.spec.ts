import { test, expect } from '@playwright/test';

test.describe('Expenses Management', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Username').fill('admin');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(/\/$|\/dashboard/);
    });

    test('Create, Filter and View Expense', async ({ page }) => {
        const expenseDesc = `Test Expense ${Date.now()}`;
        const amount = '500.00';
        
        await page.goto('/expenses/new');
        
        // Fill Expense Form
        await page.getByPlaceholder('0.00').fill(amount);
        
        // Select Category 
        // Assuming the select is the only combobox or use locator by className
        // Since label is not associated, use partial text or role
        await page.locator('select').selectOption({ index: 1 });
        
        // Since label is not associated, use locator by tag
        await page.locator('textarea').fill(expenseDesc);
        
        // Save
        await page.getByRole('button', { name: 'Save Expense' }).click();
        
        // Verify Redirect
        await expect(page).toHaveURL(/\/expenses$/);
        
        // Verify in List
        const row = page.locator('div').filter({ hasText: expenseDesc }).first();
        await expect(row).toBeVisible();
        await expect(row).toContainText(`-₹${amount}`);
        
        // Test Filter (Assuming 'Material' or similar was selected)
        // Click a category filter button in the list page
        const categoryBtn = page.getByRole('button', { name: /Material|Fuel|Labour/ }).first();
        if (await categoryBtn.isVisible()) {
            await categoryBtn.click();
            // Verify expense still visible (if category matches)
            await categoryBtn.click();
            // Verify button is active (bg-gray-900)
            await expect(categoryBtn).toHaveClass(/bg-gray-900/);
            
            // Clear filter (toggle)
            await categoryBtn.click();
        }
    });

});
