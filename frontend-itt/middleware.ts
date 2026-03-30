import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// หน้าสำหรับ student ที่ต้อง login (Protected Routes)
const studentRoutes = [
  "/check-in",       // ลงเวลาเข้า-ออก
  "/history",        // ประวัติการลงเวลา
  "/leave-request",  // ยื่นคำขอลา
  "/leave-history",  // ประวัติการลา
  "/user",           // ตั้งค่าโปรไฟล์
];

// หน้าสำหรับ mentor (พี่เลี้ยง) - ตรงกับ role 'owner' หรือ 'mentor' ในดาต้าเบส
const mentorRoutes = ["/mentor"];

// หน้าสำหรับ admin
const adminRoutes = ["/admin"];

// หน้าที่ไม่ควรเข้าได้ถ้า login แล้ว (Auth Routes)
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

// OAuth callback routes ที่ต้องอนุญาตเสมอ (ไม่ redirect แม้ login แล้ว)
const oauthCallbackRoutes = ["/login/owner/callback"];

// Better Auth cookie name (prefix + ".session_token")
const BETTER_AUTH_SESSION_COOKIE = "better-auth.session_token";

// Helper: ดึง home page ตาม role
function getHomeByRole(role: string | undefined): string {
  switch (role) {
    case "owner":
    case "mentor":
      return "/mentor";
    case "admin":
      return "/admin";
    case "student":
    case "intern":
    default:
      return "/check-in";
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const forceLogin = searchParams.get("forceLogin") === "1";

  // ดึง session token จาก Better Auth cookie
  const sessionToken = request.cookies.get(BETTER_AUTH_SESSION_COOKIE)?.value;

  // Fallback: ตรวจสอบ auth_token ด้วย (สำหรับ backward compatibility)
  const legacyToken = request.cookies.get("auth_token")?.value;

  // ดึง role ของ user จาก cookie
  const userRole = request.cookies.get("user_role")?.value; // "student" | "owner" | "admin"

  // ถือว่า auth จาก Better Auth ได้ต่อเมื่อมี role cookie ด้วย
  // เพื่อกันกรณี session cookie ค้างหลัง backend restart แต่ role ถูกลบแล้ว
  const hasBetterAuthSession = !!sessionToken && !!userRole;

  // ตรวจสอบว่า user login แล้วหรือยัง
  const isAuthenticated = hasBetterAuthSession || !!legacyToken;

  // ตรวจสอบประเภท route
  const isStudentRoute = studentRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isMentorRoute = mentorRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // ตรวจสอบว่าเป็น OAuth callback route หรือไม่
  const isOAuthCallback = oauthCallbackRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // ถ้าเป็น OAuth callback → อนุญาตเสมอ
  if (isOAuthCallback) {
    return NextResponse.next();
  }

  // ถ้า force login มา ให้เข้า login page ได้ทันที (กัน loop เด้งกลับ home)
  if (forceLogin && isAuthRoute) {
    return NextResponse.next();
  }

  const isProtectedRoute = isStudentRoute || isMentorRoute || isAdminRoute;

  // ===== 1. ถ้ายังไม่ login และพยายามเข้า protected route → redirect ไปหน้า login =====
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ===== 2. ถ้า login แล้ว ตรวจ role-based access control =====
  if (isAuthenticated && isProtectedRoute && userRole) {
    const isOwnerOrMentor = userRole === "owner" || userRole === "mentor";

    // Mentor/Owner พยายามเข้า student routes → redirect ไป mentor dashboard
    if (isOwnerOrMentor && isStudentRoute) {
      return NextResponse.redirect(new URL("/mentor", request.url));
    }
    // Mentor/Owner พยายามเข้า admin routes → redirect ไป mentor
    if (isOwnerOrMentor && isAdminRoute) {
      return NextResponse.redirect(new URL("/mentor", request.url));
    }
    // Student พยายามเข้า mentor routes → redirect ไป check-in
    if (userRole === "student" && isMentorRoute) {
      return NextResponse.redirect(new URL("/check-in", request.url));
    }
    // Student พยายามเข้า admin routes → redirect ไป check-in
    if (userRole === "student" && isAdminRoute) {
      return NextResponse.redirect(new URL("/check-in", request.url));
    }
    // Admin พยายามเข้า student routes
    if (userRole === "admin" && isStudentRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Admin พยายามเข้า mentor routes
    if (userRole === "admin" && isMentorRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // ===== 3. ถ้า login แล้วและพยายามเข้า auth route → redirect ตาม role =====
  if (isAuthenticated && isAuthRoute && !forceLogin) {
    return NextResponse.redirect(new URL(getHomeByRole(userRole), request.url));
  }

  // ===== 4. ถ้า login แล้วและเข้าหน้า public (/) → redirect ตาม role =====
  // ใน ITT ส่วนมาก everything is protected, แต่ / มักจะ redirect ไป home
  const isPublicOnlyRoute = pathname === "/";

  if (isAuthenticated && isPublicOnlyRoute) {
    return NextResponse.redirect(new URL(getHomeByRole(userRole), request.url));
  }

  return NextResponse.next();
}

// กำหนด routes ที่ต้องการให้ middleware ทำงาน
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets folder
     * - images
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets|images|.*\\..*).*)"],
};
