import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test('should toggle mobile menu', async ({ page, isMobile }) => {
    // Only run on mobile projects
    if (!isMobile) test.skip();

    await page.goto('/');

    // Check if hamburger menu is visible
    const menuButton = page.getByLabel('Open menu'); // Adjust label or selector
    // Or generic burger icon check if label missing:
    // const menuButton = page.locator('button.lg:hidden'); 

    await expect(menuButton).toBeVisible();

    // Open Menu
    await menuButton.click();

    // Verify Links are visible
    // Scope to the mobile dropdown container or ensure we pick the visible one
    await expect(page.locator('.md\\:hidden').getByText('Products').first()).toBeVisible();
    await expect(page.locator('.md\\:hidden').getByText('Orders').first()).toBeVisible();
    // await expect(page.getByText('New Order')).toBeVisible(); // Not in menu, in header

    // Close Menu (click outside or X)
    // await page.click('body', { position: { x: 0, y: 0 } });
    // Verify closed?
  });
});
