import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2702/api";

// สร้าง axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // สำหรับส่ง cookies
});

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

// ประเภทข้อมูล User ที่ได้รับจาก API
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  username: string;
  displayUsername: string;
  roleId: number;
  departmentId: number | null;
  fname: string;
  lname: string;
  phoneNumber: string;
  gender: string;
  // Student profile data (if included in session)
  studentProfile?: {
    hours: number;
    major: string;
    startDate: string;
    endDate: string;
    institutionId: number;
    faculty: string | null;
    studentNote: string | null;
    institution?: { id: number; name: string; institutionsType: string };
  };
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
  signInKeycloak: async (): Promise<string> => {
    // This endpoint returns a redirect URL to Keycloak SSO
    // We need to navigate the browser to that URL
    const response = await api.get("/auth/sign-in/keycloak", {
      maxRedirects: 0,
      validateStatus: (status: number) => status >= 200 && status < 400,
    });
    // The backend returns { url, redirect: true }
    if (response.data?.url) {
      return response.data.url;
    }
    throw new Error("ไม่สามารถเชื่อมต่อ Keycloak ได้");
  },
};

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
  institutionId?: number;
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

// Helper function สำหรับจัดการ cookie
const setCookie = (name: string, value: string, days: number = 7): void => {
  if (typeof window !== "undefined") {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }
};

const getCookie = (name: string): string | null => {
  if (typeof window !== "undefined") {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
  }
  return null;
};

const deleteCookie = (name: string): void => {
  if (typeof window !== "undefined") {
    // ลบ cookie ด้วยการตั้งค่า expires เป็นอดีต และลองหลาย path
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  }
};

// Better Auth cookie names (ตาม cookiePrefix ที่ตั้งไว้ใน backend)
const BETTER_AUTH_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_data",
  "auth_token",
  "user_role",
];

// สำหรับจัดการ token และ user ใน localStorage และ cookie
export const authStorage = {
  setToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
      // เก็บใน cookie ด้วยสำหรับ middleware
      setCookie("auth_token", token, 7);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token") || getCookie("auth_token");
    }
    return null;
  },

  removeToken: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      deleteCookie("auth_token");
    }
  },

  setUser: (user: ApiUser): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("current_user", JSON.stringify(user));
    }
  },

  getUser: (): ApiUser | null => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("current_user");
      return data ? JSON.parse(data) : null;
    }
    return null;
  },

  removeUser: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("current_user");
    }
  },

  // ลบ Better Auth cookies
  clearBetterAuthCookies: (): void => {
    if (typeof window !== "undefined") {
      BETTER_AUTH_COOKIES.forEach((cookieName) => {
        deleteCookie(cookieName);
      });
    }
  },

  clearAuth: (): void => {
    authStorage.removeToken();
    authStorage.removeUser();
    // ลบ Better Auth session cookies ด้วย
    authStorage.clearBetterAuthCookies();
  },

  // ตรวจสอบว่า login อยู่หรือไม่
  isAuthenticated: (): boolean => {
    // ตรวจสอบทั้ง auth_token, Better Auth session, และ user ใน localStorage
    const hasToken = !!authStorage.getToken();
    const hasBetterAuthSession = !!getCookie("better-auth.session_token");
    const hasUser = !!authStorage.getUser();
    return hasToken || hasBetterAuthSession || hasUser;
  },
};

// ==================== Position/Internship API ====================

// Mentor cache storage key
const MENTOR_CACHE_KEY = "mentor_data_cache";

// Helper functions for mentor data cache
export const mentorCache = {
  // บันทึกข้อมูล mentor สำหรับ position
  save: (positionId: number | string, mentorData: { name: string; email: string; phone: string }) => {
    if (typeof window === "undefined") return;
    const cache = mentorCache.getAll();
    cache[positionId.toString()] = mentorData;
    localStorage.setItem(MENTOR_CACHE_KEY, JSON.stringify(cache));
  },

  // ดึงข้อมูล mentor สำหรับ position
  get: (positionId: number | string): { name: string; email: string; phone: string } | null => {
    if (typeof window === "undefined") return null;
    const cache = mentorCache.getAll();
    return cache[positionId.toString()] || null;
  },

  // ดึงข้อมูล cache ทั้งหมด
  getAll: (): Record<string, { name: string; email: string; phone: string }> => {
    if (typeof window === "undefined") return {};
    const data = localStorage.getItem(MENTOR_CACHE_KEY);
    return data ? JSON.parse(data) : {};
  },

  // ลบข้อมูล mentor สำหรับ position
  remove: (positionId: number | string) => {
    if (typeof window === "undefined") return;
    const cache = mentorCache.getAll();
    delete cache[positionId.toString()];
    localStorage.setItem(MENTOR_CACHE_KEY, JSON.stringify(cache));
  },
};

// ==================== Institution/Faculty API ====================

// ประเภทข้อมูล Institution (สถานศึกษา)
export interface Institution {
  id: number;
  institutionsType: "UNIVERSITY" | "VOCATIONAL" | "SCHOOL" | "OTHERS";
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// ประเภทข้อมูล Faculty (คณะ)
export interface Faculty {
  id: number;
  name: string;
  institutionId?: number;
}

// Paginated response จาก institution API
export interface InstitutionsResponse {
  data: Institution[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// Institution/Faculty API functions
export const institutionApi = {
  // ค้นหาสถานศึกษาตาม type + search keyword (ใช้ pagination จาก backend)
  getInstitutions: async (type?: "UNIVERSITY" | "VOCATIONAL" | "SCHOOL" | "OTHERS", search?: string, limit: number = 20): Promise<Institution[]> => {
    try {
      const params = new URLSearchParams();
      params.append("limit", String(limit));
      params.append("page", "1");
      if (type) params.append("type", type);
      if (search && search.trim()) params.append("search", search.trim());
      const response = await api.get<InstitutionsResponse>(`/institution?${params.toString()}`);
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  // ค้นหาสถานศึกษาจากหลาย type รวมกัน (ใช้ parallel search)
  getInstitutionsByTypes: async (types: ("UNIVERSITY" | "VOCATIONAL" | "SCHOOL" | "OTHERS")[], search?: string, limit: number = 20): Promise<Institution[]> => {
    try {
      const results = await Promise.all(types.map(type => institutionApi.getInstitutions(type, search, limit)));
      // รวมผลลัพธ์และกรอง duplicate ตาม id
      const merged = results.flat();
      const unique = merged.filter((inst, index, self) => self.findIndex(i => i.id === inst.id) === index);
      return unique.slice(0, limit);
    } catch {
      return [];
    }
  },

  // ดึงข้อมูลสถานศึกษาตาม ID (ค้นหาแบบ search เพื่อลด request)
  getInstitutionById: async (id: number): Promise<Institution | null> => {
    try {
      // ดึง page ละ 1000 แล้ว find — เนื่องจากไม่มี GET /:id endpoint
      let page = 1;
      let hasNextPage = true;
      const limit = 1000;

      while (hasNextPage) {
        const response = await api.get<InstitutionsResponse>(`/institution?limit=${limit}&page=${page}`);
        const institutions = response.data.data || [];
        const found = institutions.find((inst: Institution) => inst.id === id);
        if (found) return found;
        hasNextPage = response.data.meta?.hasNextPage || false;
        page++;
      }

      return null;
    } catch {
      return null;
    }
  },

  // ดึงรายการคณะทั้งหมด
  getFaculties: async (): Promise<Faculty[]> => {
    try {
      const response = await api.get<Faculty[]>("/faculty");
      return response.data;
    } catch {
      return [];
    }
  },

  // ดึงข้อมูลคณะตาม ID
  getFacultyById: async (id: number): Promise<Faculty | null> => {
    try {
      const response = await api.get<Faculty>(`/faculty/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  // ดึงรายการคณะตาม institutionId
  getFacultiesByInstitution: async (institutionId: number): Promise<Faculty[]> => {
    try {
      const response = await api.get<Faculty[]>(`/faculty?institutionId=${institutionId}`);
      return response.data;
    } catch {
      return [];
    }
  },
};

// ประเภทข้อมูล Position Owner (ผู้ประกาศรับสมัคร)
export interface PositionOwner {
  id?: string;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phoneNumber: string | null;
}

// ประเภทข้อมูล Position Department
export interface PositionDepartment {
  id: number;
  deptSap: number;
  deptShort: string | null;
  deptFull: string | null;
  location: string | null;
  officeId: number;
}

// ประเภทข้อมูลพี่เลี้ยง (Mentor) - จาก backend internshipPositionMentors join
export interface PositionMentor {
  staffId: number;
  name: string;
  email: string;
  phoneNumber: string | null;
}

// ประเภทข้อมูล Position (ตำแหน่งฝึกงาน)
export interface Position {
  id: number;
  name: string;
  officeId?: number;
  departmentId: number;
  location: string;
  positionCount: number | null;
  major: string;
  recruitStart: string | null;
  recruitEnd: string | null;
  jobDetails: string;
  requirement: string;
  benefits: string;
  resumeRq: boolean;
  portfolioRq: boolean;
  recruitmentStatus: "OPEN" | "CLOSE";
  createdAt: string;
  updatedAt: string;
  // ข้อมูลผู้ประกาศ (owner) ที่ join มาจาก backend
  owner?: PositionOwner | null;
  // owners array จาก backend (roleId=2 ใน department เดียวกัน)
  owners?: PositionOwner[];
  // ข้อมูลพี่เลี้ยง (mentors) array จาก internshipPositionMentors table
  mentors?: PositionMentor[];
  // ข้อมูล department ที่ join มาจาก backend
  department?: PositionDepartment | null;
  // จำนวนนักศึกษาที่ได้รับการตอบรับแล้ว จาก backend (accepted_count)
  acceptedCount?: number;
  // จำนวนผู้สมัครจริง (ไม่รวม CANCEL) จาก backend
  applicantCount?: number;
}

// Helper function to format date to Thai format
const formatDateToThai = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const thaiMonths = [
    "ม.ค", "ก.พ", "มี.ค", "เม.ย", "พ.ค", "มิ.ย",
    "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค"
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Convert to Buddhist year
  return `${day} ${month} ${year}`;
};

// ==================== Favorite API ====================

export interface FavoriteItem {
  favorite: {
    id: number;
    userId: string;
    positionId: number;
    createdAt: string;
    updatedAt: string;
  };
  position: Position;
}

export interface FavoritesResponse {
  data: FavoriteItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export const favoriteApi = {
  // ดึงรายการ favorite ของตัวเอง
  getFavorites: async (page = 1, limit = 100): Promise<FavoritesResponse> => {
    try {
      const response = await api.get<FavoritesResponse>(`/favorite?page=${page}&limit=${limit}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0, hasNextPage: false } };
    }
  },

  // กด favorite ตำแหน่ง
  addFavorite: async (positionId: number): Promise<{ id: number; userId: string; positionId: number } | null> => {
    try {
      const response = await api.post("/favorite", { positionId });
      return response.data;
    } catch {
      return null;
    }
  },

  // ลบ favorite ตาม positionId
  removeFavorite: async (positionId: number): Promise<boolean> => {
    try {
      await api.delete(`/favorite/${positionId}`);
      return true;
    } catch {
      return false;
    }
  },
};

// Helper: แปลง Job.id ("api-1") เป็น positionId (1)
export const jobIdToPositionId = (jobId: string): number | null => {
  if (jobId.startsWith("api-")) {
    const num = parseInt(jobId.replace("api-", ""), 10);
    return isNaN(num) ? null : num;
  }
  return null;
};

// Helper: แปลง positionId (1) เป็น Job.id ("api-1")
export const positionIdToJobId = (positionId: number): string => {
  return `api-${positionId}`;
};

// Helper function to convert Position to Job format for JobCard component
export const positionToJob = (position: Position): {
  id: string;
  title: string;
  location: string;
  department: string;
  currentApplicants: number;
  maxApplicants: number;
  tags: string[];
  startDate: string;
  endDate: string;
  recruitStartDate: string;
  recruitEndDate: string;
  requiredDocuments: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  supervisorPhone?: string;
  mentorName?: string;
  mentorEmail?: string;
  mentorPhone?: string;
} => {
  // ใช้ข้อมูล department ที่ join มาจาก backend
  const departmentName = position.department?.deptFull || position.department?.deptShort || `กองงาน ${position.departmentId || "-"}`;

  // ใช้ข้อมูล owner ที่ join มาจาก backend (ลอง owner ก่อน ถ้าไม่มีใช้ owners[0])
  const ownerData = position.owner || (position.owners && position.owners.length > 0 ? position.owners[0] : null);
  const ownerName = ownerData
    ? `${ownerData.fname || ""} ${ownerData.lname || ""}`.trim()
    : undefined;
  const ownerEmail = ownerData?.email || undefined;
  const ownerPhone = ownerData?.phoneNumber || undefined;

  // ใช้ข้อมูล mentor จาก mentors array ที่ backend ส่งมา
  // Backend ส่งกลับมาเป็น array จาก internshipPositionMentors table
  const firstMentor = position.mentors?.[0];
  const mentorName = firstMentor?.name || undefined;
  const mentorEmail = firstMentor?.email || undefined;
  const mentorPhone = firstMentor?.phoneNumber || undefined;

  // สร้าง required documents list (Transcript เป็น default เสมอ)
  const requiredDocs: string[] = ["Transcript"];
  if (position.resumeRq) requiredDocs.push("Resume");
  if (position.portfolioRq) requiredDocs.push("Portfolio");

  return {
    id: `api-${position.id}`, // Prefix with 'api-' to avoid duplicate keys with mockJobs
    title: position.name,
    location: position.location || position.department?.location || "-",
    department: departmentName,
    currentApplicants: position.applicantCount ?? position.acceptedCount ?? 0,
    maxApplicants: position.positionCount ?? 0,
    tags: position.major ? position.major.split(",").map(m => m.trim()).filter(m => m) : [],
    startDate: formatDateToThai(position.recruitStart || ""),
    endDate: formatDateToThai(position.recruitEnd || ""),
    recruitStartDate: formatDateToThai(position.recruitStart || ""),
    recruitEndDate: formatDateToThai(position.recruitEnd || ""),
    requiredDocuments: requiredDocs,
    responsibilities: position.jobDetails ? position.jobDetails.split(/\r?\n/).filter(d => d.trim()) : [],
    qualifications: position.requirement ? position.requirement.split(/\r?\n/).filter(r => r.trim()) : [],
    benefits: position.benefits || "ไม่มีค่าตอบแทน",
    // ใช้ข้อมูล owner จาก API
    supervisorName: ownerName || undefined,
    supervisorEmail: ownerEmail || undefined,
    supervisorPhone: ownerPhone || undefined,
    // ใช้ข้อมูล mentor จาก API
    mentorName: mentorName || undefined,
    mentorEmail: mentorEmail || undefined,
    mentorPhone: mentorPhone || undefined,
  };
};

// Helper function to convert Position to Job format with owner mapping
// ใช้ข้อมูล owner จาก API โดยตรง (ไม่ต้อง staff list แยก)
export const positionToJobWithOwnerMapping = (position: Position): ReturnType<typeof positionToJob> => {
  // เรียกใช้ positionToJob ซึ่งใช้ข้อมูล owner จาก API อยู่แล้ว
  return positionToJob(position);
};

// Enhanced helper function that includes staff data
// ยังคงเก็บไว้สำหรับ backward compatibility แต่จะใช้ข้อมูล owner จาก API ก่อน
export const positionToJobWithStaff = (
  position: Position,
  staffList: StaffUser[]
): ReturnType<typeof positionToJob> => {
  const baseJob = positionToJob(position);

  // ถ้ามี owner หรือ owners จาก API แล้ว ใช้เลย
  if (position.owner || (position.owners && position.owners.length > 0)) {
    return baseJob;
  }

  // Fallback: ถ้าไม่มี owner จาก API ให้ใช้ staffList แทน
  const departmentStaff = staffList.filter(
    staff => staff.departmentId === position.departmentId
  );

  const supervisor = departmentStaff[0];
  const mentor = departmentStaff[1] || departmentStaff[0];

  return {
    ...baseJob,
    supervisorName: supervisor ? `${supervisor.fname} ${supervisor.lname}` : baseJob.supervisorName,
    supervisorEmail: supervisor?.email || baseJob.supervisorEmail,
    supervisorPhone: supervisor?.phoneNumber || baseJob.supervisorPhone,
    mentorName: mentor ? `${mentor.fname} ${mentor.lname}` : baseJob.mentorName,
    mentorEmail: mentor?.email || baseJob.mentorEmail,
    mentorPhone: mentor?.phoneNumber || baseJob.mentorPhone,
  };
};

// Helper function to convert Position to JobAnnouncement format (for Owner pages)
export const positionToAnnouncement = (position: Position): {
  id: string;
  title: string;
  department: string;
  location: string;
  maxApplicants: number;
  currentApplicants: number;
  recruitStartDate: string;
  recruitEndDate: string;
  startDate: string;
  endDate: string;
  relatedFields: string[];
  requiredDocuments: ('portfolio' | 'resume')[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string;
  status: 'draft' | 'open' | 'closed' | 'expired';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  mentorName: string;
  mentorEmail: string;
  mentorPhone: string;
  createdAt: string;
  updatedAt: string;
} => {
  const departmentName = position.department?.deptFull || position.department?.deptShort || `กองงาน ${position.departmentId || "-"}`;
  const departmentLocation = position.department?.location || "";

  // Owner info (ลอง owner ก่อน ถ้าไม่มีใช้ owners[0])
  const ownerData = position.owner || (position.owners && position.owners.length > 0 ? position.owners[0] : null);
  const ownerName = ownerData
    ? `${ownerData.fname || ""} ${ownerData.lname || ""}`.trim()
    : "";
  const ownerEmail = ownerData?.email || "";
  const ownerPhone = ownerData?.phoneNumber || "";

  // Mentor info from mentors array
  const firstMentor = position.mentors?.[0];
  const mentorName = firstMentor?.name || "";
  const mentorEmail = firstMentor?.email || "";
  const mentorPhone = firstMentor?.phoneNumber || "";

  // Determine status
  let status: 'draft' | 'open' | 'closed' | 'expired' = 'open';
  if (position.recruitmentStatus === 'CLOSE') {
    status = 'closed';
  } else if (position.recruitEnd) {
    const endDate = new Date(position.recruitEnd);
    if (endDate < new Date()) {
      status = 'expired';
    }
  }

  return {
    id: position.id.toString(),
    title: position.name,
    department: departmentName,
    location: position.location || departmentLocation || "-",
    maxApplicants: position.positionCount ?? 0,
    currentApplicants: position.applicantCount ?? position.acceptedCount ?? 0,
    recruitStartDate: position.recruitStart || "",
    recruitEndDate: position.recruitEnd || "",
    startDate: position.recruitStart || "",
    endDate: position.recruitEnd || "",
    relatedFields: position.major ? position.major.split(",").map(m => m.trim()).filter(m => m) : [],
    requiredDocuments: [
      ...(position.resumeRq ? ['resume' as const] : []),
      ...(position.portfolioRq ? ['portfolio' as const] : []),
    ],
    responsibilities: position.jobDetails ? position.jobDetails.split(/\r?\n/).filter(d => d.trim()) : [],
    qualifications: position.requirement ? position.requirement.split(/\r?\n/).filter(r => r.trim()) : [],
    benefits: position.benefits || "ไม่มีค่าตอบแทน",
    status,
    contactName: ownerName,
    contactEmail: ownerEmail,
    contactPhone: ownerPhone,
    mentorName,
    mentorEmail,
    mentorPhone,
    createdAt: position.createdAt || "",
    updatedAt: position.updatedAt || "",
  };
};

// ข้อมูลสำหรับสร้าง Position
export interface CreatePositionData {
  name: string;
  location?: string;
  positionCount?: number | null;
  major?: string;
  recruitStart?: string | null;
  recruitEnd?: string | null;
  jobDetails?: string;
  requirement?: string;
  benefits?: string;
  resumeRq?: boolean;
  portfolioRq?: boolean;
  recruitmentStatus: "OPEN" | "CLOSE";
  // Array ของ staffProfileId สำหรับพี่เลี้ยง (backend ต้องการ array)
  mentorStaffIds: number[];
}

// ข้อมูลสำหรับอัพเดท Position
export interface UpdatePositionData extends Partial<CreatePositionData> { }

// Response เมื่อดึงรายการ Position
export interface PositionsResponse {
  data: Position[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// Query params สำหรับดึงรายการ Position
export interface GetPositionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  department?: number;
  office?: number;
}

// Position API functions
export const positionApi = {
  // ดึงรายการตำแหน่งทั้งหมด (พร้อม pagination และ filter)
  getPositions: async (query?: GetPositionsQuery): Promise<PositionsResponse> => {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.search) params.append("search", query.search);
    if (query?.department) params.append("department", query.department.toString());
    if (query?.office) params.append("office", query.office.toString());

    const response = await api.get<PositionsResponse>(`/position?${params.toString()}`);
    return response.data;
  },

  // ดึงข้อมูลตำแหน่งตาม ID (ใช้ getPositions แล้ว filter เพราะ backend ไม่มี endpoint GET /position/:id)
  getPositionById: async (id: number): Promise<Position | null> => {
    try {
      // ดึง positions ทั้งหมด แล้ว filter หาตาม id
      const response = await positionApi.getPositions({ limit: 1000 });
      const position = response.data.find(p => p.id === id);
      return position || null;
    } catch {
      return null;
    }
  },

  // สร้างประกาศตำแหน่งฝึกงานใหม่
  createPosition: async (data: CreatePositionData): Promise<Position> => {
    const response = await api.post<Position>("/position", data);
    return response.data;
  },

  // อัพเดทประกาศตำแหน่งฝึกงาน
  updatePosition: async (id: number, data: UpdatePositionData): Promise<Position> => {
    const response = await api.put<Position>(`/position/${id}`, data);
    return response.data;
  },

  // ลบประกาศตำแหน่งฝึกงาน
  deletePosition: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/position/${id}`);
    return response.data;
  },
};

// ==================== Document Types API ====================

// ประเภทข้อมูล DocType (ประเภทเอกสาร)
export interface DocType {
  id: number;
  name: string;
  description: string | null;
  isRequired: boolean | null;
}

// DocType API functions
export const docTypeApi = {
  // ดึงรายการประเภทเอกสารทั้งหมด
  getDocTypes: async (): Promise<DocType[]> => {
    const response = await api.get<DocType[]>("/doc-types");
    return response.data;
  },
};

// ==================== Application API ====================

// Backend application status enum
export type AppStatusEnum =
  | "PENDING_DOCUMENT"
  | "PENDING_INTERVIEW"
  | "PENDING_CONFIRMATION"
  | "PENDING_REQUEST"
  | "PENDING_REVIEW"
  | "COMPLETE"
  | "CANCEL"
  | "ABORT";

// ข้อมูลใบสมัครจาก GET /applications/history/me
export interface MyApplicationData {
  applicationId: number;
  applicationStatus: AppStatusEnum;
  internshipRound: number;
  isActive: boolean;
  statusNote: string | null;
  createdAt: string;
  updatedAt: string;
  positionId: number | null;
  positionName: string | null;
  positionDepartmentId: number | null;
  positionOfficeId: number | null;
  infoEndDate: string | null;
  documents: { docTypeId: number; docFile: string }[];
}

// Mapping: backend status → frontend step name (Thai)
export const APP_STATUS_TO_STEP: Record<AppStatusEnum, string> = {
  PENDING_DOCUMENT: "รอยื่นเอกสาร",
  PENDING_INTERVIEW: "รอสัมภาษณ์",
  PENDING_CONFIRMATION: "รอการยืนยัน",
  PENDING_REQUEST: "รอยื่นเอกสารขอความอนุเคราะห์",
  PENDING_REVIEW: "รอการตรวจสอบ",
  COMPLETE: "เสร็จสิ้น",
  CANCEL: "ไม่ผ่าน",
  ABORT: "ยกเลิกการสมัคร",
};

// ตรวจสอบว่าสมัครใหม่ได้หรือไม่ (ไม่มี active application)
export function canApplyForNewJob(app: MyApplicationData | null): boolean {
  if (!app) return true;
  // สมัครได้เมื่อ ยกเลิก/ไม่ผ่าน หรือ application ไม่ active แล้ว (ฝึกงานเสร็จสิ้น)
  return app.applicationStatus === "CANCEL" || app.applicationStatus === "ABORT" || !app.isActive;
}

// ประเภทข้อมูล Application (ใบสมัคร)
export interface ApplicationData {
  applicationId: number;
  applicationStatus: string;
  internshipRound: number;
  departmentId: number;
  positionId: number;
}

// ประเภทข้อมูลสำหรับส่ง skills & expectations
export interface ApplicationInformationData {
  skill: string;
  expectation: string;
}

// ข้อมูลใบสมัครแยกตามตำแหน่ง (GET /applications/history?positionId=...)
export interface AllStudentsHistoryItem {
  applicationId: number;
  applicationStatus: AppStatusEnum;
  internshipRound: number;
  isActive: boolean;
  statusNote: string | null;
  createdAt: string;
  updatedAt: string;
  studentUserId: string | null;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phoneNumber: string | null;
  gender: string | null;
  studentInternshipStatus: string | null;
  institutionName: string | null;
  institutionType: string | null;
  faculty: string | null;
  major: string | null;
  profileHours: string | null;
  profileStartDate: string | null;
  profileEndDate: string | null;
  studentNote: string | null;
  infoSkill: string | null;
  infoExpectation: string | null;
  infoStartDate: string | null;
  infoEndDate: string | null;
  infoHours: string | null;
  positionId: number | null;
  positionName: string | null;
  departmentId: number | null;
  officeId: number | null;
  documents: {
    docTypeId: number;
    docFile: string;
    validationStatus: string;
  }[];
  mentors: {
    fname: string | null;
    lname: string | null;
    email: string | null;
    phone: string | null;
  }[];
}

export interface AllStudentsHistoryResponse {
  data: AllStudentsHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface AllStudentsHistoryQuery {
  includeCanceled?: boolean;
  page?: number;
  limit?: number;
  status?: AppStatusEnum;
  positionId?: number;
  q?: string;
}

// ==================== Application API Functions ====================

// Response type from backend document upload
export interface UploadDocResponse {
  key: string;
  filename: string;
  docTypeId: number;
  validationStatus: string;
  applicationStatus: string;
}

// Application API functions
export const applicationApi = {
  // ดึงประวัติการสมัครทั้งหมดของฉัน
  getMyHistory: async (): Promise<MyApplicationData[]> => {
    const response = await api.get<MyApplicationData[]>("/applications/history/me");
    return response.data;
  },

  // ดึงใบสมัครล่าสุดของฉัน (ตัวแรกจาก history — เรียง round DESC แล้วจาก backend)
  getMyLatestApplication: async (): Promise<MyApplicationData | null> => {
    const response = await api.get<MyApplicationData[]>("/applications/history/me");
    const list = response.data;
    return list && list.length > 0 ? list[0] : null;
  },

  // สร้างใบสมัครใหม่ (คลิกสมัครตำแหน่งฝึกงาน)
  createApplication: async (positionId: number): Promise<ApplicationData> => {
    const response = await api.post<ApplicationData>("/applications", { positionId });
    return response.data;
  },

  // ส่งข้อมูล skills & expectations → สร้างใบสมัครจริง
  submitInformation: async (positionId: number, data: { skill: string; expectation: string; startDate: string; endDate: string; hours: number }): Promise<{ applicationId: number; applicationStatus: string }> => {
    const response = await api.post<{ applicationId: number; applicationStatus: string }>(`/applications/positions/${positionId}/information`, data);
    return response.data;
  },

  // อัปโหลดเอกสาร Transcript
  uploadTranscript: async (applicationId: number, file: File): Promise<UploadDocResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UploadDocResponse>(`/applications/${applicationId}/documents/transcript`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // อัปโหลดเอกสาร Resume
  uploadResume: async (applicationId: number, file: File): Promise<UploadDocResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UploadDocResponse>(`/applications/${applicationId}/documents/resume`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // อัปโหลดเอกสาร Portfolio
  uploadPortfolio: async (applicationId: number, file: File): Promise<UploadDocResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UploadDocResponse>(`/applications/${applicationId}/documents/portfolio`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ดาวน์โหลด/พรีวิวเอกสารจาก MinIO
  downloadDocument: async (key: string, download: boolean = true): Promise<void> => {
    const response = await api.get(`/application-documents/file`, {
      params: { key, download },
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });
    const url = window.URL.createObjectURL(blob);
    if (download) {
      const filename = key.split("/").pop() || "document";
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.open(url, "_blank");
    }
    window.URL.revokeObjectURL(url);
  },

  // อัปโหลดเอกสาร Request Letter (ขอความอนุเคราะห์)
  uploadRequestLetter: async (applicationId: number, file: File): Promise<UploadDocResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UploadDocResponse>(`/applications/${applicationId}/documents/request-letter`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ยกเลิกใบสมัคร (Student cancel — เฉพาะ PENDING_DOCUMENT ที่ยังไม่ส่งเอกสาร)
  cancelApplication: async (applicationId: number): Promise<{ applicationStatus: string }> => {
    const response = await api.put<{ applicationStatus: string }>(`/applications/${applicationId}/cancel`);
    return response.data;
  },

  // Owner/Admin ดูใบสมัครทั้งหมด (รองรับ filter positionId, status, search, pagination)
  getAllStudentsHistory: async (query?: AllStudentsHistoryQuery): Promise<AllStudentsHistoryResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query?.includeCanceled !== undefined) params.includeCanceled = query.includeCanceled;
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.status) params.status = query.status;
    if (query?.positionId) params.positionId = query.positionId;
    if (query?.q) params.q = query.q;
    const response = await api.get<AllStudentsHistoryResponse>("/applications/history", { params });
    return response.data;
  },

  // Owner อนุมัติผ่านสัมภาษณ์
  approveInterview: async (applicationId: number): Promise<unknown> => {
    const response = await api.put(`/applications/${applicationId}/interview/approve`);
    return response.data;
  },

  // Owner ยืนยันรับนักศึกษา
  confirmAccept: async (applicationId: number): Promise<unknown> => {
    const response = await api.put(`/applications/${applicationId}/confirm/accept`);
    return response.data;
  },

  // Owner ไม่อนุมัติ (ยกเลิกใบสมัคร)
  rejectApplication: async (applicationId: number, reason: string): Promise<unknown> => {
    const response = await api.put(`/applications/${applicationId}/interview/reject`, { reason });
    return response.data;
  },

  // Admin ตรวจสอบเอกสาร (VERIFIED / INVALID)
  reviewDocument: async (
    applicationId: number,
    docType: "transcript" | "resume" | "portfolio" | "request-letter",
    status: "VERIFIED" | "INVALID",
    note?: string
  ): Promise<unknown> => {
    const response = await api.put(`/applications/${applicationId}/documents/${docType}/review`, { status, note });
    return response.data;
  },

  // Admin/Owner ดูประวัติของนักศึกษาคนเดียว
  getStudentHistory: async (studentUserId: string, includeCanceled?: boolean): Promise<MyApplicationData[]> => {
    const params: Record<string, string | boolean> = {};
    if (includeCanceled !== undefined) params.includeCanceled = includeCanceled;
    const response = await api.get<MyApplicationData[]>(`/applications/history/${studentUserId}`, { params });
    return response.data;
  },
};

// Interceptor สำหรับแนบ token ในทุก request
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor สำหรับจัดการ error response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token หมดอายุหรือไม่ถูกต้อง
      authStorage.clearAuth();
      if (typeof window !== "undefined") {
        // ไม่ redirect ถ้าอยู่หน้า public ("/", "/pea-info", "/faqs", "/jobs")
        const publicPaths = ["/", "/pea-info", "/faqs", "/jobs"];
        const currentPath = window.location.pathname;
        const isPublicPage = publicPaths.some(p => currentPath === p || currentPath.startsWith("/jobs/"));

        if (!isPublicPage) {
          window.location.href = "/login/intern";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ==================== Department API ====================

export interface Department {
  id: number;
  deptSap: number;
  deptShort: string | null;
  deptFull: string | null;
  location: string | null;
  officeId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentsResponse {
  data: Department[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export const departmentApi = {
  // ดึงรายการ departments ทั้งหมด
  getDepartments: async (): Promise<DepartmentsResponse> => {
    const response = await api.get<DepartmentsResponse>("/dept");
    return response.data;
  },

  // ดึง department ตาม ID
  getDepartmentById: async (id: number): Promise<Department | null> => {
    try {
      const response = await departmentApi.getDepartments();
      return response.data.find(d => d.id === id) || null;
    } catch {
      return null;
    }
  },
};

// ==================== Notification API ====================

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export const notificationApi = {
  // ดึง notifications ของตัวเอง
  getMyNotifications: async (query?: { unreadOnly?: boolean; limit?: number; offset?: number }): Promise<NotificationItem[]> => {
    const params: Record<string, string | number | boolean> = {};
    if (query?.unreadOnly !== undefined) params.unreadOnly = query.unreadOnly;
    if (query?.limit) params.limit = query.limit;
    if (query?.offset !== undefined) params.offset = query.offset;
    const response = await api.get<NotificationItem[]>("/notifications", { params });
    return response.data;
  },

  // อ่าน/ยังไม่อ่าน notification
  markAsRead: async (id: number, isRead: boolean): Promise<{ id: number; isRead: boolean }> => {
    const response = await api.put<{ id: number; isRead: boolean }>(`/notifications/${id}/read`, { isRead });
    return response.data;
  },

  // อ่านทั้งหมด
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await api.put<{ success: boolean }>("/notifications/read-all");
    return response.data;
  },
};

// ==================== Application Documents API ====================

export type ValidationStatus = "PENDING" | "INVALID" | "VERIFIED";
export type DocTypeName = "transcript" | "resume" | "portfolio" | "request-letter";

export interface ApplicationDocumentItem {
  id: number;
  applicationStatusId: number;
  docTypeId: number;
  docFile: string;
  validationStatus: ValidationStatus;
  createdAt: string;
  updatedAt: string;
  // Joined data
  docTypeName?: string;
  studentUserId?: string;
  studentFname?: string;
  studentLname?: string;
}

export interface ApplicationDocumentsResponse {
  data: ApplicationDocumentItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface GetApplicationDocumentsQuery {
  applicationStatusId?: number;
  departmentId?: number;
  userId?: string;
  docTypeId?: number;
  validationStatus?: ValidationStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export const applicationDocumentsApi = {
  // Admin ดึงรายการเอกสารทั้งหมด (พร้อม filter)
  getDocuments: async (query?: GetApplicationDocumentsQuery): Promise<ApplicationDocumentsResponse> => {
    const params: Record<string, string | number> = {};
    if (query?.applicationStatusId) params.applicationStatusId = query.applicationStatusId;
    if (query?.departmentId) params.departmentId = query.departmentId;
    if (query?.userId) params.userId = query.userId;
    if (query?.docTypeId) params.docTypeId = query.docTypeId;
    if (query?.validationStatus) params.validationStatus = query.validationStatus;
    if (query?.q) params.q = query.q;
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    const response = await api.get<ApplicationDocumentsResponse>("/application-documents", { params });
    return response.data;
  },

  // ดาวน์โหลด/พรีวิวเอกสาร (stream จาก MinIO)
  getFileUrl: (key: string, disposition: "inline" | "attachment" = "inline"): string => {
    return `${API_BASE_URL}/application-documents/file?key=${encodeURIComponent(key)}&disposition=${disposition}`;
  },

  // ดาวน์โหลดเอกสารเป็น blob
  downloadFile: async (key: string): Promise<Blob> => {
    const response = await api.get("/application-documents/file", {
      params: { key, disposition: "attachment" },
      responseType: "blob",
    });
    return response.data;
  },
};

// ==================== Application Status Actions API ====================

export interface ApplicationStatusAction {
  id: number;
  applicationStatusId: number;
  actionBy: string | null;
  oldStatus: AppStatusEnum | null;
  newStatus: AppStatusEnum;
  note: string | null;
  createdAt: string;
  // Joined user data (from backend join)
  actor?: {
    id: string;
    fname: string | null;
    lname: string | null;
    displayUsername: string | null;
    roleId: number | null;
    departmentId: number | null;
  };
  actionByName?: string;
}

export interface GetStatusActionsQuery {
  actionId?: number;
  limit?: number;
  offset?: number;
}

export const applicationStatusActionsApi = {
  // ดูประวัติเปลี่ยนสถานะของใบสมัคร
  getByApplicationStatusId: async (applicationStatusId: number, query?: GetStatusActionsQuery): Promise<ApplicationStatusAction[]> => {
    const params: Record<string, string | number> = {};
    if (query?.actionId) params.actionId = query.actionId;
    if (query?.limit) params.limit = query.limit;
    if (query?.offset !== undefined) params.offset = query.offset;
    const response = await api.get<ApplicationStatusAction[]>(`/application-status-actions/${applicationStatusId}`, { params });
    return response.data;
  },

  // ดูประวัติ actions ของตัวเอง
  getMyActions: async (query?: { limit?: number; offset?: number }): Promise<ApplicationStatusAction[]> => {
    const params: Record<string, string | number> = {};
    if (query?.limit) params.limit = query.limit;
    if (query?.offset !== undefined) params.offset = query.offset;
    const response = await api.get<ApplicationStatusAction[]>("/application-status-actions/me", { params });
    return response.data;
  },
};

// ==================== Staff Logs API ====================

export interface StaffLog {
  id: number;
  userId: string;
  action: string;
  createdAt: string;
  // Joined user data
  fname?: string;
  lname?: string;
}

export interface StaffLogsResponse {
  data: StaffLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface GetStaffLogsQuery {
  page?: number;
  limit?: number;
  userId?: string;
}

export const staffLogsApi = {
  // สร้าง staff log entry
  createLog: async (action: string): Promise<StaffLog> => {
    const response = await api.post<StaffLog>("/staff-logs", { action });
    return response.data;
  },

  // ดึงรายการ staff logs
  getLogs: async (query?: GetStaffLogsQuery): Promise<StaffLogsResponse> => {
    const params: Record<string, string | number> = {};
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.userId) params.userId = query.userId;
    const response = await api.get<StaffLogsResponse>("/staff-logs", { params });
    return response.data;
  },
};

// ==================== Owner Students API (End Internship) ====================

export type EndInternshipStatus = "CANCEL" | "COMPLETE";

export const ownerStudentsApi = {
  // Owner/Admin สิ้นสุดการฝึกงาน (CANCEL หรือ COMPLETE)
  updateInternshipStatus: async (
    studentUserId: string,
    status: EndInternshipStatus,
    reason?: string
  ): Promise<unknown> => {
    const body: { status: EndInternshipStatus; reason?: string } = { status };
    if (reason) body.reason = reason;
    const response = await api.put(`/owner/students/${studentUserId}/internship-status`, body);
    return response.data;
  },
};

// ==================== Roles API ====================

export interface Role {
  id: number;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const roleApi = {
  // ดึงรายการ roles ทั้งหมด
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>("/role");
    return response.data;
  },

  // สร้าง role ใหม่
  createRole: async (data: { name: string; description?: string }): Promise<Role> => {
    const response = await api.post<Role>("/role", data);
    return response.data;
  },

  // อัปเดต role
  updateRole: async (id: number, data: { name?: string; description?: string }): Promise<Role> => {
    const response = await api.put<Role>(`/role/${id}`, data);
    return response.data;
  },

  // ลบ role
  deleteRole: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/role/${id}`);
    return response.data;
  },
};

// ==================== Institution Ticket API ====================

export interface InstitutionTicket {
  id: number;
  institutionId: number;
  // ข้อมูลเพิ่มเติมจาก backend (shape ขึ้นอยู่กับ service)
  [key: string]: unknown;
}

export const institutionTicketApi = {
  // ดึงข้อมูล ticket ตาม ID (public, cached 5 นาที)
  getById: async (id: number): Promise<InstitutionTicket> => {
    const response = await api.get<InstitutionTicket>(`/institution_ticket/${id}`);
    return response.data;
  },
};

export default api;
