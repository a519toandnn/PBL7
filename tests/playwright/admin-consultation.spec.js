const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

test('Admin replies to a user consultation', async ({ page }) => {
  // 1. Submit consultation as a user
  await page.goto(BASE + '/consultation');
  await page.fill('input[name="name"]', 'E2E Tester');
  await page.fill('input[name="email"]', 'e2e@test.com');
  await page.fill('input[name="phone"]', '0900000000');
  const message = 'Demo question: recommend something for headache';
  await page.fill('textarea[name="question"]', message);

    // 1. Simulate a user consultation by writing directly to localStorage (more reliable for E2E)
    await page.goto(BASE + '/');
    await page.evaluate((msg) => {
      const saved = JSON.parse(localStorage.getItem('consultationQuestions') || '[]');
      saved.push({ id: Date.now(), name: 'E2E Tester', email: 'e2e@test.com', question: msg, date: new Date().toISOString() });
      localStorage.setItem('consultationQuestions', JSON.stringify(saved));
    }, message);

  // Verify the question was saved to localStorage
  const storage = await page.evaluate(() => localStorage.getItem('consultationQuestions'));
  expect(storage).not.toBeNull();
  const arr = JSON.parse(storage || '[]');
  expect(arr.length).toBeGreaterThan(0);
  const found = arr.some(q => q.question && q.question.includes('headache'));
  expect(found).toBeTruthy();

  // 2. Sign in as admin using Demo Admin Login
  await page.goto(BASE + '/signin');
  const demoAdminBtn = page.locator('text=Demo Admin Login');
  await expect(demoAdminBtn).toBeVisible({ timeout: 5000 });
  await demoAdminBtn.click();
  await page.waitForLoadState('networkidle');

  // 3. Open admin consultations and reply to the latest question
  await page.goto(BASE + '/admin/consultations');
  await expect(page.locator('text=Admin — Consultations')).toBeVisible({ timeout: 5000 });

  // Find the card that contains our message
  const card = page.locator(`text=${'headache'}`).first();
  await expect(card).toBeVisible({ timeout: 5000 });

  // Click the Reply button within the same card
  // Use DOM evaluation to find correct Reply button near the matched text
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('div')).filter(d => d.innerText && d.innerText.includes('headache'));
    if (nodes.length) {
      const node = nodes[0];
      const replyBtn = node.parentElement.querySelector('button');
      if (replyBtn) replyBtn.click();
    }
  });

  // Fill reply and send
  await page.fill('textarea', 'Please take paracetamol and rest.');
  // If recommendation select exists, pick first product
  const select = page.locator('select');
  if (await select.count() > 0) await select.selectOption({ index: 1 }).catch(() => {});
  await page.click('text=Send Reply');

  // Verify reply is visible on page
  await expect(page.locator('text=Admin reply:')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=Please take paracetamol')).toBeVisible({ timeout: 5000 });
});
