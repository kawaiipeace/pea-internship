import { api, API_BASE_URL, type ApiUser } from "./client";

// ประเภทข้อมูลสำหรับลงทะเบียน
export interface RegisterInternData {
  fname: string;
  lname: string;
  phoneNumber: string;
  email: string;
  password: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  institutionId: number;
  faculty: string;
  major: string;
  studentNote?: string;
  totalHours?: number | null;
  startDate?: string; // format: YYYY-MM-DD
  endDate?: string; // format: YYYY-MM-DD
}

// ประเภทข้อมูลสำหรับ login
export interface LoginData {
  phoneNumber: string;
  password: string;
}

// ประเภท response จาก API
export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface SignOutResponse {
  success: boolean;
}

// Session response from Better Auth
export interface SessionResponse {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
  user: ApiUser;
}

// Auth API functions
export const authApi = {
  // ลงทะเบียนผู้สมัครใหม่
  registerIntern: async (data: RegisterInternData): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/auth/sign-up/intern", data);
    return response.data;
  },

  // เข้าสู่ระบบผู้สมัคร
  loginIntern: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/sign-in/intern", data);
    return response.data;
  },

  // ออกจากระบบ
  signOut: async (): Promise<SignOutResponse> => {
    const response = await api.post<SignOutResponse>("/auth/sign-out");
    return response.data;
  },

  // ดึงข้อมูล session ปัจจุบัน (Better Auth)
  getSession: async (): Promise<SessionResponse | null> => {
    try {
      const response = await api.get<SessionResponse>("/auth/get-session");
      return response.data;
    } catch {
      return null;
    }
  },

  // เข้าสู่ระบบผ่าน Keycloak SSO (สำหรับพนักงาน)
  // ต้องใช้ browser navigation โดยตรง (ไม่ใช่ AJAX) เพื่อให้ state cookie ถูก set เป็น first-party cookie
  signInKeycloak: (): string => {
    return `${API_BASE_URL}/auth/sign-in/keycloak`;
  },

  // ขอรหัส OTP สำหรับ reset password
  requestResetPassword: async (data: {
    phoneNumber: string;
    email: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/request-reset-password",
      data
    );
    return response.data;
  },

  // ยืนยันรหัส OTP และรับ resetToken
  verifyResetCode: async (data: {
    phoneNumber: string;
    email: string;
    code: string;
  }): Promise<{ success: boolean; message: string; resetToken: string }> => {
    const response = await api.post<{
      success: boolean;
      message: string;
      resetToken: string;
    }>("/auth/verify-reset-code", data);
    return response.data;
  },

  // เปลี่ยนรหัสผ่านด้วย resetToken
  resetPassword: async (data: {
    resetToken: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/reset-password",
      data
    );
    return response.data;
  },
};
