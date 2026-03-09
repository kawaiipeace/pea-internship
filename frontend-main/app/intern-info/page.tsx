"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavbarIntern } from "../components";
import VideoLoading from "../components/ui/VideoLoading";
import ThaiDateInput from "../components/ui/ThaiDateInput";
import { applicationApi, userApi, canApplyForNewJob, extractStudentProfile } from "../services/api";

// Thai month names
const thaiMonths = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

// Calculate working days between two dates
const calculateWorkingDays = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let workingDays = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  return workingDays;
};

// Format date to Thai display
const formatDateThai = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

export default function InternInfoPage() {
  const router = useRouter();
  const [skills, setSkills] = useState("");
  const [expectations, setExpectations] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [trainingHours, setTrainingHours] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasActiveApp, setHasActiveApp] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalRedirect, setModalRedirect] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    skills?: string;
    expectations?: string;
    startDate?: string;
    endDate?: string;
    trainingHours?: string;
  }>({});
  const [touched, setTouched] = useState<{
    skills?: boolean;
    expectations?: boolean;
    startDate?: boolean;
    endDate?: boolean;
    trainingHours?: boolean;
  }>({});

  const dateBoxRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dateBoxRef.current &&
        !dateBoxRef.current.contains(event.target as Node) &&
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if user already has an active application
  useEffect(() => {
    const checkActiveApplication = async () => {
      try {
        const app = await applicationApi.getMyLatestApplication();
        if (!canApplyForNewJob(app)) {
          setHasActiveApp(true);
          setModalMessage("คุณมีใบสมัครที่กำลังดำเนินการอยู่แล้ว");
          setModalRedirect("/application-status");
        }
      } catch {
        // Not logged in or API error - allow to proceed
      }
    };
    checkActiveApplication();
  }, [router]);

  // Load user profile to pre-fill dates if available
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userApi.getUserProfile();
        if (profile?.profile) {
          const sp = extractStudentProfile(profile.profile);
          if (sp?.startDate) {
            const sd = new Date(sp.startDate).toISOString().split("T")[0];
            setStartDate(sd);
          }
          if (sp?.endDate) {
            const ed = new Date(sp.endDate).toISOString().split("T")[0];
            setEndDate(ed);
          }
          if (sp?.startDate && sp?.endDate) {
            const sd = new Date(sp.startDate).toISOString().split("T")[0];
            const ed = new Date(sp.endDate).toISOString().split("T")[0];
            const workingDays = calculateWorkingDays(sd, ed);
            setTrainingHours(String(workingDays * 7));
          }
          if (sp?.hours) {
            setTrainingHours(String(Math.round(parseFloat(sp.hours))));
          }
        }
      } catch {
        // Profile load failed
      }
    };
    loadProfile();
  }, []);

  // Update training hours when dates change
  const updateTrainingHours = (start: string, end: string) => {
    if (start && end && start <= end) {
      const workingDays = calculateWorkingDays(start, end);
      setTrainingHours(String(workingDays * 7));
    }
  };

  // Get display text for date range
  const getDateRangeDisplay = (): string => {
    if (startDate && endDate) {
      return `${formatDateThai(startDate)} - ${formatDateThai(endDate)}`;
    }
    if (startDate) {
      return `${formatDateThai(startDate)} - เลือกวันสิ้นสุด`;
    }
    return "ระยะเวลาที่ฝึก";
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!startDate) newErrors.startDate = "จำเป็นต้องระบุวันเริ่มต้น";
    if (!endDate) newErrors.endDate = "จำเป็นต้องระบุวันสิ้นสุด";
    if (startDate && endDate && endDate < startDate) newErrors.endDate = "วันสิ้นสุดต้องมากกว่าวันเริ่มต้น";
    if (!trainingHours.trim()) newErrors.trainingHours = "จำเป็นต้องระบุ";
    if (!skills.trim()) newErrors.skills = "จำเป็นต้องระบุ";
    if (!expectations.trim()) newErrors.expectations = "จำเป็นต้องระบุ";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ skills: true, expectations: true, startDate: true, endDate: true, trainingHours: true });

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const positionId = localStorage.getItem("currentPositionId");
        if (!positionId) {
          alert("ไม่พบข้อมูลตำแหน่งที่สมัคร กรุณาสมัครใหม่อีกครั้ง");
          router.push("/intern-home");
          return;
        }

        // Convert YYYY-MM-DD to ISO 8601
        const isoStartDate = new Date(startDate).toISOString();
        const isoEndDate = new Date(endDate).toISOString();

        const result = await applicationApi.submitInformation(parseInt(positionId), {
          skill: skills,
          expectation: expectations,
          startDate: isoStartDate,
          endDate: isoEndDate,
          hours: parseInt(trainingHours) || 0,
        });

        // Store applicationId for subsequent document uploads
        if (result?.applicationId) {
          localStorage.setItem("currentApplicationId", String(result.applicationId));
        }

        // Also update student profile with new dates & hours
        try {
          await userApi.updateStudentProfile({
            startDate,
            endDate,
            hours: parseInt(trainingHours) || 0,
          });
        } catch {
          // Non-critical - don't block flow
        }

        // Clean up positionId
        localStorage.removeItem("currentPositionId");

        // Navigate to application status page (next step)
        router.push("/application-status");
      } catch (err) {
        console.error("Failed to submit information:", err);
        const error = err as { response?: { data?: { message?: string } } };
        const msg = error?.response?.data?.message || "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง";
        setModalMessage(msg);
        setModalRedirect(null);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const hasError = (field: keyof typeof errors) => touched[field] && errors[field];

  const ErrorIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.00016 11.3333C8.18905 11.3333 8.34738 11.2694 8.47516 11.1416C8.60294 11.0139 8.66683 10.8555 8.66683 10.6666V7.99998C8.66683 7.81109 8.60294 7.65276 8.47516 7.52498C8.34738 7.3972 8.18905 7.33331 8.00016 7.33331C7.81127 7.33331 7.65294 7.3972 7.52516 7.52498C7.39738 7.65276 7.3335 7.81109 7.3335 7.99998V10.6666C7.3335 10.8555 7.39738 11.0139 7.52516 11.1416C7.65294 11.2694 7.81127 11.3333 8.00016 11.3333ZM8.00016 5.99998C8.18905 5.99998 8.34738 5.93609 8.47516 5.80831C8.60294 5.68053 8.66683 5.5222 8.66683 5.33331C8.66683 5.14442 8.60294 4.98609 8.47516 4.85831C8.34738 4.73054 8.18905 4.66665 8.00016 4.66665C7.81127 4.66665 7.65294 4.73054 7.52516 4.85831C7.39738 4.98609 7.3335 5.14442 7.3335 5.33331C7.3335 5.5222 7.39738 5.68053 7.52516 5.80831C7.65294 5.93609 7.81127 5.99998 8.00016 5.99998ZM8.00016 14.6666C7.07794 14.6666 6.21127 14.4916 5.40016 14.1416C4.58905 13.7916 3.8835 13.3166 3.2835 12.7166C2.6835 12.1166 2.2085 11.4111 1.8585 10.6C1.5085 9.78887 1.3335 8.9222 1.3335 7.99998C1.3335 7.07776 1.5085 6.21109 1.8585 5.39998C2.2085 4.58887 2.6835 3.88331 3.2835 3.28331C3.8835 2.68331 4.58905 2.20831 5.40016 1.85831C6.21127 1.50831 7.07794 1.33331 8.00016 1.33331C8.92238 1.33331 9.78905 1.50831 10.6002 1.85831C11.4113 2.20831 12.1168 2.68331 12.7168 3.28331C13.3168 3.88331 13.7918 4.58887 14.1418 5.39998C14.4918 6.21109 14.6668 7.07776 14.6668 7.99998C14.6668 8.9222 14.4918 9.78887 14.1418 10.6C13.7918 11.4111 13.3168 12.1166 12.7168 12.7166C12.1168 13.3166 11.4113 13.7916 10.6002 14.1416C9.78905 14.4916 8.92238 14.6666 8.00016 14.6666Z" fill="#F04438" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarIntern />

      <main className="flex items-center justify-center px-4 py-12">
        {hasActiveApp ? (
          <VideoLoading message="กำลังตรวจสอบสถานะ..." />
        ) : (
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            กรอกข้อมูลผู้สมัคร
          </h1>
          <p className="text-gray-500 mb-6">กรุณากรอกข้อมูลให้ครบถ้วน</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row: Training Duration & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Training Duration - Date Range Picker */}
              <div className="relative w-full max-w-full">
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    hasError("startDate") || hasError("endDate")
                      ? "text-red-500"
                      : "text-gray-800"
                  }`}
                >
                  ระยะเวลาที่ฝึก <span className="text-red-500">*</span>
                </label>
                <div
                  ref={dateBoxRef}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`w-full px-4 py-3 border-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                    hasError("startDate") || hasError("endDate")
                      ? "border-red-500"
                      : showDatePicker
                        ? "border-primary-600"
                        : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className={startDate && endDate ? "text-gray-900 text-sm" : "text-gray-400 text-sm"}>
                    {getDateRangeDisplay()}
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div
                    ref={datePickerRef}
                    className="absolute z-50 mt-2 left-0 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="w-full">
                        <label className="block text-sm text-gray-600 mb-1 font-medium">วันเริ่มต้น</label>
                        <ThaiDateInput
                          value={startDate}
                          onChange={(newStart) => {
                            setStartDate(newStart);
                            if (endDate && newStart > endDate) {
                              setEndDate("");
                            } else if (endDate) {
                              updateTrainingHours(newStart, endDate);
                            }
                          }}
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-600 text-sm"
                        />
                      </div>
                      <div className="w-full">
                        <label className="block text-sm text-gray-600 mb-1 font-medium">วันสิ้นสุด</label>
                        <ThaiDateInput
                          value={endDate}
                          min={startDate}
                          onChange={(newEnd) => {
                            setEndDate(newEnd);
                            if (startDate) {
                              updateTrainingHours(startDate, newEnd);
                            }
                          }}
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-600 text-sm"
                        />
                      </div>
                    </div>
                    {startDate && endDate && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm text-center text-primary-600 font-medium bg-primary-50 rounded-lg py-2">
                          {formatDateThai(startDate)} - {formatDateThai(endDate)}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowDatePicker(false);
                        handleBlur("startDate");
                        handleBlur("endDate");
                      }}
                      className="mt-3 w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      ตกลง
                    </button>
                  </div>
                )}
                {hasError("startDate") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon /> {errors.startDate}
                  </p>
                )}
                {hasError("endDate") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon /> {errors.endDate}
                  </p>
                )}
              </div>

              {/* Training Hours */}
              <div>
                <label
                  htmlFor="trainingHours"
                  className={`block text-sm font-semibold mb-2 ${
                    hasError("trainingHours") ? "text-red-500" : "text-gray-800"
                  }`}
                >
                  จำนวนชั่วโมงที่ฝึก <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    id="trainingHours"
                    value={trainingHours}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setTrainingHours(value);
                    }}
                    onBlur={() => handleBlur("trainingHours")}
                    placeholder="จำนวนชั่วโมงที่ฝึก"
                    className={`w-full px-4 py-3 pr-16 border-2 rounded-xl focus:outline-none transition-colors ${
                      hasError("trainingHours")
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-primary-600"
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    ชั่วโมง
                  </span>
                </div>
                {hasError("trainingHours") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon /> {errors.trainingHours}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">คำนวณชั่วโมงฝึกงานวันละ 7 ชั่วโมง</p>
              </div>
            </div>

            {/* Skills Field */}
            <div>
              <label
                htmlFor="skills"
                className={`block text-sm font-medium mb-2 ${
                  hasError("skills") ? "text-red-500" : "text-gray-700"
                }`}
              >
                ทักษะด้านต่าง ๆ ของผู้สมัคร{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                onBlur={() => handleBlur("skills")}
                placeholder="โปรดระบุทักษะด้านต่าง ๆ ของ ผู้สมัคร"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  hasError("skills")
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-600"
                }`}
              />
              {hasError("skills") && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <ErrorIcon /> {errors.skills}
                </p>
              )}
            </div>

            {/* Expectations Field */}
            <div>
              <label
                htmlFor="expectations"
                className={`block text-sm font-medium mb-2 ${
                  hasError("expectations") ? "text-red-500" : "text-gray-700"
                }`}
              >
                สิ่งที่คาดหวังจากการฝึกงาน{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="expectations"
                value={expectations}
                onChange={(e) => setExpectations(e.target.value)}
                onBlur={() => handleBlur("expectations")}
                placeholder="โปรดระบุสิ่งที่คาดหวังจากการฝึกงาน"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  hasError("expectations")
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-600"
                }`}
              />
              {hasError("expectations") && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <ErrorIcon /> {errors.expectations}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 justify-center">
              <Link
                href="/intern-home"
                className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-xl font-medium hover:bg-primary-600 hover:text-white transition-colors text-center cursor-pointer active:scale-95"
              >
                ย้อนกลับ
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-primary-600 border-2 border-primary-600 text-white rounded-xl font-medium hover:bg-white hover:text-primary-600 transition-colors cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "กำลังส่ง..." : "ยืนยัน"}
              </button>
            </div>
          </form>
        </div>
        )}
      </main>

      {/* Custom Modal */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#F59E0B" />
                </svg>
              </div>
            </div>
            <p className="text-gray-800 font-medium text-lg mb-6">{modalMessage}</p>
            <button
              onClick={() => {
                setModalMessage(null);
                if (modalRedirect) {
                  router.push(modalRedirect);
                }
              }}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors active:scale-95"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
