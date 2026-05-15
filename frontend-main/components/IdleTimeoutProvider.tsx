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
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/pea-info",
  "/faqs",
  "/jobs",
  "/credits",
  "/forgot-password",
  "/reset-password",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

/** ตรวจสอบว่า user login อยู่หรือไม่ โดยดูจาก session/token cookie */
function isUserLoggedIn(): boolean {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie;
  // ตรวจ auth_token cookie ด้วย (ถ้าอ่านได้)
  const hasAuthToken = cookies
    .split("; ")
    .some((c) => c.startsWith("auth_token="));
  // ตรวจ better-auth session cookie ด้วย
  const hasBetterAuth = cookies
    .split("; ")
    .some(
      (c) =>
        c.startsWith("better-auth.session_token=") ||
        c.startsWith("__Secure-better-auth.session_token="),
    );

  const result = hasAuthToken || hasBetterAuth;
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

    // ใช้ role จาก user cache ก่อน หากไม่มีใช้ route ปัจจุบันช่วยตัดสินหน้า login
    const roleId = authStorage.getUser()?.roleId;
    const currentPath = window.location.pathname;

    try {
      await authApi.signOut();
    } catch {
      // ignore - อาจ session หมดอายุแล้ว
    } finally {
      authStorage.clearAuth();

      // redirect ตาม role: owner/admin ไปหน้า owner login, intern ไปหน้า intern login
      const isStaff =
        roleId === 1 ||
        roleId === 2 ||
        currentPath.startsWith("/owner") ||
        currentPath.startsWith("/admin");

      const loginPath = isStaff ? "/login/owner" : "/login/intern";
      const loginUrl = new URL(loginPath, window.location.origin);
      loginUrl.searchParams.set("sessionExpired", "1");
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

    // ไม่ต้องตรวจ idle ถ้าอยู่หน้า public หรือไม่ได้ login
    if (isPublic || !isLoggedIn) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    // เริ่มนับ timer
    resetTimer();

    // ฟัง user activity events เท่านั้น (ไม่รวม API call)
    const handleActivity = () => {
      resetTimer();
    };
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [pathname, resetTimer]);

  return <>{children}</>;
}
