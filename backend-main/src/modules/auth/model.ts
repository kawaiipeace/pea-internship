import { t } from "elysia";

export const RegisterInternBody = t.Object({
  fname: t.String({ minLength: 1, error: "กรุณาระบุชื่อจริง" }),
  lname: t.String({ minLength: 1, error: "กรุณาระบุนามสกุล" }),
  phoneNumber: t.String({ minLength: 9, error: "เบอร์โทรศัพท์ไม่ถูกต้อง" }),
  email: t.String({ format: "email", error: "รูปแบบอีเมลไม่ถูกต้อง" }),
  password: t.String({ minLength: 8, error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }),
  gender: t.Union(
    [t.Literal("MALE"), t.Literal("FEMALE"), t.Literal("OTHER")],
    { error: "เพศต้องเป็น MALE, FEMALE หรือ OTHER เท่านั้น" }
  ),
  institutionId: t.Numeric({ error: "กรุณาระบุรหัสสถาบัน" }),
  faculty: t.Optional(t.String()),
  major: t.Optional(t.String()),
  studentNote: t.Optional(t.String()),
});

export const LoginInternBody = t.Object({
  phoneNumber: t.String({ minLength: 9, error: "เบอร์โทรศัพท์ไม่ถูกต้อง" }),
  password: t.String({ minLength: 8, error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }),
});

export const RequestResetPasswordBody = t.Object({
  phoneNumber: t.String(),
  email: t.String({ format: "email" }),
});

export const VerifyResetCodeBody = t.Object({
  phoneNumber: t.String(),
  email: t.String({ format: "email" }),
  code: t.String(),
});

export const ResetPasswordBody = t.Object({
  resetToken: t.String(),
  password: t.String({ minLength: 8 }),
  confirmPassword: t.String({ minLength: 8 }),
});

export type RegisterInternBodyType = typeof RegisterInternBody.static;
export type LoginInternBodyType = typeof LoginInternBody.static;
export type RequestResetPasswordBodyType = typeof RequestResetPasswordBody.static;
export type VerifyResetCodeBodyType = typeof VerifyResetCodeBody.static;
export type ResetPasswordBodyType = typeof ResetPasswordBody.static;
