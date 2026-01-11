import { test, expect } from '@playwright/test';

test.describe('Phase 9: Smart Edit Logic', () => {

  test('Local Customer Smart Edit & Upgrade Trigger', async ({ page }) => {
    // 1. Go to Quick Sale
    await page.goto('/quicksale');
    
    // 2. Create a Local Customer via SmartSelector
    // Click "CHANGE" to clear Walk-In if present
    // 2. Create a Local Customer via SmartSelector
    // Check if we need to clear updated default
    const changeBtn = page.getByText('CHANGE', { exact: true });
    if (await changeBtn.isVisible({ timeout: 2000 })) {
        await changeBtn.click();
    }

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('LocalEditUser');
    await page.waitForTimeout(1000); // Wait for debounce
    await page.getByText('Create "LocalEditUser"', { exact: false }).first().click();

    // Fill Customer Form (Modal)
    await expect(page.getByText('Create New Customer')).toBeVisible();
    await page.getByRole('button', { name: 'Save Customer' }).click();

    // 3. Verify Customer Selected and "Edit" button exists
    await expect(page.getByText('LocalEditUser')).toBeVisible();
    const editBtn = page.getByText('EDIT', { exact: true });
    await expect(editBtn).toBeVisible();

    // 4. Click Edit -> Should open Customer Form (Local)
    await editBtn.click();
    await expect(page.getByText('Edit Customer')).toBeVisible();
    
    // 5. Add Phone Number (Upgrade Trigger)
    const phoneInput = page.getByPlaceholder('Phone (Optional)');
    await phoneInput.fill('9988776655'); // Valid 10 digit
    await page.getByRole('button', { name: 'Update Customer' }).click();

    // 6. Handle 424 Sync Error (Expected in Test Env if no credentials)
    // The upgraded logic throws 424 if sync fails. Frontend catches and shows confirm.
    // Dialog listener
    page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Google Sync');
        await dialog.accept(); // Confirms "Proceed without sync"
    });

    // Wait for potential toast or completion
    // If sync works (mocked?), it just saves. If 424, dialog handles it.
    // We check if phone is updated on UI.
    await expect(page.getByText('9988776655')).toBeVisible();
  });

});
