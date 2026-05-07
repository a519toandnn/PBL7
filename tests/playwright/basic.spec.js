const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

test.describe('Pharmacy app - basic flows', () => {
  test('home page loads', async ({ page }) => {
    const res = await page.goto(BASE + '/');
    expect(res && res.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Pharmacy|Home|Pharm/);
  });

  test('demo admin sign-in redirects to /admin', async ({ page }) => {
    await page.goto(BASE + '/signin');
    // Click the Demo Admin Login button if present
    const demoBtn = page.locator('text=Demo Admin Login');
    if (await demoBtn.count() > 0) {
      await demoBtn.click();
      // wait for admin dashboard heading to appear
      const adminHeading = page.locator('text=Admin Dashboard');
      await expect(adminHeading).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Demo Admin Login button not found');
    }
  });
});
