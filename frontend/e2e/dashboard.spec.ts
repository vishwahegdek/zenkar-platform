
import { test, expect } from '@playwright/test';

test.describe('Dashboard UI', () => {
    
  test.beforeEach(async ({ page }) => {
    // Mock Login URL
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
            access_token: 'fake-jwt-token', 
            user: { id: 1, username: 'admin', role: 'ADMIN' } 
        }),
      });
    });

    // Mock Dashboard Stats
    await page.route('**/dashboard/stats*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                transactionsCount: 5,
                totalSales: 5000,
                totalReceived: 5000 // Mocked Income
            })
        });
    });

    // Mock Dashboard Payments
    await page.route('**/dashboard/payments*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { 
                    id: 1, 
                    date: new Date().toISOString(), 
                    amount: 1000, 
                    method: 'UPI', 
                    customerName: 'Test Customer', 
                    orderNo: 'ORD-001' 
                }
            ])
        });
    });

    // Mock Dashboard Activities
    await page.route('**/dashboard/activities', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                 { 
                    id: 1, 
                    action: 'CREATE', 
                    resource: 'Order #1', 
                    user: { username: 'admin' }, 
                    createdAt: new Date().toISOString() 
                 }
            ])
        });
    });

    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should navigate to dashboard or orders
    await expect(page).toHaveURL(/\/$|\/orders/);
    await page.goto('/dashboard');
    // Wait for loading to finish
    await expect(page.getByText('Loading Dashboard...')).not.toBeVisible();
  });

  test('Stats Cards are visible', async ({ page }) => {
    // Check for Headers
    await expect(page.getByText('Income')).toBeVisible();
    
    // Check for Values (Should be numeric currency matching our mock)
    // It's now in a header badge, so we just check visibility of value associated with 'Income'
    await expect(page.getByText('Income')).toBeVisible();
    await expect(page.getByText('₹5,000')).toBeVisible();
  });


  test('Recent Activity and Payments Sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible(); 
    await expect(page.getByRole('heading', { name: 'Payments', exact: true })).toBeVisible();
    
    // Check Table Headers for Payments (Desktop) or content
    if (await page.getByRole('table').isVisible()) {
        await expect(page.getByText('Customer', { exact: true })).toBeVisible();
        await expect(page.getByText('Amount', { exact: true })).toBeVisible();
        // Check content in table
        await expect(page.getByRole('cell', { name: 'Test Customer' }).first()).toBeVisible();
    } else {
        // Check content in list
        // Use .first() to avoid ambiguity if multiple exist but we only care if one is visible
        await expect(page.getByText('Test Customer').first()).toBeVisible();
    }
  });
  
  test('Mobile Responsiveness Check', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload to ensure mobile view renders (if dependent on resize listener or initial load)
    // Note: Playwright resize usually triggers reactivity, but let's be safe.
    
    // Check that 'Payments' title is visible
    await expect(page.getByRole('heading', { name: 'Payments', exact: true })).toBeVisible();
    
    // Check List View item
    // .md:hidden should be visible now
    await expect(page.getByText('Test Customer').first()).toBeVisible();
  });
});
