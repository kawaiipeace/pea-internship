"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import VideoLoading from "@/components/ui/VideoLoading";
import { authApi } from "@/services/api";

function OwnerLoginContent() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("sessionExpired") === "1";
  const [showExpiredMsg, setShowExpiredMsg] = useState(sessionExpired);

  // Auto-redirect to Keycloak SSO (browser navigation, not AJAX)
  useEffect(() => {
    if (showExpiredMsg) {
      // แสดงข้อความ session หมดเวลาก่อน redirect
      const timer = setTimeout(() => {
        setShowExpiredMsg(false);
        window.location.href = authApi.signInKeycloak();
      }, 3000);
      return () => clearTimeout(timer);
    }
    window.location.href = authApi.signInKeycloak();
  }, [showExpiredMsg]);

  if (showExpiredMsg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">เซสชันหมดอายุ</h2>
          <p className="text-gray-500 mb-4 whitespace-nowrap">เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VideoLoading message="กำลังเชื่อมต่อระบบ SSO..." />
    </div>
  );
}

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"><VideoLoading message="กำลังโหลด..." /></div>}>
      <OwnerLoginContent />
    </Suspense>
  );
}
