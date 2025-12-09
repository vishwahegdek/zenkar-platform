import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test('should display product list and allow navigation to create', async ({ page }) => {
    await page.goto('/products');

    // Verify Header
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

    // Verify "New Product" Button
    await expect(page.getByRole('link', { name: 'New Product' })).toBeVisible();

    // Test Search (Client-side)
    // We assume there's at least one product or empty state. 
    // Let's create a unique dummy product via API or UI first if we wanted to test search strictness,
    // but for now we just verify the input is interactable.
    const searchInput = page.getByPlaceholder('Search products...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('NonExistentProductXYZ');
    
    // Verify Empty State or List update
    // If empty:
    // Verify Empty State or List update
    // If empty:
    await expect(page.locator('text="No products found." >> visible=true')).toBeVisible();

    // Clear search
    await searchInput.clear();

    // Navigate to Create
    await page.getByRole('link', { name: 'New Product' }).click();
    await expect(page).toHaveURL(/\/products\/new$/);
    await expect(page.getByRole('heading', { name: 'New Product' })).toBeVisible();
  });
});
