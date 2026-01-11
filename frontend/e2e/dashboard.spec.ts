
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

    // Mock Cashflow Data
    await page.route('**/dashboard/cashflow*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                summary: { totalIn: 5000, totalOut: 2000, net: 3000 },
                entries: [
                    { 
                        id: 'pay-1', 
                        type: 'IN', 
                        category: 'Income', 
                        amount: 5000, 
                        description: 'Order #ORD-001 - Test Customer', 
                        time: new Date().toISOString(),
                        source: 'Payment'
                    },
                    { 
                        id: 'exp-1', 
                        type: 'OUT', 
                        category: 'Stationery', 
                        amount: 2000, 
                        description: 'Paper and Pens', 
                        time: new Date().toISOString(),
                        source: 'Expense'
                    }
                ]
            })
        });
    });

    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should navigate to dashboard or orders
    await expect(page).toHaveURL(/\/$|\/orders/);
  });

  test('Cashflow Dashboard renders correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Checking accounts...')).not.toBeVisible();
    // Use regex to be flexible with icons/whitespace
    await expect(page.getByRole('heading', { name: /Cashflow/i })).toBeVisible();
    
    // Check Summary Cards
    await expect(page.getByText('Money In')).toBeVisible();
    await expect(page.getByText('₹5,000')).toBeVisible();
    await expect(page.getByText('Money Out')).toBeVisible();
    await expect(page.getByText('₹2,000')).toBeVisible();
    await expect(page.getByText('Net Cashflow')).toBeVisible();

    // Check Transactions
    await expect(page.getByText('Stationery')).toBeVisible();
    await expect(page.getByText('Paper and Pens')).toBeVisible();
  });

  test('Income Sheet renders correctly', async ({ page }) => {
    // Only verify heading on desktop
    const isMobile = page.viewportSize()?.width && page.viewportSize().width < 768;
    
    await page.goto('/income-sheet');
    await expect(page.getByText('Loading Income Sheet...')).not.toBeVisible();
    
    if (!isMobile) {
        await expect(page.getByRole('heading', { name: /Income Sheet/i })).toBeVisible();
    }
    
    // Check Stats and Payments
    await expect(page.getByText('Income', { exact: true })).toBeVisible();
    await expect(page.getByText('₹5,000')).toBeVisible();
    
    // Payments list should be visible on both
    await expect(page.getByText('Test Customer').first()).toBeVisible();
  });
  
  test('Mobile Responsiveness and Filters', async ({ page }) => {
    await page.goto('/dashboard');
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Range selector should be visible
    await expect(page.getByText('Today')).toBeVisible();
    
    // Select custom range
    await page.getByRole('button', { name: 'Custom' }).click();
    await expect(page.locator('input[type="date"]')).toHaveCount(2);
  });
});
