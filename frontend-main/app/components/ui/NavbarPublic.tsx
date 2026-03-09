"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { authApi } from "../../services/api";

// Helper: fetch Keycloak SSO URL and redirect
const handleKeycloakRedirect = async () => {
  try {
    const url = await authApi.signInKeycloak();
    window.location.href = url;
  } catch {
    window.location.href = "/login/owner";
  }
};

export default function NavbarPublic() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="PEA Internship Logo"
              width={160}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Navigation and Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8 mr-4">
              <Link
                href="/"
                className={`font-medium transition-colors ${
                  pathname === "/"
                    ? "text-primary-600 hover:text-primary-700"
                    : "text-gray-600 hover:text-primary-600"
                }`}
              >
                ตำแหน่งฝึกงาน
              </Link>
              <Link
                href="/pea-info"
                className={`font-medium transition-colors ${
                  pathname === "/pea-info"
                    ? "text-primary-600 hover:text-primary-700"
                    : "text-gray-600 hover:text-primary-600"
                }`}
              >
                ข้อมูลกฟภ.
              </Link>
              <Link
                href="/faqs"
                className={`font-medium transition-colors ${
                  pathname === "/faqs"
                    ? "text-primary-600 hover:text-primary-700"
                    : "text-gray-600 hover:text-primary-600"
                }`}
              >
                FAQs
              </Link>
            </div>

            {/* Auth Buttons */}
            <Link
              href="/login/intern"
              className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-2xl font-medium hover:bg-primary-600 hover:text-white transition-colors text-base cursor-pointer"
            >
              เข้าสู่ระบบผู้สมัคร
            </Link>
            <button
              onClick={handleKeycloakRedirect}
              className="px-8 py-3 bg-primary-600 text-white rounded-2xl font-medium hover:bg-white hover:text-primary-600 border-2 border-primary-600 transition-colors text-base cursor-pointer"
            >
              เข้าสู่ระบบพนักงาน PEA
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
