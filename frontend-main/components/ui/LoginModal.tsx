"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, authStorage } from "@/services/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  pendingBookmarkJobId?: string | null;
}

export default function LoginModal({ isOpen, onClose, redirectTo = "/intern-home", pendingBookmarkJobId }: LoginModalProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ phone?: boolean; password?: boolean }>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Error icon component
  const ErrorIcon = () => (
    <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );

  const validatePhone = (value: string): string | undefined => {
    if (!value.trim()) return "ระบุเบอร์โทรศัพท์";
    if (!/^[0-9]{9,10}$/.test(value.replace(/[-\s]/g, ""))) return "รูปแบบเบอร์โทรไม่ถูกต้อง";
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value.trim()) return "ระบุรหัสผ่าน";
    return undefined;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setLoginError(null); // Clear login error when typing
    if (touched.phone) {
      setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setLoginError(null); // Clear login error when typing
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleBlur = (field: "phone" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "phone") {
      setErrors((prev) => ({ ...prev, phone: validatePhone(phone) }));
    } else {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);
    
    setTouched({ phone: true, password: true });
    setErrors({ phone: phoneError, password: passwordError });
    setLoginError(null);
    
    if (!phoneError && !passwordError) {
      setIsLoading(true);
      
      try {
        // เรียก API login จริง
        await authApi.loginIntern({
          phoneNumber: phone,
          password: password,
        });
        
        // ดึง session หลัง login สำเร็จ เพื่อเก็บข้อมูล user
        try {
          const session = await authApi.getSession();
          if (session?.user) {
            authStorage.setUser(session.user);
          } else {
            // ถ้าดึง session ไม่ได้ ให้เก็บข้อมูลพื้นฐานไว้ก่อน
            authStorage.setUser({
              id: "temp",
              phoneNumber: phone,
              roleId: 3, // intern role
            } as any);
          }
        } catch {
          // ถ้า getSession fail ให้เก็บข้อมูลพื้นฐานไว้ก่อน
          authStorage.setUser({
            id: "temp",
            phoneNumber: phone,
            roleId: 3, // intern role
          } as any);
        }
        
        // Login สำเร็จ
        console.log("Login สำเร็จ");
        
        // ถ้ามี pending bookmark ให้เพิ่มใน favorites
        if (pendingBookmarkJobId) {
          const savedFavorites = localStorage.getItem("favorites");
          const currentFavorites: string[] = savedFavorites ? JSON.parse(savedFavorites) : [];
          if (!currentFavorites.includes(pendingBookmarkJobId)) {
            const newFavorites = [...currentFavorites, pendingBookmarkJobId];
            localStorage.setItem("favorites", JSON.stringify(newFavorites));
          }
        }
        
        onClose();
        router.push(redirectTo);
      } catch (error: unknown) {
        console.error("Login error:", error);
        // แสดง error message
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { message?: string } } };
          setLoginError(axiosError.response?.data?.message || "เบอร์โทรศัพท์หรือรหัสผ่าน ไม่ถูกต้อง กรุณาระบุข้อมูลอีกครั้ง");
        } else {
          setLoginError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const hasError = (field: "phone" | "password") => touched[field] && errors[field];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-1">
            เข้าสู่ระบบผู้สมัคร
          </h2>
          <p className="text-gray-500 text-sm">
            กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Input */}
          <div>
            <label className={`block font-semibold mb-2 text-sm ${hasError("phone") || loginError ? "text-red-500" : "text-gray-800"}`}>
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              placeholder="เบอร์โทรศัพท์"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => handleBlur("phone")}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                hasError("phone") || loginError
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-[#A80689]"
              }`}
            />
            {hasError("phone") && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <ErrorIcon />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className={`block font-semibold mb-2 text-sm ${hasError("password") || loginError ? "text-red-500" : "text-gray-800"}`}>
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => handleBlur("password")}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors pr-12 ${
                  hasError("password") || loginError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-[#A80689]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
            {hasError("password") && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <ErrorIcon />
                {errors.password}
              </p>
            )}
          </div>

          {/* Login Error Message */}
          {loginError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <ErrorIcon />
              {loginError}
            </p>
          )}

          {/* Forgot Password */}
          <div className="text-left">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/forgot-password");
              }}
              className="text-[#A80689] text-sm hover:underline cursor-pointer active:underline"
            >
              ลืมรหัสผ่าน
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#A80689] text-white rounded-lg font-medium hover:bg-[#8a056f] transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          {/* Register Link */}
          <div className="text-center text-sm text-gray-600">
            ยังไม่มีบัญชีใช่หรือไม่?{" "}
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/register");
              }}
              className="text-[#A80689] font-medium hover:underline cursor-pointer active:underline"
            >
              ลงทะเบียนที่นี่
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
