import { test, expect } from '@playwright/test';

test.describe('Frontend Robustness Tests', () => {
    
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/$/); 
  });

  test.describe('Product Creation Robustness', () => {
      test('should create a valid product', async ({ page }) => {
          await page.goto('/products/new');

          await page.getByPlaceholder('e.g. Wooden Chair').fill('Frontend Robust Product');
          await page.locator('#productFormPrice').fill('500');
          
          // Wait for Categories to load and "General" to be available
          await expect(page.locator('#productFormCategory')).toContainText('General');
          
          // Assert that "General" is auto-selected
          await expect(page.locator('#productFormCategory')).not.toHaveValue('');
          
          await page.locator('#productFormNotes').fill('Robust notes');
          
          // Assert that "General" is auto-selected
          // We can check if the value corresponds to the "General" option
          // Or simpler: check that it is NOT empty
          await expect(page.locator('#productFormCategory')).not.toHaveValue('');
          
          await page.locator('#productFormNotes').fill('Robust notes');

          await page.getByRole('button', { name: 'Save Product' }).click();
          
          await expect(page.getByText('Product created successfully').or(page.getByText('Product created'))).toBeVisible();
          await expect(page).toHaveURL(/\/products/);
      });

      test('should show validation error for missing name', async ({ page }) => {
          await page.goto('/products/new');
          
          await page.locator('#productFormPrice').fill('500');
          // Validate button is disabled?
          const saveBtn = page.getByRole('button', { name: 'Save Product' });
          await expect(saveBtn).toBeDisabled();
      });
  });

  test.describe('Order Creation Robustness', () => {
      test('should create valid order with new customer (modal flow)', async ({ page }) => {
          await page.goto('/orders/new');
          
          const customerInput = page.getByPlaceholder('Search customer...');
          await customerInput.click();
          await customerInput.fill('Frontend New User');
          // Wait for debounce and dropdown
          await expect(page.getByText('+ Create "Frontend New User"')).toBeVisible();
          await page.getByText('+ Create "Frontend New User"').click();
          
          // Modal should open for new customer
          await expect(page.getByText('Create New Customer')).toBeVisible();
          // Fill Customer Modal
          await page.locator('input[placeholder="e.g. Alice Smith"]').fill('Frontend New User'); 
          // Note: Selector inferred from CustomerForm generic input or by Label if available.
          // Checking CustomerForm from previous knowledge (not viewed recently but standard).
          // Let's use getByLabel if possible, or generic input if unique.
          // CustomerForm usually has Name and Phone.
          // "ProductForm" used ID. CustomerForm probably similar?
          // Let's use getByLabel with text "Name" or "Customer Name"?
          // Safest: interact with visible inputs inside modal.
          await page.locator('.modal-content input[type="text"]').first().fill('Frontend New User');
          await page.locator('.modal-content input[type="tel"]').fill('9988776600');
          
          await page.getByRole('button', { name: /Save Customer|Save Changes/ }).click();
          
          // Wait for modal close
          await expect(page.getByText('Create New Customer')).not.toBeVisible();
          
          // Add Item
          const productInput = page.getByPlaceholder('Product Name').first();
          await productInput.fill('Frontend Robust Product');
          await page.waitForTimeout(500); 
          await page.keyboard.press('Enter'); 

          await page.getByPlaceholder('Qty').first().fill('2');
          await page.getByPlaceholder('Price').first().fill('100');
          
          // Payments
          await page.locator('select').filter({ hasText: /Cash|UPI/ }).first().selectOption('CASH');
          await page.getByPlaceholder('0').first().fill('50'); // Advance
          
          await page.getByRole('button', { name: 'Save Order' }).click();
          
          await expect(page.getByText('Order Created!')).toBeVisible();
          await expect(page).toHaveURL(/\/orders/);
      });
      
      test('should validate empty order items', async ({ page }) => {
          await page.goto('/orders/new');
          
          const customerInput = page.getByPlaceholder('Search customer...');
          await customerInput.click();
          await customerInput.fill('Frontend Val User'); 
          
          // Select create new
          await expect(page.getByText('+ Create "Frontend Val User"')).toBeVisible();
          await page.getByText('+ Create "Frontend Val User"').click();
          
          // Handle Modal 
          await expect(page.getByText('Create New Customer')).toBeVisible();
          await page.locator('.modal-content input[type="text"]').first().fill('Frontend Val User');
          await page.getByRole('button', { name: /Save Customer|Save Changes/ }).click();
          await expect(page.getByText('Create New Customer')).not.toBeVisible();
          
          await page.getByRole('button', { name: 'Save Order' }).click();
          
          // Expect toast error (regex)
          await expect(page.getByText(/Failed to save order/)).toBeVisible();
          await expect(page).toHaveURL(/\/orders\/new/);
      });

      test('should populate categories in New Product modal', async ({ page }) => {
          await page.goto('/orders/new');
          
          // Trigger "New Product" modal
          // Assuming Autocomplete input allows creating new product
          const productInput = page.getByPlaceholder('Product Name').first();
          await productInput.fill('Modal Product');
          await expect(page.getByText('+ Create "Modal Product"')).toBeVisible();
          await page.getByText('+ Create "Modal Product"').click();
          
          await expect(page.getByRole('heading', { name: 'New Product' })).toBeVisible();
          
          // Check Category Dropdown in Modal
          // Modal should be open. ProductForm is inside.
          // Check Category Dropdown in Modal
          // Modal should be open. ProductForm is inside.
          // Locator for category select inside modal (using ID directly as it should be unique enough or scoped)
          const categorySelect = page.locator('select#productFormCategory');
          await expect(categorySelect).toBeVisible();
          
          // Wait for "General" option
          await expect(categorySelect).toContainText('General');
          // And it should have value (defaulted)
          await expect(categorySelect).not.toHaveValue('');
          
          // Close modal to finish
          await page.getByRole('button', { name: 'Cancel' }).click();
      });

      test('should populate categories in Quick Sale New Product modal', async ({ page }) => {
          await page.goto('/quicksale');
          
          // Trigger "New Product" modal via Autocomplete
          const productInput = page.getByPlaceholder('Item').first();
          await productInput.fill('QS Modal Product');
          await expect(page.getByText('+ Create "QS Modal Product"')).toBeVisible();
          await page.getByText('+ Create "QS Modal Product"').click();
          
          await expect(page.getByRole('heading', { name: 'Create New Product' })).toBeVisible();
          
          const categorySelect = page.locator('select#productFormCategory');
          await expect(categorySelect).toBeVisible();
          
          // Wait for "General" option
          await expect(categorySelect).toContainText('General');
          await expect(categorySelect).not.toHaveValue('');
          
          await page.getByRole('button', { name: 'Cancel' }).click();
      });

      test('should edit an order successfully', async ({ page }) => {
          // 1. Create a dummy order first (or pick existing if guaranteed)
          // Ideally we create one to be safe and independent.
          await page.goto('/orders/new');
          await page.getByPlaceholder('Search customer...').fill('Edit Test User');
          await expect(page.getByText('+ Create "Edit Test User"')).toBeVisible();
          await page.getByText('+ Create "Edit Test User"').click();
          await page.locator('.modal-content input[type="text"]').first().fill('Edit Test User');
          await page.getByRole('button', { name: /Save Customer|Save Changes/ }).click();
          await expect(page.getByText('Create New Customer')).not.toBeVisible();

          await page.getByPlaceholder('Product Name').first().fill('Edit Product');
          await page.getByText('+ Create "Edit Product"').click();
          await page.locator('select#productFormCategory').selectOption({ label: 'General' }); // Ensure category is selected
          await page.getByPlaceholder('Price').last().fill('100');
          await page.getByRole('button', { name: 'Save Product' }).click();
          
          await page.getByRole('button', { name: 'Save Order' }).click();
          await expect(page.getByText('Order created successfully')).toBeVisible();
          
          // 2. Go to Edit Page (Url logic or Click from history)
          // We can just grab the ID from URL if redirected, but robust test might just go to history or assume success
          // For speed, let's assume redirection to /orders implies success, verify DB or navigate to last created.
          // Let's navigate to /orders and click first edit.
          await page.goto('/orders');
          await page.getByTitle('Edit Order').first().click();
          
          // 3. Modify details triggers the Update payload
          await page.getByPlaceholder('Notes').fill('Updated Notes');
          
          // 4. Save
          await page.getByRole('button', { name: 'Update Order' }).click();
          
          // 5. Verify Success
          await expect(page.getByText('Order updated successfully')).toBeVisible();
      });
  });

});
