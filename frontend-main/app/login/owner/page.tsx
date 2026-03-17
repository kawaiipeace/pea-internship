"use client";

import { useEffect } from "react";
import VideoLoading from "@/components/ui/VideoLoading";
import { authApi } from "@/services/api";

export default function OwnerLoginPage() {
  // Auto-redirect to Keycloak SSO
  useEffect(() => {
    const redirect = async () => {
      try {
        const url = await authApi.signInKeycloak();
        window.location.href = url;
      } catch {
        alert("ไม่สามารถเชื่อมต่อระบบ SSO ได้ กรุณาลองใหม่อีกครั้ง");
      }
    };
    redirect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <VideoLoading message="กำลังเชื่อมต่อระบบ SSO..." />
    </div>
  );
}
