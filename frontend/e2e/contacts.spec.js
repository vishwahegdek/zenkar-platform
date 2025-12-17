import { test, expect } from '@playwright/test';

test.describe('Contacts Module Validation', () => {
  // Authentication bypass - assume auth token is handled or mock it? 
  // For now, let's try to simulate login or re-use state if possible.
  // Actually, easiest is to login first.
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Using a known test user credentials if available, or mocking auth.
    // Assuming 'admin' / 'admin123' or similar from seed? 
    // Or we can just mock the API responses?
    // Let's try to mock the auth state if possible, but login flow is safer for E2E.
    // Based on previous contexts, we might need to register or use existing.
    // Let's assume we are logged in or just mock the successful response of /contacts.
    
    // For full E2E, let's login.
    await page.fill('input[type="text"]', 'admin'); // Username
    await page.fill('input[type="password"]', 'admin123'); // Password
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard'); 
  });

  test('should validate mandatory fields (Name & Phone)', async ({ page }) => {
    await page.goto('/contacts');
    
    // Attempt submit with empty fields
    await page.click('button:has-text("Save Contact")');
    
    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Phone is required')).toBeVisible();
    
    // Fill Name only
    await page.fill('input[placeholder="e.g. Ramesh (Labour)"]', 'Test Contact');
    await page.click('button:has-text("Save Contact")');
    
    // Name error gone, Phone error remains
    await expect(page.locator('text=Name is required')).not.toBeVisible();
    await expect(page.locator('text=Phone is required')).toBeVisible();
  });

  test('should create contact successfully', async ({ page }) => {
    await page.goto('/contacts');
    
    const uniqueName = `Contact ${Date.now()}`;
    const uniquePhone = `99${Date.now().toString().slice(-8)}`;

    await page.fill('input[placeholder="e.g. Ramesh (Labour)"]', uniqueName);
    await page.fill('input[placeholder="e.g. 9876543210"]', uniquePhone);
    await page.fill('input[placeholder="e.g. Labour, Vendor"]', 'TestGroup');
    
    await page.click('button:has-text("Save Contact")');
    
    // Expect success toast
    await expect(page.locator('text=Contact added')).toBeVisible();
    
    // Verify in list
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible();
    await expect(page.locator(`text=${uniquePhone}`)).toBeVisible();
  });

  test('should delete contact', async ({ page }) => {
    await page.goto('/contacts');
    
    // Ensure we have a contact to delete (create one first to be safe or pick existing)
    // Let's create one quickly
    const delName = `DeleteMe ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Ramesh (Labour)"]', delName);
    await page.fill('input[placeholder="e.g. 9876543210"]', '1231231231');
    await page.click('button:has-text("Save Contact")');
    await expect(page.locator('text=Contact added')).toBeVisible();
    
    // Find the delete button for this specific contact
    // We look for the row containing `delName`, then the delete button in it.
    // Locator strategy: text=delName .. parent container .. button "Delete"
    // Simplified: locator containing text, then scope.
    
    // Playwright locator chaining
    const row = page.locator('div', { has: page.locator(`text=${delName}`) }).last();
    // Assuming structure: div > div > h3(name) ... button(delete)
    
    // Handle window confirm dialog
    page.on('dialog', dialog => dialog.accept());
    
    await row.locator('button:has-text("Delete")').click();
    
    await expect(page.locator('text=Contact deleted')).toBeVisible();
    await expect(page.locator(`text=${delName}`)).not.toBeVisible();
  });

});
