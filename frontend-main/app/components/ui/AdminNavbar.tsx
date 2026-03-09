"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { authApi, authStorage } from "../../services/api";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActiveLink = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/admin/applications" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="PEA Internship Logo"
              width={160}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Right side - Navigation Links + notifications and profile */}
          <div className="flex items-center gap-6">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/admin/applications"
                className={`font-medium transition-colors ${
                  isActiveLink("/admin/applications")
                    ? "text-primary-600 hover:text-primary-700"
                    : "text-gray-600 hover:text-primary-600"
                }`}
              >
                ลิสต์รายการสมัคร
              </Link>
              <Link
                href="/admin/dashboard"
                className={`font-medium transition-colors ${
                  isActiveLink("/admin/dashboard")
                    ? "text-primary-600 hover:text-primary-700"
                    : "text-gray-600 hover:text-primary-600"
                }`}
              >
                แดชบอร์ด
              </Link>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
                className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  2
                </span>
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border-2 border-primary-600 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <span className="font-medium text-gray-800">
                      การแจ้งเตือน
                    </span>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm text-gray-800">
                        มีเอกสารใหม่รอตรวจสอบ
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        5 นาทีที่แล้ว
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm text-gray-800">
                        ผู้สมัครใหม่ส่งเอกสารเข้ามา
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        1 ชั่วโมงที่แล้ว
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border-2 border-primary-600 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">แอดมิน</p>
                    <p className="text-xs text-gray-500">admin@pea.co.th</p>
                  </div>
                  <button
                    onClick={async () => {
                      setShowProfile(false);
                      try {
                        await authApi.signOut();
                      } catch (error) {
                        console.error("Logout API error:", error);
                      } finally {
                        authStorage.clearAuth();
                        localStorage.removeItem('current_user');
                        router.replace("/");
                      }
                    }}
                    className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
