
import { test, expect } from '@playwright/test';

test.describe('Order Delivery Status Logic', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/$|\/orders/); 
  });

  test('Verify Status Cascade, Auto-Delivery, and Rollback', async ({ page }) => {
    const timestamp = Date.now();
    const customerName = `DelTest ${timestamp}`;
    const productName = `Prod ${timestamp}`;

    // 1. Create Order with 2 Items
    await page.goto('/orders/new');
    
    // Create Customer
    await page.getByPlaceholder('Search customer...').fill(customerName);
    await page.getByText(`Create "${customerName}"`).click();
    await page.locator('#customerFormPhone').fill('9988776655'); // Required?
    await page.getByRole('button', { name: 'Save Customer' }).click();
    await expect(page.locator('h3:has-text("Create New Customer")')).not.toBeVisible();

    // Add Item 1
    await page.click('button:has-text("+ Add Another Item")');
    await page.fill('input[placeholder="Product Name"] >> nth=0', productName + ' A');
    await page.waitForTimeout(2000); 
    await page.click(`text=Create "${productName} A"`);
    await page.fill('#productFormPrice', '100');
    await page.click('button:has-text("Save Product")');
    await expect(page.locator('h3:has-text("Create New Product")')).not.toBeVisible();

    // Add Item 2
    await page.click('button:has-text("+ Add Another Item")');
    await page.fill('input[placeholder="Product Name"] >> nth=1', productName + ' B');
    await page.waitForTimeout(2000);
    await page.click(`text=Create "${productName} B"`);
    await page.fill('#productFormPrice', '200');
    await page.click('button:has-text("Save Product")');
    await expect(page.locator('h3:has-text("Create New Product")')).not.toBeVisible();

    // Save Order
    await page.locator('button:visible').filter({ hasText: /Save Order|✓/ }).first().click();
    await expect(page).toHaveURL(/\/orders$/);
    await page.reload();
    await page.waitForTimeout(2000); // Wait for list fetch

    // Go to Details
    await page.locator(`text="${customerName}" >> visible=true`).first().click();
    await expect(page).toHaveURL(/\/orders\/\d+/);

    // Initial Status Check
    await expect(page.locator('span:has-text("CONFIRMED")')).toBeVisible(); // Order Status
    await expect(page.locator('span:has-text("Queue")')).toHaveCount(3); // 1 Delivery Badge, 2 Items
    // Wait, Delivery Badge is "Queue" (CONFIRMED). Item Badges are "Queue" (CONFIRMED).

    // --- Scenario 1: Manual Order Delivery Cascade ---
    // Change Order Status to Delivered via Edit? No, status is dropdown in details?
    // In OrderDetails, status is Badge. Wait, I updated StatusBadge.
    // OrderDetails does NOT have a status dropdown in the header anymore?
    // Let's check the code I read.
    // OrderDetails.jsx: <StatusBadge type="ORDER" status={order.status} />
    // It's a BADGE. Read-only in details?
    // "Actions" dropdown has "Edit Order".
    // "Edit Order" likely goes to form.
    // BUT OrdersList has the dropdown.
    
    // Go back to List
    await page.goto('/orders');
    const row = page.locator('tr:visible, div.p-3.bg-white:visible').filter({ hasText: customerName }).first();
    await row.locator('select').selectOption('DELIVERED');
    
    // Verify Cascade in Details
    await row.locator(`text="${customerName}"`).click();
    await expect(page.locator('span:has-text("Delivered")').first()).toBeVisible(); // Order Status Badge
    // Check all item badges have switched to Delivered
    // We expect 3 "Delivered" badges (1 Order, 1 DeliveryStatus, 2 Items -> Wait, DeliveryStatus is "Delivered" too).
    // Actually, "Delivered" text appears in:
    // 1. Order Status Badge
    // 2. Delivery Status Badge
    // 3. Item 1 Status Select (selected option)
    // 4. Item 2 Status Select (selected option)
    await expect(page.locator('text=Delivered')).toHaveCount(4); 

    // --- Scenario 2: Rollback Logic ---
    // Change ONE item back to "Ready"
    const itemSelect = page.locator('select').nth(0); // First item
    await itemSelect.selectOption('READY');
    await page.waitForTimeout(500); // Wait for optimistic UI / mutation

    // Expect Order Status to revert to CONFIRMED
    // Order Status Badge should say "Confirmed"
    await expect(page.locator('span:has-text("Confirmed")').first()).toBeVisible();
    
    // Delivery Status should be "In Prod" (since one is Ready, one Delivered -> Mixed/In Prod)
    // Or "Ready"? Logic: "If items.some(READY/IN_PRODUCTION) -> IN_PRODUCTION".
    // Logic: "If items.every(READY) -> READY".
    // Here: 1 Ready, 1 Delivered. calculateDeliveryStatusLogic:
    // has(DELIVERED) -> PARTIALLY_DELIVERED.
    // Ah, lines 820: if (distinct.has(DELIVERED)) return PARTIALLY_DELIVERED;
    // So Delivery Status should be "Part. Del".
    await expect(page.locator('span:has-text("Part. Del")')).toBeVisible();

    // --- Scenario 3: Auto-Delivery Logic ---
    // Set First Item back to Delivered
    await itemSelect.selectOption('DELIVERED');
    await page.waitForTimeout(500);

    // Now ALL items are Delivered.
    // Expect Order Status to become DELIVERED automatically.
    await expect(page.locator('span:has-text("Delivered")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Delivered")').nth(1)).toBeVisible(); // Delivery Status
  });
});
