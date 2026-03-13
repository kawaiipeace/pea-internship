"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { authApi, authStorage, notificationApi, type NotificationItem } from "@/services/api";

// Helper: relative time in Thai
function relativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "เมื่อสักครู่";
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} เดือนที่แล้ว`;
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationApi.getMyNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  // Load notifications on mount + poll every 30s
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

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
                onClick={async () => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                  if (unreadCount > 0) {
                    try {
                      await notificationApi.markAllAsRead();
                      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                      setUnreadCount(0);
                    } catch (err) {
                      console.error("Failed to mark all as read:", err);
                    }
                  }
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
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
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
                    <span className="font-semibold text-gray-900">
                      การแจ้งเตือน
                    </span>
                    {notifications.length > 0 && (
                      <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={async () => {
                            if (!notif.isRead) {
                              try {
                                await notificationApi.markAsRead(notif.id, true);
                                setNotifications((prev) =>
                                  prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
                                );
                                setUnreadCount((prev) => Math.max(0, prev - 1));
                              } catch (err) {
                                console.error("Failed to mark as read:", err);
                              }
                            }
                            setShowNotifications(false);
                            router.push("/admin/applications");
                          }}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notif.isRead ? "bg-primary-50/50" : ""}`}
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {notif.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {relativeTime(notif.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-400 text-sm">
                        ไม่มีการแจ้งเตือน
                      </div>
                    )}
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
