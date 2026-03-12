"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VideoLoading from "../../../components/ui/VideoLoading";
import { authApi, authStorage } from "../../../services/api";

export default function KeycloakCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Better Auth จะ set session cookie ให้แล้ว
        // ดึง session จาก backend เพื่อเอาข้อมูล user
        const session = await authApi.getSession();

        if (!session?.user) {
          setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
          return;
        }

        // ตรวจสอบ role - ต้องเป็น admin (role_id = 1) หรือ owner (role_id = 2)
        const allowedRoleIds = [1, 2];
        if (!allowedRoleIds.includes(session.user.roleId)) {
          try {
            await authApi.signOut();
          } catch {
            // ignore signout error
          }
          authStorage.clearAuth();
          setError("บัญชีนี้ไม่ใช่บัญชีพนักงาน กรุณาใช้หน้าเข้าสู่ระบบที่ถูกต้อง");
          return;
        }

        // บันทึก user ลง storage
        authStorage.setUser(session.user);

        // กำหนด role และ redirect ตาม roleId
        const roleMap: Record<number, { role: string; redirect: string }> = {
          1: { role: "admin", redirect: "/admin/applications" },
          2: { role: "owner", redirect: "/owner/announcements" },
        };
        const { role, redirect } = roleMap[session.user.roleId];

        // Set auth cookies สำหรับ middleware
        document.cookie = `auth_token=${session.user.id}; path=/; max-age=86400`;
        document.cookie = `user_role=${role}; path=/; max-age=86400`;

        // Redirect ไปหน้า dashboard ตาม role
        router.push(redirect);
      } catch (err) {
        console.error("Keycloak callback error:", err);
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">เข้าสู่ระบบไม่สำเร็จ</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login/owner")}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors cursor-pointer"
          >
            กลับหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VideoLoading message="กำลังเข้าสู่ระบบ..." />
    </div>
  );
}
