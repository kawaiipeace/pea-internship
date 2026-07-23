import { test, expect } from '@playwright/test';
import { login } from '../Automatic-function/Login';

test.describe('Applicant Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:2700/login/intern');
  });

  // IT-TC-002: การเข้าสู่ระบบด้วยเบอร์โทรศัพท์ที่ ไม่ใช่หมายเลขโทรศัพท์จริง (ตัวเลขสุ่ม 10 หลักที่ไม่ขึ้นต้นด้วย 06, 08, 09) 
  test('IT-TC-002: login fails when phone number format is invalid', async ({ page }) => {
    await login(page, '1234567890', 'Testing1234');

    // Expected: ระบบต้องไม่อนุญาตให้เข้าสู่ระบบ และต้องยังอยู่ที่หน้า login เดิม
    await expect(page).toHaveURL(/\/login\/intern/);
    await expect(page.getByText(/เบอร์โทรศัพท์หรือรหัสผ่าน ไม่ถูกต้อง กรุณาระบุข้อมูลอีกครั้ง/)).toBeVisible();
  });

  // IT-TC-003: การเข้าสู่ระบบด้วยรหัสผ่านที่ไม่ถูกต้อง
  test('IT-TC-003: login fails when password is incorrect', async ({ page }) => {
    await login(page, '0971549754', 'wrongpass123');

    // Expected: ระบบต้องไม่อนุญาตให้เข้าสู่ระบบ และ แสดงข้อความแจ้งเตือนว่า "เบอร์โทรศัพท์หรือรหัสผ่าน ไม่ถูกต้อง กรุณาระบุข้อมูลอีกครั้ง"
    await expect(page).toHaveURL(/\/login\/intern/);
    await expect(page.getByText(/เบอร์โทรศัพท์หรือรหัสผ่าน ไม่ถูกต้อง กรุณาระบุข้อมูลอีกครั้ง/)).toBeVisible();
  });

  // IT-TC-004: การเข้าสู่ระบบด้วยเบอร์โทรศัพท์ที่ยังไม่ได้ลงทะเบียน
  test('IT-TC-004: login fails when phone number is not registered', async ({ page }) => {
    await login(page, '0999999999', 'Test1234');

    // Expected: ระบบต้องไม่อนุญาตให้เข้าสู่ระบบ และ แสดงข้อความแจ้งเตือนว่า "เบอร์โทรศัพท์หรือรหัสผ่าน ไม่ถูกต้อง กรุณาระบุข้อมูลอีกครั้ง"
    await expect(page).toHaveURL(/\/login\/intern/);
    await expect(page.getByText(/เบอร์โทรศัพท์หรือรหัสผ่าน ไม่ถูกต้อง กรุณาระบุข้อมูลอีกครั้ง/)).toBeVisible();
  });

  // IT-TC-005: การเข้าสู่ระบบด้วยข้อมูลที่ถูกต้อง
  test('IT-TC-005: login succeeds with valid phone number and password', async ({ page }) => {
    // มีบัญชีผู้ใช้งานนี้อยู่ในระบบแล้ว กรอกข้อมูลถูกต้องครบถ้วน (ต้องสมัครด้วย)
    await login(page, '0971549754', 'tarmonster0099');

    // Expected: ต้องออกจากหน้า login และแถบเมนูต้องเปลี่ยนเป็นไอคอนแจ้งเตือน/โปรไฟล์
    await expect(page).not.toHaveURL(/\/login\/intern/);
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).toHaveCount(0);
    await expect(page.getByPlaceholder(/ค้นหาตำแหน่ง/)).toBeVisible();
  });
});