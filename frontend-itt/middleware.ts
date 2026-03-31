import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// หน้าสำหรับ intern ที่ต้อง login (Protected Routes)
const internRoutes = [
  "/intern",       // ลงเวลาเข้า-ออก
  "/intern/history",        // ประวัติการลงเวลา
  "/intern/leave-request",  // ยื่นคำขอลา
  "/intern/leave-history",  // ประวัติการลา
  "/intern/user",           // ตั้งค่าโปรไฟล์
];

// หน้าสำหรับ mentor (พี่เลี้ยง)
const mentorRoutes = ["/mentor"];

// หน้าสำหรับ admin
const adminRoutes = ["/admin"];

// หน้าที่ไม่ควรเข้าได้ถ้า login แล้ว (Auth Routes)
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

// Token session cookie name
const SESSION_COOKIE = "token";
const BETTER_AUTH_COOKIE = "better-auth.session_token";

// Helper: ดึง home page ตาม role สำหรับ ITT
function getHomeByRole(role: string | undefined): string {
  switch (role) {
    case "owner":
    case "mentor":
      return "/mentor";
    case "admin":
      return "/admin";
    case "intern":
    case "student":
    default:
      return "/intern";
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const forceLogin = searchParams.get("forceLogin") === "1";

  // ดึง session token และ role
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value || request.cookies.get(BETTER_AUTH_COOKIE)?.value;
  const userRole = request.cookies.get("user_role")?.value;

  // isAuthenticated คือต้องมีทั้งคู่ (เพื่อป้องกันอาการค้าง)
  const isAuthenticated = !!sessionToken && !!userRole;

  // ตรวจสอบประเภท route
  const isInternRoute = internRoutes.some(
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

  // 1. ถ้ายังไม่ login และจะเข้า protected route → ไปหน้า login
  const isProtectedRoute = isInternRoute || isMentorRoute || isAdminRoute;
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. ถ้า login แล้วแต่อยากเข้าหน้า Login/Register → ไปหน้า Home ตาม Role
  if (isAuthenticated && isAuthRoute && !forceLogin) {
    if (userRole) {
        return NextResponse.redirect(new URL(getHomeByRole(userRole), request.url));
    }
  }

  // 3. ตรวจสอบสิทธิ์ราย Role (RBAC)
  if (isAuthenticated && isProtectedRoute && userRole) {
    const isOwnerOrMentor = userRole === "owner" || userRole === "mentor";

    // Mentor/Owner พยายามเข้า Intern routes
    if (isOwnerOrMentor && isInternRoute) {
      return NextResponse.redirect(new URL("/mentor", request.url));
    }
    // Intern พยายามเข้า Mentor/Admin routes
    if ((userRole === "intern" || userRole === "student") && (isMentorRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Admin พยายามเข้าหน้าอื่นๆ
    if (userRole === "admin" && (isInternRoute || isMentorRoute)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 4. หน้า Public (/) -> ส่งไป Home ตาม Role
  if (isAuthenticated && pathname === "/") {
    if (userRole) {
        return NextResponse.redirect(new URL(getHomeByRole(userRole), request.url));
    }
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
