
// Barrel re-exports — split into services/api/* by domain.
// Existing imports like `import { authApi } from "@/services/api"` ยังทำงานเหมือนเดิมทุกจุด
// ไฟล์ย่อยอยู่ที่ services/api/{client,auth,user,institution,position,favorite,application,...}.ts

export * from "./api/client";
export * from "./api/auth";
export * from "./api/user";
export * from "./api/institution";
export * from "./api/position";
export * from "./api/favorite";
export * from "./api/application";
export * from "./api/application-documents";
export * from "./api/application-status-actions";
export * from "./api/department";
export * from "./api/doc-type";
export * from "./api/notification";
export * from "./api/staff-logs";
export * from "./api/owner-students";
export * from "./api/role";

// default axios instance (compat: `import api from "@/services/api"`)
export { default } from "./api/client";

