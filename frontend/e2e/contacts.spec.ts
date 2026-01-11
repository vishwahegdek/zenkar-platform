import { test, expect } from '@playwright/test';

test.describe('Contacts Management', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Username').fill('admin');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(/\/$|\/dashboard/);
    });

    test('Add, Edit and Delete Contact with Phone Types', async ({ page }) => {
        const timestamp = Date.now();
        const rand = Math.floor(Math.random() * 1000);
        const contactName = `Test Contact ${timestamp}-${rand}`;
        const newName = `Updated ${contactName}`;
        const phone1 = `98${timestamp.toString().slice(-8)}`;
        const phone2 = `99${timestamp.toString().slice(-8)}`;
        
        await page.route('**/api/auth/google/status', async route => {
            await route.fulfill({ json: { isConnected: true, lastSyncAt: new Date().toISOString() } });
        });

        let contacts: any[] = [];

        await page.route(/\/api\/contacts/, async route => {
             const method = route.request().method();
             const url = route.request().url();
             
             if (url.includes('/api/contacts/')) {
                 const parts = url.split('/');
                 const idStr = parts[parts.length - 1].split('?')[0]; 
                 const id = parseInt(idStr);
                 
                 if (method === 'PATCH') {
                     const data = route.request().postDataJSON();
                     const idx = contacts.findIndex(c => c.id === id);
                     if(idx !== -1) {
                         contacts[idx] = { 
                             ...contacts[idx], 
                             name: data.name, 
                             phones: data.phones.map((p: any) => ({ phone: p.value, type: p.type })), 
                             group: data.group 
                         };
                         await route.fulfill({ status: 200, json: contacts[idx] });
                     } else {
                         await route.fulfill({ status: 404 });
                     }
                 } else if (method === 'DELETE') {
                     contacts = contacts.filter(c => c.id !== id);
                     await route.fulfill({ status: 200 });
                 } else if (method === 'GET') {
                      const c = contacts.find(c => c.id === id);
                      if(c) await route.fulfill({ json: c });
                      else await route.fulfill({ status: 404 });
                 } else {
                     await route.continue();
                 }
             } else {
                 if (method === 'POST') {
                     const data = route.request().postDataJSON();
                     const newContact = { 
                         id: rand, 
                         name: data.name, 
                         phones: data.phones.map((p: any) => ({ phone: p.value, type: p.type })), // Backend returns 'phone', frontend sends 'value'
                         group: data.group
                     };
                     contacts.push(newContact);
                     await route.fulfill({ status: 201, json: newContact });
                 } else if (method === 'GET') {
                     const searchParams = new URLSearchParams(new URL(route.request().url()).search);
                     const query = searchParams.get('query'); // Use 'query' as per backend logic
                     
                     let result = contacts;
                     if (query) {
                         const lower = query.toLowerCase();
                         result = contacts.filter(c => c.name.toLowerCase().includes(lower) || c.phones.some((p: any) => p.value.includes(lower)));
                     }
                     // Mock Paginated Structure
                     await route.fulfill({ 
                         json: {
                             data: result,
                             meta: {
                                 total: result.length,
                                 page: 1,
                                 limit: 20,
                                 totalPages: 1
                             }
                         } 
                     });
                 } else {
                     await route.continue();
                 }
             }
        });

        await page.goto('/contacts');
        await expect(page.getByRole('button', { name: 'Reconnect' })).toBeVisible(); 

        // 1. Add Contact (Mobile)
        await page.getByPlaceholder('e.g. Ramesh (Labour)').fill(contactName);
        await page.getByPlaceholder('9876543210').first().fill(phone1); // New placeholder
        await page.getByPlaceholder('e.g. Labour, Vendor').fill('Test Group');
        await page.getByRole('button', { name: 'Save Contact' }).click();
        
        await expect(page.getByText(contactName)).toBeVisible();
        await expect(page.getByText(phone1)).toBeVisible();

        // 2. Edit Contact & Add WhatsApp
        await page.locator('div.flex.justify-between').filter({ hasText: contactName }).getByRole('button', { name: 'Edit' }).click();
        
        await page.getByPlaceholder('e.g. Ramesh (Labour)').fill(newName);
        
        // Add Another Phone
        await page.getByRole('button', { name: 'Add Another Phone' }).click();
        
        // Select WhatsApp for 2nd phone (index 1)
        // We select the select element that is inside the second row.
        const phoneRows = page.locator('form .space-y-2 > div');
        await expect(phoneRows).toHaveCount(2);
        
        const secondRow = phoneRows.nth(1);
        await secondRow.locator('select').selectOption('whatsapp');
        await secondRow.locator('input').fill(phone2);
        
        await page.getByRole('button', { name: 'Update Contact' }).click();
        
        // Verify Changes
        await expect(page.getByText(newName)).toBeVisible();
        await expect(page.getByText(phone1)).toBeVisible();
        await expect(page.getByText(phone2)).toBeVisible();
        
        // Verify WhatsApp Badge
        // Find the specific phone row in the list
        const contactCard = page.locator('div.flex.justify-between').filter({ hasText: newName });
        await expect(contactCard.getByText(/whatsapp/i)).toBeVisible(); 
        // My UI code: <span className="uppercase">{p.type}</span> -> WHATSAPP? No, UI code: {p.type} but class uppercase.
        // Wait, UI code said `className="... uppercase ..."`?
        // Let's check UI code again. `className="... uppercase ..."` yes.
        // So valid would be "WHATSAPP".
        
    });

    test('Load More Pagination Logic', async ({ page }) => {
        // Mock Many Contacts
        const total = 25;
        const page1 = Array.from({ length: 20 }, (_, i) => ({ id: i, name: `Contact ${i}`, phones: [{ value: '9999999999', type: 'mobile' }] }));
        const page2 = Array.from({ length: 5 }, (_, i) => ({ id: 20+i, name: `Contact ${20+i}`, phones: [{ value: '8888888888', type: 'mobile' }] }));

        await page.route('**/api/auth/google/status', async route => {
            await route.fulfill({ json: { isConnected: true, lastSyncAt: new Date().toISOString() } });
        });

        await page.route(/\/api\/contacts/, async route => {
             if (route.request().method() === 'GET') {
                 const url = new URL(route.request().url());
                 const pageNum = url.searchParams.get('page') || '1';
                 
                 if (pageNum === '1') {
                     await route.fulfill({ json: { data: page1, meta: { total, page: 1, limit: 20, totalPages: 2 } } });
                 } else {
                     await route.fulfill({ json: { data: page2, meta: { total, page: 2, limit: 20, totalPages: 2 } } });
                 }
             } else {
                 await route.continue();
             }
        });

        await page.goto('/contacts');
        
        // Check first page loaded
        await expect(page.getByText('Contact 0')).toBeVisible();
        await expect(page.getByText('Contact 19')).toBeVisible();
        await expect(page.getByText('Contact 20')).not.toBeVisible();

        // Check Load More Button
        const loadMore = page.getByRole('button', { name: 'Load More Contacts' });
        await expect(loadMore).toBeVisible();
        await loadMore.click();

        // Check second page loaded
        await expect(page.getByText('Contact 20')).toBeVisible();
        await expect(page.getByText('Contact 24')).toBeVisible();
        
        // Button should disappear
        await expect(loadMore).not.toBeVisible();
    });

    test('Filter by Owner', async ({ page }) => {
        // Mock Users
        await page.route('**/api/users', async route => {
            await route.fulfill({ json: [
                { id: 1, username: 'admin' },
                { id: 2, username: 'manager' }
            ]});
        });

        // Mock Contacts for Filter
        await page.route(/\/api\/contacts/, async route => {
             const url = new URL(route.request().url());
             const userId = url.searchParams.get('userId');
             
             if (userId === '2') {
                 // Return Manager's contacts
                 await route.fulfill({ json: { 
                     data: [{ id: 101, name: 'Manager Contact', phones: [], user: { username: 'manager' } }], 
                     meta: { total: 1, page: 1, limit: 20, totalPages: 1 } 
                 }});
             } else {
                 // Return All (default)
                 await route.fulfill({ json: { 
                     data: [
                         { id: 100, name: 'Admin Contact', phones: [], user: { username: 'admin' } },
                         { id: 101, name: 'Manager Contact', phones: [], user: { username: 'manager' } }
                     ], 
                     meta: { total: 2, page: 1, limit: 20, totalPages: 1 } 
                 }});
             }
        });

        await page.goto('/contacts');
        
        // Verify All Contacts initially
        await expect(page.getByText('Admin Contact')).toBeVisible();
        await expect(page.getByText('Manager Contact')).toBeVisible();

        // Check Owner Badge (for All view)
        await expect(page.getByText('Owner: admin')).toBeVisible();
        
        // Use Filter
        const filter = page.locator('select').first(); 
        await filter.selectOption({ label: "manager" });
        
        // Verify Filtered Content
        await expect(page.getByText('Manager Contact')).toBeVisible();
        await expect(page.getByText('Admin Contact')).not.toBeVisible();
    });
});
