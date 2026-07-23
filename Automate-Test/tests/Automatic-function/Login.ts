import { Page } from '@playwright/test';


// function กรอกเบอร์โทรศัพท์ + รหัสผ่าน แล้วกดปุ่ม "เข้าสู่ระบบ"
// หมายเหตุ: ฟังก์ชันนี้ไม่ได้ page.goto() ไปหน้า login ให้ ต้อง goto มาก่อนเรียกใช้เอง


export async function login(page: Page, phone: string, password: string) {
  await page.getByPlaceholder('เบอร์โทรศัพท์').fill(phone);
  await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill(password);
  await page.locator('form').getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
}