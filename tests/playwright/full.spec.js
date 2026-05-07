const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

test.describe('Full smoke flows', () => {
  test('navigate header links', async ({ page }) => {
    await page.goto(BASE + '/');
    // Click Products
    await page.click('text=Products');
    await expect(page).toHaveURL(/\/products/);

    // Click Consultation
    await page.click('text=Consultation');
    await expect(page).toHaveURL(/\/consultation/);

    // Click Contact
    await page.click('text=Contact');
    await expect(page).toHaveURL(/\/contact/);
  });

  test('consultation form submission stored in localStorage', async ({ page }) => {
    await page.goto(BASE + '/consultation');
    // Fill and submit form
    await page.fill('input[name="name"]', 'QA Tester');
    await page.fill('input[name="email"]', 'qa@test.local');
    await page.fill('textarea[name="question"]', 'This is an automated test question.');
    await page.click('text=Gửi câu hỏi');

    // Check localStorage has an entry
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('consultationQuestions') || '[]'));
    expect(saved.length).toBeGreaterThan(0);
    const last = saved[saved.length - 1];
    expect(last.name).toBe('QA Tester');
    expect(last.email).toBe('qa@test.local');
  });

  test('admin can reply and recommend product', async ({ page }) => {
    // sign in using demo admin
    await page.goto(BASE + '/signin');
    const demoBtn = page.locator('text=Demo Admin Login');
    await demoBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();

    // go to consultations
    await page.goto(BASE + '/admin/consultations');
    await expect(page).toHaveURL(/\/admin\/consultations/);

    // find the first Reply button
    const replyBtn = page.locator('text=Reply').first();
    await expect(replyBtn).toBeVisible();
    await replyBtn.click();

    // fill reply and pick a recommendation if select exists
    await page.fill('textarea', 'Automated reply from QA');
    const select = page.locator('select');
    if (await select.count() > 0) {
      // pick the first non-empty option if available
      await select.selectOption({ index: 1 }).catch(() => {});
    }
    await page.click('text=Send Reply');

    // Verify reply appears on the page
    await expect(page.locator('text=Admin reply:')).toBeVisible();
    await expect(page.locator('text=Automated reply from QA')).toBeVisible();
  });
});
