import axios from "axios";

// In production (Vercel), use relative URL so requests go through Next.js rewrite proxy
// This makes all API calls same-origin, solving cross-domain cookie issues
export const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api` || "/api";

// สร้าง axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // สำหรับส่ง cookies
});

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

let currentUserCache: ApiUser | null = null;

// สำหรับจัดการ token และ user ใน cookie/in-memory
export const authStorage = {
  setToken: (token: string): void => {
    if (typeof window !== "undefined") {
      setCookie("auth_token", token, 7);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return getCookie("auth_token");
    }
    return null;
  },

  removeToken: (): void => {
    if (typeof window !== "undefined") {
      deleteCookie("auth_token");
    }
  },

  setUser: (user: ApiUser): void => {
    currentUserCache = user;
  },

  getUser: (): ApiUser | null => {
    return currentUserCache;
  },

  removeUser: (): void => {
    currentUserCache = null;
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
    // ลบ token cookie ที่ใช้ข้ามระบบไป iTT
    deleteCookie("token");
  },

  // ตรวจสอบว่า login อยู่หรือไม่
  isAuthenticated: (): boolean => {
    // ตรวจสอบทั้ง auth_token, Better Auth session, และ user ใน memory
    const hasToken = !!authStorage.getToken();
    const hasBetterAuthSession = !!getCookie("better-auth.session_token");
    const hasUser = !!authStorage.getUser();
    return hasToken || hasBetterAuthSession || hasUser;
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
        const publicPaths = ["/", "/pea-info", "/faqs", "/jobs", "/guide"];
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith("/login") || currentPath.startsWith("/register");
        const isPublicPage = publicPaths.some(p => currentPath === p || currentPath.startsWith("/jobs/") || currentPath.startsWith("/guide"));

        if (!isPublicPage && !isAuthPage) {
          const loginUrl = new URL("/login/intern", window.location.origin);
          loginUrl.searchParams.set("forceLogin", "1");
          loginUrl.searchParams.set("callbackUrl", currentPath);
          window.location.replace(loginUrl.toString());
        }
      }
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
