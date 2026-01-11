import { test, expect } from '@playwright/test';

test.describe('ERP Navigation', () => {
  
  test('Desktop: Sidebar Navigation', async ({ page }) => {
    // 1. Setup Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // 2. Login
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123'); // Assuming standard dev creds
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // 3. Verify Sidebar Presence
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('Sales');
    await expect(sidebar).toContainText('Operations');

    // 4. Verify Header Title and Navigation
    // Check Dashboard (Landing Page is now root which maps to Sales Orders in Layout)
    await expect(page.locator('header h1')).toHaveText('Orders');

    // Navigate to Orders
    await page.click('aside >> text=Orders');
    await page.waitForURL('/orders');
    await expect(page.locator('header h1')).toHaveText('Orders');

    // Navigate to Quick Sale
    await page.click('aside >> text=Quick Sale');
    await page.waitForURL('/quick-sale');
    await expect(page.locator('header h1')).toHaveText('Quick Sale');

    // Navigate to Production
    await page.click('aside >> text=Production');
    await page.waitForURL('/production');
    await expect(page.locator('header h1')).toHaveText('Production Floor');
  });

  test('Mobile: Drawer Navigation', async ({ page }) => {
    // 1. Setup Mobile Viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    // 2. Login
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // 3. Verify Sidebar Hidden initially
    // Note: The sidebar component is rendered twice in DOM (desktop vs mobile drawer), 
    // but desktop one should be hidden via CSS class 'hidden md:flex'
    // We check that the mobile drawer is NOT visible
    const mobileDrawer = page.locator('.fixed.inset-0.z-50');
    await expect(mobileDrawer).not.toBeVisible();

    // 4. Open Menu
    await page.click('button[aria-label="Open menu"]');
    await expect(mobileDrawer).toBeVisible();

    // 5. Navigate via Drawer
    // Click "Contacts" inside the drawer
    await mobileDrawer.getByRole('link', { name: 'Contacts' }).click();
    
    // 6. Verify Navigation & Drawer Auto-Close
    await page.waitForURL('/contacts');
    await expect(page.locator('header h1')).toHaveText('Global Contacts');
    await expect(mobileDrawer).not.toBeVisible();
  });

});
