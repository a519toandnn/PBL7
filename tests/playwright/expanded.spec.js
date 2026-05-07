const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

test.describe('Pharmacy full smoke flows', () => {
  test('user checkout + consultation submit + admin reply', async ({ page }) => {
    // 1. Sign in as demo admin (faster demo login button)
    await page.goto(BASE + '/signin');
    const demoBtn = page.locator('text=Demo Admin Login');
    if (await demoBtn.count() > 0) {
      await demoBtn.click();
      await page.waitForLoadState('networkidle');
    } else {
      // fallback to filling demo user credentials
      await page.fill('input[name="email"]', 'demo@test.com');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button:has-text("Sign In")');
      await page.waitForLoadState('networkidle');
    }

    // 2. Navigate to products (use client-side click to preserve in-memory cart)
    await page.click('text=Products');
    // robustly click the first "Add To Cart" or go to first product and add there
    const addBtn = page.locator('button:has-text("Add To Cart")').first();
    if (await addBtn.count() > 0) {
      await expect(addBtn).toBeVisible({ timeout: 7000 });
      await addBtn.click();
      // handle success swal modal
      const swalBtn = page.locator('.swal-button--confirm');
      if (await swalBtn.count() > 0) {
        await swalBtn.click();
        // wait for swal overlay to disappear
        await page.waitForSelector('.swal-overlay', { state: 'hidden', timeout: 5000 }).catch(() => {});
      } else {
        await page.waitForSelector('.swal-overlay', { state: 'hidden', timeout: 5000 }).catch(() => {});
      }

    // verify cart count updated in navbar (orders length)
    const cartBadge = page.locator('.relative.flex.cursor-pointer span').first();
    await expect(cartBadge).toHaveText(/\d+/, { timeout: 5000 });
    } else {
      // open first product detail and add from there
      // Wait for products to render, then click the first "View" button via DOM to avoid animation instability
      await page.waitForSelector('img', { timeout: 10000 });
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().startsWith('View'));
        if (btn) btn.click();
      });
      await page.waitForLoadState('networkidle');
      // the button text can vary (Added/Add To Cart), so select by class as fallback
      const detailAdd = page.locator('button:has-text("Add To Cart")').first();
      if (await detailAdd.count() === 0) {
        const btn = page.locator('button.btn-primary').first();
        await expect(btn).toBeVisible({ timeout: 10000 });
        await btn.click({ force: true });
        const swalBtn = page.locator('.swal-button--confirm');
        if (await swalBtn.count() > 0) {
          await swalBtn.click();
          await page.waitForSelector('.swal-overlay', { state: 'hidden', timeout: 5000 }).catch(() => {});
        } else {
          await page.waitForSelector('.swal-overlay', { state: 'hidden', timeout: 5000 }).catch(() => {});
        }
      } else {
        await expect(detailAdd).toBeVisible({ timeout: 7000 });
        await detailAdd.click();
      }
    }

    // 3. Open cart from navbar (client-side navigation) and proceed to checkout
    // navigate client-side to /orders to avoid swal overlay blocking clicks
    await page.evaluate(() => {
      try {
        window.history.pushState({}, '', '/orders');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (e) {
        window.location.href = '/orders';
      }
    });
    await page.waitForSelector('text=Proceed to Checkout', { timeout: 7000 });
    await page.click('text=Proceed to Checkout');
    await page.waitForURL('**/checkout');

    // 4. Fill payment and place order
    await page.fill('input[name="cardName"]', 'Test User');
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiryDate"]', '12/30');
    await page.fill('input[name="cvv"]', '123');
    await page.click('text=Place Order');

    // wait for redirection to orders
    await page.waitForURL('**/orders', { timeout: 10000 });
    await expect(page.locator('text=All Orders').first()).toBeVisible();

    // 5. Submit a consultation question (as the same user)
    await page.goto(BASE + '/consultation');

    // fill and submit the consultation form
    await page.fill('input[name="name"]', 'Playwright Tester');
    await page.fill('input[name="email"]', 'pwtester@example.com');
    await page.fill('input[name="phone"]', '0123456789');
    await page.fill('textarea[name="question"]', 'I have a headache and need a recommendation.');

    // Listen for alert triggered by the form submission
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    await page.click('text=Gửi câu hỏi');

    // Small pause to ensure localStorage updated
    await page.waitForTimeout(500);

    // Verify localStorage contains the question
    const storage = await page.evaluate(() => localStorage.getItem('consultationQuestions'));
    expect(storage).not.toBeNull();
    const questions = JSON.parse(storage || '[]');
    expect(questions.length).toBeGreaterThan(0);
    const latest = questions[questions.length - 1];
    expect(latest.question).toContain('headache');

    // 6. Sign in as admin (same context) and reply
    await page.goto(BASE + '/signin');
    // click Demo Admin Login
    const demoAdminBtn = page.locator('text=Demo Admin Login');
    await demoAdminBtn.click();
    await page.waitForLoadState('networkidle');

    // Go to admin consultations
    await page.goto(BASE + '/admin/consultations');
    await page.waitForSelector('text=Admin — Consultations');

    // Find the question and click Reply
    const questionCard = page.locator('text=headache').first();
    await expect(questionCard).toBeVisible();

    // Click the Reply button within that card
    const replyButton = questionCard.locator('xpath=..').locator('text=Reply').first();
    // Fallback: try to click any Reply button
    if (await replyButton.count() === 0) {
      await page.click('text=Reply');
    } else {
      await replyButton.click();
    }

    // Fill reply and recommendation
    await page.fill('textarea', 'Please take paracetamol and rest.');
    // choose first product recommendation if available
    const select = page.locator('select');
    if (await select.count() > 0) {
      await select.selectOption({ index: 1 });
    }

    await page.click('text=Send Reply');

    // Verify reply appears on the page
    await expect(page.locator('text=Admin reply:')).toBeVisible();
    await expect(page.locator('text=Please take paracetamol')).toBeVisible();
  });
});
