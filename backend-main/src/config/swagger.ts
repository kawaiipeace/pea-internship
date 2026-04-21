import { swagger } from "@elysiajs/swagger";

const swaggerConfig = swagger({
  path: "/docs",
  documentation: {
    info: {
      title: "PEA Internships, PEA Itt API",
      version: "1.0.0",
      description:
        "ระบบบริหารจัดการนักศึกษาฝึกงาน การไฟฟ้าส่วนภูมิภาค (PEA), ระบบบันทึกเวลาทำงานของนักศึกษาฝึกงาน (PEA)",
    },
    tags: [
      {
        name: "Authentication",
        description:
          "ระบบยืนยันตัวตน Login, Register และ Session มาตรฐานด้วย BetterAuth, Keycloak",
      },
      {
        name: "Users",
        description: "ระบบจะเก็บข้อมูลบัญชีผู้ใช้ในทุกบทบาทหน้าที่ (ADMIN, OWNER, STUDENT)",
      },
      {
        name: "Roles",
        description:
          "จัดการข้อมูลบทบาทและสิทธิ์การเข้าใช้งานระบบ (Roles & Permissions)\nADMIN: เจ้าหน้าที่ฝ่ายทรัพยากรบุคคล มีหน้าที่ตรวจสอบเอกสารขอความอนุเคราะห์ของนักศึกษา และมีสิทธิ์ในการเข้าถึงทุก Feature ของ OWNER\nOWNER: เจ้าหน้าที่ดูแลประจำแต่ละกองงาน มีหน้าที่เปิดรับสมัคร และอนุมัติรับนักศึกษาเข้าฝึกงาน\n.STUDENT: นักศึกษา ที่ต้องการสมัครฝึกงาน มีหน้าที่เลือกสมัครตามใบประกาศที่เปิดรับ และส่งเอกสารตามที่กำหนดไว้ในระบบ ",
      },
      {
        name: "Institutions",
        description: "ข้อมูลสถาบันการศึกษา (ค้นหา / เพิ่มสถาบันใหม่ในขั้นตอนสมัคร)",
      },
      {
        name: "Departments",
        description: "ข้อมูลกองงาน, สำนักงาน, และโครงสร้างหน่วยงานของ PEA",
      },
      {
        name: "Positions",
        description: "ประกาศตำแหน่งฝึกงาน",
      },
      {
        name: "Applications",
        description:
          "กระบวนการสมัครฝึกงานของนักศึกษา (สมัคร, อัปโหลดเอกสาร, ตรวจเอกสาร)",
      },
      {
        name: "Documents",
        description:
          "เอกสารที่เกี่ยวข้องกับการสมัครฝึกงาน (Transcript, Resume, Portfolio, Request Letter)",
      },
      {
        name: "Projects",
        description: "โครงงานที่นักศึกษาฝึกงานได้รับมอบหมาย",
      },
      {
        name: "Daily Work Logs",
        description: "บันทึกการทำงานประจำวันของนักศึกษาฝึกงาน",
      },
      {
        name: "Notifications",
        description: "มีระบบแจ้งเตือนภายในระบบ",
      },
    ],
  },
});

export default swaggerConfig;
