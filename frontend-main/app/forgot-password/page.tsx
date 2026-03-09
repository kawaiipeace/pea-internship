"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "../components";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{
    phone?: string;
    email?: string;
    general?: string;
  }>({});
  const [touched, setTouched] = useState<{
    phone?: boolean;
    email?: boolean;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!phone.trim()) {
      newErrors.phone = "ระบุเบอร์โทรศัพท์";
    }

    if (!email.trim()) {
      newErrors.email = "ระบุอีเมล";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ phone: true, email: true });

    if (validateForm()) {
      // Navigate to reset password page
      router.push("/reset-password");
    }
  };

  const handleBlur = (field: "phone" | "email") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const hasPhoneError = touched.phone && (errors.phone || errors.general);
  const hasEmailError = touched.email && (errors.email || errors.general);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            เปลี่ยนรหัสผ่าน
          </h1>
          <p className="text-gray-500 mb-6">กรุณากรอกข้อมูลเพื่อยืนยันตัวตน</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className={`block text-sm font-medium mb-2 ${
                  hasPhoneError ? "text-red-500" : "text-gray-700"
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
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  hasPhoneError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-500"
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

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${
                  hasEmailError ? "text-red-500" : "text-gray-700"
                }`}
              >
                อีเมล
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="อีเมล"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  hasEmailError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-500"
                }`}
              />
              {touched.email && errors.email && (
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
                  <span className="text-sm text-red-500">{errors.email}</span>
                </div>
              )}
            </div>

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

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/login/intern"
                className="flex-1 py-3 border-2 border-primary-600 text-primary-600 rounded-xl font-medium hover:bg-primary-600 hover:text-white transition-colors text-center cursor-pointer"
              >
                ย้อนกลับ
              </Link>
              <button
                type="submit"
                className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors cursor-pointer"
              >
                ยืนยัน
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
