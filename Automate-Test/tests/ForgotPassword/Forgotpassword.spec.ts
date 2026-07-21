import {test, expect} from '@playwright/test';

test.describe('Forgot Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:2700/login/intern');

   // Click on the "Forgot Password" link first
    await page.getByRole('link', { name: 'ลืมรหัสผ่าน' }).click();
  });

    // IT-TC-040: กรณีไม่กรอกข้อมูลใด ๆ เลย
  test('IT-TC-040: In the event that there is absolutely no information available', async ({ page }) => {
    await page.getByRole('button', { name: 'ยืนยัน' }).click();

    // Expected: Show error message "ระบุเบอร์โทรศัพท์" และ "ระบุอีเมล" (ใต้ช่องกรอกข้อมูล)
    await expect(page.getByText(/ระบุเบอร์โทรศัพท์/)).toBeVisible();
    await expect(page.getByText(/ระบุอีเมล/)).toBeVisible();
  });
    
    // IT-TC-041: กรณีกรอกตัวอักษรลงในช่องเบอร์โทรศัพท์
    // Status: FAIL — ทีม Tester แนะนำให้ไม่สามารถกรอกตัวอักษรลงในช่องเบอร์โทรศัพท์ได้ (ควรเป็นตัวเลขเท่านั้น) แต่ระบบยังอนุญาตให้กรอกตัวอักษรลงไปได้
  test('IT-TC-041: Entering characters into the phone number field' , async ({ page }) => {
    test.fail(true, 'Known bug: ระบบยังอนุญาตให้กรอกตัวอักษรลงในช่องเบอร์โทรศัพท์ได้');
    await page.getByRole('textbox', { name: 'เบอร์โทรศัพท์' }).fill('abcทดสอบ');
    await page.getByRole('textbox', { name: 'อีเมล' }).fill('test@gmail.com');
    await page.getByRole('button', { name: 'ยืนยัน' }).click();

    // Expected ที่ถูกต้อง : ระบบต้องไม่อนุญาตให้กรอกตัวอักษรลงในช่องเบอร์โทรศัพท์ได้ หรือ กรอกได้แต่ต้องแสดงข้อความเตือนว่า "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง"
    await expect(page.getByText(/รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง/)).toBeVisible();
  });

    // IT-TC-042: กรณีระบบแจ้งเตือนเมื่อกรอกเบอร์โทรศัพท์หรืออีเมลที่ไม่ถูกต้องหรือไม่ถูกต้อง
  test ('IT-TC-042: System notification regarding the entry of an incorrect or invalid phone number or email address.', async ({ page }) => {
    await page.getByRole('textbox', { name: 'เบอร์โทรศัพท์' }).fill('0999999999');
    await page.getByRole('textbox', { name: 'อีเมล' }).fill('wrongdata@gmail.com');
    await page.getByRole('button', { name: 'ยืนยัน' }).click();

    // Expected: Show error message "ไม่พบบัญชีผู้ใช้จากเบอร์โทรศัพท์และอีเมลนี้"
    await expect(page.getByText(/ไม่พบบัญชีผู้ใช้จากเบอร์โทรศัพท์และอีเมลนี้/)).toBeVisible();
  });

    // IT-TC-043: การเข้าสู่หน้ายืนยันรหัส OTP เมื่อกรอกเบอร์โทรศัพท์และอีเมลถูกต้องตรงกับฐานข้อมูล
  test ('IT-TC-043: Entering a valid phone number and email address.', async ({ page }) => {
    await page.getByRole('textbox', { name: 'เบอร์โทรศัพท์' }).fill('0971549754');
    await page.getByRole('textbox', { name: 'อีเมล' }).fill('66111810@dpu.ac.th');
    await page.getByRole('button', { name: 'ยืนยัน' }).click();

    // Expected: Navigate to the OTP verification page
    await expect(page.getByRole('heading', { name: 'ยืนยันรหัส OTP' })).toBeVisible();
    await expect(page.getByText('กรุณากรอกรหัส 6')).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^รหัสยืนยัน$/ })).toBeVisible();
    await expect(page.getByText('ไม่ได้รับรหัส? ส่งรหัสใหม่')).toBeVisible();
  });

    // IT-TC-044: การแจ้งเตือนของระบบ กรณีกรอกรหัส OTP ไม่ถูกต้อง
  test ('IT-TC-044: System notification for entering an incorrect OTP code.', async ({ page }) => {
    await page.getByRole('textbox', { name: 'เบอร์โทรศัพท์' }).fill('0971549754');
    await page.getByRole('textbox', { name: 'อีเมล' }).fill('66111810@dpu.ac.th');
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    
    // ต้องรอให้ระบบตอบกลับก่อน ไม่งั้น assertion ข้างล่างจะเช็คเร็วเกินไปตอนฟอร์ม OTP ยังไม่ทันขึ้น
    await page.waitForTimeout(10000); // รอ 10 วินาที
    
    // ใช้ pressSequentially() แทน fill() เพราะช่อง OTP นี้เช็ค keystroke ทีละตัว
    const otpDigits = ['1', '2', '3', '4', '5', '6'];
        for (let i = 0; i < otpDigits.length; i++) {
            const input = page.getByRole('textbox').nth(i);
    await input.click(); // คลิกโฟกัสก่อนพิมพ์ทุกครั้ง เผื่อ auto-focus ของ component ทำงานไม่ตรงกับที่ Playwright เข้าใจ
    await input.pressSequentially(otpDigits[i]);
    }

    // จำลองกด Tab ออกจากช่องสุดท้าย
    await page.keyboard.press('Tab'); 

    // เช็คว่าปุ่มปลดล็อกแล้วก่อนกด (ถ้ายัง disabled จะเห็น error ชัดเจนกว่าการรอ timeout เฉยๆ)
    const confirmButton = page.getByRole('button', { name: 'ยืนยัน', exact: true });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Expected: Show error message "รหัสยืนยันไม่ถูกต้อง"
    await expect(page.getByText('รหัสยืนยันไม่ถูกต้อง')).toBeVisible();
    });
});