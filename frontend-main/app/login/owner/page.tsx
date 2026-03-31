"use client";

import { useEffect } from "react";
import VideoLoading from "@/components/ui/VideoLoading";
import { authApi } from "@/services/api";

export default function OwnerLoginPage() {
  // Auto-redirect to Keycloak SSO (browser navigation, not AJAX)
  useEffect(() => {
    window.location.href = authApi.signInKeycloak();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <VideoLoading message="กำลังเชื่อมต่อระบบ SSO..." />
    </div>
  );
}
