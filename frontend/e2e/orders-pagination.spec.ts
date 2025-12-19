import { test, expect } from '@playwright/test';

test.describe('Orders Pagination', () => {
    
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/$|\/orders/); 
  });
  
  test('Should display 20 orders initially and load more on button click', async ({ page }) => {
    const timestamp = Date.now();
    const totalOrders = 25; // Create more than 20 to test pagination
    
    // Create 25 orders via API (faster than UI)
    for (let i = 1; i <= totalOrders; i++) {
      const customerName = `PaginationTest ${timestamp} - ${i}`;
      
      // Create contact first
      const contactRes = await page.request.post('/api/contacts', {
        data: {
          name: customerName,
          phone: `99${String(i).padStart(8, '0')}`
        },
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        }
      });
      const contactData = await contactRes.json();
      
      // Create order
      await page.request.post('/api/orders', {
        data: {
          contactId: contactData.id,
          customerName: customerName,
          orderDate: new Date().toISOString().split('T')[0],
          totalAmount: 1000,
          paymentMethod: 'CASH',
          items: [{
            productId: 0,
            productName: `Product ${i}`,
            quantity: 1,
            unitPrice: 1000,
            lineTotal: 1000
          }]
        },
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        }
      });
    }
    
    // Navigate to orders list
    await page.goto('/orders');
    
    // Wait for orders to load
    await page.waitForSelector('table tbody tr, div.p-3.bg-white', { timeout: 10000 });
    
    // Desktop: Count table rows (excluding header and empty state)
    // Mobile: Count cards
    const isDesktop = await page.locator('table').isVisible().catch(() => false);
    
    if (isDesktop) {
      // Desktop table view
      const rows = await page.locator('table tbody tr').count();
      expect(rows).toBe(20); // Should show exactly 20 rows initially
      
      // Verify "Load More Results" button exists and is visible
      await expect(page.getByRole('button', { name: /Load More Results/ })).toBeVisible();
      
      // Click "Load More" button
      await page.getByRole('button', { name: /Load More Results/ }).click();
      
      // Wait for new rows to load
      await page.waitForTimeout(1000);
      
      // Should now have 25 rows total
      const rowsAfter = await page.locator('table tbody tr').count();
      expect(rowsAfter).toBe(25);
      
      // "Load More" button should disappear (no more pages)
      await expect(page.getByRole('button', { name: /Load More Results/ })).not.toBeVisible();
      
    } else {
      // Mobile card view
      const cards = await page.locator('div.p-3.bg-white').count();
      expect(cards).toBe(20); // Should show exactly 20 cards initially
      
      // Verify "Load More Results" button exists and is visible
      await expect(page.getByRole('button', { name: /Load More Results/ })).toBeVisible();
      
      // Click "Load More" button
      await page.getByRole('button', { name: /Load More Results/ }).click();
      
      // Wait for new cards to load
      await page.waitForTimeout(1000);
      
      // Should now have 25 cards total
      const cardsAfter = await page.locator('div.p-3.bg-white').count();
      expect(cardsAfter).toBe(25);
      
      // "Load More" button should disappear (no more pages)
      await expect(page.getByRole('button', { name: /Load More Results/ })).not.toBeVisible();
    }
  });
  
  test('Should work correctly with search and pagination', async ({ page }) => {
    const timestamp = Date.now();
    const searchTerm = `SearchTest${timestamp}`;
    
    // Create 15 orders with searchable name
    for (let i = 1; i <= 15; i++) {
      const customerName = `${searchTerm} Customer ${i}`;
      
      const contactRes = await page.request.post('/api/contacts', {
        data: {
          name: customerName,
          phone: `88${String(i).padStart(8, '0')}`
        },
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        }
      });
      const contactData = await contactRes.json();
      
      await page.request.post('/api/orders', {
        data: {
          contactId: contactData.id,
          customerName: customerName,
          orderDate: new Date().toISOString().split('T')[0],
          totalAmount: 500,
          paymentMethod: 'CASH',
          items: [{
            productId: 0,
            productName: `SearchProduct ${i}`,
            quantity: 1,
            unitPrice: 500,
            lineTotal: 500
          }]
        },
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        }
      });
    }
    
    // Navigate and search
    await page.goto('/orders');
    await page.getByPlaceholder('Search orders...').fill(searchTerm);
    
    // Wait for search results
    await page.waitForTimeout(1500);
    
    // Should show all 15 matching orders (less than page limit of 20)
    const isDesktop = await page.locator('table').isVisible().catch(() => false);
    
    if (isDesktop) {
      const rows = await page.locator('table tbody tr').count();
      expect(rows).toBe(15);
      
      // No "Load More" button should be visible (all results fit in one page)
      await expect(page.getByRole('button', { name: /Load More Results/ })).not.toBeVisible();
    } else {
      const cards = await page.locator('div.p-3.bg-white').count();
      expect(cards).toBe(15);
      
      await expect(page.getByRole('button', { name: /Load More Results/ })).not.toBeVisible();
    }
  });
});
