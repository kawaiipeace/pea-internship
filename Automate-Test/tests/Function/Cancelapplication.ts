import { Page } from '@playwright/test';

/**
 * ยกเลิกใบสมัครงานที่ค้างอยู่เพื่อให้สามารถสมัครตำแหน่งใหม่ได้ในการรัน test ครั้งถัดไป
 * ระบบไม่อนุญาตให้สมัครตำแหน่งเดิมซ้ำถ้ายังมีใบสมัครค้างอยู่ในสถานะ "รอยื่นเอกสาร" ฯลฯ
 * เรียกใช้ผ่าน test.afterEach() เพื่อให้ทำความสะอาดอัตโนมัติหลังจบทุก test case
 */
export async function cancelPendingApplication(page: Page) {
  await page.goto('http://localhost:2700/application-status');

  const cancelButton = page.getByRole('button', { name: 'ยกเลิกการสมัคร' });

  // ถ้าไม่มีใบสมัครค้างอยู่ ปุ่มนี้จะไม่โผล่มา ข้ามไปเลยไม่ต้องทำอะไรต่อ
  if (!(await cancelButton.isVisible().catch(() => false))) {
    return;
  }

  await cancelButton.click();

  // เผื่อระบบเปิด popup ให้ยืนยันการยกเลิกอีกรอบ (พฤติกรรมที่เจอบ่อยในระบบนี้)
  const confirmButton = page.getByRole('button', { name: 'ยืนยัน', exact: true });
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }
}