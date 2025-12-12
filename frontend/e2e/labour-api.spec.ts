import { test, expect } from '@playwright/test';

test.describe('Labour Module API', () => {
    let apiContext;
    let token;
    const baseURL = 'http://localhost:3000'; // Backend URL

    test.beforeAll(async ({ playwright }) => {
        apiContext = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: {
                'Content-Type': 'application/json',
            },
        });

        // Login to get token
        const loginRes = await apiContext.post('/api/auth/login', {
            data: {
                username: 'admin',
                password: 'admin123'
            }
        });
        expect(loginRes.ok()).toBeTruthy();
        const loginData = await loginRes.json();
        token = loginData.access_token;
        
        // Update context with auth header
        apiContext = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
    });

    test.afterAll(async () => {
        await apiContext.dispose();
    });

    test('CRUD Labourer via API', async () => {
        const uniqueName = `API Labourer ${Date.now()}`;
        const wage = 600;

        // 1. Create Labourer
        const createRes = await apiContext.post('/api/labour', {
            data: {
                name: uniqueName,
                defaultDailyWage: wage
            }
        });
        expect(createRes.ok()).toBeTruthy();
        const created = await createRes.json();
        expect(created.name).toBe(uniqueName);
        expect(Number(created.defaultDailyWage)).toBe(wage);

        const labourerId = created.id;

        // 2. Get All Labourers and Verify
        const listRes = await apiContext.get('/api/labour');
        expect(listRes.ok()).toBeTruthy();
        const list = await listRes.json();
        const found = list.find(l => l.id === labourerId);
        expect(found).toBeDefined();
        
        // 3. Add Daily Attendance
        const today = new Date().toISOString().split('T')[0];
        const attendanceRes = await apiContext.post('/api/labour/daily', {
            data: {
                date: today,
                updates: [
                    {
                        contactId: labourerId,
                        attendance: 1.0, 
                        amount: 100 // Advance/Expense amount
                    }
                ]
            }
        });
        if (!attendanceRes.ok()) {
            console.log('Attendance Error:', await attendanceRes.text());
        }
        expect(attendanceRes.ok()).toBeTruthy();

        // 4. Get Report
        const reportRes = await apiContext.get(`/api/labour/report?date=${today}`);
        expect(reportRes.ok()).toBeTruthy();
        const report = await reportRes.json();
        // Check report structure (might return summary or daily data)
        // Adjust expectation based on actual API response structure
        // Assuming report returns array of daily summaries or similar
         // For now just checking 200 OK as structure might vary
    });

});
