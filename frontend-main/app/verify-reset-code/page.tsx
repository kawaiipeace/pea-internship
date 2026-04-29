"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NavbarPublic from "@/components/ui/NavbarPublic";
import { authApi } from "@/services/api";

export default function VerifyResetCodePage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ดึง phone/email ที่ส่งมาจากหน้า forgot-password
  const phone =
    typeof window !== "undefined"
      ? sessionStorage.getItem("reset_phone") ?? ""
      : "";
  const email =
    typeof window !== "undefined"
      ? sessionStorage.getItem("reset_email") ?? ""
      : "";

  // redirect กลับถ้าไม่มีข้อมูล
  useEffect(() => {
    if (!phone || !email) {
      router.replace("/forgot-password");
    }
  }, [phone, email, router]);

  // countdown timer สำหรับปุ่ม ขอรหัสใหม่
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const code = digits.join("");

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => {
      next[i] = c;
    });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError("กรุณากรอกรหัสยืนยัน 6 หลักให้ครบ");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.verifyResetCode({ phoneNumber: phone, email, code });
      sessionStorage.setItem("reset_token", result.resetToken);
      router.push("/reset-password");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "รหัสยืนยันไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
      setError(message);
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      await authApi.requestResetPassword({ phoneNumber: phone, email });
      setResendCooldown(60);
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "ไม่สามารถส่งรหัสใหม่ได้ กรุณาลองอีกครั้ง";
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarPublic />

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ยืนยันรหัส OTP
          </h1>
          <p className="text-gray-500 mb-1">
            กรุณากรอกรหัส 6 หลักที่ส่งไปยังอีเมล
          </p>
          {email && (
            <p className="text-primary-600 font-medium text-sm mb-6 break-all">
              {email}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                รหัสยืนยัน
              </label>
              <div className="flex gap-2 justify-between">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 h-14 text-center text-xl font-semibold border-2 rounded-xl focus:outline-none transition-colors ${
                      error
                        ? "border-red-400 focus:border-red-500"
                        : digit
                        ? "border-primary-500"
                        : "border-gray-200 focus:border-primary-500"
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2">
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
                  <span className="text-sm text-red-500">{error}</span>
                </div>
              )}
            </div>

            {/* Resend */}
            <div className="text-center text-sm text-gray-500">
              ไม่ได้รับรหัส?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="text-primary-600 font-medium hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
              >
                {isResending
                  ? "กำลังส่ง..."
                  : resendCooldown > 0
                  ? `ส่งใหม่ใน ${resendCooldown}s`
                  : "ส่งรหัสใหม่"}
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="flex-1 py-3 border-2 border-primary-600 text-primary-600 rounded-xl font-medium hover:bg-primary-600 hover:text-white transition-colors cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "กำลังยืนยัน..." : "ยืนยัน"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
