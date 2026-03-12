"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NavbarIntern } from "../../components";
import VideoLoading from "../../components/ui/VideoLoading";
import { userApi, institutionApi, extractStudentProfile, applicationApi, positionApi, Position } from "../../services/api";

// Helper functions
const getEducationLabel = (value: string): string => {
  const educationMap: { [key: string]: string } = {
    high_school: "มัธยมศึกษาตอนปลาย",
    vocational: "ประกาศนียบัตรวิชาชีพ (ปวช.)",
    high_vocational: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
    university: "มหาวิทยาลัย",
    other: "อื่น ๆ",
  };
  return educationMap[value] || value;
};

const getGenderLabel = (value: string): string => {
  const genderMap: { [key: string]: string } = {
    male: "ชาย",
    female: "หญิง",
    MALE: "ชาย",
    FEMALE: "หญิง",
  };
  return genderMap[value] || value;
};

const formatPhone = (phone: string): string => {
  if (!phone || phone.length < 9) return phone || "";
  // Remove existing dashes first
  const cleaned = phone.replace(/-/g, "");
  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Helper to clean phone number for API
const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/-/g, "");
};

function InputWithClear({
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full h-11 px-4 pr-10 rounded-xl border",
          disabled
            ? "bg-gray-100 text-gray-500 border-gray-100"
            : "bg-white border-gray-300 focus:border-primary-600 focus:outline-none",
        ].join(" ")}
      />
      {!disabled && value?.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="clear"
        >
          ×
        </button>
      )}
    </div>
  );
}

function FieldBox({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5">
      <div className="w-full">
        <div className="text-sm text-gray-500 mb-2 font-medium">
          {label}{" "}
          {required ? <span className="text-primary-600">*</span> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();

  // Default data for fallback
  const defaultFormData = {
    fullName: "",
    fname: "",
    lname: "",
    email: "",
    phone: "",
    gender: "",
    education: "มหาวิทยาลัย",
    institutionId: 0,
    institutionName: "",
    faculty: "",
    major: "",
    internshipPeriod: "",
    totalHours: "",
    department: "",
    supervisor: "",
    supervisorEmail: "",
    supervisorPhone: "",
    mentorName: "",
    mentorEmail: "",
    mentorPhone: "",
  };

  const [form, setForm] = useState(defaultFormData);
  const [educationType, setEducationType] = useState("university"); // raw education value
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [hasApplication, setHasApplication] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [applicationPosition, setApplicationPosition] = useState<Position | null>(null);

  // Thai month names for formatting
  const thaiMonthsArray = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const formatDateThaiLocal = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = thaiMonthsArray[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  // Load user data from API
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // ดึงข้อมูล profile จาก /user/profile API
        const profileData = await userApi.getUserProfile();
        if (profileData) {
          const studentProfile = extractStudentProfile(profileData.profile);

          // Format internship period
          let internshipPeriod = "";
          if (studentProfile?.startDate && studentProfile?.endDate) {
            internshipPeriod = `${formatDateThaiLocal(studentProfile.startDate)} - ${formatDateThaiLocal(studentProfile.endDate)}`;
            // Convert to YYYY-MM-DD format for date inputs
            setStartDate(studentProfile.startDate.split("T")[0]);
            setEndDate(studentProfile.endDate.split("T")[0]);
          }

          // faculty เป็น string ตรงๆ จาก backend
          let institutionName = "";
          let educationLabel = "มหาวิทยาลัย";
          let isHighSchool = false;

          // ดึงข้อมูล institution จาก API ตาม institutionId
          if (studentProfile?.institutionId) {
            try {
              const inst = await institutionApi.getInstitutionById(studentProfile.institutionId);
              if (inst) {
                institutionName = inst.name;
                const typeToEducation: { [key: string]: string } = {
                  UNIVERSITY: "university",
                  VOCATIONAL: "vocational",
                  SCHOOL: "high_school",
                  OTHERS: "other",
                };
                const eduKey = typeToEducation[inst.institutionsType] || "other";
                setEducationType(eduKey);
                educationLabel = getEducationLabel(eduKey);
                // สำหรับ "อื่น ๆ" — แสดงประเภทการศึกษาจาก studentNote
                if (eduKey === "other" && studentProfile?.studentNote) {
                  educationLabel = studentProfile.studentNote;
                }
                isHighSchool = eduKey === "high_school";
              }
            } catch {
              console.log("Cannot fetch institution data");
            }
          }

          setForm({
            fullName: `${profileData.fname || ""} ${profileData.lname || ""}`.trim() || "",
            fname: profileData.fname || "",
            lname: profileData.lname || "",
            email: profileData.email || "",
            phone: formatPhone(profileData.phoneNumber || ""),
            gender: getGenderLabel(profileData.gender || ""),
            education: educationLabel,
            institutionId: studentProfile?.institutionId || 0,
            institutionName: institutionName,
            faculty: studentProfile?.faculty || "",
            major: isHighSchool
              ? (studentProfile?.studentNote || "")
              : (studentProfile?.major || ""),
            internshipPeriod: internshipPeriod,
            totalHours: studentProfile?.hours ? String(parseInt(studentProfile.hours)) : "",
            department: defaultFormData.department,
            supervisor: "",
            supervisorEmail: "",
            supervisorPhone: "",
            mentorName: "",
            mentorEmail: "",
            mentorPhone: "",
          });

          // Fetch latest application to determine hasApplication and get position data
          try {
            const latestApp = await applicationApi.getMyLatestApplication();
            if (latestApp && latestApp.applicationStatus !== "CANCEL" && latestApp.applicationStatus !== "ABORT") {
              setHasApplication(true);
              setApplicationId(latestApp.applicationId);
              if (latestApp.positionId) {
                try {
                  const pos = await positionApi.getPositionById(latestApp.positionId);
                  if (pos) {
                    setApplicationPosition(pos);
                    const ownerData = pos.owner || (pos.owners && pos.owners.length > 0 ? pos.owners[0] : null);
                    setForm(prev => ({
                      ...prev,
                      department: pos.department?.deptFull || pos.department?.deptShort || "",
                      supervisor: ownerData ? `${ownerData.fname || ""} ${ownerData.lname || ""}`.trim() : "",
                      supervisorEmail: ownerData?.email || "",
                      supervisorPhone: ownerData?.phoneNumber || "",
                      mentorName: pos.mentors && pos.mentors.length > 0 ? (pos.mentors[0].name || "") : "",
                      mentorEmail: pos.mentors && pos.mentors.length > 0 ? (pos.mentors[0].email || "") : "",
                      mentorPhone: pos.mentors && pos.mentors.length > 0 ? (pos.mentors[0].phoneNumber || "") : "",
                    }));
                  }
                } catch {
                  console.log("Cannot fetch position data");
                }
              }
            }
          } catch {
            console.log("Cannot fetch application data");
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // =========================
  // ✅ Date Range Picker
  // =========================
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateBoxRef = useRef<HTMLDivElement>(null);

  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const formatDateThai = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const getDateRangeDisplay = (): string => {
    if (startDate && endDate) {
      return `${formatDateThai(startDate)} - ${formatDateThai(endDate)}`;
    }
    if (startDate) return `${formatDateThai(startDate)} - เลือกวันสิ้นสุด`;
    return "เลือกช่วงวันที่ฝึกงาน";
  };

  // ✅ Calculate training hours from date range (8 hours per weekday)
  const calculateTrainingHours = (start: string, end: string): number => {
    if (!start || !end) return 0;

    const startD = new Date(start);
    const endD = new Date(end);

    if (startD > endD) return 0;

    let hours = 0;
    const current = new Date(startD);

    while (current <= endD) {
      const dayOfWeek = current.getDay();
      // Count only weekdays (Monday = 1, Friday = 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        hours += 8; // 8 hours per working day
      }
      current.setDate(current.getDate() + 1);
    }

    return hours;
  };

  const applyInternshipPeriod = () => {
    if (startDate && endDate) {
      setForm((p) => ({
        ...p,
        internshipPeriod: `${formatDateThai(startDate)} - ${formatDateThai(
          endDate,
        )}`,
      }));
    } else if (startDate && !endDate) {
      setForm((p) => ({
        ...p,
        internshipPeriod: `${formatDateThai(startDate)} - เลือกวันสิ้นสุด`,
      }));
    } else {
      setForm((p) => ({ ...p, internshipPeriod: "" }));
    }
  };

  // Removed: the old useEffect that called applyInternshipPeriod() on mount
  // was overwriting form data before profile fetch completed

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node) &&
        dateBoxRef.current &&
        !dateBoxRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canSave = useMemo(() => {
    return (form.fullName || "").trim() && (form.email || "").trim() && (form.phone || "").trim();
  }, [form]);

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Parse fullName into fname and lname
      const nameParts = form.fullName.trim().split(" ");
      const fname = nameParts[0] || "";
      const lname = nameParts.slice(1).join(" ") || "";

      // Update user data
      await userApi.updateUser({
        fname,
        lname,
        email: form.email,
        phoneNumber: cleanPhoneNumber(form.phone),
      });

      // Update student profile data
      const profilePayload = {
        hours: form.totalHours ? parseInt(form.totalHours) : undefined,
        faculty: form.faculty || undefined,
        major: educationType === "high_school" ? undefined : (form.major || undefined),
        studentNote: educationType === "high_school"
          ? (form.major || undefined)
          : educationType === "other"
            ? undefined
            : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };
      console.log("Saving student profile:", profilePayload);
      await userApi.updateStudentProfile(profilePayload);

      // Update application_informations (hours/dates) so me() returns correct data
      if (applicationId) {
        const appInfoPayload: { hours?: number | null; startDate?: string | null; endDate?: string | null } = {};
        if (form.totalHours) appInfoPayload.hours = parseInt(form.totalHours);
        if (startDate) appInfoPayload.startDate = new Date(startDate).toISOString();
        if (endDate) appInfoPayload.endDate = new Date(endDate).toISOString();
        await applicationApi.updateApplicationInformation(applicationId, appInfoPayload);
      }

      setSaveSuccess(true);
      setShowSaveModal(true);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveError("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.push("/intern-profile");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarIntern />
        <VideoLoading message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarIntern />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
            ข้อมูลส่วนตัว
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            <FieldBox label="ชื่อ - นามสกุล">
              <InputWithClear
                value={form.fullName}
                onChange={(v) => setForm((p) => ({ ...p, fullName: v }))}
              />
            </FieldBox>

            <FieldBox label="อีเมล">
              <InputWithClear
                value={form.email}
                onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                type="email"
              />
            </FieldBox>

            <FieldBox label="เบอร์โทร">
              <InputWithClear
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
              />
            </FieldBox>

            <FieldBox label="เพศ">
              <InputWithClear
                value={form.gender}
                onChange={() => { }}
                disabled
              />
            </FieldBox>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 sm:mt-8 mb-3 sm:mb-4">
            ข้อมูลการศึกษา
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            <FieldBox label="การศึกษาปัจจุบัน">
              <InputWithClear
                value={form.education}
                onChange={() => { }}
                disabled
              />
            </FieldBox>

            <FieldBox label="ชื่อสถาบัน">
              <InputWithClear
                value={form.institutionName}
                onChange={() => { }}
                disabled
              />
            </FieldBox>

            {/* Show faculty only for university and other */}
            {(educationType === "university" || educationType === "other") && (
              <FieldBox label="คณะ">
                <InputWithClear
                  value={form.faculty}
                  onChange={(v) => setForm((p) => ({ ...p, faculty: v }))}
                  placeholder="กรอกชื่อคณะ"
                />
              </FieldBox>
            )}

            <FieldBox
              label={educationType === "high_school" ? "แผนการเรียน" : "สาขา"}
            >
              <InputWithClear
                value={form.major}
                onChange={(v) => setForm((p) => ({ ...p, major: v }))}
              />
            </FieldBox>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 sm:mt-8 mb-3 sm:mb-4">
            ข้อมูลการฝึกงาน
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {/* ✅ ระยะเวลาที่ฝึก (mock ค่าเริ่มต้น) */}
            <FieldBox label="ระยะเวลาที่ฝึก" required>
              <div className="relative">
                <div
                  ref={dateBoxRef}
                  onClick={() => setShowDatePicker((s) => !s)}
                  className={[
                    "w-full h-11 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-between border",
                    showDatePicker
                      ? "border-primary-600"
                      : "border-gray-300 hover:border-gray-400",
                  ].join(" ")}
                >
                  <span className="text-gray-900">{getDateRangeDisplay()}</span>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                {showDatePicker && (
                  <div
                    ref={datePickerRef}
                    className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-full"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1 font-medium">
                          วันเริ่มต้น
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            const v = e.target.value;
                            setStartDate(v);
                            if (endDate && v > endDate) setEndDate("");
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1 font-medium">
                          วันสิ้นสุด
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          min={startDate || undefined}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowDatePicker(false);
                        applyInternshipPeriod();
                      }}
                      className="mt-3 w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      ตกลง
                    </button>
                  </div>
                )}

                {/* เก็บค่า string ไทยไว้ใน form */}
                <input type="hidden" value={form.internshipPeriod} readOnly />
              </div>
            </FieldBox>

            <FieldBox label="ชั่วโมงที่ต้องฝึก" required>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.totalHours.replace(/[^0-9]/g, "")}
                  onChange={(e) => {
                    const onlyNum = e.target.value.replace(/[^0-9]/g, "");
                    setForm((p) => ({
                      ...p,
                      totalHours: onlyNum, // ✅ เก็บเป็นตัวเลขล้วน เช่น "540"
                    }));
                  }}
                  placeholder="จำนวนชั่วโมงที่ฝึก"
                  className="w-full h-11 px-4 pr-20 rounded-xl border bg-white border-gray-300 focus:border-primary-600 focus:outline-none"
                />

                {/* ✅ คำว่า "ชั่วโมง" โชว์เฉยๆ */}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
                  ชั่วโมง
                </span>
              </div>
            </FieldBox>
          </div>

          {/* Department Info - only show if has application */}
          {hasApplication && (
            <>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 sm:mt-8 mb-3 sm:mb-4">
                ข้อมูลผู้ประกาศรับสมัคร
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                <FieldBox label="ชื่อกองงาน">
                  <InputWithClear
                    value={form.department}
                    onChange={() => { }}
                    disabled
                  />
                </FieldBox>

                <FieldBox label="ชื่อผู้ติดต่อ">
                  <InputWithClear
                    value={form.supervisor}
                    onChange={() => { }}
                    disabled
                  />
                </FieldBox>

                <FieldBox label="อีเมลผู้ติดต่อ">
                  <InputWithClear
                    value={form.supervisorEmail}
                    onChange={() => { }}
                    disabled
                  />
                </FieldBox>

                <FieldBox label="เบอร์โทรกองงาน">
                  <InputWithClear
                    value={form.supervisorPhone}
                    onChange={() => { }}
                    disabled
                  />
                </FieldBox>
              </div>
            </>
          )}

          {/* Mentor Info - only show if has application and mentors exist */}
          {hasApplication && applicationPosition?.mentors && applicationPosition.mentors.length > 0 && (
            <>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 sm:mt-8 mb-3 sm:mb-4">
                ข้อมูลพี่เลี้ยง
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                <FieldBox label="ชื่อพี่เลี้ยง">
                  <InputWithClear
                    value={form.mentorName}
                    onChange={() => { }}
                    disabled
                  />
                </FieldBox>

                <FieldBox label="อีเมลพี่เลี้ยง">
                  <InputWithClear
                    value={form.mentorEmail}
                    onChange={() => { }}
                    disabled
                  />
                </FieldBox>

                <FieldBox label="เบอร์โทรติดต่อพี่เลี้ยง">
                  <InputWithClear
                    value={form.mentorPhone}
                    onChange={() => { }}
                    disabled
                  />
                </FieldBox>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8">
            {/* Error Message */}
            {saveError && (
              <div className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm order-3 sm:order-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {saveError}
              </div>
            )}

            {/* Success Message */}
            {/* {saveSuccess && (
              <div className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm order-3 sm:order-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                บันทึกข้อมูลสำเร็จ
              </div>
            )} */}

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="cursor-pointer h-10 sm:h-11 px-4 sm:px-6 rounded-xl border-2 border-gray-300 bg-white text-gray-800 font-medium text-sm sm:text-base hover:bg-gray-200 hover:text-gray-800 transition-colors order-2 sm:order-2 active:scale-95 active:bg-gray-100 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!canSave || isSaving}
              onClick={handleSave}
              className={[
                "cursor-pointer h-10 sm:h-11 px-4 sm:px-6 rounded-xl font-medium text-sm sm:text-base transition-colors order-1 sm:order-3 active:scale-95",
                canSave && !isSaving
                  ? "bg-primary-600 text-white hover:bg-white hover:text-primary-600 border-2 border-primary-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังบันทึก...
                </span>
              ) : (
                "บันทึกการเปลี่ยนแปลง"
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Save Success Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">บันทึกสำเร็จ</h3>
            <p className="text-sm text-gray-500 mb-6">ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว</p>
            <button
              type="button"
              onClick={() => router.push("/intern-profile")}
              className="w-full h-11 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors active:scale-95"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
