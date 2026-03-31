import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// หน้าสำหรับ intern ที่ต้อง login (Protected Routes)
const internRoutes = [
  "/intern-home",
  "/intern-profile",
  "/intern-info",
  "/intern-pea-info",
  "/application-history",
  "/application-status",
  "/favorites",
];

// หน้าสำหรับ admin ที่ต้อง login
const adminRoutes = ["/admin"];

// หน้าสำหรับ owner ที่ต้อง login
const ownerRoutes = ["/owner"];

// หน้าที่ไม่ควรเข้าได้ถ้า login แล้ว (Auth Routes)
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

// OAuth callback routes ที่ต้องอนุญาตเสมอ (ไม่ redirect แม้ login แล้ว)
const oauthCallbackRoutes = ["/login/owner/callback"];

// Better Auth cookie names
// With useSecureCookies: false, the name is always "better-auth.session_token"
// but we also check the __Secure- variant as a safety net
const BETTER_AUTH_SESSION_COOKIE = "better-auth.session_token";
const BETTER_AUTH_SESSION_COOKIE_SECURE = "__Secure-better-auth.session_token";

// Helper: ดึง home page ตาม role
function getHomeByRole(role: string | undefined): string {
  switch (role) {
    case "owner":
      return "/owner/announcements";
    case "admin":
      return "/admin";
    case "intern":
    default:
      return "/intern-home";
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const forceLogin = searchParams.get("forceLogin") === "1";

  // ดึง session token จาก Better Auth cookie (check both variants)
  const sessionToken =
    request.cookies.get(BETTER_AUTH_SESSION_COOKIE)?.value ||
    request.cookies.get(BETTER_AUTH_SESSION_COOKIE_SECURE)?.value;

  // Fallback: ตรวจสอบ auth_token ด้วย (สำหรับ backward compatibility)
  const legacyToken = request.cookies.get("auth_token")?.value;

  // ดึง role ของ user จาก cookie
  const userRole = request.cookies.get("user_role")?.value; // "intern" | "owner" | "admin"

  // ถือว่า auth จาก Better Auth ได้ต่อเมื่อมี role cookie ด้วย
  // เพื่อกันกรณี session cookie ค้างหลัง backend restart แต่ role ถูกลบแล้ว
  const hasBetterAuthSession = !!sessionToken && !!userRole;

  // ตรวจสอบว่า user login แล้วหรือยัง
  const isAuthenticated = hasBetterAuthSession || !!legacyToken;

  // ตรวจสอบประเภท route
  const isInternRoute = internRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isOwnerRoute = ownerRoutes.some(
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

  const isProtectedRoute = isInternRoute || isAdminRoute || isOwnerRoute;

  // ===== 1. ถ้ายังไม่ login และพยายามเข้า protected route → redirect ไปหน้า login =====
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login/intern", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ===== 2. ถ้า login แล้ว ตรวจ role-based access control =====
  if (isAuthenticated && isProtectedRoute && userRole) {
    // Owner พยายามเข้า intern routes → redirect ไป owner dashboard
    if (userRole === "owner" && isInternRoute) {
      return NextResponse.redirect(new URL("/owner/announcements", request.url));
    }
    // Owner พยายามเข้า admin routes → redirect ไป owner announcements
    if (userRole === "owner" && isAdminRoute) {
      return NextResponse.redirect(new URL("/owner/announcements", request.url));
    }
    // Intern พยายามเข้า owner routes → redirect ไป intern-home
    if (userRole === "intern" && isOwnerRoute) {
      return NextResponse.redirect(new URL("/intern-home", request.url));
    }
    // Intern พยายามเข้า admin routes → redirect ไป intern-home
    if (userRole === "intern" && isAdminRoute) {
      return NextResponse.redirect(new URL("/intern-home", request.url));
    }
    // Admin พยายามเข้า intern routes → redirect ไป admin
    if (userRole === "admin" && isInternRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Admin พยายามเข้า owner routes → redirect ไป admin
    if (userRole === "admin" && isOwnerRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // ===== 3. ถ้า login แล้วและพยายามเข้า auth route → redirect ตาม role =====
  if (isAuthenticated && isAuthRoute && !forceLogin) {
    return NextResponse.redirect(new URL(getHomeByRole(userRole), request.url));
  }

  // ===== 4. ถ้า login แล้วและเข้าหน้า public (/, /jobs, /pea-info, /faqs) → redirect ตาม role =====
  const publicOnlyRoutes = ["/", "/jobs", "/pea-info"];
  const isPublicOnlyRoute =
    pathname === "/" ||
    publicOnlyRoutes.some(
      (route) => route !== "/" && (pathname === route || pathname.startsWith(route + "/"))
    );

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
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)"],
};
