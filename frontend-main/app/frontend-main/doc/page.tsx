"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

type FileDoc = {
  file: string;
  purpose: string;
  editWhen: string;
  notes: string;
};

type RouteDoc = {
  url: string;
  file: string;
  purpose: string;
  editWhen: string;
  risk: string;
};

type ScenarioDoc = {
  topic: string;
  symptoms: string;
  files: string[];
  steps: string[];
};

type TechStackDoc = {
  technology: string;
  version: string;
  usedFor: string;
  whereToMaintain: string;
  maintenanceTips: string;
};

type ThemeMode = "light" | "dark";

type ApiEndpointDoc = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  purpose: string;
  usedInPages: string[];
};

type ApiModuleDoc = {
  file: string;
  domain: string;
  description: string;
  types: string[];
  functions: string[];
  notes: string;
  endpoints: ApiEndpointDoc[];
};

const quickStartSteps = [
  "เริ่มจากอ่านหัวข้อ 1-4 เพื่อเข้าใจภาพรวมระบบก่อน",
  "ถ้าจะแก้หน้าใดหน้าหนึ่ง ให้ไปที่หัวข้อ 5-9 (Route-by-Route)",
  "ถ้าจะแก้พฤติกรรม shared UI หรือ API ให้ไปที่หัวข้อ 10",
  "ถ้าเป็นปัญหา runtime/auth/redirect ให้ดูหัวข้อ 11 (Playbook)",
  "ก่อน merge ให้เทียบกับหัวข้อ 12 (Release Checklist)",
];

const techStack: TechStackDoc[] = [
  {
    technology: "Next.js (App Router)",
    version: "16.x",
    usedFor: "routing, rendering, rewrite, proxy integration",
    whereToMaintain: "next.config.ts, app/, proxy.ts",
    maintenanceTips:
      "ถ้า route หรือ /api rewrite ผิด ให้เช็ก next.config.ts และ proxy.ts ก่อน",
  },
  {
    technology: "React",
    version: "19.x",
    usedFor: "UI components และ state management ในหน้า",
    whereToMaintain: "app/**/*.tsx, components/**/*.tsx",
    maintenanceTips:
      "ระวัง state ที่กระทบหลาย component โดยเฉพาะหน้า dashboard",
  },
  {
    technology: "TypeScript",
    version: "5.x",
    usedFor: "type safety ทั้ง app, services, และ shared model",
    whereToMaintain: "tsconfig.json, services/api/*.ts, types/*.ts",
    maintenanceTips:
      "เพิ่ม/แก้ endpoint ควรแก้ type ไปพร้อมกันเพื่อลด runtime bug",
  },
  {
    technology: "Tailwind CSS",
    version: "4.x",
    usedFor: "styling ของทุกหน้าและ component",
    whereToMaintain: "app/globals.css, component className",
    maintenanceTips:
      "ถ้าโทนสีหรือ spacing เพี้ยนทั้งระบบ ให้เริ่มที่ globals.css",
  },
  {
    technology: "Axios",
    version: "1.x",
    usedFor: "HTTP client สำหรับเรียก backend",
    whereToMaintain: "services/api/client.ts (axios instance + interceptors)",
    maintenanceTips:
      "ควรเรียกผ่าน base /api เพื่อรักษา same-origin cookie flow; เพิ่ม endpoint ใหม่ให้ไปไว้ในไฟล์ domain ที่ services/api/*.ts (ไม่ใช่ client.ts)",
  },
  {
    technology: "ESLint",
    version: "9.x",
    usedFor: "lint และ quality gate ก่อน merge",
    whereToMaintain: "eslint.config.mjs",
    maintenanceTips: "รัน pnpm lint ก่อน push ทุกครั้ง",
  },
  {
    technology: "pnpm",
    version: "10.x",
    usedFor: "dependency management และ script execution",
    whereToMaintain: "package.json, .npmrc",
    maintenanceTips: "โปรเจกต์นี้ optimize มาสำหรับ pnpm เป็นหลัก",
  },
  {
    technology: "Docker",
    version: "Node 20 base image",
    usedFor: "containerized dev/prod runtime",
    whereToMaintain:
      "Dockerfile, dockerfile.dev, docker-compose.yml (root repo)",
    maintenanceTips:
      "ถ้า build image ไม่ผ่าน ให้ตรวจ .dockerignore และ dependency install ขั้นตอนแรก",
  },
];

const rootFiles: FileDoc[] = [
  {
    file: ".env.example",
    purpose: "แม่แบบตัวแปรแวดล้อมสำหรับ dev/deploy",
    editWhen: "เพิ่มหรือลด env variable ที่แอปต้องใช้",
    notes: "ห้ามใส่ secret จริงในไฟล์นี้",
  },
  {
    file: ".dockerignore",
    purpose: "กำหนดไฟล์ที่ไม่ต้อง copy เข้า image",
    editWhen: "ต้องการลดขนาด image หรือกันไฟล์ไม่จำเป็นเข้า Docker build",
    notes:
      "ตอนนี้ ignore README.md ด้วย ถ้าอยากให้ image มีเอกสารต้องแก้ที่ไฟล์นี้",
  },
  {
    file: ".gitignore",
    purpose: "กำหนดไฟล์/โฟลเดอร์ที่ไม่ commit",
    editWhen: "เพิ่ม output ใหม่ที่ไม่ควรเข้า git",
    notes: "มีการ ignore package-lock.json เพราะโปรเจกต์ใช้ pnpm",
  },
  {
    file: ".npmrc",
    purpose: "กำหนดพฤติกรรม install package (pnpm compatibility)",
    editWhen: "มีปัญหา peer dependency หรือ install บน CI/Vercel",
    notes: "ค่า shamefully-hoist=true มีผลต่อโครงสร้าง node_modules",
  },
  {
    file: ".nvmrc",
    purpose: "ระบุ Node.js version ที่แนะนำ",
    editWhen: "ยกระดับ Node version ของทั้งทีม",
    notes: "ปัจจุบันระบุ Node 20",
  },
  {
    file: "package.json",
    purpose: "scripts, dependencies, engines และ packageManager",
    editWhen: "เพิ่ม lib, เปลี่ยนคำสั่ง dev/build/start, อัปเดตเวอร์ชัน",
    notes: "พอร์ตหลักคือ 2700 ผ่าน scripts dev/start",
  },
  {
    file: "package-lock.json",
    purpose: "lock file ของ npm",
    editWhen: "แทบไม่ต้องแก้ใน workflow นี้",
    notes:
      "โปรเจกต์หลักใช้ pnpm; ถ้าทีมไม่ใช้ npm ควรหลีกเลี่ยงการอัปเดตไฟล์นี้",
  },
  {
    file: "tsconfig.json",
    purpose: "TypeScript compiler options และ path alias",
    editWhen: "ปรับ strictness, include/exclude, alias",
    notes: "alias @/* ชี้ไป root ของ frontend-main",
  },
  {
    file: "eslint.config.mjs",
    purpose: "ESLint rule set ของโปรเจกต์",
    editWhen: "เพิ่ม/ปรับ lint rule",
    notes: "ต่อยอดจาก eslint-config-next (core-web-vitals + typescript)",
  },
  {
    file: "postcss.config.mjs",
    purpose: "PostCSS plugin config",
    editWhen: "เปลี่ยน pipeline CSS หรือ plugin",
    notes: "ตอนนี้ใช้ @tailwindcss/postcss",
  },
  {
    file: "next.config.ts",
    purpose: "Next runtime config และ rewrite /api",
    editWhen: "แก้ backend destination, rewrite, runtime options",
    notes: "ถ้า API cross-domain มีปัญหา ให้เช็กไฟล์นี้ก่อน",
  },
  {
    file: "proxy.ts",
    purpose: "route guard, role-based redirect, auth flow control",
    editWhen: "เพิ่ม route protected/public, แก้ logic redirect",
    notes: "ไฟล์เสี่ยงสูงสุดเรื่อง login loop และสิทธิ์เข้าถึง",
  },
  {
    file: "Dockerfile",
    purpose: "production image build",
    editWhen: "ปรับขั้นตอน build/prod runtime",
    notes: "ใช้ multi-stage build",
  },
  {
    file: "dockerfile.dev",
    purpose: "development container setup",
    editWhen: "ปรับ dev image, hot reload behavior",
    notes: "รัน pnpm dev ภายใน container",
  },
  {
    file: "vercel.json",
    purpose: "deploy instruction สำหรับ Vercel",
    editWhen: "เปลี่ยน build/install command บน Vercel",
    notes: "ตอนนี้ใช้ npm command บน Vercel",
  },
  {
    file: "next-env.d.ts",
    purpose: "Next TypeScript ambient declarations",
    editWhen: "ไม่ควรแก้เอง",
    notes: "ไฟล์ generated โดย Next",
  },
  {
    file: "README.md",
    purpose: "เอกสารโปรเจกต์ระดับสูง",
    editWhen: "อัปเดต onboarding command/flow",
    notes: "ปัจจุบันยังเป็น template ของ create-next-app",
  },
];

const appSystemFiles: FileDoc[] = [
  {
    file: "app/layout.tsx",
    purpose: "root layout + global font + IdleTimeoutProvider",
    editWhen: "ต้องการเพิ่ม provider ระดับแอป หรือแก้ metadata กลาง",
    notes: "มีผลทุกหน้าในระบบ",
  },
  {
    file: "app/globals.css",
    purpose: "global style, theme token, utility animation",
    editWhen: "ปรับสีหลัก/ฟอนต์/global behavior",
    notes: "ถ้าทั้งเว็บสีหรือ spacing เพี้ยน ให้เริ่มที่ไฟล์นี้",
  },
  {
    file: "app/data/institutions.ts",
    purpose: "แหล่งข้อมูลรายชื่อสถานศึกษาฝั่ง frontend",
    editWhen: "ปรับรายการสถานศึกษา หรือ logic map ตามระดับการศึกษา",
    notes: "ไฟล์นี้ยาวมาก ควรระวัง merge conflict",
  },
  {
    file: "app/data/relatedFieldOptions.ts",
    purpose: "ตัวเลือกสาขา/related fields สำหรับฟอร์ม",
    editWhen: "เพิ่ม/ลบสาขาที่ใช้ค้นหา/ประกาศตำแหน่ง",
    notes: "ถ้าต้อง sync กับ backend enum ให้ตรวจความสอดคล้องด้วย",
  },
  {
    file: "app/frontend-main/doc/page.tsx",
    purpose: "หน้าเอกสาร maintenance (หน้านี้)",
    editWhen: "อัปเดตคู่มือเมื่อโครงสร้างระบบเปลี่ยน",
    notes: "เส้นทางเข้าคือ /frontend-main/doc",
  },
  {
    file: "app/favicon.ico",
    purpose: "favicon ของเว็บ",
    editWhen: "เปลี่ยนแบรนด์หรือไอคอนแท็บ",
    notes: "กระทบน้อยเรื่อง logic",
  },
];

const publicRoutes: RouteDoc[] = [
  {
    url: "/",
    file: "app/page.tsx",
    purpose: "หน้าแรกแสดงรายการตำแหน่งฝึกงานและค้นหา",
    editWhen: "ปรับ homepage, search behavior, card listing",
    risk: "กระทบ first impression และ flow เข้าสู่ระบบ",
  },
  {
    url: "/jobs/[id]",
    file: "app/jobs/[id]/page.tsx",
    purpose: "หน้ารายละเอียดตำแหน่งฝั่ง public",
    editWhen: "เพิ่มข้อมูลรายละเอียดตำแหน่งก่อน login",
    risk: "ต้องคุมการ fallback กรณี id ไม่ถูกต้อง",
  },
  {
    url: "/pea-info",
    file: "app/pea-info/page.tsx",
    purpose: "หน้าแนะนำข้อมูลหน่วยงาน PEA",
    editWhen: "อัปเดตเนื้อหาองค์กร/ภาพลักษณ์",
    risk: "เสี่ยงต่ำทาง logic",
  },
  {
    url: "/faqs",
    file: "app/faqs/page.tsx",
    purpose: "FAQ สำหรับผู้สมัครฝั่งสาธารณะ",
    editWhen: "เพิ่มคำถาม/คำตอบทั่วไป",
    risk: "ส่วนใหญ่เป็น content, แต่อาจมีผลกับ auth-aware navbar",
  },
  {
    url: "/credits",
    file: "app/credits/page.tsx",
    purpose: "หน้าเครดิตทีมพัฒนา",
    editWhen: "อัปเดตรายชื่อทีม/visual effects",
    risk: "มี animation สูง ควรเช็ก performance หลังแก้",
  },
];

const authRoutes: RouteDoc[] = [
  {
    url: "/register",
    file: "app/register/page.tsx",
    purpose: "ฟอร์มสมัครผู้ใช้นักศึกษา",
    editWhen: "แก้ฟิลด์สมัครสมาชิก, validation, register API",
    risk: "กระทบ conversion สมัครใช้งาน",
  },
  {
    url: "/login/intern",
    file: "app/login/intern/page.tsx",
    purpose: "หน้า login ของ intern",
    editWhen: "แก้ validation/login UX ของนักศึกษา",
    risk: "เสี่ยงเกิด login loop ร่วมกับ proxy.ts",
  },
  {
    url: "/login/owner",
    file: "app/login/owner/page.tsx",
    purpose: "หน้า login ของ owner (SSO flow)",
    editWhen: "ปรับปุ่ม SSO/flow สำหรับพนักงาน",
    risk: "เกี่ยวข้อง callback และ cookie policy",
  },
  {
    url: "/login/admin",
    file: "app/login/admin/page.tsx",
    purpose: "หน้า login ของ admin",
    editWhen: "ปรับ flow login admin",
    risk: "ต้องเทสต์ role redirect หลัง login",
  },
  {
    url: "/login/owner/callback",
    file: "app/login/owner/callback/page.tsx",
    purpose: "รับผล callback จาก Keycloak",
    editWhen: "แก้ flow รับ token/session จาก SSO",
    risk: "ไฟล์สำคัญ ถ้าพังจะ login owner/admin ไม่ได้",
  },
  {
    url: "/forgot-password",
    file: "app/forgot-password/page.tsx",
    purpose: "ขอรีเซ็ตรหัสผ่าน",
    editWhen: "แก้ UX/password recovery",
    risk: "ต้องคุมข้อความ error ให้ชัดเจน",
  },
  {
    url: "/reset-password",
    file: "app/reset-password/page.tsx",
    purpose: "หน้าตั้งรหัสผ่านใหม่",
    editWhen: "แก้ token check/รูปแบบรหัสผ่าน",
    risk: "ระวังกรณีลิงก์หมดอายุ",
  },
];

const internRoutes: RouteDoc[] = [
  {
    url: "/intern-home",
    file: "app/intern-home/page.tsx",
    purpose: "หน้า home ของ intern หลัง login",
    editWhen: "ปรับรายการงาน, filter, status การสมัคร",
    risk: "กระทบ flow หลักของนักศึกษา",
  },
  {
    url: "/intern-home/job-detail",
    file: "app/intern-home/job-detail/page.tsx",
    purpose: "รายละเอียดตำแหน่งฝั่ง intern",
    editWhen: "เพิ่มข้อมูลหน้างานหลัง login",
    risk: "ต้อง sync field กับ model ของ position",
  },
  {
    url: "/intern-profile",
    file: "app/intern-profile/page.tsx",
    purpose: "แสดงโปรไฟล์นักศึกษา",
    editWhen: "แก้ข้อมูลที่ต้องแสดงจาก user/profile",
    risk: "ต้องระวังข้อมูล null และ field mapping",
  },
  {
    url: "/intern-profile/edit",
    file: "app/intern-profile/edit/page.tsx",
    purpose: "แก้ไขโปรไฟล์นักศึกษา",
    editWhen: "เพิ่มฟิลด์แก้ไขหรือ validation",
    risk: "เสี่ยงส่ง payload ไม่ตรงกับ backend",
  },
  {
    url: "/intern-info",
    file: "app/intern-info/page.tsx",
    purpose: "ข้อมูลฝึกงาน/รายละเอียดการฝึก",
    editWhen: "ปรับการคำนวณวัน/ชั่วโมงหรือข้อมูลประกอบ",
    risk: "ระวังค่า date format",
  },
  {
    url: "/intern-pea-info",
    file: "app/intern-pea-info/page.tsx",
    purpose: "ข้อมูลภายในสำหรับ intern ที่เกี่ยวกับ PEA",
    editWhen: "อัปเดตเนื้อหาภายใน",
    risk: "เสี่ยงต่ำทาง business logic",
  },
  {
    url: "/application-history",
    file: "app/application-history/page.tsx",
    purpose: "ประวัติการสมัครทั้งหมดของ intern",
    editWhen: "แก้สถานะ/ลำดับเวลา/การแสดงผลรายการ",
    risk: "มีการ map status หลายแบบ",
  },
  {
    url: "/application-history/evaluation-result",
    file: "app/application-history/evaluation-result/page.tsx",
    purpose: "ผลการประเมินของการสมัคร",
    editWhen: "ปรับการแสดงผลคะแนน/ผลลัพธ์",
    risk: "ควบคุมกรณีไม่มีข้อมูลให้ดี",
  },
  {
    url: "/application-history/job-detail",
    file: "app/application-history/job-detail/page.tsx",
    purpose: "รายละเอียดตำแหน่งจากประวัติสมัคร",
    editWhen: "เชื่อม field เพิ่มเติมจากประวัติ",
    risk: "ระวัง mismatch กับหน้ารายละเอียดหลัก",
  },
  {
    url: "/application-status",
    file: "app/application-status/page.tsx",
    purpose: "timeline สถานะการสมัครแบบ step",
    editWhen: "แก้ลำดับ step หรือข้อความสถานะ",
    risk: "ต้องตรงกับ enum/status จาก backend",
  },
  {
    url: "/application-status/document-list",
    file: "app/application-status/document-list/page.tsx",
    purpose: "รายการเอกสารของการสมัคร",
    editWhen: "เพิ่มประเภทเอกสาร/สถานะเอกสาร",
    risk: "เสี่ยงเรื่องชื่อ type เอกสารและ fallback",
  },
  {
    url: "/favorites",
    file: "app/favorites/page.tsx",
    purpose: "หน้ารายการโปรดของ intern",
    editWhen: "แก้ bookmark flow หรือ card actions",
    risk: "กระทบ interaction กับหน้า home",
  },
];

const adminRoutes: RouteDoc[] = [
  {
    url: "/admin/applications",
    file: "app/admin/applications/page.tsx",
    purpose: "หน้าจัดการ applications ของ admin",
    editWhen: "ปรับตาราง/ฟิลเตอร์/การดำเนินการ admin",
    risk: "กระทบงานหลังบ้านโดยตรง",
  },
  {
    url: "/admin/dashboard",
    file: "app/admin/dashboard/page.tsx",
    purpose: "dashboard ภาพรวมสำหรับ admin",
    editWhen: "เพิ่ม widget/stats/summary",
    risk: "มักกระทบ performance ถ้าดึงข้อมูลหนัก",
  },
  {
    url: "/admin/dashboard/[id]",
    file: "app/admin/dashboard/[id]/page.tsx",
    purpose: "รายละเอียดเชิงลึกของรายการใน dashboard",
    editWhen: "เพิ่มข้อมูล detail และ action รายบุคคล",
    risk: "ต้องเช็กกรณี id ไม่พบ",
  },
];

const ownerRoutes: RouteDoc[] = [
  {
    url: "/owner/announcements",
    file: "app/owner/announcements/page.tsx",
    purpose: "รายการประกาศรับฝึกงานของ owner",
    editWhen: "แก้ตารางประกาศ, สถานะเปิด/ปิดรับ",
    risk: "เสี่ยงกระทบข้อมูลประกาศทั้งระบบ",
  },
  {
    url: "/owner/announcements/create",
    file: "app/owner/announcements/create/page.tsx",
    purpose: "หน้าสร้างประกาศใหม่",
    editWhen: "เพิ่ม field ในฟอร์มสร้างประกาศ",
    risk: "ต้อง sync payload กับ positionApi",
  },
  {
    url: "/owner/announcements/[id]",
    file: "app/owner/announcements/[id]/page.tsx",
    purpose: "รายละเอียดประกาศแบบรายตัว",
    editWhen: "เพิ่มข้อมูลเชิงลึกของประกาศ",
    risk: "ต้อง handle กรณี id ไม่ถูกต้อง",
  },
  {
    url: "/owner/announcements/[id]/edit",
    file: "app/owner/announcements/[id]/edit/page.tsx",
    purpose: "หน้าแก้ไขประกาศ",
    editWhen: "แก้ UI หรือ validation ตอนแก้ประกาศ",
    risk: "ระวังข้อมูลเดิมหายตอน patch/update",
  },
  {
    url: "/owner/dashboard",
    file: "app/owner/dashboard/page.tsx",
    purpose: "dashboard หลักของ owner",
    editWhen: "ปรับ summary card และสถิติสถานะ",
    risk: "มี mapping status หลายจุด",
  },
  {
    url: "/owner/dashboard/applications",
    file: "app/owner/dashboard/applications/page.tsx",
    purpose: "รายการ applicant ทั้งหมด",
    editWhen: "ปรับ filter/search/list action",
    risk: "เป็นหน้าใช้งานจริงบ่อย เสี่ยง regress สูง",
  },
  {
    url: "/owner/dashboard/pending",
    file: "app/owner/dashboard/pending/page.tsx",
    purpose: "รายการสถานะรอดำเนินการ",
    editWhen: "แก้การคัดกรองสถานะ pending",
    risk: "ต้องคุม mapping status ให้ตรง backend",
  },
  {
    url: "/owner/dashboard/near-start",
    file: "app/owner/dashboard/near-start/page.tsx",
    purpose: "รายการผู้ที่ใกล้เริ่มฝึก",
    editWhen: "ปรับนิยาม near-start และ date filter",
    risk: "เสี่ยงจาก timezone/date boundary",
  },
  {
    url: "/owner/dashboard/accepted",
    file: "app/owner/dashboard/accepted/page.tsx",
    purpose: "รายการผู้สมัครที่รับแล้ว",
    editWhen: "ปรับแสดงผลผู้ได้รับการตอบรับ",
    risk: "เกี่ยวกับขั้นตอนปลายทางก่อนเริ่มฝึก",
  },
  {
    url: "/owner/dashboard/accepted/cancel/[id]",
    file: "app/owner/dashboard/accepted/cancel/[id]/page.tsx",
    purpose: "หน้าจัดการยกเลิกฝึกงานของคนที่รับแล้ว",
    editWhen: "ปรับ flow cancel/reason",
    risk: "เป็น business critical flow",
  },
  {
    url: "/owner/dashboard/rejected",
    file: "app/owner/dashboard/rejected/page.tsx",
    purpose: "รายการผู้ถูกปฏิเสธ",
    editWhen: "ปรับเหตุผล reject หรือการแสดงผล",
    risk: "ต้องคุมข้อความสื่อสารให้ชัด",
  },
  {
    url: "/owner/dashboard/cancelled",
    file: "app/owner/dashboard/cancelled/page.tsx",
    purpose: "รายการที่ยกเลิกแล้ว",
    editWhen: "แก้ report หรือรายการ cancel",
    risk: "ข้อมูลย้อนหลังต้องไม่เพี้ยน",
  },
  {
    url: "/owner/dashboard/[id]",
    file: "app/owner/dashboard/[id]/page.tsx",
    purpose: "รายละเอียดผู้สมัครรายบุคคล",
    editWhen: "เพิ่ม action/ข้อมูลในหน้ารายบุคคล",
    risk: "ผูกกับหลาย API endpoint",
  },
  {
    url: "/owner/faqs",
    file: "app/owner/faqs/page.tsx",
    purpose: "FAQ ฝั่ง owner",
    editWhen: "ปรับเนื้อหาคำถามเฉพาะ owner",
    risk: "เสี่ยงต่ำทาง logic",
  },
  {
    url: "(utility)",
    file: "app/owner/dashboard/utils/applicationMapper.ts",
    purpose:
      "map data จาก backend ให้เป็น model ใช้ร่วมทุกหน้าบน owner dashboard",
    editWhen: "backend เปลี่ยน status enum/shape ของ all-students-history",
    risk: "ไฟล์นี้เปลี่ยนแล้วกระทบทุกหน้า owner dashboard",
  },
];

const componentFiles: FileDoc[] = [
  {
    file: "components/IdleTimeoutProvider.tsx",
    purpose: "ควบคุม auto logout เมื่อผู้ใช้ idle",
    editWhen: "เปลี่ยน timeout, event activity, behavior redirect หลังหมดเวลา",
    notes: "มีผลกับทุกหน้าที่ใช้ layout หลัก",
  },
  {
    file: "components/index.ts",
    purpose: "barrel export ของ components",
    editWhen: "เพิ่ม/ลบการ export",
    notes: "ไฟล์สะพาน, business logic ต่ำ",
  },
  {
    file: "components/ui/index.ts",
    purpose: "barrel export ของ UI components",
    editWhen: "เพิ่ม/ลบ export component",
    notes: "ถ้า import หา component ไม่เจอ ให้เช็กไฟล์นี้",
  },
  {
    file: "components/ui/Navbar.tsx",
    purpose: "navbar สำหรับหน้า public หลัก",
    editWhen: "ปรับเมนู public หรือปุ่ม login",
    notes: "เกี่ยวข้องปุ่ม Keycloak redirect",
  },
  {
    file: "components/ui/NavbarPublic.tsx",
    purpose: "navbar variant สำหรับ public pages",
    editWhen: "ต้องการแยกพฤติกรรม navbar ของหน้า public เฉพาะ",
    notes: "ระวังความซ้ำกับ Navbar.tsx",
  },
  {
    file: "components/ui/NavbarIntern.tsx",
    purpose: "navbar ของผู้ใช้นักศึกษา",
    editWhen: "เพิ่มเมนู intern หรือ notification behavior",
    notes: "ผูกกับสถานะ login และ notification",
  },
  {
    file: "components/ui/OwnerNavbar.tsx",
    purpose: "navbar ของ owner",
    editWhen: "ปรับเมนู owner dashboard/announcement",
    notes: "เกี่ยวข้อง role owner",
  },
  {
    file: "components/ui/AdminNavbar.tsx",
    purpose: "navbar ของ admin",
    editWhen: "ปรับเมนูหรือ notification ฝั่ง admin",
    notes: "เกี่ยวข้อง role admin",
  },
  {
    file: "components/ui/SearchSection.tsx",
    purpose: "ส่วนค้นหาตำแหน่งฝั่ง public/intern",
    editWhen: "ปรับ field ค้นหา/ตัวกรอง",
    notes: "กระทบ UX หน้า listing",
  },
  {
    file: "components/ui/OwnerSearchSection.tsx",
    purpose: "ส่วนค้นหาเฉพาะหน้าฝั่ง owner",
    editWhen: "เพิ่ม filter owner",
    notes: "ใช้คู่กับ owner dashboard tables",
  },
  {
    file: "components/ui/JobCard.tsx",
    purpose: "การ์ดแสดงข้อมูลตำแหน่งงาน",
    editWhen: "แก้ layout card หรือ field บน card",
    notes: "ถูกใช้หลายหน้า",
  },
  {
    file: "components/ui/JobDetailPanel.tsx",
    purpose: "panel รายละเอียดตำแหน่งแบบข้างการ์ด",
    editWhen: "ปรับข้อมูล detail หรือ action buttons",
    notes: "ควร sync กับ JobCard.tsx",
  },
  {
    file: "components/ui/Pagination.tsx",
    purpose: "pagination component กลาง",
    editWhen: "เปลี่ยนพฤติกรรมเปลี่ยนหน้า",
    notes: "เสี่ยงต่ำแต่ใช้หลายจุด",
  },
  {
    file: "components/ui/LoginModal.tsx",
    purpose: "modal แจ้ง/ชวน login",
    editWhen: "ปรับข้อความหรือ CTA login",
    notes: "มักถูกเรียกก่อน action สำคัญ",
  },
  {
    file: "components/ui/ConfirmModal.tsx",
    purpose: "modal ยืนยัน action",
    editWhen: "เพิ่ม flow ยืนยันก่อน submit/cancel",
    notes: "ระวัง action callback ซ้ำซ้อน",
  },
  {
    file: "components/ui/CongratsModal.tsx",
    purpose: "modal แสดงผลสำเร็จ",
    editWhen: "ปรับประสบการณ์หลัง submit สำเร็จ",
    notes: "มักใช้คู่กับ Confetti",
  },
  {
    file: "components/ui/Confetti.tsx",
    purpose: "visual effect เมื่อสำเร็จ",
    editWhen: "ปรับ animation หรือระยะเวลา",
    notes: "ควรระวัง performance บนอุปกรณ์ช้า",
  },
  {
    file: "components/ui/Toast.tsx",
    purpose: "แจ้งเตือนสั้นบนหน้าจอ",
    editWhen: "ปรับ style/timeout/สถานะ success-error",
    notes: "ใช้ในหลาย flow ของฟอร์ม",
  },
  {
    file: "components/ui/VideoLoading.tsx",
    purpose: "loading state ที่มี animation",
    editWhen: "ปรับ loading UX ระหว่างรอข้อมูล",
    notes: "เสี่ยงต่ำทาง business logic",
  },
  {
    file: "components/ui/NotificationStatusIcon.tsx",
    purpose: "วิเคราะห์ tone ของ notification และเลือกไอคอนสถานะ",
    editWhen: "เปลี่ยนกฎ classify notification",
    notes: "ถ้า notification icon ผิด ให้เริ่มจากไฟล์นี้",
  },
  {
    file: "components/ui/ThaiDateInput.tsx",
    purpose: "input วันที่รูปแบบไทย",
    editWhen: "แก้การ format/parse วันเดือนปี",
    notes: "ระวัง conversion พ.ศ./ค.ศ.",
  },
];

const serviceAndTypes: FileDoc[] = [
  {
    file: "services/api.ts",
    purpose: "barrel re-export ของทุก domain ใน services/api/* (backward-compat)",
    editWhen: "เพิ่ม domain ไฟล์ใหม่ใน services/api/ ต้องมาเพิ่ม export * ที่นี่",
    notes: "ห้ามใส่ logic หรือ type ลงไฟล์นี้ — เป็น re-export ล้วน ๆ",
  },
  {
    file: "services/api/client.ts",
    purpose: "axios instance, API_BASE_URL, interceptors (auth token + 401 redirect), authStorage, ApiUser type",
    editWhen: "แก้ base URL, เพิ่ม/แก้ interceptor, เปลี่ยน auth storage/cookie",
    notes: "โดนเรียกจากทุก domain ไฟล์ — เปลี่ยน behavior ที่นี่กระทบทั้งแอป",
  },
  {
    file: "services/api/{auth,user,position,application,favorite,notification,...}.ts",
    purpose: "แต่ละไฟล์ = 1 domain: endpoint functions + types + helper ของ domain นั้น",
    editWhen: "เพิ่ม endpoint, เปลี่ยน payload/response, เพิ่ม transform helper",
    notes: "import { api } from './client' แล้วเรียก api.get/post/put/delete; ไฟล์ใหม่ต้องไป export ที่ services/api.ts ด้วย",
  },
  {
    file: "types/job.ts",
    purpose: "type ของงาน/ตัวกรอง/enum ที่ใช้หน้าฝั่งงาน",
    editWhen: "model งานเปลี่ยนหรือเพิ่มฟิลด์",
    notes: "ควร sync กับ type ใน services/api/position.ts",
  },
  {
    file: "types/announcement.ts",
    purpose: "type ของประกาศงานฝั่ง owner",
    editWhen: "ฟอร์มประกาศหรือโครงสร้างประกาศเปลี่ยน",
    notes: "สำคัญกับ flow create/edit announcement",
  },
  {
    file: "types/index.ts",
    purpose: "barrel export ของ types",
    editWhen: "เพิ่ม/ย้าย type file",
    notes: "ช่วยให้ import สั้นลง",
  },
];

const apiDomains: FileDoc[] = [
  {
    file: "services/api/client.ts — api (axios) / authStorage / API_BASE_URL / ApiUser",
    purpose: "axios instance + interceptors + cookie/auth storage + ApiUser type กลาง",
    editWhen: "แก้ base URL, interceptor, 401 flow, auth cookies",
    notes: "โดน import จากทุก domain; แก้ที่นี่กระทบทั้งแอป",
  },
  {
    file: "services/api/auth.ts — authApi",
    purpose: "login, logout, get-session, Keycloak SSO",
    editWhen: "แก้ auth flow หรือปัญหา session",
    notes: "เชื่อมกับ proxy.ts โดยตรง และ cookie ของ Better Auth",
  },
  {
    file: "services/api/user.ts — userApi / studentProfileApi",
    purpose: "profile, staff list, student info, update profile",
    editWhen: "แก้ข้อมูลผู้ใช้, mentor, profile form",
    notes: "มักกระทบ intern-profile และ owner pages",
  },
  {
    file: "services/api/position.ts — positionApi / mentorCache / positionToJob / positionToAnnouncement",
    purpose: "ตำแหน่งฝึกงาน: list/create/update + transform ไป Job/Announcement",
    editWhen: "แก้ flow ประกาศ, รายการงาน, หรือ mapping ไป UI model",
    notes: "ใช้หนักทั้ง public, intern, owner; transforms อยู่ไฟล์เดียวกัน",
  },
  {
    file: "services/api/application.ts — applicationApi / APP_STATUS_TO_STEP / canApplyForNewJob",
    purpose: "สมัครงาน, history, status, action, upload เอกสาร",
    editWhen: "แก้ workflow สมัครงานหรือสถานะ หรือ enum สถานะ",
    notes: "domain หลักที่มีผลกับหลาย role; sync AppStatusEnum กับ backend เสมอ",
  },
  {
    file: "services/api/favorite.ts — favoriteApi",
    purpose: "เพิ่ม/ลบ/ดึงรายการโปรด",
    editWhen: "ปรับ bookmark behavior",
    notes: "สัมพันธ์กับหน้า /favorites และหน้า list งาน",
  },
  {
    file: "services/api/notification.ts — notificationApi",
    purpose: "ดึงและจัดการแจ้งเตือน (read/unread/delete)",
    editWhen: "notification flow เปลี่ยน",
    notes: "เกี่ยวข้อง navbar หลาย role",
  },
  {
    file: "services/api/application-documents.ts + application-status-actions.ts",
    purpose: "เอกสารใบสมัคร (list/download/preview) และ log การเปลี่ยนสถานะ",
    editWhen: "เปลี่ยนกฎเอกสารหรือ audit log",
    notes: "ValidationStatus และ AppStatusEnum ต้อง sync กับ backend",
  },
  {
    file: "services/api/institution.ts — institutionApi / institutionTicketApi",
    purpose: "สถานศึกษา, คณะ, ticket lookup",
    editWhen: "เพิ่ม/แก้ข้อมูลสถานศึกษาหรือ faculty ในฟอร์มสมัคร",
    notes: "รองรับ type UNIVERSITY/VOCATIONAL/SCHOOL/OTHERS",
  },
  {
    file: "services/api/{department,doc-type,role,staff-logs,owner-students}.ts",
    purpose: "domain สนับสนุนฝั่ง admin/owner (กองงาน, ประเภทเอกสาร, role, log, จบฝึกงาน)",
    editWhen: "แก้หน้าบริหารข้อมูลองค์กรและบันทึกการทำงาน",
    notes: "ไฟล์เล็ก endpoint เดียว/สองตัว — ดูแลง่าย",
  },
];

const apiModuleDocs: ApiModuleDoc[] = [
  {
    file: "client.ts",
    domain: "Base Client — axios instance & authStorage",
    description: "axios instance กลาง, API_BASE_URL, interceptors (auth token + 401 redirect) และ authStorage สำหรับอ่าน/เขียน user session",
    types: ["ApiUser"],
    functions: ["api (axios instance)", "authStorage.getUser()", "authStorage.setUser()", "authStorage.removeUser()"],
    notes: "import 'api' จากไฟล์นี้ในทุก domain file — แก้ interceptor ที่นี่กระทบทั้งแอป",
    endpoints: [],
  },
  {
    file: "auth.ts",
    domain: "authApi — Authentication",
    description: "จัดการล็อกอิน, ล็อกเอาท์, ตรวจสอบ session และ SSO (Keycloak)",
    types: ["RegisterInternData", "LoginData", "AuthResponse"],
    functions: ["authApi.registerIntern()", "authApi.loginIntern()", "authApi.logout()", "authApi.getSession()", "authApi.getKeycloakLoginUrl()"],
    notes: "เชื่อมกับ proxy.ts และ Better Auth cookie — แก้ auth flow แก้ที่นี่",
    endpoints: [
      { method: "POST", path: "/auth/sign-up/intern", purpose: "สมัครสมาชิกนักศึกษาใหม่", usedInPages: ["/register"] },
      { method: "POST", path: "/auth/sign-in/intern", purpose: "เข้าสู่ระบบสำหรับนักศึกษา (phone + password)", usedInPages: ["/login/intern"] },
      { method: "POST", path: "/auth/sign-out", purpose: "ออกจากระบบ (ล้าง session/token)", usedInPages: ["ทุกหน้าที่มีปุ่ม logout"] },
      { method: "GET", path: "/auth/get-session", purpose: "ตรวจสอบ session ปัจจุบัน — ดึงข้อมูล user จาก cookie", usedInPages: ["/login/owner/callback", "proxy.ts"] },
      { method: "GET", path: "/auth/sign-in/keycloak", purpose: "Redirect ไปหน้า SSO login ของ Keycloak (owner/admin)", usedInPages: ["/login/owner", "/login/admin"] },
    ],
  },
  {
    file: "user.ts",
    domain: "userApi — User & Profile",
    description: "ดึงและแก้ไขข้อมูลผู้ใช้ โปรไฟล์นักศึกษา และรายการพนักงาน",
    types: ["StudentProfile", "UserProfile", "StaffUser"],
    functions: ["userApi.getProfile()", "userApi.updateUser()", "userApi.updateStudentProfile()", "userApi.updateStaffPhone()", "userApi.getStaffList()", "userApi.getStudentList()", "studentProfileApi.getMyProfile()", "extractStudentProfile()", "canApplyForNewJob()"],
    notes: "canApplyForNewJob() ตรวจสอบว่านักศึกษาสมัครใหม่ได้หรือไม่ ก่อนเรียก applicationApi",
    endpoints: [
      { method: "GET", path: "/user/profile", purpose: "ดึงโปรไฟล์เต็มของผู้ใช้ปัจจุบัน รวม studentProfile", usedInPages: ["/intern-profile"] },
      { method: "PUT", path: "/user/update", purpose: "แก้ไขข้อมูลผู้ใช้ (ชื่อ, นามสกุล, email, เบอร์โทร)", usedInPages: ["/intern-profile/edit"] },
      { method: "PUT", path: "/user/student-profile", purpose: "แก้ไขโปรไฟล์นักศึกษา (ชั่วโมง, คณะ, สาขา, วันฝึก)", usedInPages: ["/intern-profile/edit"] },
      { method: "PUT", path: "/user/staff/{staffProfileId}/phone", purpose: "แก้ไขเบอร์โทรพนักงาน (admin/owner เท่านั้น)", usedInPages: ["/owner/profile"] },
      { method: "GET", path: "/user/staff", purpose: "ดึงรายการพนักงาน กรองด้วย departmentId ได้", usedInPages: ["/owner/announcements/create", "/owner/announcements/[id]/edit"] },
      { method: "GET", path: "/user/student", purpose: "ดึงรายการนักศึกษาทั้งหมด (admin/owner เท่านั้น)", usedInPages: ["/admin/dashboard", "/owner/dashboard"] },
    ],
  },
  {
    file: "position.ts",
    domain: "positionApi — Positions / ตำแหน่งฝึกงาน",
    description: "จัดการประกาศตำแหน่งฝึกงาน ทั้งการสร้าง, ดู, แก้ไข, ลบ พร้อม transform helpers แปลง API response เป็น UI model",
    types: ["Position", "CreatePositionData", "UpdatePositionData"],
    functions: ["positionApi.getPositions()", "positionApi.getPositionById()", "positionApi.createPosition()", "positionApi.updatePosition()", "positionApi.deletePosition()", "positionToJob()", "positionToJobWithStaff()", "positionToAnnouncement()", "positionsToJobs()"],
    notes: "mentorCache ลด API call ซ้ำ — positionToJob/Announcement ใช้ทั่ว intern/owner pages; APP_STATUS_TO_STEP map สถานะ → step index",
    endpoints: [
      { method: "GET", path: "/position", purpose: "ดึงรายการตำแหน่งทั้งหมด (ค้นหา/กรองได้, pagination)", usedInPages: ["/", "/intern-home", "/owner/announcements", "/owner/dashboard", "/admin/dashboard"] },
      { method: "GET", path: "/position/{id}", purpose: "ดึงรายละเอียดตำแหน่งรายตัว", usedInPages: ["/jobs/[id]", "/intern-home/job-detail", "/owner/announcements/[id]", "/owner/announcements/[id]/edit"] },
      { method: "POST", path: "/position", purpose: "สร้างประกาศตำแหน่งฝึกงานใหม่", usedInPages: ["/owner/announcements/create"] },
      { method: "PUT", path: "/position/{id}", purpose: "แก้ไขประกาศตำแหน่ง (ชื่อ, วันรับสมัคร, สาขา ฯลฯ)", usedInPages: ["/owner/announcements/[id]/edit"] },
      { method: "DELETE", path: "/position/{id}", purpose: "ลบประกาศตำแหน่ง", usedInPages: ["/owner/announcements/[id]"] },
    ],
  },
  {
    file: "application.ts",
    domain: "applicationApi — Applications / การสมัคร",
    description: "Core workflow ทั้งหมดของการสมัครฝึกงาน ตั้งแต่สมัคร, อัปโหลดเอกสาร ไปจนถึง owner ตัดสินใจรับ/ปฏิเสธ",
    types: ["AppStatusEnum", "MyApplicationData", "CompleteModalResponse"],
    functions: ["applicationApi.apply()", "applicationApi.getMyApplications()", "applicationApi.getApplicationById()", "applicationApi.getApplicationsByPosition()", "applicationApi.updateStatus()", "applicationApi.uploadDocument()"],
    notes: "AppStatusEnum ต้อง sync กับ backend เสมอ — domain หลักที่กระทบหลาย role",
    endpoints: [
      { method: "GET", path: "/applications/history/me", purpose: "ดึงประวัติการสมัครทั้งหมดของนักศึกษาปัจจุบัน", usedInPages: ["/application-history", "/application-status", "/application-history/job-detail"] },
      { method: "GET", path: "/student/application-complete-modal", purpose: "ตรวจสอบว่าต้องแสดง modal แจ้งการสมัครเสร็จสิ้นหรือไม่", usedInPages: ["/intern-home"] },
      { method: "POST", path: "/student/application-complete-modal/acknowledge", purpose: "บันทึกว่าผู้ใช้รับรู้ modal แล้ว", usedInPages: ["/intern-home"] },
      { method: "POST", path: "/applications", purpose: "สร้างการสมัครใหม่ (ส่ง positionId)", usedInPages: ["/intern-home/job-detail"] },
      { method: "POST", path: "/applications/positions/{positionId}/information", purpose: "ส่งข้อมูลทักษะ, ความคาดหวัง และวันที่ต้องการฝึก", usedInPages: ["/application-status"] },
      { method: "POST", path: "/applications/{id}/documents/transcript", purpose: "อัปโหลดไฟล์ transcript (multipart/form-data)", usedInPages: ["/application-status/document-list"] },
      { method: "POST", path: "/applications/{id}/documents/resume", purpose: "อัปโหลดไฟล์ resume", usedInPages: ["/application-status/document-list"] },
      { method: "POST", path: "/applications/{id}/documents/portfolio", purpose: "อัปโหลดไฟล์ portfolio", usedInPages: ["/application-status/document-list"] },
      { method: "POST", path: "/applications/{id}/documents/request-letter", purpose: "อัปโหลดหนังสือขอความอนุเคราะห์", usedInPages: ["/application-status/document-list"] },
      { method: "GET", path: "/application-documents/file", purpose: "ดาวน์โหลด/ดูตัวอย่างไฟล์จาก MinIO (ส่ง fileKey)", usedInPages: ["/application-status/document-list", "/admin/applications"] },
      { method: "PUT", path: "/applications/{id}/cancel", purpose: "ยกเลิกการสมัครโดยนักศึกษา", usedInPages: ["/application-status"] },
      { method: "GET", path: "/applications/history", purpose: "ดึงประวัติการสมัครทั้งหมด กรองตาม positionId/status ได้ (admin/owner)", usedInPages: ["/owner/dashboard", "/owner/dashboard/applications", "/owner/dashboard/pending", "/owner/dashboard/accepted", "/owner/dashboard/rejected", "/owner/dashboard/cancelled", "/admin/applications", "/admin/dashboard"] },
      { method: "GET", path: "/applications/history/{studentUserId}", purpose: "ดึงประวัติการสมัครของนักศึกษาคนใดคนหนึ่ง", usedInPages: ["/admin/dashboard/[id]", "/owner/dashboard/[id]"] },
      { method: "PUT", path: "/applications/{id}/interview/approve", purpose: "อนุมัติเข้าสัมภาษณ์ — เปลี่ยนสถานะเป็น PENDING_CONFIRMATION (owner)", usedInPages: ["/owner/dashboard/[id]"] },
      { method: "PUT", path: "/applications/{id}/confirm/accept", purpose: "ยืนยันรับนักศึกษาเข้าฝึกงาน (owner)", usedInPages: ["/owner/dashboard/accepted"] },
      { method: "PUT", path: "/applications/{id}/interview/reject", purpose: "ปฏิเสธการสมัคร พร้อมระบุเหตุผล (owner)", usedInPages: ["/owner/dashboard/[id]"] },
      { method: "PUT", path: "/applications/{id}/documents/{docType}/review", purpose: "ตรวจสอบเอกสาร (admin) — ผล VERIFIED หรือ INVALID", usedInPages: ["/admin/applications"] },
      { method: "PUT", path: "/applications/{applicationId}/information", purpose: "แก้ไขข้อมูลการสมัคร (ชั่วโมง/วันที่ฝึก)", usedInPages: ["/application-status"] },
    ],
  },
  {
    file: "application-documents.ts",
    domain: "applicationDocumentsApi — Application Documents",
    description: "ดึงและจัดการเอกสารของการสมัครทั้งหมด (ใช้โดย admin เป็นหลัก)",
    types: ["ApplicationDocumentItem", "ValidationStatus"],
    functions: ["applicationDocumentsApi.getDocuments()", "applicationDocumentsApi.getDownloadUrl()", "applicationDocumentsApi.getPreviewUrl()", "applicationDocumentsApi.validateDocument()"],
    notes: "ValidationStatus (PENDING/APPROVED/REJECTED) ต้อง sync กับ backend — ใช้ใน /application-status",
    endpoints: [
      { method: "GET", path: "/application-documents", purpose: "ดึงเอกสารทั้งหมดในระบบ กรองตามสถานะ VERIFIED/INVALID/PENDING ได้", usedInPages: ["/admin/applications"] },
      { method: "GET", path: "/application-documents/file", purpose: "ดาวน์โหลดไฟล์จาก MinIO storage โดยส่ง fileKey", usedInPages: ["/admin/applications", "/application-status/document-list"] },
    ],
  },
  {
    file: "application-status-actions.ts",
    domain: "applicationStatusActionsApi — Status History",
    description: "ดึงประวัติการเปลี่ยนสถานะของการสมัคร (ใช้แสดง timeline)",
    types: ["ApplicationStatusAction"],
    functions: ["applicationStatusActionsApi.getActions()", "applicationStatusActionsApi.getActionsByApplication()"],
    notes: "read-only ไม่มี mutation — ใช้แสดง timeline ว่าใครทำอะไรเมื่อไร",
    endpoints: [
      { method: "GET", path: "/application-status-actions/{applicationStatusId}", purpose: "ดึงประวัติการเปลี่ยนสถานะของ application", usedInPages: ["/owner/dashboard/[id]", "/admin/dashboard/[id]"] },
      { method: "GET", path: "/application-status-actions/me", purpose: "ดึง action ของผู้ใช้ปัจจุบัน", usedInPages: ["(ใช้ภายใน)"] },
    ],
  },
  {
    file: "favorite.ts",
    domain: "favoriteApi — Favorites / รายการโปรด",
    description: "เพิ่ม/ลบ/ดึงตำแหน่งที่นักศึกษา bookmark ไว้",
    types: ["FavoriteItem", "FavoritesResponse"],
    functions: ["favoriteApi.getFavorites()", "favoriteApi.addFavorite()", "favoriteApi.removeFavorite()", "favoriteApi.isFavorite()"],
    notes: "ใช้ใน /favorites และ job-card ทุกหน้า — ตรวจ isFavorite() ก่อน add/remove เสมอ",
    endpoints: [
      { method: "GET", path: "/favorite", purpose: "ดึงรายการตำแหน่งที่บันทึกไว้ทั้งหมด (pagination)", usedInPages: ["/", "/intern-home", "/favorites"] },
      { method: "POST", path: "/favorite", purpose: "เพิ่มตำแหน่งในรายการโปรด (ส่ง positionId)", usedInPages: ["/", "/intern-home", "/favorites"] },
      { method: "DELETE", path: "/favorite/{positionId}", purpose: "ลบตำแหน่งออกจากรายการโปรด", usedInPages: ["/", "/intern-home", "/favorites"] },
    ],
  },
  {
    file: "notification.ts",
    domain: "notificationApi — Notifications / การแจ้งเตือน",
    description: "ดึงและจัดการการแจ้งเตือนของผู้ใช้ทุก role ผ่าน Navbar",
    types: ["NotificationItem"],
    functions: ["notificationApi.getNotifications()", "notificationApi.markAsRead()", "notificationApi.markAllAsRead()", "notificationApi.deleteNotification()"],
    notes: "เชื่อมกับ Navbar bell icon ของทุก role — unread count อยู่ใน NotificationItem.isRead",
    endpoints: [
      { method: "GET", path: "/notifications", purpose: "ดึงรายการแจ้งเตือน กรองและ paginate ได้", usedInPages: ["NavbarIntern.tsx", "OwnerNavbar.tsx", "AdminNavbar.tsx"] },
      { method: "PUT", path: "/notifications/{id}/read", purpose: "ทำเครื่องหมายอ่านแล้ว/ยังไม่อ่าน", usedInPages: ["NavbarIntern.tsx", "OwnerNavbar.tsx", "AdminNavbar.tsx"] },
      { method: "PUT", path: "/notifications/read-all", purpose: "อ่านการแจ้งเตือนทั้งหมดพร้อมกัน", usedInPages: ["NavbarIntern.tsx", "OwnerNavbar.tsx", "AdminNavbar.tsx"] },
      { method: "DELETE", path: "/notifications/delete/{id}", purpose: "ลบการแจ้งเตือนรายการ", usedInPages: ["NavbarIntern.tsx", "OwnerNavbar.tsx", "AdminNavbar.tsx"] },
    ],
  },
  {
    file: "institution.ts",
    domain: "institutionApi — Institutions & Faculties / สถานศึกษา",
    description: "ดึงข้อมูลสถานศึกษาและคณะสำหรับฟอร์มสมัครและแก้โปรไฟล์",
    types: ["Institution", "Faculty"],
    functions: ["institutionApi.getInstitutions()", "institutionApi.getFaculties()", "institutionApi.getInstitutionByTicket()"],
    notes: "รองรับ type UNIVERSITY / VOCATIONAL / SCHOOL / OTHERS — ใช้ใน /register และ /intern-profile/edit",
    endpoints: [
      { method: "GET", path: "/institution", purpose: "ค้นหาสถานศึกษา (pagination, กรองตามประเภท)", usedInPages: ["/register", "/intern-profile/edit"] },
      { method: "POST", path: "/institution", purpose: "เพิ่มสถานศึกษาใหม่ (เมื่อค้นหาไม่พบ)", usedInPages: ["/register"] },
      { method: "GET", path: "/faculty", purpose: "ดึงรายการคณะทั้งหมด กรองด้วย institutionId ได้", usedInPages: ["/register", "/intern-profile/edit"] },
      { method: "GET", path: "/institution_ticket/{id}", purpose: "ดึงข้อมูลสถานศึกษาโดย ID", usedInPages: ["/intern-profile"] },
    ],
  },
  {
    file: "department.ts",
    domain: "departmentApi — Departments / แผนก",
    description: "ดึงข้อมูลแผนกภายในองค์กรสำหรับฟอร์มสร้าง/แก้ประกาศ",
    types: ["Department", "DepartmentsResponse"],
    functions: ["departmentApi.getDepartments()", "departmentApi.getDepartmentById()"],
    notes: "ใช้ใน /owner/announcements/create และ dropdown filter ฝั่ง owner",
    endpoints: [
      { method: "GET", path: "/dept", purpose: "ดึงรายการแผนกทั้งหมด (pagination)", usedInPages: ["/owner/announcements/create", "/owner/announcements/[id]/edit", "/admin/dashboard"] },
    ],
  },
  {
    file: "doc-type.ts",
    domain: "docTypeApi — Document Types / ประเภทเอกสาร",
    description: "ดึงรายการประเภทเอกสารที่ระบบกำหนดให้นักศึกษาต้องส่ง",
    types: ["DocType"],
    functions: ["docTypeApi.getDocTypes()", "docTypeApi.getDocTypeById()"],
    notes: "ใช้ตอน config เอกสารที่ต้องการในแต่ละตำแหน่ง — ดูแลง่าย ไม่มี mutation",
    endpoints: [
      { method: "GET", path: "/doc-types", purpose: "ดึงประเภทเอกสารทั้งหมด (transcript, resume, portfolio, request-letter)", usedInPages: ["/application-status", "/application-status/document-list"] },
    ],
  },
  {
    file: "owner-students.ts",
    domain: "ownerStudentsApi — Owner Student Management",
    description: "จัดการสถานะการฝึกงานของนักศึกษาที่ได้รับการตอบรับแล้ว",
    types: ["EndInternshipStatus"],
    functions: ["ownerStudentsApi.getStudents()", "ownerStudentsApi.endInternship()", "ownerStudentsApi.getEndInternshipStatus()"],
    notes: "ใช้ใน /owner/dashboard — endpoint นี้เปลี่ยนสถานะสุดท้ายก่อนปิด cycle ฝึกงาน",
    endpoints: [
      { method: "PUT", path: "/owner/students/{studentUserId}/internship-status", purpose: "จบการฝึกงาน (COMPLETE) หรือยกเลิกกลางคัน (CANCEL)", usedInPages: ["/owner/dashboard/accepted/cancel/[id]"] },
    ],
  },
  {
    file: "role.ts",
    domain: "roleApi — Roles / สิทธิ์ผู้ใช้",
    description: "ดึงและจัดการ role ของผู้ใช้ในระบบ (admin เท่านั้น)",
    types: ["Role"],
    functions: ["roleApi.getRoles()", "roleApi.getRoleById()", "roleApi.assignRole()"],
    notes: "role กำหนดสิทธิ์การเข้าถึง route และ API — ใช้ใน admin pages",
    endpoints: [],
  },
  {
    file: "staff-logs.ts",
    domain: "staffLogsApi — Staff Logs / บันทึกกิจกรรม",
    description: "บันทึกและดึง log การทำงานของพนักงาน (audit trail)",
    types: ["StaffLog", "StaffLogsResponse"],
    functions: ["staffLogsApi.getLogs()", "staffLogsApi.getLogsByStaff()", "staffLogsApi.getLogsByApplication()"],
    notes: "read-only สำหรับ query — ใช้ใน /admin/logs และ dashboard การตรวจสอบ",
    endpoints: [
      { method: "POST", path: "/staff-logs", purpose: "บันทึก log กิจกรรมของพนักงาน", usedInPages: ["/owner/dashboard/[id]", "owner pages"] },
      { method: "GET", path: "/staff-logs", purpose: "ดึง log กิจกรรม (pagination, filterable)", usedInPages: ["/admin/dashboard"] },
    ],
  },
];

const scenarios: ScenarioDoc[] = [
  {
    topic: "Login แล้วเด้งผิดหน้า หรือเข้า role ไม่ได้",
    symptoms: "login สำเร็จแต่ redirect ไม่ถูก, หรือวนกลับหน้า login",
    files: [
      "proxy.ts",
      "services/api/client.ts (interceptor 401 redirect + authStorage)",
      "services/api/auth.ts (login/session/keycloak)",
      "components/IdleTimeoutProvider.tsx",
      "app/login/intern/page.tsx",
      "app/login/owner/page.tsx",
      "app/login/owner/callback/page.tsx",
    ],
    steps: [
      "ตรวจ cookie better-auth.session_token และ user_role ใน browser",
      "ตรวจเงื่อนไข route group และ role redirect ใน proxy.ts",
      "ทดสอบ flow intern/owner/admin แยกกันทีละ role",
      "ตรวจว่าฝั่ง client เรียก API ผ่าน /api rewrite",
    ],
  },
  {
    topic: "ข้อมูลจาก API ไม่ขึ้น หรือขึ้นไม่ครบ",
    symptoms: "หน้าโหลดได้แต่ list ว่าง/field หาย/ขึ้น error เงียบ",
    files: [
      "services/api/{domain}.ts (ตาม endpoint ที่ไม่ขึ้น)",
      "services/api/client.ts (ถ้าทุก endpoint ไม่ขึ้นเลย — ปัญหาอาจอยู่ที่ instance/interceptor)",
      "next.config.ts",
      "app/page.tsx",
      "app/intern-home/page.tsx",
      "app/owner/dashboard/utils/applicationMapper.ts",
    ],
    steps: [
      "ระบุ domain ก่อน (auth/position/application/...) แล้วเปิด services/api/{domain}.ts",
      "ตรวจ endpoint + payload/response type ในไฟล์ domain นั้น",
      "ตรวจ rewrite /api/:path* ใน next.config.ts ว่าชี้ backend ถูก",
      "เช็ก mapping จาก backend model ไป frontend model",
      "เติม fallback state ให้เห็นชัด (empty/error/loading)",
    ],
  },
  {
    topic: "สถานะการสมัครเพี้ยน",
    symptoms: "step ไม่ตรง, badge ผิด, ย้ายแท็บผิด",
    files: [
      "services/api/application.ts (AppStatusEnum + APP_STATUS_TO_STEP + canApplyForNewJob)",
      "services/api/application-status-actions.ts (log การเปลี่ยนสถานะ)",
      "app/owner/dashboard/utils/applicationMapper.ts",
      "app/application-status/page.tsx",
      "app/application-history/page.tsx",
    ],
    steps: [
      "ไล่ enum/status map ที่ต้นทาง: services/api/application.ts (AppStatusEnum, APP_STATUS_TO_STEP)",
      "ตรวจ mapping เฉพาะ owner dashboard ใน applicationMapper.ts",
      "ทดสอบเคสสถานะหลัก (pending, accepted, rejected, cancelled, complete)",
      "ยืนยันข้อความ label ภาษาไทยในแต่ละหน้า",
    ],
  },
  {
    topic: "เพิ่มหน้าใหม่และกำหนดสิทธิ์เข้าถึง",
    symptoms: "หน้าใหม่ 404 หรือเข้าถึงได้ผิด role",
    files: [
      "app/<new-route>/page.tsx",
      "proxy.ts",
      "components/ui/*Navbar*.tsx",
    ],
    steps: [
      "สร้างไฟล์ route ตาม App Router convention",
      "เพิ่ม route เข้า public/auth/protected ใน proxy.ts ให้ถูกกลุ่ม",
      "เพิ่มเมนูใน navbar ที่เกี่ยวข้อง",
      "ทดสอบการเข้าหน้าใหม่ทั้งก่อนและหลัง login",
    ],
  },
];

const releaseChecklist = [
  "รัน pnpm lint แล้วไม่มี error",
  "รัน pnpm build ผ่านและ route สำคัญไม่หาย",
  "เทสต์ manual ขั้นต่ำ: public + intern + owner + admin",
  "กรณีแก้ auth/redirect ต้องทดสอบ callback และ forceLogin query",
  "กรณีแก้ status mapping ต้องทดสอบทุกสถานะหลัก",
  "ตรวจว่าการเรียก API ใช้ /api (same-origin) ไม่ยิง cross-domain ตรง",
  "ถ้าแก้ shared component ให้ตรวจทุกหน้าที่ import component นั้น",
  "อัปเดตหน้านี้ถ้าเปลี่ยนโครงสร้างไฟล์หรือ flow หลัก",
];

const sectionNavigation = [
  { id: "section-1", label: "1) วิธีใช้เอกสารนี้" },
  { id: "section-2", label: "2) Tech Stack" },
  { id: "section-3", label: "3) Root Files" },
  { id: "section-4", label: "4) App System Files" },
  { id: "section-5", label: "5) Public Routes" },
  { id: "section-6", label: "6) Auth Routes" },
  { id: "section-7", label: "7) Intern Routes" },
  { id: "section-8", label: "8) Admin Routes" },
  { id: "section-9", label: "9) Owner Routes" },
  { id: "section-10", label: "10) Components, Services, Types" },
  { id: "section-11", label: "11) Playbook" },
  { id: "section-12", label: "12) Release Checklist" },
  { id: "section-13", label: "13) API Reference ละเอียด" },
];

const sectionCardClassName =
  "mt-8 max-w-full scroll-mt-6 rounded-2xl border border-slate-700/90 bg-slate-900 p-6 shadow-sm shadow-black/20 md:scroll-mt-8 md:p-8";

function SectionTitle({
  children,
  theme,
}: {
  children: ReactNode;
  theme: ThemeMode;
}) {
  return (
    <h2
      className={`text-xl font-bold leading-tight tracking-tight md:text-2xl ${
        theme === "light" ? "text-slate-900" : "text-slate-100"
      }`}
    >
      {children}
    </h2>
  );
}

function DocTable({
  headers,
  children,
  theme,
}: {
  headers: string[];
  children: ReactNode;
  theme: ThemeMode;
}) {
  const isLight = theme === "light";

  return (
    <div
      className={`mt-4 max-w-full overflow-x-auto rounded-xl border shadow-sm ${
        isLight
          ? "border-slate-200/90 shadow-slate-200/50"
          : "border-slate-700/90 shadow-black/20"
      }`}
    >
      <table
        className={`w-full min-w-245 border-collapse text-left text-sm leading-relaxed ${
          isLight ? "bg-white text-slate-900" : "bg-slate-900 text-slate-100"
        }`}
      >
        <thead
          className={`bg-linear-to-r ${
            isLight
              ? "from-slate-50 to-slate-100 text-slate-600"
              : "from-slate-800 to-slate-700 text-slate-300"
          }`}
        >
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className={`whitespace-nowrap border-b px-3 py-2 font-semibold ${
                  isLight ? "border-slate-200" : "border-slate-700"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function FileRows({ items, theme }: { items: FileDoc[]; theme: ThemeMode }) {
  const isLight = theme === "light";

  return (
    <>
      {items.map((item, index) => (
        <tr
          key={item.file}
          className={`align-top transition-colors ${
            isLight
              ? index % 2 === 0
                ? "bg-white"
                : "bg-slate-50/70"
              : index % 2 === 0
                ? "bg-slate-900"
                : "bg-slate-800/70"
          } ${isLight ? "hover:bg-sky-50/60" : "hover:bg-slate-700/50"}`}
        >
          <td
            className={`whitespace-nowrap border-b px-3 py-3 font-semibold ${
              isLight
                ? "border-slate-100 text-slate-900"
                : "border-slate-700 text-slate-100"
            }`}
          >
            {item.file}
          </td>
          <td
            className={`border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.purpose}
          </td>
          <td
            className={`border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.editWhen}
          </td>
          <td
            className={`border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.notes}
          </td>
        </tr>
      ))}
    </>
  );
}

function RouteRows({ items, theme }: { items: RouteDoc[]; theme: ThemeMode }) {
  const isLight = theme === "light";

  return (
    <>
      {items.map((item, index) => (
        <tr
          key={`${item.url}-${item.file}`}
          className={`align-top transition-colors ${
            isLight
              ? index % 2 === 0
                ? "bg-white"
                : "bg-slate-50/70"
              : index % 2 === 0
                ? "bg-slate-900"
                : "bg-slate-800/70"
          } ${isLight ? "hover:bg-sky-50/60" : "hover:bg-slate-700/50"}`}
        >
          <td
            className={`whitespace-nowrap border-b px-3 py-3 font-semibold ${
              isLight
                ? "border-slate-100 text-slate-900"
                : "border-slate-700 text-slate-100"
            }`}
          >
            {item.url}
          </td>
          <td
            className={`whitespace-nowrap border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.file}
          </td>
          <td
            className={`border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.purpose}
          </td>
          <td
            className={`border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.editWhen}
          </td>
          <td
            className={`border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.risk}
          </td>
        </tr>
      ))}
    </>
  );
}

function TechStackRows({
  items,
  theme,
}: {
  items: TechStackDoc[];
  theme: ThemeMode;
}) {
  const isLight = theme === "light";

  return (
    <>
      {items.map((item, index) => (
        <tr
          key={item.technology}
          className={`align-top transition-colors ${
            isLight
              ? index % 2 === 0
                ? "bg-white"
                : "bg-slate-50/70"
              : index % 2 === 0
                ? "bg-slate-900"
                : "bg-slate-800/70"
          } ${isLight ? "hover:bg-sky-50/60" : "hover:bg-slate-700/50"}`}
        >
          <td
            className={`whitespace-nowrap border-b px-3 py-3 font-semibold ${
              isLight
                ? "border-slate-100 text-slate-900"
                : "border-slate-700 text-slate-100"
            }`}
          >
            {item.technology}
          </td>
          <td
            className={`whitespace-nowrap border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.version}
          </td>
          <td
            className={`border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.usedFor}
          </td>
          <td
            className={`border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.whereToMaintain}
          </td>
          <td
            className={`border-b px-3 py-3 ${
              isLight
                ? "border-slate-100 text-slate-700"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {item.maintenanceTips}
          </td>
        </tr>
      ))}
    </>
  );
}

function MethodBadge({
  method,
  isLight,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  isLight: boolean;
}) {
  const lightColors: Record<string, string> = {
    GET: "bg-sky-100 text-sky-700 border-sky-200",
    POST: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PUT: "bg-amber-100 text-amber-700 border-amber-200",
    DELETE: "bg-red-100 text-red-700 border-red-200",
  };
  const darkColors: Record<string, string> = {
    GET: "bg-sky-900/50 text-sky-300 border-sky-700/50",
    POST: "bg-emerald-900/50 text-emerald-300 border-emerald-700/50",
    PUT: "bg-amber-900/50 text-amber-300 border-amber-700/50",
    DELETE: "bg-red-900/50 text-red-300 border-red-700/50",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-bold ${isLight ? lightColors[method] : darkColors[method]}`}
    >
      {method}
    </span>
  );
}

function ApiEndpointRows({
  items,
  theme,
}: {
  items: ApiEndpointDoc[];
  theme: ThemeMode;
}) {
  const isLight = theme === "light";
  return (
    <>
      {items.map((item, index) => (
        <tr
          key={`${item.method}-${item.path}`}
          className={`align-top transition-colors ${
            isLight
              ? index % 2 === 0
                ? "bg-white"
                : "bg-slate-50/70"
              : index % 2 === 0
                ? "bg-slate-900"
                : "bg-slate-800/70"
          } ${isLight ? "hover:bg-sky-50/60" : "hover:bg-slate-700/50"}`}
        >
          <td
            className={`whitespace-nowrap border-b px-3 py-3 ${isLight ? "border-slate-100" : "border-slate-700"}`}
          >
            <MethodBadge method={item.method} isLight={isLight} />
          </td>
          <td
            className={`whitespace-nowrap border-b px-3 py-3 font-mono text-xs ${isLight ? "border-slate-100 text-slate-800" : "border-slate-700 text-slate-200"}`}
          >
            {item.path}
          </td>
          <td
            className={`border-b px-3 py-3 text-sm ${isLight ? "border-slate-100 text-slate-700" : "border-slate-700 text-slate-300"}`}
          >
            {item.purpose}
          </td>
          <td
            className={`border-b px-3 py-3 ${isLight ? "border-slate-100" : "border-slate-700"}`}
          >
            <div className="flex flex-wrap gap-1">
              {item.usedInPages.map((page) => (
                <span
                  key={`${item.method}-${item.path}-${page}`}
                  className={`rounded-full border px-2 py-0.5 font-mono text-xs ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-600"
                      : "border-slate-600 bg-slate-900 text-slate-400"
                  }`}
                >
                  {page}
                </span>
              ))}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function FrontendMainMaintenanceDocPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const isLight = theme === "light";
  const sectionCardClass = isLight
    ? "mt-8 max-w-full scroll-mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 md:scroll-mt-8 md:p-8"
    : sectionCardClassName;

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("frontend-main-doc-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  const applyTheme = (nextTheme: "light" | "dark") => {
    setTheme(nextTheme);
    window.localStorage.setItem("frontend-main-doc-theme", nextTheme);
  };

  const handleSectionNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    event.preventDefault();

    const sectionElement = document.getElementById(sectionId);
    if (!sectionElement) {
      return;
    }

    const targetTop =
      sectionElement.getBoundingClientRect().top + window.scrollY - 8;
    window.scrollTo({ top: targetTop, left: 0, behavior: "smooth" });
    window.history.replaceState(null, "", `#${sectionId}`);
  };

  return (
    <main
      className={`min-h-screen overflow-x-hidden ${
        theme === "light"
          ? "bg-white text-slate-800"
          : "bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100"
      }`}
    >
      <div className="mx-auto w-full max-w-375 px-4 py-8 md:px-8 md:py-12">
        <div className="min-w-0 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
          <aside className="hidden lg:block">
            <div className="fixed top-6 w-65 space-y-4">
              <div
                className={`max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border p-4 shadow-sm backdrop-blur ${
                  isLight
                    ? "border-slate-200/90 bg-white/95 shadow-slate-200/60"
                    : "border-slate-700/90 bg-slate-900/95 shadow-black/30"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Contents
                </p>
                <nav className="mt-3 space-y-1">
                  {sectionNavigation.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(event) =>
                        handleSectionNavigation(event, section.id)
                      }
                      className={`block rounded-lg px-2 py-1.5 text-sm transition-colors ${
                        isLight
                          ? "text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                          : "text-slate-300 hover:bg-slate-800 hover:text-sky-300"
                      }`}
                    >
                      {section.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          <div className="min-w-0 max-w-full">
            <header
              className={`rounded-3xl border p-6 shadow-lg md:p-8 ${
                isLight
                  ? "border-slate-200/90 bg-white/95 shadow-slate-200/60"
                  : "border-slate-700/90 bg-slate-900/95 shadow-black/30"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                    isLight
                      ? "bg-sky-100 text-sky-700"
                      : "bg-sky-900/40 text-sky-300"
                  }`}
                >
                  FRONTEND-MAIN MAINTENANCE HANDBOOK
                </p>
                <div
                  className={`inline-flex rounded-full border p-1 text-xs ${
                    isLight
                      ? "border-slate-300 bg-white"
                      : "border-slate-600 bg-slate-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => applyTheme("light")}
                    aria-label="ใช้ธีมปกติ"
                    className={`cursor-pointer rounded-full px-3 py-1 font-semibold transition-colors ${
                      theme === "light"
                        ? isLight
                          ? "bg-slate-900 text-white"
                          : "bg-slate-200 text-slate-900"
                        : isLight
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTheme("dark")}
                    aria-label="ใช้ธีมมืด"
                    className={`cursor-pointer rounded-full px-3 py-1 font-semibold transition-colors ${
                      theme === "dark"
                        ? isLight
                          ? "bg-slate-900 text-white"
                          : "bg-slate-200 text-slate-900"
                        : isLight
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M12 3a7 7 0 1 0 9 9 9 9 0 1 1-9-9z" />
                    </svg>
                  </button>
                </div>
              </div>

              <h1
                className={`mb-3 text-2xl font-extrabold leading-tight tracking-tight md:text-4xl ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                คู่มือ Maintenance แบบละเอียด (อธิบายรายไฟล์)
              </h1>
              <p
                className={`max-w-5xl text-sm leading-relaxed md:text-base ${
                  isLight ? "text-slate-600" : "text-slate-300"
                }`}
              >
                เอกสารหน้านี้ออกแบบให้ "คนใหม่เข้าใจระบบได้เร็ว" และ
                "คนดูแลเดิมย้อนกลับมาแก้ได้ไว" โดยแยกคำอธิบายเป็นรายไฟล์/ราย
                route พร้อมบอกว่าแก้ปัญหาแบบไหนควรเริ่มจากไฟล์อะไร
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div
                  className={`rounded-xl border p-4 ${
                    isLight
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-700 bg-slate-800/70"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Access URL
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    localhost:2700/frontend-main/doc
                  </p>
                </div>
                <div
                  className={`rounded-xl border p-4 ${
                    isLight
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-700 bg-slate-800/70"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Scope
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    File-by-file + Route-by-route + Playbook
                  </p>
                </div>
                <div
                  className={`rounded-xl border p-4 ${
                    isLight
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-700 bg-slate-800/70"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Last Updated
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    21 April 2026
                  </p>
                </div>
              </div>
            </header>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:hidden">
              {sectionNavigation.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(event) =>
                    handleSectionNavigation(event, section.id)
                  }
                  className={`rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                    isLight
                      ? "border-slate-200 bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-sky-300"
                  }`}
                >
                  {section.label}
                </a>
              ))}
            </div>

            <section id="section-1" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                1) วิธีใช้เอกสารนี้ (สำหรับคนที่เพิ่งเข้ามาดูแล)
              </SectionTitle>
              <ol
                className={`mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                {quickStartSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div
                className={`mt-5 rounded-xl border p-4 text-sm ${
                  isLight
                    ? "border-sky-200 bg-sky-50 text-sky-900"
                    : "border-sky-900/50 bg-sky-950/40 text-sky-200"
                }`}
              >
                <p className="font-semibold">ภาพรวมลำดับการทำงานของระบบ</p>
                <p className="mt-1">
                  Browser Request -&gt; proxy.ts (ตรวจสิทธิ์/redirect) -&gt; app
                  route page -&gt; services/api/&#123;domain&#125;.ts -&gt;
                  services/api/client.ts (axios + interceptors) -&gt; /api
                  rewrite ใน next.config.ts -&gt; backend-main
                </p>
              </div>
            </section>

            <section id="section-2" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                2) Tech Stack ของโปรเจกต์
              </SectionTitle>
              <p
                className={`mt-2 text-sm ${
                  isLight ? "text-slate-600" : "text-slate-300"
                }`}
              >
                ตารางนี้สรุปเทคโนโลยีหลัก
                พร้อมบอกว่าไฟล์ไหนคือจุดที่ต้องแก้เมื่อมีปัญหา
              </p>
              <DocTable
                theme={theme}
                headers={[
                  "Technology",
                  "Version",
                  "ใช้ทำอะไร",
                  "ไฟล์ที่ต้องดูแล",
                  "ข้อควรระวังตอน maintenance",
                ]}
              >
                <TechStackRows items={techStack} theme={theme} />
              </DocTable>
            </section>

            <section id="section-3" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                3) Root Files (อธิบายทีละไฟล์)
              </SectionTitle>
              <p
                className={`mt-2 text-sm ${
                  isLight ? "text-slate-600" : "text-slate-300"
                }`}
              >
                ถ้าต้องแก้เรื่อง config, build, deploy, lint หรือ env
                ให้เริ่มจากตารางนี้
              </p>
              <DocTable
                theme={theme}
                headers={["ไฟล์", "หน้าที่", "แก้เมื่อ", "ข้อควรระวัง"]}
              >
                <FileRows items={rootFiles} theme={theme} />
              </DocTable>
            </section>

            <section id="section-4" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                4) App System Files (ไม่ใช่ route แต่สำคัญ)
              </SectionTitle>
              <DocTable
                theme={theme}
                headers={["ไฟล์", "หน้าที่", "แก้เมื่อ", "ข้อควรระวัง"]}
              >
                <FileRows items={appSystemFiles} theme={theme} />
              </DocTable>
            </section>

            <section id="section-5" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                5) Public Routes (ไฟล์ต่อไฟล์)
              </SectionTitle>
              <DocTable
                theme={theme}
                headers={["URL", "ไฟล์", "หน้าที่", "แก้เมื่อ", "ความเสี่ยง"]}
              >
                <RouteRows items={publicRoutes} theme={theme} />
              </DocTable>
            </section>

            <section id="section-6" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                6) Auth Routes (ไฟล์ต่อไฟล์)
              </SectionTitle>
              <DocTable
                theme={theme}
                headers={["URL", "ไฟล์", "หน้าที่", "แก้เมื่อ", "ความเสี่ยง"]}
              >
                <RouteRows items={authRoutes} theme={theme} />
              </DocTable>
            </section>

            <section id="section-7" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                7) Intern Routes (ไฟล์ต่อไฟล์)
              </SectionTitle>
              <DocTable
                theme={theme}
                headers={["URL", "ไฟล์", "หน้าที่", "แก้เมื่อ", "ความเสี่ยง"]}
              >
                <RouteRows items={internRoutes} theme={theme} />
              </DocTable>
            </section>

            <section id="section-8" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                8) Admin Routes (ไฟล์ต่อไฟล์)
              </SectionTitle>
              <DocTable
                theme={theme}
                headers={["URL", "ไฟล์", "หน้าที่", "แก้เมื่อ", "ความเสี่ยง"]}
              >
                <RouteRows items={adminRoutes} theme={theme} />
              </DocTable>
            </section>

            <section id="section-9" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                9) Owner Routes (ไฟล์ต่อไฟล์)
              </SectionTitle>
              <DocTable
                theme={theme}
                headers={["URL", "ไฟล์", "หน้าที่", "แก้เมื่อ", "ความเสี่ยง"]}
              >
                <RouteRows items={ownerRoutes} theme={theme} />
              </DocTable>
            </section>

            <section id="section-10" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                10) Components, Services และ Types (รายไฟล์)
              </SectionTitle>

              <h3
                className={`mt-4 text-base font-bold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                10.1 Components
              </h3>
              <DocTable
                theme={theme}
                headers={["ไฟล์", "หน้าที่", "แก้เมื่อ", "ข้อควรระวัง"]}
              >
                <FileRows items={componentFiles} theme={theme} />
              </DocTable>

              <h3
                className={`mt-8 text-base font-bold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                10.2 Services และ Types
              </h3>
              <DocTable
                theme={theme}
                headers={["ไฟล์", "หน้าที่", "แก้เมื่อ", "ข้อควรระวัง"]}
              >
                <FileRows items={serviceAndTypes} theme={theme} />
              </DocTable>

              <h3
                className={`mt-8 text-base font-bold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                10.3 API Domains ใน services/api/*.ts
              </h3>
              <DocTable
                theme={theme}
                headers={["โดเมน", "หน้าที่", "แก้เมื่อ", "ข้อควรระวัง"]}
              >
                <FileRows items={apiDomains} theme={theme} />
              </DocTable>

            </section>

            <section id="section-11" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                11) Playbook แก้ปัญหา (อาการ -&gt; ไฟล์ -&gt; ขั้นตอน)
              </SectionTitle>

              <div className="mt-5 grid gap-4">
                {scenarios.map((scenario) => (
                  <article
                    key={scenario.topic}
                    className={`rounded-xl border p-4 shadow-sm ${
                      isLight
                        ? "border-slate-200 bg-slate-50 shadow-slate-200/60"
                        : "border-slate-700 bg-slate-800/50 shadow-black/20"
                    }`}
                  >
                    <h3
                      className={`text-base font-bold ${
                        isLight ? "text-slate-900" : "text-slate-100"
                      }`}
                    >
                      {scenario.topic}
                    </h3>
                    <p
                      className={`mt-1 text-sm ${
                        isLight ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      <span
                        className={`font-semibold ${
                          isLight ? "text-slate-900" : "text-slate-100"
                        }`}
                      >
                        อาการ:
                      </span>{" "}
                      {scenario.symptoms}
                    </p>

                    <p
                      className={`mt-3 text-sm font-semibold ${
                        isLight ? "text-slate-900" : "text-slate-100"
                      }`}
                    >
                      ไฟล์ที่ควรเช็กก่อน
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {scenario.files.map((file) => (
                        <span
                          key={`${scenario.topic}-${file}`}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            isLight
                              ? "border-slate-300 bg-white text-slate-700"
                              : "border-slate-600 bg-slate-900 text-slate-300"
                          }`}
                        >
                          {file}
                        </span>
                      ))}
                    </div>

                    <ol
                      className={`mt-3 list-decimal space-y-1 pl-5 text-sm ${
                        isLight ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      {scenario.steps.map((step) => (
                        <li key={`${scenario.topic}-${step}`}>{step}</li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </section>

            <section id="section-12" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                12) Release Checklist (ก่อน merge/deploy)
              </SectionTitle>
              <ul
                className={`mt-4 space-y-2 text-sm ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                {releaseChecklist.map((item) => (
                  <li
                    key={item}
                    className={`rounded-lg border px-3 py-2 transition-colors ${
                      isLight
                        ? "border-slate-200 bg-slate-50 hover:bg-sky-50/70"
                        : "border-slate-700 bg-slate-800/60 hover:bg-slate-700/60"
                    }`}
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <div
                className={`mt-5 rounded-xl border p-4 ${
                  isLight
                    ? "border-slate-200 bg-slate-900 text-slate-100"
                    : "border-slate-600 bg-slate-950 text-slate-100"
                }`}
              >
                <p className="mb-2 text-sm font-semibold">
                  คำสั่งแนะนำก่อนส่งงาน
                </p>
                <pre className="overflow-x-auto text-xs md:text-sm">{`pnpm lint
pnpm build`}</pre>
              </div>
            </section>

            <section id="section-13" className={sectionCardClass}>
              <SectionTitle theme={theme}>
                13) API Reference — services/api/ (ทุก module)
              </SectionTitle>
              <p className={`mt-2 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                แต่ละ card = 1 ไฟล์ใน <code className={`font-mono text-xs px-1 py-0.5 rounded ${isLight ? "bg-slate-200 text-slate-700" : "bg-slate-700 text-slate-300"}`}>services/api/</code> แสดง types, functions ที่ export และทุก endpoint พร้อมหน้าที่เชื่อม — สีบอก HTTP method:{" "}
                <span className="inline-flex flex-wrap gap-1.5 align-middle">
                  <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${isLight ? "border-sky-200 bg-sky-100 text-sky-700" : "border-sky-700/50 bg-sky-900/50 text-sky-300"}`}>GET</span>
                  <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${isLight ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-emerald-700/50 bg-emerald-900/50 text-emerald-300"}`}>POST</span>
                  <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${isLight ? "border-amber-200 bg-amber-100 text-amber-700" : "border-amber-700/50 bg-amber-900/50 text-amber-300"}`}>PUT</span>
                  <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${isLight ? "border-red-200 bg-red-100 text-red-700" : "border-red-700/50 bg-red-900/50 text-red-300"}`}>DELETE</span>
                </span>
              </p>

              <div className="mt-6 space-y-6">
                {apiModuleDocs.map((mod) => (
                  <div
                    key={mod.file}
                    className={`rounded-xl border ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/50"}`}
                  >
                    {/* Card header */}
                    <div className={`flex flex-wrap items-baseline gap-3 px-5 py-4 border-b ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                      <code className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${isLight ? "bg-slate-800 text-slate-100" : "bg-slate-950 text-slate-200"}`}>
                        {mod.file}
                      </code>
                      <span className={`text-base font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                        {mod.domain}
                      </span>
                      <span className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        — {mod.description}
                      </span>
                    </div>

                    {/* Types & Functions */}
                    <div className={`grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 border-b ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                      <div>
                        <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Types ที่ export</p>
                        {mod.types.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {mod.types.map((t: string) => (
                              <code key={t} className={`text-xs font-mono px-2 py-0.5 rounded ${isLight ? "bg-violet-100 text-violet-800" : "bg-violet-900/40 text-violet-300"}`}>
                                {t}
                              </code>
                            ))}
                          </div>
                        ) : (
                          <span className={`text-xs ${isLight ? "text-slate-400" : "text-slate-500"}`}>— (infrastructure only)</span>
                        )}
                      </div>
                      <div>
                        <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Functions ที่ export</p>
                        <div className="flex flex-wrap gap-1.5">
                          {mod.functions.map((fn: string) => (
                            <code key={fn} className={`text-xs font-mono px-2 py-0.5 rounded ${isLight ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-emerald-900/30 text-emerald-300 border border-emerald-800/40"}`}>
                              {fn}
                            </code>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Endpoints */}
                    {mod.endpoints.length > 0 ? (
                      <div className="px-5 py-4">
                        <p className={`mb-3 text-xs font-semibold uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Endpoints</p>
                        <DocTable theme={theme} headers={["Method", "Path", "คำอธิบาย", "หน้าที่เชื่อม"]}>
                          <ApiEndpointRows items={mod.endpoints} theme={theme} />
                        </DocTable>
                      </div>
                    ) : (
                      <div className={`px-5 py-3 text-xs ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                        ไฟล์นี้เป็น infrastructure — ไม่มี endpoint ตรง ๆ (ใช้ผ่าน domain files อื่น)
                      </div>
                    )}

                    {/* Notes */}
                    <div className={`px-5 py-3 rounded-b-xl text-xs border-t ${isLight ? "border-slate-200 bg-amber-50 text-amber-800" : "border-slate-700 bg-amber-900/20 text-amber-300"}`}>
                      <span className="font-semibold">หมายเหตุ: </span>{mod.notes}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
