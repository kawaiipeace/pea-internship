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

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
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
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [userRoleId, setUserRoleId] = useState<number | null>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load user profile on mount
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

  // Handle role switch (Admin -> Owner)
  const handleSwitchToOwner = () => {
    setIsSwitchingRole(true);
    // Update user_role cookie to owner
    document.cookie = `user_role=owner; path=/; max-age=86400`;
    // Short delay for loading animation
    setTimeout(() => {
      router.push("/owner/announcements");
    }, 1000);
  };

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
            <Link href="/admin/applications" className="flex items-center">
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
                  href="/admin/applications"
                  className={`font-medium transition-colors ${isActiveLink("/admin/applications")
                      ? "text-primary-600 hover:text-primary-700"
                      : "text-gray-600 hover:text-primary-600"
                    }`}
                >
                  ลิสต์รายการสมัคร
                </Link>
                <Link
                  href="/admin/dashboard"
                  className={`font-medium transition-colors ${isActiveLink("/admin/dashboard")
                      ? "text-primary-600 hover:text-primary-700"
                      : "text-gray-600 hover:text-primary-600"
                    }`}
                >
                  แดชบอร์ด
                </Link>
              </div>

              {/* Role Switch Button - only for roleId=1 */}
              {userRoleId === 1 && (
                <button
                  onClick={handleSwitchToOwner}
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
                  Admin
                </button>
              )}

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={async () => {
                    setShowNotifications(!showNotifications);
                    setShowProfile(false);
                    if (unreadCount > 0) {
                      try {
                        await notificationApi.markAllAsRead();
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, isRead: true })),
                        );
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
                      <div className="ml-auto flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={requestClearAllNotifications}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            ลบทั้งหมด
                          </button>
                        )}
                      </div>
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
                                  await notificationApi.markAsRead(
                                    notif.id,
                                    true,
                                  );
                                  setNotifications((prev) =>
                                    prev.map((n) =>
                                      n.id === notif.id
                                        ? { ...n, isRead: true }
                                        : n,
                                    ),
                                  );
                                  setUnreadCount((prev) =>
                                    Math.max(0, prev - 1),
                                  );
                                } catch (err) {
                                  console.error("Failed to mark as read:", err);
                                }
                              }
                              setShowNotifications(false);
                              router.push("/admin/applications");
                            }}
                            className={`relative px-4 py-3 pr-14 hover:bg-gray-50 cursor-pointer ${!notif.isRead ? "bg-primary-50/50" : ""}`}
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
                                className="mt-1 shrink-0"
                              />
                              <div>
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
                            </div>
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
                      <p className="text-sm font-medium text-gray-800">
                        {displayName || "แอดมิน"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {displayEmail || "admin@pea.co.th"}
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
