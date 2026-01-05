
import { Page, expect } from '@playwright/test';
import { mockAuthUser } from '../mocks/orders.mock';

/**
 * Sets up a mocked authenticated session.
 * @param page Playwright Page object
 */
export async function setupMockAuth(page: Page) {
    await page.addInitScript((user) => {
        localStorage.setItem('token', 'fake-jwt-token');
        localStorage.setItem('user', JSON.stringify(user));
    }, mockAuthUser);
}

/**
 * Mocks the basic Order API endpoints (Login, List, Get One)
 * @param page Playwright Page object
 * @param specificOrder Optional order object to return for GET /orders/:id
 */
export async function mockOrderApi(page: Page, specificOrder?: any) {
    // Login
    await page.route('**/api/auth/login', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify({ access_token: 'fake-jwt-token', user: mockAuthUser }) });
    });

    // List
    await page.route('**/api/orders?*', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify({ data: [], meta: { total: 0 } }) });
    });

    // Get One
    if (specificOrder) {
        await page.route(`**/api/orders/${specificOrder.id}`, async route => {
            await route.fulfill({ status: 200, body: JSON.stringify(specificOrder) });
        });
    }
}

/**
 * Dumps page content to console on failure.
 * Usage: try { ... } catch (e) { await dumpOnFail(page); throw e; }
 */
export async function dumpOnFail(page: Page) {
    console.log('--- FAILURE DUMP START ---');
    console.log('URL:', page.url());
    console.log('HTML:', await page.content());
    console.log('--- FAILURE DUMP END ---');
}
