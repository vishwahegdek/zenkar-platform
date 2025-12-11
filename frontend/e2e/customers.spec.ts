import { test, expect } from '@playwright/test';

test.describe('Customer Management Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/orders/);
  });

  const customerName = 'Test Customer ' + Date.now();
  const customerPhone = '9876543210';
  const customerAddress = '123 Test St, Test City';

  test('Create, Search, and Edit Customer', async ({ page }) => {
    // 1. Navigate to Customers Page
    await page.goto('/customers');
    await expect(page).toHaveURL(/.*\/customers/);

    // 2. Click New Customer
    // Handling mobile/desktop view - "New Customer" text might be hidden on mobile but the link is there.
    // The "New Customer" text is inside a span hidden on mobile, but there's a mobile FAB too.
    // We use :visible to ensure we click the one active for the current viewport (Mobile vs Desktop)
    await page.locator('a[href="/customers/new"]:visible').click();
    
    // 3. Fill Form
    await expect(page.locator('h1')).toContainText('New Customer');
    
    await page.fill('input[placeholder="e.g. Raj Kumar"]', customerName);
    await page.fill('input[placeholder="e.g. 9876543210"]', customerPhone);
    await page.fill('textarea[placeholder="Full address..."]', customerAddress);
    
    // 4. Submit
    await page.click('button:has-text("Save Customer")');
    
    // 5. Verify Redirection and List
    await expect(page).toHaveURL(/\/customers$/);
    
    // Search for the new customer
    await page.fill('input[placeholder="Search customers..."]', customerName);
    
    // Wait for the list to filter
    await expect(page.locator('text=Loading...')).toBeHidden();
    await expect(page.locator('body')).toContainText(customerName);
    
    // Verify details in the card/list
    await expect(page.locator('body')).toContainText(customerPhone);
    await expect(page.locator('body')).toContainText(customerAddress);
    
    // 6. Edit Customer
    // Find the edit button for this customer
    // The card structure: 
    // <div ...> <h3>Name</h3> ... <a href=".../edit">✏️</a> </div>
    // We filter by text then find the edit link
    const customerCard = page.locator('div', { hasText: customerName }).last();
    await customerCard.locator('a[href*="/edit"]').click();
    
    await expect(page.locator('h1')).toContainText('Edit Customer');
    
    // Update Name
    const newName = customerName + ' Edited';
    await page.fill('input[placeholder="e.g. Raj Kumar"]', newName);
    
    await page.click('button:has-text("Save Customer")');
    
    // 7. Verify Edit
    await expect(page).toHaveURL(/\/customers$/);
    await page.fill('input[placeholder="Search customers..."]', newName);
    await expect(page.locator('body')).toContainText(newName);
    
  });
});
