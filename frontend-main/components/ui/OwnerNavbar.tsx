"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  authApi,
  authStorage,
  userApi,
  notificationApi,
  type NotificationItem,
} from "@/services/api";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import NotificationStatusIcon, {
  detectNotificationTone,
} from "@/components/ui/NotificationStatusIcon";
import VideoLoading from "@/components/ui/VideoLoading";

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

export default function OwnerNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState(() => {
    const u = authStorage.getUser();
    return u ? (`${u.fname || ""} ${u.lname || ""}`.trim() || u.username || "-") : "";
  });
  const [displayEmail, setDisplayEmail] = useState(() => authStorage.getUser()?.email || "");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isClearAllConfirm, setIsClearAllConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [userRoleId, setUserRoleId] = useState<number | null>(() => authStorage.getUser()?.roleId ?? null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  // Load user display name on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await userApi.getUserProfile();
        if (profile) {
          setDisplayName(
            `${profile.fname || ""} ${profile.lname || ""}`.trim() ||
            profile.username ||
            "-",
          );
          setDisplayEmail(profile.email || "-");
          setUserRoleId(profile.roleId);
        }
      } catch {
        const stored = authStorage.getUser();
        if (stored) {
          setDisplayName(
            `${stored.fname || ""} ${stored.lname || ""}`.trim() ||
            stored.username ||
            "-",
          );
          setDisplayEmail(stored.email || "-");
          setUserRoleId(stored.roleId);
        }
      }
    };
    loadUser();
  }, []);

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
      if (
        helpRef.current &&
        !helpRef.current.contains(event.target as Node)
      ) {
        setShowHelp(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle bell click — toggle dropdown and mark all as read
  const handleBellClick = async () => {
    setShowNotifications((prev) => !prev);
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
  };

  // Mark single notification as read
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await notificationApi.markAsRead(notif.id, true);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    }
    setShowNotifications(false);
    router.push("/owner/announcements");
  };

  const handleDeleteNotification = async () => {
    if (pendingDeleteId === null) return;

    try {
      await notificationApi.deleteNotification(pendingDeleteId);
      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === pendingDeleteId);
        if (removed && !removed.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== pendingDeleteId);
      });
      setToastMessage("ลบการแจ้งเตือนสำเร็จ");
      setToastType("success");
      setShowToast(true);
    } catch (err) {
      setToastMessage("ลบการแจ้งเตือนไม่สำเร็จ");
      setToastType("error");
      setShowToast(true);
    } finally {
      setShowDeleteConfirm(false);
      setPendingDeleteId(null);
    }
  };

  const requestDeleteNotification = (notificationId: number) => {
    setIsClearAllConfirm(false);
    setPendingDeleteId(notificationId);
    setShowDeleteConfirm(true);
  };

  const requestClearAllNotifications = () => {
    if (notifications.length === 0) return;
    setIsClearAllConfirm(true);
    setPendingDeleteId(null);
    setShowDeleteConfirm(true);
  };

  const handleClearAllNotifications = async () => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) {
      setShowDeleteConfirm(false);
      setIsClearAllConfirm(false);
      return;
    }

    const results = await Promise.allSettled(
      ids.map(async (id) => {
        await notificationApi.deleteNotification(id);
        return id;
      }),
    );

    const failedIds = results
      .map((result, index) =>
        result.status === "rejected" ? ids[index] : null,
      )
      .filter((id): id is number => id !== null);

    const successCount = ids.length - failedIds.length;

    setNotifications((prev) => prev.filter((n) => failedIds.includes(n.id)));
    setUnreadCount((prev) => Math.max(0, prev - successCount));

    if (failedIds.length === 0) {
      setToastMessage("ลบการแจ้งเตือนทั้งหมดสำเร็จ");
      setToastType("success");
    } else if (successCount > 0) {
      setToastMessage("ลบบางรายการสำเร็จ แต่บางรายการไม่สำเร็จ");
      setToastType("info");
    } else {
      setToastMessage("ลบการแจ้งเตือนทั้งหมดไม่สำเร็จ");
      setToastType("error");
    }

    setShowToast(true);
    setShowDeleteConfirm(false);
    setIsClearAllConfirm(false);
    setPendingDeleteId(null);
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/owner/announcements" className="flex items-center">
              <Image
                src="/images/logo.png"
                alt="PEA Internship Logo"
                width={195}
                height={112}
                style={{ width: "auto", height: "3rem" }}
                priority
              />
            </Link>

            {/* Right side - Navigation Links + notifications and profile */}
            <div className="flex items-center gap-6">
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/owner/announcements"
                  className={`font-medium transition-colors ${pathname === "/owner/announcements" ||
                    pathname?.startsWith("/owner/announcements/")
                    ? "text-primary-600 hover:text-primary-700"
                    : "text-gray-600 hover:text-primary-600"
                    }`}
                >
                  ประกาศที่เปิดรับสมัคร
                </Link>
                <Link
                  href="/owner/dashboard"
                  className={`font-medium transition-colors ${pathname === "/owner/dashboard"
                    ? "text-primary-600 hover:text-primary-700"
                    : "text-gray-600 hover:text-primary-600"
                    }`}
                >
                  แดชบอร์ด
                </Link>
                {/* Help Dropdown */}
                <div className="relative" ref={helpRef}>
                  <button
                    onClick={() => {
                      setShowHelp((prev) => !prev);
                      setShowNotifications(false);
                      setShowProfile(false);
                    }}
                    className={`flex items-center gap-1 font-medium transition-colors ${pathname === "/owner/faqs" || pathname?.startsWith("/guide/owner")
                      ? "text-primary-600 hover:text-primary-700"
                      : "text-gray-600 hover:text-primary-600"
                      }`}
                  >
                    ช่วยเหลือ
                    <svg
                      className={`w-4 h-4 transition-transform ${showHelp ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showHelp && (
                    <div className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                      <Link
                        href="/owner/faqs"
                        onClick={() => setShowHelp(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${pathname === "/owner/faqs"
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        FAQs
                      </Link>
                      <Link
                        href="/guide/owner"
                        onClick={() => setShowHelp(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${pathname?.startsWith("/guide/owner")
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        คู่มือการใช้งาน
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Role Switch Button - only for roleId=1 */}
              {userRoleId === 1 && (
                <button
                  onClick={() => {
                    setIsSwitchingRole(true);
                    setTimeout(() => {
                      router.push("/admin/applications");
                    }, 1000);
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 border-2 border-primary-600 text-primary-600 rounded-full font-medium hover:bg-primary-600 hover:text-white transition-all text-sm cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Owner
                </button>
              )}

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={handleBellClick}
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
                      {unreadCount}
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
                      <div className="ml-auto flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={requestClearAllNotifications}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            ลบทั้งหมด
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <span className="bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notification Items */}
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">
                          ไม่มีการแจ้งเตือน
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`relative px-4 py-3 pr-14 hover:bg-primary-50 cursor-pointer ${!notif.isRead ? "bg-primary-50/50" : ""
                              }`}
                          >
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                requestDeleteNotification(notif.id);
                              }}
                              aria-label="ลบการแจ้งเตือน"
                              className="absolute right-3 top-3 h-5 w-5 rounded-full text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600"
                            >
                              X
                            </button>
                            <div className="flex items-start gap-2">
                              <NotificationStatusIcon
                                tone={detectNotificationTone(
                                  notif.title,
                                  notif.message,
                                )}
                                className="mt-0.5 shrink-0"
                              />
                              <div>
                                <p className="text-gray-900 text-sm font-medium">
                                  {notif.title}
                                </p>
                                <p className="text-gray-600 text-xs mt-0.5">
                                  {notif.message}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  {relativeTime(notif.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
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
                  className="flex items-center gap-2 p-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <div className="w-9 h-9 flex items-center justify-center transition-colors hover:text-primary-600 active:text-primary-600 cursor-pointer">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_4097_4838)">
                        <path
                          d="M5.85 17.1C6.7 16.45 7.65 15.9375 8.7 15.5625C9.75 15.1875 10.85 15 12 15C13.15 15 14.25 15.1875 15.3 15.5625C16.35 15.9375 17.3 16.45 18.15 17.1C18.7333 16.4167 19.1875 15.6417 19.5125 14.775C19.8375 13.9083 20 12.9833 20 12C20 9.78333 19.2208 7.89583 17.6625 6.3375C16.1042 4.77917 14.2167 4 12 4C9.78333 4 7.89583 4.77917 6.3375 6.3375C4.77917 7.89583 4 9.78333 4 12C4 12.9833 4.1625 13.9083 4.4875 14.775C4.8125 15.6417 5.26667 16.4167 5.85 17.1ZM12 13C11.0167 13 10.1875 12.6625 9.5125 11.9875C8.8375 11.3125 8.5 10.4833 8.5 9.5C8.5 8.51667 8.8375 7.6875 9.5125 7.0125C10.1875 6.3375 11.0167 6 12 6C12.9833 6 13.8125 6.3375 14.4875 7.0125C15.1625 7.6875 15.5 8.51667 15.5 9.5C15.5 10.4833 15.1625 11.3125 14.4875 11.9875C13.8125 12.6625 12.9833 13 12 13ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C12.8833 20 13.7167 19.8708 14.5 19.6125C15.2833 19.3542 16 18.9833 16.65 18.5C16 18.0167 15.2833 17.6458 14.5 17.3875C13.7167 17.1292 12.8833 17 12 17C11.1167 17 10.2833 17.1292 9.5 17.3875C8.71667 17.6458 8 18.0167 7.35 18.5C8 18.9833 8.71667 19.3542 9.5 19.6125C10.2833 19.8708 11.1167 20 12 20ZM12 11C12.4333 11 12.7917 10.8583 13.075 10.575C13.3583 10.2917 13.5 9.93333 13.5 9.5C13.5 9.06667 13.3583 8.70833 13.075 8.425C12.7917 8.14167 12.4333 8 12 8C11.5667 8 11.2083 8.14167 10.925 8.425C10.6417 8.70833 10.5 9.06667 10.5 9.5C10.5 9.93333 10.6417 10.2917 10.925 10.575C11.2083 10.8583 11.5667 11 12 11Z"
                          fill=""
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_4097_4838">
                          <rect width="26" height="26" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border-2 border-primary-600 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">
                        {displayName || "..."}
                      </p>
                      <p className="text-xs text-gray-500">
                        {displayEmail || "-"}
                      </p>
                    </div>
                    <a
                      href="https://forms.gle/BvqQv8VwzYDDux2Z7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer border-t border-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      แจ้งปัญหาการใช้งาน
                    </a>
                    <button
                      onClick={async () => {
                        setShowProfile(false);
                        try {
                          await authApi.signOut();
                        } catch (error) {
                          console.error("Logout API error:", error);
                        } finally {
                          authStorage.clearAuth();
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

        <Toast
          message={toastMessage}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
          type={toastType}
        />

        <ConfirmModal
          isOpen={showDeleteConfirm}
          title={
            isClearAllConfirm ? "ยืนยันการลบทั้งหมด" : "ยืนยันการลบการแจ้งเตือน"
          }
          message={
            isClearAllConfirm
              ? "คุณต้องการลบการแจ้งเตือนทั้งหมดใช่หรือไม่"
              : "คุณต้องการลบการแจ้งเตือนนี้ใช่หรือไม่"
          }
          confirmText={isClearAllConfirm ? "Clear all" : "ลบ"}
          cancelText="ยกเลิก"
          onConfirm={
            isClearAllConfirm
              ? handleClearAllNotifications
              : handleDeleteNotification
          }
          onCancel={() => {
            setShowDeleteConfirm(false);
            setIsClearAllConfirm(false);
            setPendingDeleteId(null);
          }}
        />
      </nav>

      {/* Role switching loading overlay */}
      {isSwitchingRole && (
        <VideoLoading message="กำลังสลับบทบาท..." fullScreen />
      )}
    </>
  );
}
