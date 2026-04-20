"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { authApi, authStorage } from "@/services/api";

// ระยะเวลา idle timeout: 1 ชั่วโมง (ms)
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
// สำหรับ Test: ใช้ค่าสั้นๆ แทน เช่น 5 วินาที
// const IDLE_TIMEOUT_MS = 5 * 1000;

// Events ที่ถือว่าผู้ใช้ยัง active อยู่ (user interaction เท่านั้น)
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

// หน้าที่ไม่ต้องตรวจ idle (public pages)
const PUBLIC_PATHS = ["/", "/login", "/register", "/pea-info", "/faqs", "/jobs", "/credits", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

/** ตรวจสอบว่า user login อยู่หรือไม่ โดยดูจาก user_role cookie (client-set, ไม่ใช่ httpOnly) */
function isUserLoggedIn(): boolean {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie;
  // ตรวจ user_role cookie (set จาก client เสมอ ตอน login)
  const hasUserRole = cookies.split("; ").some((c) => {
    const [name, value] = c.split("=");
    return name === "user_role" && !!value;
  });
  // fallback: ตรวจ auth_token cookie ด้วย (ถ้าอ่านได้)
  const hasAuthToken = cookies.split("; ").some((c) => c.startsWith("auth_token="));
  // fallback: ตรวจ better-auth session cookie ด้วย
  const hasBetterAuth = cookies.split("; ").some((c) => c.startsWith("better-auth.session_token="));

  const result = hasUserRole || hasAuthToken || hasBetterAuth;
  console.log(`[IdleTimeout] isUserLoggedIn: userRole=${hasUserRole}, authToken=${hasAuthToken}, betterAuth=${hasBetterAuth} → ${result}`);
  return result;
}

export default function IdleTimeoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggingOutRef = useRef(false);

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    console.log("[IdleTimeout] ⏰ หมดเวลา — กำลัง logout...");

    // ตรวจ role ก่อน clear เพื่อ redirect ไปหน้าที่ถูกต้อง
    const userRole = document.cookie
      .split("; ")
      .find((c) => c.startsWith("user_role="))
      ?.split("=")[1];

    try {
      await authApi.signOut();
    } catch {
      // ignore - อาจ session หมดอายุแล้ว
    } finally {
      authStorage.clearAuth();
      // ลบ user_role cookie ด้วย
      document.cookie = "user_role=; path=/; max-age=0";

      // redirect ตาม role: owner/admin ไปหน้า owner login, intern ไปหน้า intern login
      const isStaff =
        userRole === "owner" ||
        userRole === "admin" ||
        userRole?.startsWith("/owner") ||
        userRole?.startsWith("/admin");

      const loginPath = isStaff ? "/login/owner" : "/login/intern";
      const loginUrl = new URL(loginPath, window.location.origin);
      loginUrl.searchParams.set("sessionExpired", "1");
      console.log("[IdleTimeout] Redirect →", loginUrl.toString());
      window.location.replace(loginUrl.toString());
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      // ตรวจอีกครั้งก่อน logout จริง
      if (isUserLoggedIn()) {
        performLogout();
      }
    }, IDLE_TIMEOUT_MS);
  }, [performLogout]);

  useEffect(() => {
    const isPublic = isPublicPath(pathname);
    const isLoggedIn = isUserLoggedIn();

    console.log(`[IdleTimeout] pathname=${pathname}, isPublic=${isPublic}, isLoggedIn=${isLoggedIn}`);

    // ไม่ต้องตรวจ idle ถ้าอยู่หน้า public หรือไม่ได้ login
    if (isPublic || !isLoggedIn) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    console.log(`[IdleTimeout] ✅ เริ่ม idle timer ${IDLE_TIMEOUT_MS / 1000} วินาที`);

    // เริ่มนับ timer
    resetTimer();

    // ฟัง user activity events เท่านั้น (ไม่รวม API call)
    const handleActivity = () => {
      resetTimer();
    };
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // ฟัง activity จาก tab อื่นผ่าน localStorage
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lastActivity") {
        resetTimer();
      }
    };
    window.addEventListener("storage", handleStorage);

    // broadcast activity ไปยัง tab อื่น
    const broadcastActivity = () => {
      try {
        localStorage.setItem("lastActivity", Date.now().toString());
      } catch {
        // localStorage อาจไม่พร้อมใช้
      }
    };
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, broadcastActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
        document.removeEventListener(event, broadcastActivity);
      });
      window.removeEventListener("storage", handleStorage);
    };
  }, [pathname, resetTimer]);

  return <>{children}</>;
}
