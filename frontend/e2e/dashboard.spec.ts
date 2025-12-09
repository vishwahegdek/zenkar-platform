import { test, expect } from '@playwright/test';

test.describe('Dashboard / Home', () => {
  test('should redirect root to orders list', async ({ page }) => {
    await page.goto('/');
    
    // Expect redirect to /orders
    await expect(page).toHaveURL(/\/orders$/);

    // Verify Orders List Page Load (Assuming h1 or key element)
    // Based on typical pattern. If h1 is dynamic, we look for something stable.
    // Layout has "Order Book" link, but that's everywhere.
    // Let's check for "Orders" heading or "New Order" button.
    // OrdersList usually has "New Order" button as well.
    await expect(page.getByLabel('New Order')).toBeVisible();
  });
});
