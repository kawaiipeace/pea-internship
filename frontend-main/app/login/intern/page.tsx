"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/ui/Navbar";
import { authApi, authStorage } from "../../services/api";

export default function InternLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    password?: string;
    general?: string;
  }>({});
  const [touched, setTouched] = useState<{
    phone?: boolean;
    password?: boolean;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!phone.trim()) {
      newErrors.phone = "ระบุเบอร์โทรศัพท์";
    }

    if (!password.trim()) {
      newErrors.password = "ระบุรหัสผ่าน";
    } else if (password.length < 8) {
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ phone: true, password: true });
    setErrors({});

    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await authApi.loginIntern({
          phoneNumber: phone.replace(/[-\s]/g, ""),
          password: password,
        });

        // ตรวจสอบ role - ต้องเป็น student (role_id = 3) เท่านั้น
        if (response.user && response.user.roleId !== 3) {
          // ลบ session ที่ backend สร้างไว้ เพราะ role ไม่ตรง
          try {
            await authApi.signOut();
          } catch {
            // ignore signout error
          }
          authStorage.clearAuth();
          setErrors({
            general: "บัญชีนี้ไม่ใช่บัญชีนักศึกษา กรุณาใช้หน้าเข้าสู่ระบบที่ถูกต้อง",
          });
          return;
        }

        // บันทึก token และข้อมูล user
        authStorage.setToken(response.token);
        authStorage.setUser(response.user);
        // Set user_role cookie สำหรับ middleware
        document.cookie = `user_role=intern; path=/; max-age=86400`;

        console.log("Login สำเร็จ:", response.user);
        // Redirect to intern home page
        router.push("/intern-home");
      } catch (error: unknown) {
        console.error("Login error:", error);
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
          if (axiosError.response?.status === 401 || axiosError.response?.status === 400) {
            setErrors({
              general: "เบอร์โทรศัพท์หรือรหัสผ่าน ไม่ถูกต้อง กรุณาระบุข้อมูลอีกครั้ง",
            });
          } else {
            setErrors({
              general: axiosError.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
            });
          }
        } else {
          setErrors({
            general: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBlur = (field: "phone" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const hasPhoneError = touched.phone && (errors.phone || errors.general);
  const hasPasswordError =
    touched.password && (errors.password || errors.general);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            เข้าสู่ระบบผู้สมัคร
          </h1>
          <p className="text-gray-500 mb-6">กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className={`block text-sm font-medium mb-2 ${hasPhoneError ? "text-red-500" : "text-gray-700"
                  }`}
              >
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur("phone")}
                placeholder="เบอร์โทรศัพท์"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${hasPhoneError
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-200 focus:border-primary-600"
                  }`}
              />
              {touched.phone && errors.phone && (
                <div className="mt-2 flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.00016 11.3333C8.18905 11.3333 8.34738 11.2694 8.47516 11.1416C8.60294 11.0139 8.66683 10.8555 8.66683 10.6666V7.99998C8.66683 7.81109 8.60294 7.65276 8.47516 7.52498C8.34738 7.3972 8.18905 7.33331 8.00016 7.33331C7.81127 7.33331 7.65294 7.3972 7.52516 7.52498C7.39738 7.65276 7.3335 7.81109 7.3335 7.99998V10.6666C7.3335 10.8555 7.39738 11.0139 7.52516 11.1416C7.65294 11.2694 7.81127 11.3333 8.00016 11.3333ZM8.00016 5.99998C8.18905 5.99998 8.34738 5.93609 8.47516 5.80831C8.60294 5.68053 8.66683 5.5222 8.66683 5.33331C8.66683 5.14442 8.60294 4.98609 8.47516 4.85831C8.34738 4.73054 8.18905 4.66665 8.00016 4.66665C7.81127 4.66665 7.65294 4.73054 7.52516 4.85831C7.39738 4.98609 7.3335 5.14442 7.3335 5.33331C7.3335 5.5222 7.39738 5.68053 7.52516 5.80831C7.65294 5.93609 7.81127 5.99998 8.00016 5.99998ZM8.00016 14.6666C7.07794 14.6666 6.21127 14.4916 5.40016 14.1416C4.58905 13.7916 3.8835 13.3166 3.2835 12.7166C2.6835 12.1166 2.2085 11.4111 1.8585 10.6C1.5085 9.78887 1.3335 8.9222 1.3335 7.99998C1.3335 7.07776 1.5085 6.21109 1.8585 5.39998C2.2085 4.58887 2.6835 3.88331 3.2835 3.28331C3.8835 2.68331 4.58905 2.20831 5.40016 1.85831C6.21127 1.50831 7.07794 1.33331 8.00016 1.33331C8.92238 1.33331 9.78905 1.50831 10.6002 1.85831C11.4113 2.20831 12.1168 2.68331 12.7168 3.28331C13.3168 3.88331 13.7918 4.58887 14.1418 5.39998C14.4918 6.21109 14.6668 7.07776 14.6668 7.99998C14.6668 8.9222 14.4918 9.78887 14.1418 10.6C13.7918 11.4111 13.3168 12.1166 12.7168 12.7166C12.1168 13.3166 11.4113 13.7916 10.6002 14.1416C9.78905 14.4916 8.92238 14.6666 8.00016 14.6666Z"
                      fill="#F04438"
                    />
                  </svg>
                  <span className="text-sm text-red-500">{errors.phone}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 ${hasPasswordError ? "text-red-500" : "text-gray-700"
                  }`}
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="รหัสผ่าน"
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors ${hasPasswordError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-600"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {touched.password && errors.password && !errors.general && (
                <div className="mt-2 flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.00016 11.3333C8.18905 11.3333 8.34738 11.2694 8.47516 11.1416C8.60294 11.0139 8.66683 10.8555 8.66683 10.6666V7.99998C8.66683 7.81109 8.60294 7.65276 8.47516 7.52498C8.34738 7.3972 8.18905 7.33331 8.00016 7.33331C7.81127 7.33331 7.65294 7.3972 7.52516 7.52498C7.39738 7.65276 7.3335 7.81109 7.3335 7.99998V10.6666C7.3335 10.8555 7.39738 11.0139 7.52516 11.1416C7.65294 11.2694 7.81127 11.3333 8.00016 11.3333ZM8.00016 5.99998C8.18905 5.99998 8.34738 5.93609 8.47516 5.80831C8.60294 5.68053 8.66683 5.5222 8.66683 5.33331C8.66683 5.14442 8.60294 4.98609 8.47516 4.85831C8.34738 4.73054 8.18905 4.66665 8.00016 4.66665C7.81127 4.66665 7.65294 4.73054 7.52516 4.85831C7.39738 4.98609 7.3335 5.14442 7.3335 5.33331C7.3335 5.5222 7.39738 5.68053 7.52516 5.80831C7.65294 5.93609 7.81127 5.99998 8.00016 5.99998ZM8.00016 14.6666C7.07794 14.6666 6.21127 14.4916 5.40016 14.1416C4.58905 13.7916 3.8835 13.3166 3.2835 12.7166C2.6835 12.1166 2.2085 11.4111 1.8585 10.6C1.5085 9.78887 1.3335 8.9222 1.3335 7.99998C1.3335 7.07776 1.5085 6.21109 1.8585 5.39998C2.2085 4.58887 2.6835 3.88331 3.2835 3.28331C3.8835 2.68331 4.58905 2.20831 5.40016 1.85831C6.21127 1.50831 7.07794 1.33331 8.00016 1.33331C8.92238 1.33331 9.78905 1.50831 10.6002 1.85831C11.4113 2.20831 12.1168 2.68331 12.7168 3.28331C13.3168 3.88331 13.7918 4.58887 14.1418 5.39998C14.4918 6.21109 14.6668 7.07776 14.6668 7.99998C14.6668 8.9222 14.4918 9.78887 14.1418 10.6C13.7918 11.4111 13.3168 12.1166 12.7168 12.7166C12.1168 13.3166 11.4113 13.7916 10.6002 14.1416C9.78905 14.4916 8.92238 14.6666 8.00016 14.6666Z"
                      fill="#F04438"
                    />
                  </svg>
                  <span className="text-sm text-red-500">
                    {errors.password}
                  </span>
                </div>
              )}
              {errors.general && (
                <div className="mt-2 flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.00016 11.3333C8.18905 11.3333 8.34738 11.2694 8.47516 11.1416C8.60294 11.0139 8.66683 10.8555 8.66683 10.6666V7.99998C8.66683 7.81109 8.60294 7.65276 8.47516 7.52498C8.34738 7.3972 8.18905 7.33331 8.00016 7.33331C7.81127 7.33331 7.65294 7.3972 7.52516 7.52498C7.39738 7.65276 7.3335 7.81109 7.3335 7.99998V10.6666C7.3335 10.8555 7.39738 11.0139 7.52516 11.1416C7.65294 11.2694 7.81127 11.3333 8.00016 11.3333ZM8.00016 5.99998C8.18905 5.99998 8.34738 5.93609 8.47516 5.80831C8.60294 5.68053 8.66683 5.5222 8.66683 5.33331C8.66683 5.14442 8.60294 4.98609 8.47516 4.85831C8.34738 4.73054 8.18905 4.66665 8.00016 4.66665C7.81127 4.66665 7.65294 4.73054 7.52516 4.85831C7.39738 4.98609 7.3335 5.14442 7.3335 5.33331C7.3335 5.5222 7.39738 5.68053 7.52516 5.80831C7.65294 5.93609 7.81127 5.99998 8.00016 5.99998ZM8.00016 14.6666C7.07794 14.6666 6.21127 14.4916 5.40016 14.1416C4.58905 13.7916 3.8835 13.3166 3.2835 12.7166C2.6835 12.1166 2.2085 11.4111 1.8585 10.6C1.5085 9.78887 1.3335 8.9222 1.3335 7.99998C1.3335 7.07776 1.5085 6.21109 1.8585 5.39998C2.2085 4.58887 2.6835 3.88331 3.2835 3.28331C3.8835 2.68331 4.58905 2.20831 5.40016 1.85831C6.21127 1.50831 7.07794 1.33331 8.00016 1.33331C8.92238 1.33331 9.78905 1.50831 10.6002 1.85831C11.4113 2.20831 12.1168 2.68331 12.7168 3.28331C13.3168 3.88331 13.7918 4.58887 14.1418 5.39998C14.4918 6.21109 14.6668 7.07776 14.6668 7.99998C14.6668 8.9222 14.4918 9.78887 14.1418 10.6C13.7918 11.4111 13.3168 12.1166 12.7168 12.7166C12.1168 13.3166 11.4113 13.7916 10.6002 14.1416C9.78905 14.4916 8.92238 14.6666 8.00016 14.6666Z"
                      fill="#F04438"
                    />
                  </svg>
                  <span className="text-sm text-red-500">{errors.general}</span>
                </div>
              )}
            </div>

            {/* Forgot Password Link */}
            <div>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline active:text-primary-800 active:underline"
              >
                ลืมรหัสผ่าน
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 border-1 border-primary-700 bg-primary-600 text-white rounded-xl font-medium transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700 active:bg-white active:text-primary-700 active:border-1 active:border-primary-700 active:scale-[0.98] cursor-pointer'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>

            {/* Register Link */}
            <p className="text-center text-gray-600 text-sm">
              ยังไม่มีบัญชีใช่หรือไม่?{" "}
              <Link
                href="/register"
                className="text-primary-600 hover:text-primary-700 hover:underline active:text-primary-800 active:underline"
              >
                ลงทะเบียนที่นี่
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
