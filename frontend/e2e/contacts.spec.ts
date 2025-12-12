import { test, expect } from '@playwright/test';

test.describe('Contacts Management', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Username').fill('admin');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(/\/$|\/dashboard/);
    });

    test('Add, View and Delete Contact', async ({ page }) => {
        const timestamp = Date.now();
        const contactName = `Test Contact ${timestamp}`;
        const phone = `98${timestamp.toString().slice(-8)}`;
        
        await page.goto('/contacts');
        
        // Add Contact
        await page.getByPlaceholder('e.g. Ramesh (Labour)').fill(contactName);
        await page.getByPlaceholder('Optional').fill(phone);
        await page.getByPlaceholder('e.g. Labour, Vendor').fill('Test Group');
        await page.getByRole('button', { name: 'Save Contact' }).click();
        
        // Verify in list
        await expect(page.getByText(contactName)).toBeVisible();
        await expect(page.getByText(phone)).toBeVisible();
        await expect(page.getByText('Test Group').first()).toBeVisible();
        
        // Data Persistence Check: Reload
        await page.reload();
        await expect(page.getByText(contactName)).toBeVisible();
        
        // Delete Contact
        page.on('dialog', dialog => dialog.accept());
        // Find row with contact name and click delete. Use specific classes to identify row.
        await page.locator('div.flex.justify-between').filter({ hasText: contactName }).getByRole('button', { name: 'Delete' }).click();
        
        // Verify removal (Wait a bit for optimistic UI or refetch)
        await page.waitForTimeout(1000); 
        await expect(page.getByText(contactName)).not.toBeVisible();
    });
});
