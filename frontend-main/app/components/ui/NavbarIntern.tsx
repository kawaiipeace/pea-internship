"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { authApi, authStorage } from "../../services/api";

// Types for Notification System - Ready for API integration
export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  type: "status_update" | "new_position" | "reminder" | "system";
  link?: string;
}

// Mock notifications data - Replace with API call in production
const getMockNotifications = (): Notification[] => [
  {
    id: "1",
    title: "อัปเดตสถานะ",
    message: "มีการอัปเดตสถานะการสมัครของคุณ",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    type: "status_update",
    link: "/application-status",
  },
  {
    id: "2",
    title: "ตำแหน่งใหม่",
    message: "ตำแหน่งใหม่ที่คุณอาจจะสนใจ",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: false,
    type: "new_position",
    link: "/intern-home",
  },
];

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "เมื่อสักครู่";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return date.toLocaleDateString("th-TH");
};

interface NavbarInternProps {
  favoritesCount?: number;
}

export default function NavbarIntern({
  favoritesCount: propFavoritesCount,
}: NavbarInternProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileNotificationOpen, setIsMobileNotificationOpen] =
    useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Notification state - Ready for API integration
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage or API
  const loadNotifications = useCallback(() => {
    // Check localStorage for read notification IDs
    const readIdsJson = localStorage.getItem('readNotificationIds');
    const readIds: string[] = readIdsJson ? JSON.parse(readIdsJson) : [];

    // Get mock data and merge with read state from localStorage
    const mockData = getMockNotifications();
    const notificationsWithReadState = mockData.map(n => ({
      ...n,
      isRead: readIds.includes(n.id)
    }));

    setNotifications(notificationsWithReadState);
    setUnreadCount(notificationsWithReadState.filter(n => !n.isRead).length);
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const readIds = prev.map(n => n.id);
      localStorage.setItem('readNotificationIds', JSON.stringify(readIds));
      return prev.map(n => ({ ...n, isRead: true }));
    });
    setUnreadCount(0);
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (!notification || notification.isRead) return prev;

      const readIdsJson = localStorage.getItem('readNotificationIds');
      const readIds: string[] = readIdsJson ? JSON.parse(readIdsJson) : [];
      if (!readIds.includes(notificationId)) {
        readIds.push(notificationId);
        localStorage.setItem('readNotificationIds', JSON.stringify(readIds));
      }

      return prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Add new notification (for real-time updates via WebSocket in production)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      const updated = [notification, ...prev];
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();

    // Listen for notification updates from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "notifications") {
        loadNotifications();
      }
    };

    // Listen for custom notification events (for same-tab updates)
    const handleNewNotification = (e: CustomEvent<Notification>) => {
      addNotification(e.detail);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "newNotification",
      handleNewNotification as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "newNotification",
        handleNewNotification as EventListener,
      );
    };
  }, [loadNotifications, addNotification]);

  // Toggle notification panel and mark as read
  const handleOpenNotifications = useCallback(
    (isMobile: boolean) => {
      if (isMobile) {
        // Toggle for mobile
        setIsMobileNotificationOpen(prev => !prev);
      } else {
        // Toggle for desktop
        setIsNotificationOpen(prev => !prev);
      }
      // Mark all as read when opening (not closing)
      if (unreadCount > 0) {
        markAllAsRead();
      }
    },
    [unreadCount, markAllAsRead],
  );

  // Load favorites count from localStorage
  useEffect(() => {
    const loadFavoritesCount = () => {
      const savedFavorites = localStorage.getItem("favorites");
      if (savedFavorites) {
        const favorites = JSON.parse(savedFavorites);
        setFavoritesCount(favorites.length);
      } else {
        setFavoritesCount(0);
      }
    };

    // Load initially
    loadFavoritesCount();

    // Listen for storage changes (from other tabs or when favorites change)
    window.addEventListener("storage", loadFavoritesCount);

    // Also listen for custom event for same-tab updates
    window.addEventListener("favoritesUpdated", loadFavoritesCount);

    return () => {
      window.removeEventListener("storage", loadFavoritesCount);
      window.removeEventListener("favoritesUpdated", loadFavoritesCount);
    };
  }, []);

  // Update from props if provided (for real-time updates on same page)
  useEffect(() => {
    if (propFavoritesCount !== undefined) {
      setFavoritesCount(propFavoritesCount);
    }
  }, [propFavoritesCount]);

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
      // เรียก API logout ฝั่ง server
      await authApi.signOut();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // ล้าง token และ user data จาก localStorage และ cookie
      authStorage.clearAuth();
      // ลบ localStorage ทั้งหมดที่เกี่ยวกับ user
      localStorage.removeItem('current_user');
      localStorage.removeItem('registered_interns');
      // Redirect ไปหน้าแรก (ใช้ replace เพื่อไม่ให้กดย้อนกลับได้)
      router.replace("/");
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/intern-home" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="PEA Internship Logo"
              width={160}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Navigation and User Menu */}
          <div className="flex items-center gap-3">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8 mr-4">
              <Link
                href="/intern-home"
                className={`font-medium transition-colors ${pathname === "/intern-home"
                  ? "text-primary-600 hover:text-primary-700"
                  : "text-gray-600 hover:text-primary-600"
                  }`}
              >
                ตำแหน่งฝึกงาน
              </Link>
              <Link
                href="/intern-pea-info"
                className={`font-medium transition-colors ${pathname === "/intern-pea-info"
                  ? "text-primary-600 hover:text-primary-700"
                  : "text-gray-600 hover:text-primary-600"
                  }`}
              >
                ข้อมูลกฟภ.
              </Link>
              <Link
                href="/favorites"
                className={`font-medium transition-colors relative ${pathname === "/favorites"
                  ? "text-primary-600 hover:text-primary-700"
                  : "text-gray-600 hover:text-primary-600"
                  }`}
              >
                รายการโปรด
                {favoritesCount > 0 && (
                  <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
                )}
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

            {/* Notification Bell - Desktop */}
            <div className="relative hidden md:block" ref={notificationRef}>
              <button
                onClick={() => handleOpenNotifications(false)}
                className={`relative p-2 transition-colors ${isNotificationOpen ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
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

              {/* Notification Dropdown - Desktop */}
              {isNotificationOpen && (
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

                  {/* Notification Items */}
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            markAsRead(notification.id);
                            if (notification.link) {
                              router.push(notification.link);
                            }
                            setIsNotificationOpen(false);
                          }}
                          className={`px-4 py-3 hover:bg-primary-50 cursor-pointer ${!notification.isRead ? 'bg-primary-50/50' : ''}`}
                        >
                          <p className="text-gray-900 text-sm">
                            {notification.message}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500 text-sm">
                        ไม่มีการแจ้งเตือน
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell - Mobile */}
            <button
              onClick={() => handleOpenNotifications(true)}
              className={`relative p-2 transition-colors md:hidden ${isMobileNotificationOpen ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
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

            {/* User Profile Icon - Mobile Only */}
            <button
              onClick={() => setIsMobileProfileOpen(true)}
              className={`p-2 transition-colors md:hidden ${isMobileProfileOpen ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
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
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* User Profile Dropdown - Desktop Only */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`p-2 transition-colors ${isDropdownOpen ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
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
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border-2 border-primary-600 py-2 z-50">
                  {/* ข้อมูลผู้สมัคร */}
                  <Link
                    href="/intern-profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`group flex items-center gap-3 px-4 py-2 transition-colors ${pathname === "/intern-profile" || pathname === "/intern-profile/edit"
                      ? "bg-primary-100 text-primary-600"
                      : "text-gray-700 hover:bg-primary-100 hover:text-primary-600"
                      }`}
                  >
                    <svg
                      className={`w-5 h-5 transition-colors ${pathname === "/intern-profile" || pathname === "/intern-profile/edit"
                        ? "text-primary-600"
                        : "text-gray-500 group-hover:text-primary-600"
                        }`}
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
                    <span className="transition-colors">ข้อมูลผู้สมัคร</span>
                  </Link>

                  {/* ประวัติการสมัคร */}
                  <Link
                    href="/application-history"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`group flex items-center gap-3 px-4 py-2 transition-colors ${pathname === "/application-history" || pathname?.startsWith("/application-history/")
                      ? "bg-primary-100 text-primary-600"
                      : "text-gray-700 hover:bg-primary-100 hover:text-primary-600"
                      }`}
                  >
                    <svg
                      className={`w-4 h-4 transition-colors ${pathname === "/application-history" || pathname?.startsWith("/application-history/")
                        ? "text-primary-600"
                        : "text-gray-500 group-hover:text-primary-600"
                        }`}
                      viewBox="0 0 16 20"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z" />
                    </svg>

                    <span className="transition-colors">ประวัติการสมัคร</span>
                  </Link>

                  {/* ติดตามสถานะการสมัคร */}
                  <Link
                    href="/application-status"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`group flex items-center gap-3 px-4 py-2 transition-colors ${pathname === "/application-status" || pathname?.startsWith("/application-status/")
                      ? "bg-primary-100 text-primary-600"
                      : "text-gray-700 hover:bg-primary-100 hover:text-primary-600"
                      }`}
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 21 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-colors ${pathname === "/application-status" || pathname?.startsWith("/application-status/")
                        ? "text-primary-600"
                        : "text-gray-500 group-hover:text-primary-600"
                        }`}
                    >
                      <path
                        d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V9C20 9.28333 19.9042 9.51667 19.7125 9.7C19.5208 9.88333 19.2833 9.975 19 9.975C18.7167 9.975 18.4792 9.87917 18.2875 9.6875C18.0958 9.49583 18 9.25833 18 8.975V6H2V17H8.5C8.78333 17 9.02083 17.0958 9.2125 17.2875C9.40417 17.4792 9.5 17.7167 9.5 18C9.5 18.2833 9.40417 18.5208 9.2125 18.7125C9.02083 18.9042 8.78333 19 8.5 19H2ZM8 4H12V2H8V4ZM16 21C14.6167 21 13.4375 20.5125 12.4625 19.5375C11.4875 18.5625 11 17.3833 11 16C11 14.6167 11.4875 13.4375 12.4625 12.4625C13.4375 11.4875 14.6167 11 16 11C17.3833 11 18.5625 11.4875 19.5375 12.4625C20.5125 13.4375 21 14.6167 21 16C21 17.3833 20.5125 18.5625 19.5375 19.5375C18.5625 20.5125 17.3833 21 16 21ZM16.5 15.8V13.5C16.5 13.3667 16.45 13.25 16.35 13.15C16.25 13.05 16.1333 13 16 13C15.8667 13 15.75 13.05 15.65 13.15C15.55 13.25 15.5 13.3667 15.5 13.5V15.775C15.5 15.9083 15.525 16.0375 15.575 16.1625C15.625 16.2875 15.7 16.4 15.8 16.5L17.3 18C17.4 18.1 17.5167 18.15 17.65 18.15C17.7833 18.15 17.9 18.1 18 18C18.1 17.9 18.15 17.7833 18.15 17.65C18.15 17.5167 18.1 17.4 18 17.3L16.5 15.8Z"
                        fill="currentColor"
                      />
                    </svg>

                    <span className="transition-colors">
                      ติดตามสถานะการสมัคร
                    </span>
                  </Link>

                  <hr className="my-2 border-gray-100" />

                  {/* ออกจากระบบ (Danger) */}
                  <button
                    onClick={handleLogout}
                    className="cursor-pointer group flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-600 transition-colors w-full"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors"
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
                    <span className="transition-colors">ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>

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
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Menu for Navigation */}
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
              <Link
                href="/intern-home"
                onClick={() => setIsMobileMenuOpen(false)}
              >
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
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
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
                href="/intern-home"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors ${pathname === "/intern-home"
                  ? "text-primary-600 font-medium bg-primary-50"
                  : ""
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
                href="/intern-pea-info"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors ${pathname === "/intern-pea-info"
                  ? "text-primary-600 font-medium bg-primary-50"
                  : ""
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
                href="/favorites"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`relative flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors ${pathname === "/favorites"
                  ? "text-primary-600 font-medium bg-primary-50"
                  : ""
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
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <span className="relative">
                  รายการโปรด
                  {favoritesCount > 0 && (
                    <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
                  )}
                </span>
              </Link>
              <Link
                href="/faqs"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`relative flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-primary-50 active:bg-primary-100 active:text-primary-600 transition-colors  ${pathname === "/faqs"
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-600 hover:bg-gray-50"
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
                <span>FAQs</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Profile Full Screen */}
      {isMobileProfileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
            <Link
              href="/intern-home"
              onClick={() => setIsMobileProfileOpen(false)}
            >
              <Image
                src="/images/logo.png"
                alt="PEA Internship Logo"
                width={160}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={() => {
                  setIsMobileProfileOpen(false);
                  handleOpenNotifications(true);
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
              {/* Profile Icon (active - click to close) */}
              <button
                onClick={() => setIsMobileProfileOpen(false)}
                className="p-2 text-primary-600 transition-colors"
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
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {/* Hamburger Icon */}
              <button
                onClick={() => {
                  setIsMobileProfileOpen(false);
                  setIsMobileMenuOpen(true);
                }}
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
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
            </div>
          </div>

          {/* Profile Menu Items */}
          <nav className="py-6 px-4">
            {/* ข้อมูลผู้สมัคร */}
            <Link
              href="/intern-profile"
              onClick={() => setIsMobileProfileOpen(false)}
              className={`group flex items-center gap-4 py-4 px-8 -mx-8 transition-colors w-[calc(100%+4rem)] ${pathname === "/intern-profile" ||
                pathname === "/intern-profile/edit"
                ? "bg-primary-50 text-primary-600"
                : "text-gray-700 hover:bg-primary-50 hover:text-primary-600 active:bg-primary-100 active:text-primary-600"
                }`}
            >
              <svg
                className={`w-6 h-6 ${pathname === "/intern-profile" ||
                  pathname === "/intern-profile/edit"
                  ? "text-primary-600"
                  : "text-gray-500 group-hover:text-primary-600 group-active:text-primary-600"
                  }`}
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
              <span className="text-lg">ข้อมูลผู้สมัคร</span>
            </Link>

            {/* ประวัติการสมัคร */}
            <Link
              href="/application-history"
              onClick={() => setIsMobileProfileOpen(false)}
              className={`group flex items-center gap-4 py-4 px-8 -mx-8 transition-colors w-[calc(100%+4rem)] ${pathname === "/application-history" ||
                pathname === "/application-history/job-detail"
                ? "bg-primary-50 text-primary-600"
                : "text-gray-700 hover:bg-primary-50 hover:text-primary-600 active:bg-primary-100 active:text-primary-600"
                }`}
            >
              <svg
                className={`w-6 h-6 ${pathname === "/application-history" ||
                  pathname === "/application-history/job-detail"
                  ? "text-primary-600"
                  : "text-gray-500 group-hover:text-primary-600 group-active:text-primary-600"
                  }`}
                viewBox="0 0 16 20"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z" />
              </svg>
              <span className="text-lg">ประวัติการสมัคร</span>
            </Link>

            {/* ติดตามสถานะการสมัคร */}
            <Link
              href="/application-status"
              onClick={() => setIsMobileProfileOpen(false)}
              className={`group flex items-center gap-4 py-4 px-8 -mx-8 transition-colors w-[calc(100%+4rem)] ${pathname === "/application-status" ||
                pathname === "/application-status/document-list"
                ? "bg-primary-50 text-primary-600"
                : "text-gray-700 hover:bg-primary-50 hover:text-primary-600 active:bg-primary-100 active:text-primary-600"
                }`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`${pathname === "/application-status" ||
                  pathname === "/application-status/document-list"
                  ? "text-primary-600"
                  : "text-gray-500 group-hover:text-primary-600 group-active:text-primary-600"
                  }`}
              >
                <path
                  d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V9C20 9.28333 19.9042 9.51667 19.7125 9.7C19.5208 9.88333 19.2833 9.975 19 9.975C18.7167 9.975 18.4792 9.87917 18.2875 9.6875C18.0958 9.49583 18 9.25833 18 8.975V6H2V17H8.5C8.78333 17 9.02083 17.0958 9.2125 17.2875C9.40417 17.4792 9.5 17.7167 9.5 18C9.5 18.2833 9.40417 18.5208 9.2125 18.7125C9.02083 18.9042 8.78333 19 8.5 19H2ZM8 4H12V2H8V4ZM16 21C14.6167 21 13.4375 20.5125 12.4625 19.5375C11.4875 18.5625 11 17.3833 11 16C11 14.6167 11.4875 13.4375 12.4625 12.4625C13.4375 11.4875 14.6167 11 16 11C17.3833 11 18.5625 11.4875 19.5375 12.4625C20.5125 13.4375 21 14.6167 21 16C21 17.3833 20.5125 18.5625 19.5375 19.5375C18.5625 20.5125 17.3833 21 16 21ZM16.5 15.8V13.5C16.5 13.3667 16.45 13.25 16.35 13.15C16.25 13.05 16.1333 13 16 13C15.8667 13 15.75 13.05 15.65 13.15C15.55 13.25 15.5 13.3667 15.5 13.5V15.775C15.5 15.9083 15.525 16.0375 15.575 16.1625C15.625 16.2875 15.7 16.4 15.8 16.5L17.3 18C17.4 18.1 17.5167 18.15 17.65 18.15C17.7833 18.15 17.9 18.1 18 18C18.1 17.9 18.15 17.7833 18.15 17.65C18.15 17.5167 18.1 17.4 18 17.3L16.5 15.8Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-lg">ติดตามสถานะการสมัคร</span>
            </Link>

            {/* ออกจากระบบ */}
            <button
              onClick={() => {
                setIsMobileProfileOpen(false);
                handleLogout();
              }}
              className="group flex items-center gap-4 py-4 px-8 -mx-8 text-gray-600 hover:bg-red-100 hover:text-red-600 active:bg-red-100 active:text-red-600 transition-colors w-[calc(100%+4rem)]"
            >
              <svg
                className="w-6 h-6 text-gray-500 group-hover:text-red-600 group-active:text-red-600"
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
              <span className="text-lg">ออกจากระบบ</span>
            </button>
          </nav>
        </div>
      )}

      {/* Mobile Notification Full Screen */}
      {isMobileNotificationOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
            <Link
              href="/intern-home"
              onClick={() => setIsMobileNotificationOpen(false)}
            >
              <Image
                src="/images/logo.png"
                alt="PEA Internship Logo"
                width={160}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3">
              {/* Notification Bell (active - click to close) */}
              <button
                onClick={() => setIsMobileNotificationOpen(false)}
                className="relative p-2 text-primary-600 transition-colors"
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
              {/* Profile Icon */}
              <button
                onClick={() => {
                  setIsMobileNotificationOpen(false);
                  setIsMobileProfileOpen(true);
                }}
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
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
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {/* Hamburger Icon */}
              <button
                onClick={() => {
                  setIsMobileNotificationOpen(false);
                  setIsMobileMenuOpen(true);
                }}
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
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
            </div>
          </div>

          {/* Notification Content */}
          <div className="px-4 py-4">
            {/* Notification Header */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-lg font-semibold text-gray-900">
                การแจ้งเตือน
              </span>
              {notifications.length > 0 && (
                <span className="bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>

            {/* Notification Items */}
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.link) {
                        router.push(notification.link);
                      }
                      setIsMobileNotificationOpen(false);
                    }}
                    className={`rounded-lg px-4 py-3 cursor-pointer transition-colors ${!notification.isRead ? 'bg-primary-100 hover:bg-primary-150' : 'bg-primary-50 hover:bg-primary-100'}`}
                  >
                    <p className="text-gray-900 text-sm">
                      {notification.message}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  ไม่มีการแจ้งเตือน
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
