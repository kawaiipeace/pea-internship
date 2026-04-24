"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { authApi, authStorage } from "@/services/api";

const handleKeycloakRedirect = () => {
  window.location.href = authApi.signInKeycloak();
};

interface NavbarPublicProps {
  isLoggedIn?: boolean;
  userRole?: "intern" | "admin" | "owner";
}

export default function NavbarPublic({
  isLoggedIn = false,
  userRole,
}: NavbarPublicProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(e.target as Node))
        setIsHelpOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsDropdownOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node))
        setIsNotificationOpen(false);
    }
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
      router.replace("/");
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="PEA Internship Logo"
              width={195}
              height={112}
              style={{ width: "auto", height: "3rem" }}
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn && userRole === "intern" ? (
              <>
                {/* Nav links — logged-in intern */}
                <div className="hidden lg:flex items-center gap-8 mr-4">
                  <Link
                    href="/"
                    className={`font-medium transition-colors ${pathname === "/" ? "text-primary-600 hover:text-primary-700" : "text-gray-600 hover:text-primary-600"}`}
                  >
                    ตำแหน่งฝึกงาน
                  </Link>
                  <Link
                    href="/pea-info"
                    className={`font-medium transition-colors ${pathname === "/pea-info" ? "text-primary-600 hover:text-primary-700" : "text-gray-600 hover:text-primary-600"}`}
                  >
                    ข้อมูลกฟภ.
                  </Link>
                  <Link
                    href="/favorites"
                    className={`font-medium transition-colors ${pathname === "/favorites" ? "text-primary-600 hover:text-primary-700" : "text-gray-600 hover:text-primary-600"}`}
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
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-3 z-50">
                      <div className="flex items-center gap-2 px-4 pb-3 border-b border-gray-100">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="font-semibold text-gray-800">การแจ้งเตือน</span>
                      </div>
                      <p className="px-4 py-4 text-sm text-gray-400 text-center">ไม่มีการแจ้งเตือนใหม่</p>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <Link
                        href="/intern-info"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 hover:bg-primary-50 transition-colors ${pathname === "/intern-info" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        ข้อมูลผู้สมัคร
                      </Link>
                      <Link
                        href="/application-history"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 hover:bg-primary-50 transition-colors ${pathname === "/application-history" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ประวัติการสมัคร
                      </Link>
                      <Link
                        href="/application-status"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 hover:bg-primary-50 transition-colors ${pathname === "/application-status" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        ติดตามสถานะการสมัคร
                      </Link>
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Nav links — not logged in */}
                <div className="hidden lg:flex items-center gap-8 mr-4 nav-text-links">
                  <Link
                    href="/"
                    className={`font-medium transition-colors ${pathname === "/" ? "text-primary-600 hover:text-primary-700" : "text-gray-600 hover:text-primary-600"}`}
                  >
                    ตำแหน่งฝึกงาน
                  </Link>
                  <Link
                    href="/pea-info"
                    className={`font-medium transition-colors ${pathname === "/pea-info" ? "text-primary-600 hover:text-primary-700" : "text-gray-600 hover:text-primary-600"}`}
                  >
                    ข้อมูลกฟภ.
                  </Link>
                  {/* ช่วยเหลือ dropdown */}
                  <div ref={helpRef} className="relative">
                    <button
                      onClick={() => setIsHelpOpen((v) => !v)}
                      className={`flex items-center gap-1 font-medium transition-colors ${
                        ["/faqs", "/credits"].includes(pathname) || pathname.startsWith("/guide")
                          ? "text-primary-600"
                          : "text-gray-600 hover:text-primary-600"
                      }`}
                    >
                      ช่วยเหลือ
                      <svg className={`w-4 h-4 transition-transform ${isHelpOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isHelpOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 nav-dropdown-menu">
                        <Link href="/guide" onClick={() => setIsHelpOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${pathname.startsWith("/guide") ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          คู่มือการใช้งาน
                        </Link>
                        <Link href="/faqs" onClick={() => setIsHelpOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${pathname === "/faqs" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          FAQs
                        </Link>
                        <Link href="/credits" onClick={() => setIsHelpOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${pathname === "/credits" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          ผู้จัดทำ
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Auth Buttons - desktop only */}
                <Link
                  href="/login/intern"
                  className="hidden lg:block px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-2xl font-medium hover:bg-primary-600 hover:text-white transition-colors text-base cursor-pointer"
                >
                  เข้าสู่ระบบผู้สมัคร
                </Link>
                <button
                  onClick={handleKeycloakRedirect}
                  className="hidden lg:block px-8 py-3 bg-primary-600 text-white rounded-2xl font-medium hover:bg-primary-700 hover:text-white border-2 border-primary-600 transition-colors text-base cursor-pointer"
                >
                  เข้าสู่ระบบพนักงาน PEA
                </button>

                {/* Hamburger - mobile/tablet only */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  aria-label="Open menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Image
                  src="/images/logo.png"
                  alt="PEA Internship Logo"
                  width={195}
                  height={112}
                  style={{ width: "auto", height: "2.25rem" }}
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 active:bg-primary-100 active:text-primary-700 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 py-4">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 hover:bg-primary-50 active:bg-primary-100 transition-colors ${pathname === "/" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                ตำแหน่งฝึกงาน
              </Link>
              <Link href="/pea-info" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 hover:bg-primary-50 active:bg-primary-100 transition-colors ${pathname === "/pea-info" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                ข้อมูลกฟภ.
              </Link>
              <Link href="/guide" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 hover:bg-primary-50 active:bg-primary-100 transition-colors ${pathname.startsWith("/guide") ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                คู่มือการใช้งาน
              </Link>
              <Link href="/faqs" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 hover:bg-primary-50 active:bg-primary-100 transition-colors ${pathname === "/faqs" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                FAQs
              </Link>
              <Link href="/credits" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 hover:bg-primary-50 active:bg-primary-100 transition-colors ${pathname === "/credits" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                ผู้จัดทำ
              </Link>
              <Link href="/login/intern" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 hover:bg-primary-50 active:bg-primary-100 transition-colors ${pathname === "/login/intern" ? "text-primary-600 font-medium bg-primary-50" : "text-gray-700"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                เข้าสู่ระบบผู้สมัคร
              </Link>
              <button
                onClick={() => { setIsMobileMenuOpen(false); handleKeycloakRedirect(); }}
                className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors w-full text-left"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
