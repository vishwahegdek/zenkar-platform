import { test, expect } from '@playwright/test';

test.describe('Finance Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow (adjust if you have a bypass or seed)
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to Finance Book and show Payables', async ({ page }) => {
    // Open Mobile Menu if needed
    const isMobile = await page.locator('button[aria-label="Open menu"]').isVisible();
    if (isMobile) {
        await page.click('button[aria-label="Open menu"]');
        await page.click('text=Finance Book');
    } else {
        await page.click('text=Finance Book');
    }

    await expect(page).toHaveURL('/finance');
    await expect(page.locator('h1')).toContainText('Finance Book');
    await expect(page.getByText('Total Payable')).toBeVisible();
  });

  test('should create a new party linked to contact', async ({ page }) => {
    // 1. Create a contact first (to ensure one exists)
    await page.goto('/contacts');
    await page.click('text=Add Contact');
    const contactName = `Test Contact ${Date.now()}`;
    await page.fill('input[name="name"]', contactName);
    await page.fill('input[name="phone"]', '9988776655');
    await page.click('button:has-text("Save Contact")');
    await expect(page.getByText(contactName)).toBeVisible();

    // 2. Go to Finance
    await page.goto('/finance');
    await page.click('text=Add Party');

    // 3. Select Contact
    await page.fill('input[placeholder="Search contacts..."]', contactName);
    await page.click(`text=${contactName}`);
    
    // 4. Verify Autofill (visual check only as inputs might be disabled)
    await expect(page.locator('input[name="name"]')).toHaveValue(contactName);
    await expect(page.locator('input[name="name"]')).toBeDisabled();

    // 5. Save
    await page.click('button:has-text("Save Party")');
    
    // 6. Verify List
    await expect(page.locator(`text=${contactName}`)).toBeVisible();
  });
});
