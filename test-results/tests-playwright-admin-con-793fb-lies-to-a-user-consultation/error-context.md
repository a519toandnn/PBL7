# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\playwright\admin-consultation.spec.js >> Admin replies to a user consultation
- Location: tests\playwright\admin-consultation.spec.js:5:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e6]:
        - img "logo" [ref=e7]
        - heading "Long Chau Pharmacy" [level=1] [ref=e8]
      - generic [ref=e9]:
        - list [ref=e10]:
          - listitem [ref=e11]:
            - link "Home" [ref=e12] [cursor=pointer]:
              - /url: /
          - listitem [ref=e13]:
            - link "Products" [ref=e14] [cursor=pointer]:
              - /url: /products
          - listitem [ref=e15]:
            - link "Consultation" [ref=e16] [cursor=pointer]:
              - /url: /consultation
          - listitem [ref=e17]:
            - link "Contact" [ref=e18] [cursor=pointer]:
              - /url: /contact
        - generic [ref=e19]:
          - textbox "Search products..." [ref=e20]
          - button [ref=e21] [cursor=pointer]:
            - img [ref=e22]
        - generic [ref=e24]:
          - button "Sign In" [ref=e25] [cursor=pointer]
          - button "Sign Up" [ref=e26] [cursor=pointer]
  - generic [ref=e29]:
    - generic [ref=e30]:
      - heading "Tư Vấn Tình Hình Sức Khỏe" [level=1] [ref=e31]
      - paragraph [ref=e32]: Tìm hiểu về các tình trạng sức khỏe phổ biến, triệu chứng, thuốc phù hợp và lời khuyên
    - generic [ref=e33]:
      - button "Cảm lạnh & Cứng cơ" [ref=e35] [cursor=pointer]:
        - heading "Cảm lạnh & Cứng cơ" [level=3] [ref=e36]
        - img [ref=e37]
      - button "Viêm mũi dị ứng" [ref=e41] [cursor=pointer]:
        - heading "Viêm mũi dị ứng" [level=3] [ref=e42]
        - img [ref=e43]
      - button "Đau đầu & Chóng mặt" [ref=e47] [cursor=pointer]:
        - heading "Đau đầu & Chóng mặt" [level=3] [ref=e48]
        - img [ref=e49]
      - button "Đau bụng kinh & Kinh nguyệt không đều" [ref=e53] [cursor=pointer]:
        - heading "Đau bụng kinh & Kinh nguyệt không đều" [level=3] [ref=e54]
        - img [ref=e55]
      - button "Mệt mỏi & Suy nhược cơ thể" [ref=e59] [cursor=pointer]:
        - heading "Mệt mỏi & Suy nhược cơ thể" [level=3] [ref=e60]
        - img [ref=e61]
      - button "Da khô & Nứt nẻ" [ref=e65] [cursor=pointer]:
        - heading "Da khô & Nứt nẻ" [level=3] [ref=e66]
        - img [ref=e67]
      - button "Mụn & Mụn ẩn" [ref=e71] [cursor=pointer]:
        - heading "Mụn & Mụn ẩn" [level=3] [ref=e72]
        - img [ref=e73]
      - button "Ho & Viêm họng" [ref=e77] [cursor=pointer]:
        - heading "Ho & Viêm họng" [level=3] [ref=e78]
        - img [ref=e79]
      - button "Miễn dịch suy yếu & Cảm lạnh thường xuyên" [ref=e83] [cursor=pointer]:
        - heading "Miễn dịch suy yếu & Cảm lạnh thường xuyên" [level=3] [ref=e84]
        - img [ref=e85]
      - button "Tiêu chảy & Các vấn đề tiêu hóa" [ref=e89] [cursor=pointer]:
        - heading "Tiêu chảy & Các vấn đề tiêu hóa" [level=3] [ref=e90]
        - img [ref=e91]
    - generic [ref=e94]:
      - heading "📞 Cần khám chuyên khoa?" [level=3] [ref=e95]
      - paragraph [ref=e96]: Nếu bạn có bất kỳ triệu chứng nặng ngoài những tình huống nêu trên hoặc tình trạng không cải thiện trong thời gian nêu, vui lòng liên hệ với điều dưỡng viên hoặc bác sĩ của chúng tôi để được tư vấn chi tiết.
    - generic [ref=e97]:
      - heading "📝 Hỏi Dược Sĩ" [level=3] [ref=e98]
      - paragraph [ref=e99]: "Gửi câu hỏi của bạn, dược sĩ sẽ trả lời (demo: phản hồi mô phỏng)."
      - generic [ref=e100]:
        - generic [ref=e101]:
          - textbox "Họ và tên" [ref=e102]: E2E Tester
          - textbox "Email" [ref=e103]: e2e@test.com
          - textbox "Số điện thoại (tùy chọn)" [ref=e104]: "0900000000"
        - textbox "Mô tả triệu chứng hoặc câu hỏi" [active] [ref=e106]: "Demo question: recommend something for headache"
        - generic [ref=e107]:
          - button "Gửi câu hỏi" [ref=e108] [cursor=pointer]
          - button "Xóa demo" [ref=e109] [cursor=pointer]
  - button "Ask a pharmacist" [ref=e110] [cursor=pointer]:
    - img [ref=e111]
  - contentinfo [ref=e115]:
    - generic [ref=e116]:
      - generic [ref=e118]:
        - img "logo" [ref=e119]
        - heading "Long Chau Pharmacy" [level=1] [ref=e120]
      - generic [ref=e121]:
        - generic [ref=e122]:
          - heading "Working Hours" [level=2] [ref=e123]
          - list [ref=e124]:
            - listitem [ref=e125]: Monday – Sunday
            - listitem [ref=e126]: 7:00 AM – 10:00 PM
            - listitem [ref=e127]: 123 Nguyen Hue Street
            - listitem [ref=e128]: Da Nang, Vietnam
        - generic [ref=e129]:
          - heading "Services" [level=2] [ref=e130]
          - list [ref=e131]:
            - listitem [ref=e132]: Prescription Services
            - listitem [ref=e133]: Non-Prescription Medicines
            - listitem [ref=e134]: Health & Wellness Consultation
            - listitem [ref=e135]: Medical Equipment & Supplies
        - generic [ref=e136]:
          - heading "Contact" [level=2] [ref=e137]
          - list [ref=e138]:
            - listitem [ref=e139]: "Hotline: +84 858 765 765"
            - listitem [ref=e140]: "Phone: +84 236 123 4567"
            - listitem [ref=e141]: "Email: contact@longchaupharmacy.com"
    - paragraph [ref=e144]: © 2024 Long Chau Pharmacy. All rights reserved.
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
  4  | 
  5  | test('Admin replies to a user consultation', async ({ page }) => {
  6  |   // 1. Submit consultation as a user
  7  |   await page.goto(BASE + '/consultation');
  8  |   await page.fill('input[name="name"]', 'E2E Tester');
  9  |   await page.fill('input[name="email"]', 'e2e@test.com');
  10 |   await page.fill('input[name="phone"]', '0900000000');
  11 |   const message = 'Demo question: recommend something for headache';
  12 |   await page.fill('textarea[name="question"]', message);
  13 | 
  14 |   // Accept the alert created by the form submit
  15 |     page.once('dialog', async dialog => { await dialog.accept(); });
  16 |     // Dispatch submit event on the form to ensure React onSubmit handler runs
  17 |     await page.evaluate(() => {
  18 |       const form = document.querySelector('form');
  19 |       if (form) {
  20 |         form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  21 |       }
  22 |     });
> 23 |     await page.waitForFunction(() => !!localStorage.getItem('consultationQuestions'), { timeout: 5000 });
     |                ^ Error: page.waitForFunction: Test timeout of 30000ms exceeded.
  24 | 
  25 |   // Verify the question was saved to localStorage
  26 |   const storage = await page.evaluate(() => localStorage.getItem('consultationQuestions'));
  27 |   expect(storage).not.toBeNull();
  28 |   const arr = JSON.parse(storage || '[]');
  29 |   expect(arr.length).toBeGreaterThan(0);
  30 |   const found = arr.some(q => q.question && q.question.includes('headache'));
  31 |   expect(found).toBeTruthy();
  32 | 
  33 |   // 2. Sign in as admin using Demo Admin Login
  34 |   await page.goto(BASE + '/signin');
  35 |   const demoAdminBtn = page.locator('text=Demo Admin Login');
  36 |   await expect(demoAdminBtn).toBeVisible({ timeout: 5000 });
  37 |   await demoAdminBtn.click();
  38 |   await page.waitForLoadState('networkidle');
  39 | 
  40 |   // 3. Open admin consultations and reply to the latest question
  41 |   await page.goto(BASE + '/admin/consultations');
  42 |   await expect(page.locator('text=Admin — Consultations')).toBeVisible({ timeout: 5000 });
  43 | 
  44 |   // Find the card that contains our message
  45 |   const card = page.locator(`text=${'headache'}`).first();
  46 |   await expect(card).toBeVisible({ timeout: 5000 });
  47 | 
  48 |   // Click the Reply button within the same card
  49 |   // Use DOM evaluation to find correct Reply button near the matched text
  50 |   await page.evaluate(() => {
  51 |     const nodes = Array.from(document.querySelectorAll('div')).filter(d => d.innerText && d.innerText.includes('headache'));
  52 |     if (nodes.length) {
  53 |       const node = nodes[0];
  54 |       const replyBtn = node.parentElement.querySelector('button');
  55 |       if (replyBtn) replyBtn.click();
  56 |     }
  57 |   });
  58 | 
  59 |   // Fill reply and send
  60 |   await page.fill('textarea', 'Please take paracetamol and rest.');
  61 |   // If recommendation select exists, pick first product
  62 |   const select = page.locator('select');
  63 |   if (await select.count() > 0) await select.selectOption({ index: 1 }).catch(() => {});
  64 |   await page.click('text=Send Reply');
  65 | 
  66 |   // Verify reply is visible on page
  67 |   await expect(page.locator('text=Admin reply:')).toBeVisible({ timeout: 5000 });
  68 |   await expect(page.locator('text=Please take paracetamol')).toBeVisible({ timeout: 5000 });
  69 | });
  70 | 
```