import { test, expect, Page } from '@playwright/test';

test.describe('Applicant Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:2700/register');
  });

  // ฟังก์ชันช่วยกรอกข้อมูลส่วนตัวพื้นฐานที่ใช้ซ้ำในหลาย test case (ชื่อ, นามสกุล, อีเมล, เบอร์โทร, เพศ)
  async function fillBasicInfo(page: Page , data: { firstName: string; lastName: string; email: string; phone: string; gender: 'ชาย' | 'หญิง' }) {
    await page.getByPlaceholder('ชื่อ').fill(data.firstName);
    await page.getByPlaceholder('นามสกุล').fill(data.lastName);
    await page.getByPlaceholder('อีเมล').fill(data.email);
    await page.getByPlaceholder('เบอร์โทร').fill(data.phone);
    await page.getByRole('radio', { name: data.gender }).check();
  }

  // IT-TC-007: กรณีกรอกข้อมูลถูกต้องครบถ้วนและกดยืนยันแล้วต้องลงทะเบียนสำเร็จ
  test('IT-TC-007: registration succeeds with valid and complete information', async ({ page }) => {
    // ใช้ timestamp ทำให้อีเมล/เบอร์โทรไม่ซ้ำทุกครั้งที่รัน ป้องกัน fail จาก duplicate data
    const uniqueId = Date.now().toString().slice(-8);

    await fillBasicInfo(page, {
      firstName: 'ทดสอบ',
      lastName: 'ระบบ',
      email: `test${uniqueId}@mail.com`,
      phone: `08${uniqueId}`,
      gender: 'ชาย',
    });

  
    await page.getByRole('radio', { name: 'มัธยมศึกษาตอนปลาย' }).check();
    await page.getByPlaceholder('มัธยมศึกษาตอนปลาย').fill('โรงเรียนทดสอบ');
    await page.getByPlaceholder('แผนการเรียน').fill('วิทย์-คณิต');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();

    // ระบบต้องแสดงป๊อปอัปยืนยันก่อน submit จริง
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();

    // Expected: ต้องบันทึกสำเร็จ แสดงข้อความแจ้งเตือน และพากลับไปหน้า Login
    await expect(page.getByText(/ลงทะเบียนสำเร็จ/)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  // IT-TC-008 : การลงทะเบียนกรณี รหัสผ่านน้อยกว่า 8 ตัวอักษร
  test('IT-TC-008: registration fails when password is less than 8 characters', async ({ page }) => {
    await fillBasicInfo(page, {
      firstName: 'ทดสอบ',
      lastName: 'รหัสผ่านสั้น',
      email: 'shortpass@mail.com',
      phone: '0822222222',
      gender: 'ชาย',
    });

    await page.getByRole('radio', { name: 'มัธยมศึกษาตอนปลาย' }).check();
    await page.getByPlaceholder('มัธยมศึกษาตอนปลาย').fill('โรงเรียนทดสอบ');
    await page.getByPlaceholder('แผนการเรียน').fill('วิทย์-คณิต');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('1234567');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();

    // Expected: แสดงข้อความเตือนใต้ input ว่า "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" และ ต้องไม่มี popup ยืนยัน
    await expect(page.getByText('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')).toBeVisible();
  });

  // IT-TC-009 : การลงทะเบียนกรณี ยืนยันรหัสผ่านไม่ตรงกัน
  test('IT-TC-009: registration fails when password confirmation does not match', async ({ page }) => {
    await fillBasicInfo(page, {
      firstName: 'ทดสอบ',
      lastName: 'ยืนยันรหัสไม่ตรง',
      email: 'mismatch@mail.com',
      phone: '0833333333',
      gender: 'หญิง',
    });

    await page.getByRole('radio', { name: 'มัธยมศึกษาตอนปลาย' }).check();
    await page.getByPlaceholder('มัธยมศึกษาตอนปลาย').fill('โรงเรียนทดสอบ');
    await page.getByPlaceholder('แผนการเรียน').fill('วิทย์-คณิต');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Passw0rd1');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('1dr0wssaP');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();

   // Expected: แสดงข้อความเตือนใต้ input ว่า "รหัสผ่านไม่ตรงกัน" 
    await expect(page.getByText('รหัสผ่านไม่ตรงกัน')).toBeVisible();
  });

  // IT-TC-010 : การลงทะเบียนกรณี อีเมลผิดรูปแบบ
  test('IT-TC-010: registration fails when email format is invalid', async ({ page }) => {
    await fillBasicInfo(page, {
      firstName: 'ทดสอบ',
      lastName: 'อีเมลผิดรูปแบบ',
      email: 'https://www.google.com/search?q=testemail.com',
      phone: '0844444444',
      gender: 'ชาย',
    });

    await page.getByRole('radio', { name: 'มัธยมศึกษาตอนปลาย' }).check();
    await page.getByPlaceholder('มัธยมศึกษาตอนปลาย').fill('โรงเรียนทดสอบ');
    await page.getByPlaceholder('แผนการเรียน').fill('วิทย์-คณิต');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();

    // Expected: ต้องไม่ปล่อยให้ลงทะเบียนสำเร็จ และต้องเห็นข้อความเตือน "รูปแบบอีเมลไม่ถูกต้อง"
    await expect(page.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeVisible();
  });

  // IT-TC-011 : การลงทะเบียนกรณี เบอร์โทรผิดรูปแบบ
  // (STATUS CASE: FAIL) — ระบบยังอนุญาตให้ลงทะเบียนสำเร็จ ด้วยเบอร์โทรผิดรูปแบบ ทั้งที่ควรบล็อก
  test('IT-TC-012: registration fails when phone number format is invalid', async ({ page }) => {
    test.fail(true, 'case status fail : ระบบอนุญาตให้ลงทะเบียนสำเร็จด้วยเบอร์ผิดรูปแบบ');

  await fillBasicInfo(page, {
    firstName: 'ทดสอบ',
    lastName: 'เบอร์ผิดรูปแบบ',
    email: 'invalidphone@mail.com',
    phone: '1111111111',
    gender: 'ชาย',
  });

  await page.getByRole('radio', { name: 'มัธยมศึกษาตอนปลาย' }).check();
  await page.getByPlaceholder('มัธยมศึกษาตอนปลาย').fill('โรงเรียนทดสอบ');
  await page.getByPlaceholder('แผนการเรียน').fill('วิทย์-คณิต');

  await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
  await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
  await page.getByRole('button', { name: 'ลงทะเบียน' }).click();

  // เผื่อระบบเปิด popup ยืนยันขึ้นมาก่อน (พฤติกรรมจริงที่เจอ) ให้กดผ่านไป
  const confirmButton = page.getByRole('button', { name: 'ยืนยัน', exact: true });
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }

  // Expected ที่ถูกต้อง: ต้องไม่ปล่อยให้ลงทะเบียนสำเร็จ และต้องเห็นข้อความเตือนรูปแบบเบอร์
  await expect(page).not.toHaveURL(/intern-home/);
  await expect(page.getByText('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง')).toBeVisible();
});

  // IT-TC-013 : การลงทะเบียนกรณี กรอกข้อมูลถูกต้องครบถ้วนและกดยืนยันแล้วต้องไปหน้า login
  test('IT-TC-013: registration accepts free text for "มหาวิทยาลัย" education level', async ({ page }) => {
    await fillBasicInfo(page, {
      firstName: 'ทดสอบ',
      lastName: 'มหาวิทยาลัย',
      email: 'university@mail.com',
      phone: '0855555551',
      gender: 'ชาย',
    });

    await page.getByRole('radio', { name: 'มหาวิทยาลัย' }).check();
    await page.getByPlaceholder('มหาวิทยาลัย').fill('ส้มโอ');
    await page.getByPlaceholder('คณะ').fill('แกงเขียวหวาน');
    await page.getByPlaceholder('สาขาวิชา').fill('ไข่ดาว');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();

    // Expected: ระบบต้องยอมรับข้อความทั่วไปและแสดงป๊อปอัปยืนยันเพื่อบันทึกชื่อสถานศึกษาใหม่นี้
    await expect(page.getByRole('button', { name: 'ยืนยัน', exact: true })).toBeVisible();
  });

  // IT-TC-014 : ลงทะเบียนของระดับการศึกษา "มัธยมศึกษาตอนปลาย" เมื่อกรอกข้อมูลด้วยข้อความทั่วไป
  test('IT-TC-014: registration accepts free text for "มัธยมศึกษาตอนปลาย" education level', async ({ page }) => {
    await fillBasicInfo(page, {
      firstName: 'ทดสอบ',
      lastName: 'มัธยมปลาย',
      email: 'highschool@mail.com',
      phone: '0855555552',
      gender: 'หญิง',
    });

    await page.getByRole('radio', { name: 'มัธยมศึกษาตอนปลาย' }).check();
    await page.getByPlaceholder('มัธยมศึกษาตอนปลาย').fill('กะเพราหมูสับ');
    await page.getByPlaceholder('แผนการเรียน').fill('ไข่ดาว');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();

    // Expected: ระบบต้องยอมรับข้อความทั่วไป และแสดงหน้าต่างป๊อปอัป "ยืนยันการลงทะเบียน" เพื่อให้ดำเนินขั้นตอนต่อไปได้
    await expect(page.getByRole('button', { name: 'ยืนยัน', exact: true })).toBeVisible();
  });

  // IT-TC-015 : ลงทะเบียนของระดับการศึกษา "ประกาศนียบัตรวิชาชีพ (ปวช.)" เมื่อกรอกข้อมูลด้วยข้อความทั่วไป
  test('IT-TC-015: registration accepts free text for "ปวช." education level', async ({ page }) => {
    await fillBasicInfo(page, {
      firstName: 'ทดสอบ',
      lastName: 'ปวช',
      email: 'vocational@mail.com',
      phone: '0855555553',
      gender: 'ชาย',
    });

    await page.getByRole('radio', { name: 'ประกาศนียบัตรวิชาชีพ (ปวช.)' }).check();
    await page.getByPlaceholder('ประกาศนียบัตรวิชาชีพ (ปวช.)').fill('ข้าวขาหมู');
    await page.getByPlaceholder('สาขาวิชา').fill('ไข่ดาว');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();

    // Expected: ระบบต้องยอมรับข้อความทั่วไป และแสดงหน้าต่างป๊อปอัป "ยืนยันการลงทะเบียน" เพื่อให้ดำเนินขั้นตอนต่อไปได้
    await expect(page.getByRole('button', { name: 'ยืนยัน', exact: true })).toBeVisible();
  });

  // IT-TC-016 : ลงทะเบียนของระดับการศึกษา "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)" เมื่อกรอกข้อมูลด้วยข้อความทั่วไป
  test('IT-TC-016: registration accepts free text for "ปวส." education level', async ({ page }) => {
    await fillBasicInfo(page, {
      firstName: 'ทดสอบ',
      lastName: 'ปวส',
      email: 'highvoc@mail.com',
      phone: '0855555554',
      gender: 'หญิง',
    });

    await page.getByRole('radio', { name: 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)' }).check();
    await page.getByPlaceholder('ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)').fill('คนหล่อ');
    await page.getByPlaceholder('สาขาวิชา').fill('ขาวตี๋');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();
    
    // Expected: ระบบต้องยอมรับข้อความทั่วไป และแสดงหน้าต่างป๊อปอัป "ยืนยันการลงทะเบียน" เพื่อให้ดำเนินขั้นตอนต่อไปได้
    await expect(page.getByRole('button', { name: 'ยืนยัน', exact: true })).toBeVisible();
  });

  // IT-TC-017 : ลงทะเบียนของระดับการศึกษา "อื่นๆ" เมื่อกรอกข้อมูลด้วยข้อความทั่วไป 
  test('IT-TC-017: registration accepts free text for "อื่น ๆ" education level', async ({ page }) => {
    await fillBasicInfo(page, {
      firstName: 'ทดสอบ',
      lastName: 'การศึกษาอื่นๆ',
      email: 'others@mail.com',
      phone: '0855525555',
      gender: 'ชาย',
    });
 
    await page.getByRole('radio', { name: 'อื่น ๆ' }).check();
    await page.getByPlaceholder('เช่น หลักสูตรประกาศนียบัตร อบรมเฉพาะทาง การศึกษานอกประเทศ').fill('หมูมะนาว');
    await page.getByPlaceholder('พิมพ์เพื่อค้นหาชื่อสถานศึกษา หรือพิมพ์ชื่อใหม่').fill('ส้มตำ');
    await page.getByPlaceholder('คณะ').fill('แกงกะทิ');
    await page.getByPlaceholder('สาขาวิชา').fill('ลาบหมู');
 
    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();
 
    // Expected: ระบบต้องยอมรับข้อความทั่วไป และแสดงหน้าต่างป๊อปอัป "ยืนยันการลงทะเบียน" เพื่อให้ดำเนินขั้นตอนต่อไปได้
    await expect(page.getByRole('button', { name: 'ยืนยัน', exact: true })).toBeVisible();
  });

  // IT-TC-018: กรณีกรอกเบอร์โทรศัพท์ซ้ำกับที่มีอยู่ในระบบแล้ว
  test('IT-TC-018: registration fails when phone number is already registered', async ({ page }) => {
    // เบอร์ 0971549754 ต้องมีอยู่ในระบบแล้วก่อนรัน test 
    await fillBasicInfo(page, {
      firstName: 'การทดสอบ',
      lastName: 'รอบที่ 2',
      email: 'test1@gmail.com',
      phone: '0971549754',
      gender: 'ชาย',
    });

    await page.getByRole('radio', { name: 'อื่น ๆ' }).check();
    await page.getByPlaceholder('เช่น หลักสูตรประกาศนียบัตร อบรมเฉพาะทาง การศึกษานอกประเทศ').fill('หลักสูตรทั่วไป');
    await page.getByPlaceholder('พิมพ์เพื่อค้นหาชื่อสถานศึกษา หรือพิมพ์ชื่อใหม่').fill('สถานศึกษาทดสอบ');
    await page.getByPlaceholder('สาขาวิชา').fill('สาขาทดสอบ');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();

    // Expected: ระบบต้องแสดง Error Popup แจ้งว่าเบอร์โทรศัพท์ถูกใช้งานแล้ว
    await expect(page.getByText('ลงทะเบียนไม่สำเร็จ')).toBeVisible();
    await expect(page.getByText('เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว กรุณาใช้เบอร์โทรอื่น')).toBeVisible();
  });

  // IT-TC-019: กรณีกรอกอีเมลซ้ำกับที่มีอยู่ในระบบแล้ว
  test('IT-TC-019: registration fails when email is already registered', async ({ page }) => {
    // อีเมล 61111810@dpu.ac.th ต้องมีอยู่ในระบบแล้วก่อนรัน test นี้ 
    await fillBasicInfo(page, {
      firstName: 'Kobchai',
      lastName: 'Leawjuntron',
      email: 'hayatekungtar@gmail.com',
      phone: '0123445567',
      gender: 'ชาย',
    });

    await page.getByRole('radio', { name: 'มหาวิทยาลัย' }).check();
    await page.getByPlaceholder('มหาวิทยาลัย').fill('มหาวิทยาลัยทดสอบ');
    await page.getByPlaceholder('คณะ').fill('คณะทดสอบ');
    await page.getByPlaceholder('สาขาวิชา').fill('สาขาทดสอบ');

    await page.getByPlaceholder('รหัสผ่าน', { exact: true }).fill('Pass1234');
    await page.getByPlaceholder('ยืนยันรหัสผ่าน').fill('Pass1234');
    await page.getByRole('button', { name: 'ลงทะเบียน' }).click();
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();

    // Expected: ระบบต้องแสดง Error Popup แจ้งว่าอีเมลถูกใช้งานแล้ว
    await expect(page.getByText('ลงทะเบียนไม่สำเร็จ')).toBeVisible();
    await expect(page.getByText('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น')).toBeVisible();
  });
});