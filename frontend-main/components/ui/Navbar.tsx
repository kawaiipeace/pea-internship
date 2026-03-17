"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { authApi, authStorage } from "@/services/api";

// Helper: fetch Keycloak SSO URL and redirect
const handleKeycloakRedirect = async () => {
  try {
    const url = await authApi.signInKeycloak();
    window.location.href = url;
  } catch {
    // fallback: navigate to login/owner page
    window.location.href = "/login/owner";
  }
};

interface NavbarProps {
  isLoggedIn?: boolean;
  userRole?: "intern" | "admin" | "owner";
}

export default function Navbar({ isLoggedIn = false, userRole }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      await authApi.signOut();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      authStorage.clearAuth();
      localStorage.removeItem('current_user');
      router.replace("/");
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            {/* TODO: เพิ่มรูป logo ที่ /public/images/logo.png */}
            <Image
              src="/images/logo.png"
              alt="PEA Internship Logo"
              width={160}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Auth Buttons or User Menu */}
          <div className="flex items-center gap-3">
            {isLoggedIn && userRole === "intern" ? (
              <>
                {/* Navigation Links - moved to right side when logged in */}
                <div className="hidden md:flex items-center gap-8 mr-4">
                  <Link
                    href="/"
                    className={`font-medium transition-colors ${pathname === "/"
                      ? "text-primary-600 hover:text-primary-700"
                      : "text-gray-600 hover:text-primary-600"
                      }`}
                  >
                    ตำแหน่งฝึกงาน
                  </Link>
                  <Link
                    href="/pea-info"
                    className={`font-medium transition-colors ${pathname === "/pea-info"
                      ? "text-primary-600 hover:text-primary-700"
                      : "text-gray-600 hover:text-primary-600"
                      }`}
                  >
                    ข้อมูลกฟภ.
                  </Link>
                  <Link
                    href="/favorites"
                    className={`font-medium transition-colors ${pathname === "/favorites"
                      ? "text-primary-600 hover:text-primary-700"
                      : "text-gray-600 hover:text-primary-600"
                      }`}
                  >
                    รายการโปรด
                  </Link>
                </div>

                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {/* Notification badge */}
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      2
                    </span>
                  </button>

                  {/* Notification Dropdown */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-3 z-50">
                      {/* Header */}
                      <div className="flex items-center gap-2 px-4 pb-3 border-b border-gray-100">
                        <svg
                          className="w-5 h-5 text-primary-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                        <span className="font-semibold text-gray-800">
                          การแจ้งเตือน
                        </span>
                        <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          2
                        </span>
                      </div>

                      {/* Notification Items */}
                      <div className="py-2">
                        <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="text-sm text-gray-700">
                            มีการอัปเดตสถานะการสมัครของคุณ
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            2 ชั่วโมงที่แล้ว
                          </p>
                        </div>
                        <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="text-sm text-gray-700">
                            ตำแหน่งใหม่ที่คุณอาจจะสนใจ
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            1 วันที่แล้ว
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <Link
                        href="/intern-info"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        ข้อมูลผู้สมัคร
                      </Link>
                      <Link
                        href="/application-history"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        ประวัติการสมัคร
                      </Link>
                      <Link
                        href="/application-status"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                        ติดตามสถานะการสมัคร
                      </Link>
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Navigation Links - for non-logged in users */}
                <div className="hidden md:flex items-center gap-8 mr-4">
                  <Link
                    href="/"
                    className={`font-medium transition-colors ${pathname === "/"
                      ? "text-primary-600 hover:text-primary-700"
                      : "text-gray-600 hover:text-primary-600"
                      }`}
                  >
                    ตำแหน่งฝึกงาน
                  </Link>
                  <Link
                    href="/pea-info"
                    className={`font-medium transition-colors ${pathname === "/pea-info"
                      ? "text-primary-600 hover:text-primary-700"
                      : "text-gray-600 hover:text-primary-600"
                      }`}
                  >
                    ข้อมูลกฟภ.
                  </Link>
                  <Link
                    href="/faqs"
                    className={`font-medium transition-colors ${pathname === "/faqs"
                      ? "text-primary-600 hover:text-primary-700"
                      : "text-gray-600 hover:text-primary-600"
                      }`}
                  >
                    FAQs
                  </Link>
                </div>
                <Link
                  href="/login/intern"
                  className="hidden md:block px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-2xl font-medium hover:bg-primary-600 hover:text-white transition-colors text-base cursor-pointer"
                >
                  เข้าสู่ระบบผู้สมัคร
                </Link>
                <button
                  onClick={handleKeycloakRedirect}
                  className="hidden md:block px-8 py-3 bg-primary-600 text-white rounded-2xl font-medium hover:bg-primary-700 hover:text-white border-2 border-primary-600 transition-colors text-base cursor-pointer"
                >
                  เข้าสู่ระบบพนักงาน PEA
                </button>
                {/* Hamburger Menu - Mobile Only */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  aria-label="Open menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Image
                  src="/images/logo.png"
                  alt="PEA Internship Logo"
                  width={120}
                  height={36}
                  className="h-9 w-auto"
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 active:bg-primary-100 active:text-primary-700 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 py-4">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors ${pathname === "/" ? "text-primary-600 font-medium bg-primary-50" : ""
                  }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                ตำแหน่งฝึกงาน
              </Link>
              <Link
                href="/pea-info"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors ${pathname === "/pea-info" ? "text-primary-600 font-medium bg-primary-50" : ""
                  }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                ข้อมูลกฟภ.
              </Link>
              <Link
                href="/faqs"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors ${pathname === "/faqs" ? "text-primary-600 font-medium bg-primary-50" : ""
                  }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                FAQs
              </Link>
              <Link
                href="/login/intern"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors ${pathname === "/login/intern" ? "text-primary-600 font-medium bg-primary-50" : ""
                  }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                เข้าสู่ระบบผู้สมัคร
              </Link>
              <button
                onClick={() => { setIsMobileMenuOpen(false); handleKeycloakRedirect(); }}
                className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors w-full text-left`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                เข้าสู่ระบบพนักงาน PEA
              </button>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}
