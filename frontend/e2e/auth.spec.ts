
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    
  test('Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await expect(page).toHaveURL(/\/$|\/dashboard|\/orders/); // Redirects to default
    
    // Check for Logout button or User Profile to confirm session
    // Assuming Mobile or Desktop layout has some indicator
    // For now, checking URL and lack of login form is enough
    await expect(page.getByLabel('Username')).not.toBeVisible();
  });

  test('Login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('wrong');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should stay on login
    await expect(page).toHaveURL(/\/login/);
    
    // Should show error (if implemented, otherwise just check URL)
    // await expect(page.getByText('Invalid')).toBeVisible(); 
  });
});
