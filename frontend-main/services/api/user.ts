import { api, type ApiUser } from "./client";

// ประเภทข้อมูล Student Profile จาก API
export interface StudentProfile {
  id: number;
  userId: string;
  image: string | null;
  hours: number;
  institutionId: number;
  faculty: string | null;
  major: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  studentNote: string | null;
  internshipStatus: string;
  statusNote: string | null;
  // Joined data
  institution?: {
    id: number;
    name: string;
    institutionsType?: string;
  };
}

// ประเภทข้อมูล User Profile (user + student_profile)
export interface UserProfile {
  user: ApiUser;
  studentProfile: StudentProfile | null;
  // ข้อมูลผู้ดูแล (ถ้ามี)
  mentor?: {
    name: string;
    email: string;
    phone: string;
  };
  supervisor?: {
    name: string;
    email: string;
    phone: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

// Staff user type
export interface StaffUser {
  id: string;
  roleId: number;
  departmentId: number | null;
  fname: string;
  lname: string;
  username: string;
  displayUsername: string;
  phoneNumber: string;
  email: string;
  gender: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // staffProfileId จาก staffProfiles table - ใช้สำหรับส่ง mentorStaffIds
  staffProfileId?: number | null;
}

// Student Profile data shape (ใช้ร่วมกันระหว่าง array และ object format)
export interface StudentProfileData {
  id: number;
  userId: string;
  image: string | null;
  hours: string;
  institutionId: number;
  faculty: string | null;
  major: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  studentNote: string | null;
  internshipStatus: string;
  statusNote: string | null;
}

// User Full Profile Response (from /user/profile)
// Backend returns profile as single object (for interns) or array — handle both
export interface UserFullProfileResponse {
  id: string;
  roleId: number;
  departmentId: number | null;
  fname: string;
  lname: string;
  username: string;
  displayUsername: string;
  phoneNumber: string;
  email: string;
  gender: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile: StudentProfileData | StudentProfileData[] | null;
}

// Helper: extract first student profile from profile field (handles both array and object)
export const extractStudentProfile = (profile: StudentProfileData | StudentProfileData[] | null | undefined): StudentProfileData | null => {
  if (!profile) return null;
  if (Array.isArray(profile)) return profile.length > 0 ? profile[0] : null;
  return profile;
};

// ข้อมูลสำหรับอัปเดต User
export interface UpdateUserData {
  fname?: string;
  lname?: string;
  email?: string;
  phoneNumber?: string;
}

// ข้อมูลสำหรับอัปเดต Student Profile
export interface UpdateStudentProfileData {
  hours?: number;
  faculty?: string;
  major?: string;
  studentNote?: string;
  startDate?: string;
  endDate?: string;
}

// User/Profile API functions
export const userApi = {
  // ดึงข้อมูล profile แบบ full จาก /user/profile
  getUserProfile: async (): Promise<UserFullProfileResponse> => {
    const response = await api.get<UserFullProfileResponse>("/user/profile");
    return response.data;
  },

  // อัปเดตข้อมูล user
  updateUser: async (data: UpdateUserData): Promise<ApiUser> => {
    const response = await api.put<ApiUser>("/user/update", data);
    return response.data;
  },

  // อัปเดตเบอร์โทรของ staff คนอื่น (ใช้ staffProfileId) — สำหรับ owner/admin เท่านั้น
  updateStaffPhone: async (staffProfileId: number, phoneNumber: string): Promise<void> => {
    await api.put(`/user/staff/${staffProfileId}/phone`, { phoneNumber });
  },

  // อัปเดต student profile
  updateStudentProfile: async (data: UpdateStudentProfileData): Promise<unknown> => {
    const response = await api.put("/user/student-profile", data);
    return response.data;
  },

  // ดึงข้อมูล profile ของ user ที่ login อยู่
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>("/users/me/profile");
    return response.data;
  },

  // ดึงข้อมูล user ปัจจุบัน
  getCurrentUser: async (): Promise<ApiUser> => {
    const response = await api.get<ApiUser>("/users/me");
    return response.data;
  },

  // ดึงรายชื่อ staff ทั้งหมด (ต้อง login เป็น owner หรือ admin)
  getStaff: async (departmentId?: number): Promise<StaffUser[]> => {
    const params: Record<string, string> = {};
    if (departmentId) params.departmentId = departmentId.toString();
    const response = await api.get<StaffUser[]>("/user/staff", { params });
    return response.data;
  },

  // ดึงข้อมูล staff ตาม departmentId
  getStaffByDepartment: async (departmentId: number): Promise<StaffUser[]> => {
    return userApi.getStaff(departmentId);
  },

  // ดึงรายชื่อนักศึกษาทั้งหมด (ต้อง login เป็น owner หรือ admin)
  getStudents: async (): Promise<ApiUser[]> => {
    const response = await api.get<ApiUser[]>("/user/student");
    return response.data;
  },

  // อัพเดท profile
  updateProfile: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
    const response = await api.put<StudentProfile>("/users/me/profile", data);
    return response.data;
  },
};

// Student Profile API functions
export const studentProfileApi = {
  // ดึงข้อมูล student profile ของ user ที่ login
  getMyStudentProfile: async (): Promise<StudentProfile | null> => {
    try {
      const response = await api.get<StudentProfile>("/student-profiles/me");
      return response.data;
    } catch {
      return null;
    }
  },

  // ดึงข้อมูล student profile พร้อม join institution และ faculty
  getMyStudentProfileFull: async (): Promise<{
    studentProfile: StudentProfile;
    institution: { id: number; name: string; institutionsType: string } | null;
    faculty: { id: number; name: string } | null;
  } | null> => {
    try {
      const response = await api.get("/student-profiles/me/full");
      return response.data;
    } catch {
      return null;
    }
  },
};
