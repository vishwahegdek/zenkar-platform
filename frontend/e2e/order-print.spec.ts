import { test, expect } from '@playwright/test';
import { mockOrderStandard } from './mocks/orders.mock';
import { setupMockAuth, mockOrderApi, dumpOnFail } from './utils/test-helpers';

test.describe('Order Printing (Mocked estimate only)', () => {
    
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
    await mockOrderApi(page, mockOrderStandard);
  });

  test('Should show Print Estimate button and trigger print', async ({ page }) => {
    // Navigate directly to the order page
    await page.goto(`/orders/${mockOrderStandard.id}`);

    // Wait for loading to finish
    await expect(page.getByText('Loading order details...')).not.toBeVisible();
    
    // Check for Print Estimate Button
    const printBtn = page.getByRole('button', { name: 'Print Estimate' });
    
    try {
        await expect(printBtn).toBeVisible({ timeout: 5000 });
    } catch (e) {
        await dumpOnFail(page);
        throw e;
    }

    // Mock Print
    await page.exposeFunction('mockPrint', () => console.log('Print Triggered'));
    await page.addInitScript(() => {
        (window as any).print = (window as any).mockPrint;
    });

    await printBtn.click();

    // Verify Content in hidden Print View
    // Checking for H1 with ESTIMATE (standard check)
    const billView = page.locator('h1', { hasText: 'ESTIMATE' });
    await expect(billView).toBeAttached();
    
    // Check specific customer name from mock
    // Note: The hidden div might not be 'div.hidden' exactly depending on Tailwind, 
    // but we can search for the text in the invisible part of the DOM.
    // .isVisible() would return false, but .first() or locator should find it.
    const customer = page.getByText(mockOrderStandard.customer.name).first();
    await expect(customer).toBeAttached();
  });
});
