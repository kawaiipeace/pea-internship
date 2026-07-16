import { test, expect } from '@playwright/test';

test.describe('Applicant Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:2700/login/intern');
  });

  // Module นี้ไม่มี data-testid ให้ใช้ placeholder และ role 
  test('IT-TC-002: login fails when phone number format is invalid', async ({ page }) => {
    // เบอร์โทรศัพท์ที่ไม่ใช่หมายเลขจริง (ตัวเลขสุ่ม 10 หลักที่ไม่ขึ้นต้นด้วย 06, 08, 09)
    await page.getByPlaceholder('เบอร์โทรศัพท์').fill('1234567890');
    await page.getByPlaceholder('รหัสผ่าน').fill('Testing1234');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

    // ระบบต้องไม่อนุญาตให้เข้าสู่ระบบ และต้องยังอยู่ที่หน้า login เดิม
    await expect(page).toHaveURL(/\/login\/intern/);
    await expect(page.getByText(/เบอร์โทรศัพท์หรือรหัสผ่าน ไม่ถูกต้อง กรุณาระบุข้อมูลอีกครั้ง/)).toBeVisible();
  });

  test('IT-TC-003: login fails when password is incorrect', async ({ page }) => {
    // เบอร์โทรศัพท์นี้มีลงทะเบียนอยู่ในระบบแล้ว แต่กรอกรหัสผ่านผิด 
    await page.getByPlaceholder('เบอร์โทรศัพท์').fill('0971549754');
    await page.getByPlaceholder('รหัสผ่าน').fill('wrongpass123');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

    await expect(page).toHaveURL(/\/login\/intern/);
    await expect(page.getByText(/เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้องกรุณาระบุข้อมูลอีกครั้ง/)).toBeVisible();
  });

  test('IT-TC-004: login fails when phone number is not registered', async ({ page }) => {
    // เบอร์โทรศัพท์นี้ยังไม่เคยลงทะเบียนในระบบ
    await page.getByPlaceholder('เบอร์โทรศัพท์').fill('0999999999');
    await page.getByPlaceholder('รหัสผ่าน').fill('Test1234');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

    await expect(page).toHaveURL(/\/login\/intern/);
    await expect(page.getByText(/เบอร์โทรศัพท์หรือรหัสผ่าน ไม่ถูกต้อง/)).toBeVisible();
  });

  test('IT-TC-005: login succeeds with valid phone number and password', async ({ page }) => {
    // มีบัญชีผู้ใช้งานนี้อยู่ในระบบแล้ว กรอกข้อมูลถูกต้องครบถ้วน (ต้องสมัครด้วย)
    await page.getByPlaceholder('เบอร์โทรศัพท์').fill('0971549754');
    await page.getByPlaceholder('รหัสผ่าน').fill('12345678');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

    // ต้องออกจากหน้า login และแถบเมนูต้องเปลี่ยนเป็นไอคอนแจ้งเตือน/โปรไฟล์
    await expect(page).not.toHaveURL(/\/login\/intern/);
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).toHaveCount(0);
    await expect(page.getByPlaceholder(/ค้นหาตำแหน่ง/)).toBeVisible();
  });
});