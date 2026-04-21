import { swagger } from "@elysiajs/swagger";

const swaggerConfig = swagger({
  path: "/docs",
  documentation: {
    info: {
      title: "PEA Internships, PEA Itt API",
      version: "1.0.0",
      description: "ระบบบริหารจัดการนักศึกษาฝึกงาน การไฟฟ้าส่วนภูมิภาค (PEA), ระบบบันทึกเวลาทำงานของนักศึกษาฝึกงาน (PEA)",
    },
    tags: [
      {
        name: "Authentication(การยืนยันตัวตน)",
        description: "ระบบยืนยันตัวตน Login, Register และ Session มาตรฐานด้วย BetterAuth, Keycloak",
      },
      {
        name: "Users(ข้อมูลผู้ใช้)",
        description: "ระบบจะเก็บข้อมูลบัญชีผู้ใช้ในทุกบทบาทหน้าที่ (ADMIN, OWNER, STUDENT)",
      },
      {
        name: "Roles(บทบาทผู้ใช้)",
        description:
          "จัดการข้อมูลบทบาทและสิทธิ์การเข้าใช้งานระบบ (Roles & Permissions)\nADMIN: เจ้าหน้าที่ฝ่ายทรัพยากรบุคคล มีหน้าที่ตรวจสอบเอกสารขอความอนุเคราะห์ของนักศึกษา และมีสิทธิ์ในการเข้าถึงทุก Feature ของ OWNER\nOWNER: เจ้าหน้าที่ดูแลประจำแต่ละกองงาน มีหน้าที่เปิดรับสมัคร และอนุมัติรับนักศึกษาเข้าฝึกงาน\n.STUDENT: นักศึกษา ที่ต้องการสมัครฝึกงาน มีหน้าที่เลือกสมัครตามใบประกาศที่เปิดรับ และส่งเอกสารตามที่กำหนดไว้ในระบบ ",
      },
      {
        name: "Institutions(สถาบันการศึกษา)",
        description: "ข้อมูลสถาบันการศึกษา (ค้นหา / เพิ่มสถาบันใหม่ในขั้นตอนสมัคร)",
      },
      {
        name: "Departments(กองงาน/หน่วยงาน)",
        description: "ข้อมูลกองงาน, สำนักงาน, และโครงสร้างหน่วยงานของ PEA",
      },
      {
        name: "Positions(ใบประกาศรับสมัครฝึกงาน)",
        description: "ประกาศตำแหน่งฝึกงาน",
      },
      {
        name: "Applications(การสมัครฝึกงาน)",
        description:
          "กระบวนการสมัครฝึกงานของนักศึกษา (สมัคร, อัปโหลดเอกสาร, ตรวจเอกสาร)",
      },
      {
        name: "Documents(เอกสารสมัครฝึกงาน)",
        description:
          "เอกสารที่เกี่ยวข้องกับการสมัครฝึกงาน (Transcript, Resume, Portfolio, Request Letter)",
      },
      {
        name: "Projects(โครงงาน)",
        description: "โครงงานที่นักศึกษาฝึกงานได้รับมอบหมาย",
      },
      {
        name: "Daily Work Logs(บันทึกประจำวัน)",
        description: "บันทึกการทำงานประจำวันของนักศึกษาฝึกงาน",
      },
      {
        name: "Notifications(ระบบแจ้งเตือน)",
        description: "มีระบบแจ้งเตือนภายในระบบ",
      },
    ],
  },
});

export default swaggerConfig;
