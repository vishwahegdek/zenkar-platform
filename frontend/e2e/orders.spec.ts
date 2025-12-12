
import { test, expect } from '@playwright/test';

test.describe('Order Management Flow', () => {
    
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    // Default is now Orders at /
    await expect(page).toHaveURL(/\/$|\/orders/); 
  });
  
  test('Create Order, Add Payment, and Close', async ({ page }) => {
    const timestamp = Date.now();
    const customerName = `Customer ${timestamp}`;
    const productName = `Product ${timestamp}`;

    // 1. Navigate to Create Order
    await page.goto('/orders');
    await page.locator('a[href="/orders/new"]:visible').click();
    await expect(page).toHaveURL(/\/orders\/new/);

    // 2. Fill Customer Details
    await page.getByPlaceholder('Search customer...').fill(customerName);
    // Click explicit create option -> Opens Modal
    // Click explicit create option -> Opens Modal
    // SmartSelector uses divs, Autocomplete used li
    await page.getByText(`Create "${customerName}"`).click();
    
    // Check Modal is open
    await expect(page.locator('h3:has-text("Create New Customer")')).toBeVisible();

    // Fill Modal Form
    await expect(page.locator('#customerFormName')).toHaveValue(customerName);
    
    await page.locator('#customerFormPhone').fill('9988776655');
    await page.locator('#customerFormAddress').fill('Flat 404, Tech Park, Hyderabad');
    
    // Save Customer
    await page.getByRole('button', { name: 'Save Customer' }).click();
    
    // Modal should close and Order Form should have details in Locked Card
    await expect(page.locator('h3:has-text("Create New Customer")')).not.toBeVisible();
    
    // Customer Details should be visible as text (Locked Card)
    await expect(page.locator('body')).toContainText('9988776655');
    await expect(page.locator('body')).toContainText('Flat 404, Tech Park, Hyderabad');
    
    // 3. Add new item via Modal
    await page.click('button:has-text("+ Add Another Item")');
    await page.fill('input[placeholder="Product Name"] >> nth=0', productName);
    // Wait for debounce and autocomplete
    await page.waitForTimeout(2000); 
    
    // Click "Create 'New Product'" option
    await page.click(`text=Create "${productName}"`);
    
    // Validate Product Modal Opened
    await expect(page.locator('h3:has-text("Create New Product")')).toBeVisible();
    
    // Fill Product Modal
    await page.fill('#productFormPrice', '150');
    await page.fill('#productFormNotes', 'Test Product Notes');
    
    // Save Product
    await page.click('button:has-text("Save Product")');
    
    // Wait for modal to close
    await expect(page.locator('h3:has-text("Create New Product")')).not.toBeVisible();

    // Verify item row is updated with new product details
    const quantityInput = page.locator('input[placeholder="Qty"] >> nth=0');
    await quantityInput.fill('2');
    
    // Price should be auto-filled (150)
    await expect(page.locator('input[placeholder="Price"] >> nth=0')).toHaveValue('150');
    // Update price to 25000 for the rest of the test logic
    await quantityInput.fill('1'); 
    await page.getByPlaceholder('Price').first().fill('25000');
    
    // 4. Advance
    // Find input near "Advance" text
    await page.locator('div', { hasText: 'Advance' }).locator('input[type="number"]').last().fill('5000');
    
    // 5. Save
    // 5. Save
    // Desktop: "Save Order", Mobile: "✓" (FAB). Use :visible to click the correct one.
    await page.locator('button:visible').filter({ hasText: /Save Order|✓/ }).first().click();
    
    // 6. Verify Redirection and List Presence
    await page.waitForTimeout(1000); // Wait for modal/nav
    await expect(page).toHaveURL(/\/orders$/);
    // Wait for list update (query invalidation)
    await page.reload();
    await expect(page.locator('body')).toContainText(customerName);
    
    // 7. Go to Details
    await page.waitForTimeout(1000); 
    // We utilize :visible to ensure we click the element rendered for the current viewport
    // Using .first() in case the framework renders multiple identical visible text nodes
    await page.locator(`text="${customerName}" >> visible=true`).first().click();
    
    // Verify successful navigation
    await expect(page).toHaveURL(/\/orders\/\d+/);

    // Verify Details
    await expect(page.locator('body')).toContainText(productName);
    await expect(page.locator('body')).toContainText('Balance Due');
    
    // Balance should be 25000 - 5000 = 20000
    await expect(page.locator('body')).toContainText('20,000');

    // 8. Record Payment
    await page.click('button:has-text("Record Payment")');
    await expect(page.locator('h2:has-text("Record Payment")')).toBeVisible(); // Modal title
    
    await page.fill('input[type="number"]:visible', '10000'); // Amount input in modal
    await page.fill('input[placeholder="e.g. UPI, Cash"]', 'Bank Transfer');
    await page.click('button:has-text("Save Payment")');
    
    // 9. Verify Balance Update
    // Total Paid: 15000 (5000 Adv + 10000 New). Balance: 10000.
    await expect(page.locator('body')).toContainText('Balance Due');
    await expect(page.locator('body')).toContainText('10,000');

    // 9.5 Manage Payments (Edit Mode)
    // We look for the "Payments" heading, then the "Edit" button next to it.
    await page.locator('div').filter({ hasText: /^PaymentsEdit$/ }).getByRole('button', { name: 'Edit' }).click();

    await expect(page.locator('h2:has-text("Manage Payments")')).toBeVisible();
    
    // Existing rows:
    // 1. Initial Advance (5000)
    // 2. Bank Transfer (10000)
    // Find the input with value 10000
    const paymentInput = page.locator('input[type="number"][value="10000"]');
    await paymentInput.fill('15000');
    
    // Add a new row for remaining 5000
    await page.click('button:has-text("+ Add Payment")');
    // New row appears at bottom, empty amount
    const newRowAmount = page.locator('input[placeholder="0"]').last();
    await newRowAmount.fill('5000');
    const newRowNote = page.locator('input[placeholder="Note"]').last();
    await newRowNote.fill('Final Settlement');
    
    // Total in Modal should be 5000 + 15000 + 5000 = 25000
    await expect(page.locator('div:has-text("Total:")').last()).toContainText('25,000');
    
    // Save Changes
    await page.click('button:has-text("Save Changes")');
    
    // Verify Modal Closed and Balance is 0
    await expect(page.locator('h2:has-text("Manage Payments")')).not.toBeVisible();
    await expect(page.locator('tfoot')).toContainText('₹0'); // Balance Due 0
    await expect(page.locator('body')).toContainText('Final Settlement');
    
    // 10. Close Order
    await page.click('text=Back to Orders');
    
    // Handle Dialog for Closing
    page.on('dialog', dialog => dialog.accept());
    
    // Need to find the select associated with Priya Sharma (or dynamic name)
    // Filter for visible container (tr or card) having Customer Name
    // We use div.p-3 to target the mobile card specifically, preventing selection of the main wrapper
    const container = page.locator('tr:visible, div.p-3.bg-white:visible').filter({ hasText: customerName }).first();
    const select = container.locator('select');
    await select.selectOption('closed');
    
    // 11. Verify Status Closed
    // Wait for mutation
    await page.waitForTimeout(1000);
    
    // Default view is 'active', so closed order should disappear.
    // We navigate to 'history' view to verify it.
    await page.goto('/orders?view=history');
    
    // Re-acquire select after navigation
    // Wait for list to load (visible element only)
    await page.waitForSelector(`text="${customerName}" >> visible=true`);
    const finalContainer = page.locator('tr:visible, div.p-3.bg-white:visible').filter({ hasText: customerName }).first();
    const finalSelect = finalContainer.locator('select');
    await expect(finalSelect).toHaveValue('closed');
    
    // 12. Verify Zero Balance
    // Click to details
    await finalContainer.locator(`text="${customerName}"`).click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    // Discount should NOT be present if balance was 0
    await expect(page.locator('body')).not.toContainText('Discount');
    
    // Final check: Balance Due 0
    // Paid should be 25000
    await expect(page.locator('tfoot')).toContainText('₹25,000');
    
    // Final check: Balance Due 0
    // It might be "₹0"
    await expect(page.locator('tfoot')).toContainText('₹0');
  });
});
