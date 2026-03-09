"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/ui/Navbar";
import { authApi, RegisterInternData, institutionApi, Institution } from "../services/api";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  education: string;
  otherEducationType: string;
  institution: string;
  faculty: string;
  major: string;
  startDate: string;
  endDate: string;
  trainingHours: string;
  password: string;
  confirmPassword: string;
  profileImage: File | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  education?: string;
  otherEducationType?: string;
  institution?: string;
  faculty?: string;
  major?: string;
  startDate?: string;
  endDate?: string;
  trainingHours?: string;
  password?: string;
  confirmPassword?: string;
  profileImage?: string;
}

interface TouchedFields {
  firstName?: boolean;
  lastName?: boolean;
  email?: boolean;
  phone?: boolean;
  gender?: boolean;
  education?: boolean;
  institution?: boolean;
  faculty?: boolean;
  major?: boolean;
  otherEducationType?: boolean;
  startDate?: boolean;
  endDate?: boolean;
  trainingHours?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
  profileImage?: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    education: "",
    otherEducationType: "",
    institution: "",
    faculty: "",
    major: "",
    startDate: "",
    endDate: "",
    trainingHours: "",
    password: "",
    confirmPassword: "",
    profileImage: null,
  });

  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Autocomplete states for institution
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [justSelectedInstitution, setJustSelectedInstitution] = useState(false);
  const institutionInputRef = useRef<HTMLInputElement>(null);
  const institutionDropdownRef = useRef<HTMLDivElement>(null);

  // Institutions from backend API
  const [apiInstitutions, setApiInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        institutionDropdownRef.current &&
        !institutionDropdownRef.current.contains(event.target as Node) &&
        institutionInputRef.current &&
        !institutionInputRef.current.contains(event.target as Node)
      ) {
        setShowInstitutionDropdown(false);
      }

    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Map education level to institution type(s) for API filter
  const getInstitutionTypes = (education: string): ("UNIVERSITY" | "VOCATIONAL" | "SCHOOL" | "OTHERS")[] => {
    switch (education) {
      case "university": return ["UNIVERSITY"];
      case "vocational": return ["VOCATIONAL"];
      case "high_vocational": return ["VOCATIONAL"];
      case "high_school": return ["SCHOOL", "OTHERS"];
      case "other": return ["OTHERS"];
      default: return [];
    }
  };

  // Debounce timer ref for institution search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search institutions from backend API (debounced, triggered on typing)
  const searchInstitutions = (searchText: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const types = getInstitutionTypes(formData.education);
    if (types.length === 0) return;

    if (!searchText.trim()) {
      // ช่องว่าง — ซ่อน dropdown
      setFilteredInstitutions([]);
      setShowInstitutionDropdown(false);
      setLoadingInstitutions(false);
      return;
    }

    // พิมพ์ค้นหา — debounce 300ms
    setLoadingInstitutions(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        let results: Institution[];
        if (types.length === 1) {
          results = await institutionApi.getInstitutions(types[0], searchText, 100);
        } else {
          results = await institutionApi.getInstitutionsByTypes(types, searchText, 100);
        }
        setApiInstitutions(results);
        setFilteredInstitutions(results.slice(0, 100));
        setShowInstitutionDropdown(results.length > 0);
      } catch {
        setApiInstitutions([]);
        setFilteredInstitutions([]);
      } finally {
        setLoadingInstitutions(false);
      }
    }, 300);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const educationOptions = [
    { value: "high_school", label: "มัธยมศึกษาตอนปลาย" },
    { value: "vocational", label: "ประกาศนียบัตรวิชาชีพ (ปวช.)" },
    { value: "high_vocational", label: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)" },
    { value: "university", label: "มหาวิทยาลัย" },
    { value: "other", label: "อื่น ๆ" },
  ];

  const validateField = (
    name: keyof FormData,
    value: string,
  ): string | undefined => {
    switch (name) {
      case "firstName":
        return !value.trim() ? "จำเป็นต้องระบุ" : undefined;
      case "lastName":
        return !value.trim() ? "จำเป็นต้องระบุ" : undefined;
      case "email":
        if (!value.trim()) return "จำเป็นต้องระบุ";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "รูปแบบอีเมลไม่ถูกต้อง";
        return undefined;
      case "phone":
        if (!value.trim()) return "จำเป็นต้องระบุ";
        if (!/^[0-9]{9,10}$/.test(value.replace(/[-\s]/g, "")))
          return "รูปแบบเบอร์โทรไม่ถูกต้อง";
        return undefined;
      case "gender":
        return !value ? "จำเป็นต้องระบุ" : undefined;
      case "education":
        return !value ? "จำเป็นต้องระบุ" : undefined;
      case "otherEducationType":
        if (formData.education === "other") {
          return !value.trim() ? "จำเป็นต้องระบุ" : undefined;
        }
        return undefined;
      case "institution":
        if (!value.trim()) return "จำเป็นต้องระบุ";
        // บังคับเลือกจาก dropdown เท่านั้น
        if (!selectedInstitutionId) return "กรุณาเลือกสถานศึกษาจากรายการ";
        return undefined;
      case "faculty":
        // Only required for university
        if (formData.education === "university") {
          return !value.trim() ? "จำเป็นต้องระบุ" : undefined;
        }
        return undefined;
      case "major":
        // Not required for "other" education
        if (formData.education === "other") {
          return undefined;
        }
        return !value.trim() ? "จำเป็นต้องระบุ" : undefined;
      case "startDate":
      case "endDate":
      case "trainingHours":
        return undefined; // Moved to intern-info page
      case "password":
        if (!value.trim()) return "จำเป็นต้องระบุ";
        if (value.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
        return undefined;
      case "confirmPassword":
        if (!value.trim()) return "จำเป็นต้องระบุ";
        if (value !== formData.password) return "รหัสผ่านไม่ตรงกัน";
        return undefined;
      case "profileImage":
        return undefined; // Will be validated separately
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    let firstErrorField: keyof FormData | null = null;

    // Define field order for scroll priority
    const fieldOrder: (keyof FormData)[] = [
      "profileImage",
      "firstName",
      "lastName",
      "email",
      "phone",
      "gender",
      "education",
      "otherEducationType",
      "institution",
      "faculty",
      "major",
      "password",
      "confirmPassword",
    ];

    // Validate all fields in order
    for (const field of fieldOrder) {
      // Skip faculty validation if not university
      if (
        field === "faculty" &&
        formData.education !== "university"
      ) {
        continue;
      }

      // Skip otherEducationType validation if not "other"
      if (
        field === "otherEducationType" &&
        formData.education !== "other"
      ) {
        continue;
      }

      const error = validateField(field, formData[field] as string);
      if (error) {
        newErrors[field] = error;
        isValid = false;
        if (!firstErrorField) {
          firstErrorField = field;
        }
      }
    }

    setErrors(newErrors);

    // Scroll ไปหา field แรกที่ error
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        for (const key of fieldOrder) {
          if (newErrors[key as keyof FormErrors]) {
            const el = document.querySelector(`[data-field="${key}"]`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              // Focus input ตัวแรกใน section นั้น (ถ้ามี)
              const input = el.querySelector("input, select, textarea") as HTMLElement | null;
              if (input && !input.hasAttribute("disabled")) {
                setTimeout(() => input.focus(), 500);
              }
              break;
            }
          }
        }
      }, 100);
    }

    return isValid;
  };

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Handle institution autocomplete — ค้นหาจาก API แบบ debounce
    if (name === "institution") {
      setSelectedInstitutionId(null); // เคลียร์ selection เมื่อพิมพ์ใหม่
      searchInstitutions(value);
    }

    // Clear institution, faculty, and otherEducationType when education changes
    if (name === "education") {
      setFormData((prev) => ({ ...prev, institution: "", faculty: "", otherEducationType: "" }));
      setApiInstitutions([]);
      setFilteredInstitutions([]);
      setShowInstitutionDropdown(false);
      setSelectedInstitutionId(null);
    }

    // Clear confirmPassword when password becomes invalid (< 8 chars)
    if (name === "password" && value.length < 8) {
      setFormData((prev) => ({ ...prev, confirmPassword: "" }));
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleInstitutionSelect = (institution: Institution) => {
    setFormData((prev) => ({ ...prev, institution: institution.name }));
    setSelectedInstitutionId(institution.id);
    setShowInstitutionDropdown(false);
    setFilteredInstitutions([]);
    // Mark as just selected to prevent onBlur validation
    setJustSelectedInstitution(true);
    // Always clear error when selecting from dropdown
    setTouched((prev) => ({ ...prev, institution: true }));
    setErrors((prev) => ({ ...prev, institution: undefined }));
  };

  const handleInstitutionFocus = () => {
    // ถ้ามีข้อความอยู่แล้วและยังไม่ได้เลือก — ค้นหาใหม่
    if (formData.institution.trim() && !selectedInstitutionId) {
      searchInstitutions(formData.institution);
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name] as string);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          profileImage: "รูปแบบไฟล์ไม่ถูกต้อง (รองรับ JPG, PNG, GIF, WEBP)",
        }));
        return;
      }

      // Validate file size (max 4MB)
      if (file.size > 4 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profileImage: "ขนาดไฟล์ต้องไม่เกิน 4 MB",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, profileImage: file }));
      setErrors((prev) => ({ ...prev, profileImage: undefined }));
      setTouched((prev) => ({ ...prev, profileImage: true }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    profileImageInputRef.current?.click();
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modal states
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  // Check if any field has data
  const hasAnyData = () => {
    return (
      formData.firstName.trim() !== "" ||
      formData.lastName.trim() !== "" ||
      formData.email.trim() !== "" ||
      formData.phone.trim() !== "" ||
      formData.gender !== "" ||
      formData.education !== "" ||
      formData.institution.trim() !== "" ||
      formData.faculty.trim() !== "" ||
      formData.major.trim() !== "" ||

      formData.password.trim() !== "" ||
      formData.confirmPassword.trim() !== "" ||
      formData.profileImage !== null
    );
  };

  const handleBackClick = () => {
    if (hasAnyData()) {
      setShowBackConfirm(true);
    } else {
      router.push("/login/intern");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Mark all fields as touched
    const allTouched: TouchedFields = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      // ตรวจสอบว่าเลือกสถานศึกษาจาก dropdown แล้ว
      if (!selectedInstitutionId) {
        setErrors((prev) => ({ ...prev, institution: "กรุณาเลือกสถานศึกษาจากรายการ" }));
        return;
      }

      // แสดง popup ยืนยันการลงทะเบียน
      setShowRegisterConfirm(true);
    }
  };

  const handleConfirmRegister = async () => {
    setShowRegisterConfirm(false);
    setIsSubmitting(true);
    try {
      const registerData: RegisterInternData = {
        fname: formData.firstName,
        lname: formData.lastName,
        phoneNumber: formData.phone.replace(/[-\s]/g, ""),
        email: formData.email,
        password: formData.password,
        gender: formData.gender === "male" ? "MALE" : "FEMALE",
        institutionId: selectedInstitutionId!,
        faculty: formData.faculty,
        major: formData.education === "high_school" ? "" : formData.major,
        studentNote: formData.education === "high_school"
          ? formData.major
          : formData.education === "other"
            ? formData.otherEducationType
            : undefined,
        totalHours: undefined,
      };

      const response = await authApi.registerIntern(registerData);

      if (response.success) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          router.push("/login/intern");
        }, 2000);
      } else {
        // API ส่ง success: false กลับมา (HTTP 200 แต่ไม่สำเร็จ)
        const apiMsg = response.message || "";
        let message = "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง";
        if (apiMsg.toLowerCase().includes("username") && apiMsg.toLowerCase().includes("already")) {
          message = "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว กรุณาใช้เบอร์โทรอื่น";
        } else if (apiMsg.toLowerCase().includes("email") || apiMsg.includes("อีเมล") || apiMsg.includes("already exists")) {
          message = "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น";
        } else if (apiMsg.toLowerCase().includes("phone") || apiMsg.includes("เบอร์โทร")) {
          message = "เบอร์โทรนี้ถูกใช้งานแล้ว กรุณาใช้เบอร์โทรอื่น";
        } else if (apiMsg) {
          message = apiMsg;
        }
        setErrorModalMessage(message);
        setShowErrorModal(true);
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      let message = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; code?: string; error?: string } } };
        const respData = axiosError.response?.data;
        const apiMsg = respData?.message || respData?.error || "";
        const apiCode = respData?.code || "";

        // ตรวจสอบกรณีอีเมลซ้ำหรือเบอร์โทรซ้ำ
        if (apiMsg.toLowerCase().includes("username") && apiMsg.toLowerCase().includes("already")) {
          message = "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว กรุณาใช้เบอร์โทรอื่น";
        } else if (apiMsg.toLowerCase().includes("email") || apiCode === "USER_ALREADY_EXISTS" || apiMsg.includes("อีเมล") || apiMsg.includes("already exists")) {
          message = "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น";
        } else if (apiMsg.toLowerCase().includes("phone") || apiMsg.includes("เบอร์โทร")) {
          message = "เบอร์โทรนี้ถูกใช้งานแล้ว กรุณาใช้เบอร์โทรอื่น";
        } else if (apiMsg) {
          message = apiMsg;
        } else {
          message = "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง";
        }
      }
      setErrorModalMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasError = (field: keyof FormData) => touched[field] && errors[field];

  // Get institution field label based on education level
  const getInstitutionLabel = () => {
    const selectedEducation = educationOptions.find(
      (opt) => opt.value === formData.education,
    );
    if (!selectedEducation || formData.education === "other") {
      return "ชื่อสถานศึกษา";
    }
    return selectedEducation.label;
  };

  // Error icon component
  const ErrorIcon = () => (
    <svg
      className="w-4 h-4 text-red-500 flex-shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-8">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ลงทะเบียนผู้สมัคร
          </h1>
          <p className="text-gray-500 mb-6">
            กรุณากรอกข้อมูลเพื่อสร้างบัญชีใหม่
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: ชื่อ & นามสกุล */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div data-field="firstName">
                <label
                  htmlFor="firstName"
                  className={`block text-sm mb-2 ${hasError("firstName")
                    ? "text-red-500 font-semibold"
                    : "text-gray-800 font-semibold"
                    }`}
                >
                  ชื่อ <span className="text-primary-600">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  onBlur={() => handleBlur("firstName")}
                  placeholder="ชื่อ"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${hasError("firstName")
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-600"
                    }`}
                />
                {hasError("firstName") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon />
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div data-field="lastName">
                <label
                  htmlFor="lastName"
                  className={`block text-sm mb-2 ${hasError("lastName")
                    ? "text-red-500 font-semibold"
                    : "text-gray-800 font-semibold"
                    }`}
                >
                  นามสกุล <span className="text-primary-600">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                  placeholder="นามสกุล"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${hasError("lastName")
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-600"
                    }`}
                />
                {hasError("lastName") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: อีเมล & เบอร์โทร */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div data-field="email">
                <label
                  htmlFor="email"
                  className={`block text-sm mb-2 ${hasError("email")
                    ? "text-red-500 font-semibold"
                    : "text-gray-800 font-semibold"
                    }`}
                >
                  อีเมล <span className="text-primary-600">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="อีเมล"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${hasError("email")
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-600"
                    }`}
                />
                {hasError("email") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div data-field="phone">
                <label
                  htmlFor="phone"
                  className={`block text-sm mb-2 ${hasError("phone")
                    ? "text-red-500 font-semibold"
                    : "text-gray-800 font-semibold"
                    }`}
                >
                  เบอร์โทร <span className="text-primary-600">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="เบอร์โทร"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${hasError("phone")
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-600"
                    }`}
                />
                {hasError("phone") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div data-field="gender">
              <label
                className={`block text-sm mb-2 ${hasError("gender")
                  ? "text-red-500 font-semibold"
                  : "text-gray-800 font-semibold"
                  }`}
              >
                เพศ <span className="text-primary-600">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    onBlur={() => handleBlur("gender")}
                    className="w-4 h-4 accent-primary-600 border-primary-600 focus:ring-primary-600"
                  />
                  <span className="text-gray-700">หญิง</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    onBlur={() => handleBlur("gender")}
                    className="w-4 h-4 accent-primary-600 border-primary-600 focus:ring-primary-600"
                  />
                  <span className="text-gray-700">ชาย</span>
                </label>
              </div>
              {hasError("gender") && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <ErrorIcon />
                  {errors.gender}
                </p>
              )}
            </div>

            {/* Education Level */}
            <div data-field="education">
              <label
                className={`block text-sm mb-2 ${hasError("education")
                  ? "text-red-500 font-semibold"
                  : "text-gray-800 font-semibold"
                  }`}
              >
                การศึกษาปัจจุบัน <span className="text-primary-600">*</span>
              </label>
              <div className="flex flex-col gap-2">
                {educationOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="education"
                      value={option.value}
                      checked={formData.education === option.value}
                      onChange={(e) =>
                        handleChange("education", e.target.value)
                      }
                      onBlur={() => handleBlur("education")}
                      className="w-4 h-4 accent-primary-600 border-primary-600 focus:ring-primary-600"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {hasError("education") && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <ErrorIcon />
                  {errors.education}
                </p>
              )}
            </div>

            {/* Other Education Type - Show only when "other" is selected */}
            {formData.education === "other" && (
              <div data-field="otherEducationType">
                <label
                  htmlFor="otherEducationType"
                  className={`block text-sm mb-2 ${hasError("otherEducationType")
                    ? "text-red-500 font-semibold"
                    : "text-gray-800 font-semibold"
                    }`}
                >
                  ระบุประเภทการศึกษาอื่น ๆ <span className="text-primary-600">*</span>
                </label>
                <input
                  type="text"
                  id="otherEducationType"
                  value={formData.otherEducationType}
                  onChange={(e) => handleChange("otherEducationType", e.target.value)}
                  onBlur={() => handleBlur("otherEducationType")}
                  placeholder="เช่น หลักสูตรประกาศนียบัตร อบรมเฉพาะทาง การศึกษานอกประเทศ"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${hasError("otherEducationType")
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-primary-600"
                    }`}
                />
                {hasError("otherEducationType") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon />
                    {errors.otherEducationType}
                  </p>
                )}
              </div>
            )}

            {/* Institution Name with Autocomplete */}
            <div className="relative" data-field="institution">
              <label
                htmlFor="institution"
                className={`block text-sm mb-2 ${hasError("institution")
                  ? "text-red-500 font-semibold"
                  : "text-gray-800 font-semibold"
                  }`}
              >
                {getInstitutionLabel()}{" "}
                <span className="text-primary-600">*</span>
              </label>
              <div className="relative">
                <input
                  ref={institutionInputRef}
                  type="text"
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                  onFocus={handleInstitutionFocus}
                  onBlur={() => {
                    // ปิด dropdown
                    setTimeout(() => setShowInstitutionDropdown(false), 200);
                    // ถ้าพิมพ์แต่ไม่ได้เลือกจาก dropdown — เคลียร์ข้อความ & แสดง error
                    if (formData.institution.trim() && !selectedInstitutionId) {
                      setFormData((prev) => ({ ...prev, institution: "" }));
                    }
                    handleBlur("institution");
                  }}
                  placeholder={
                    formData.education
                      ? `พิมพ์เพื่อค้นหา${getInstitutionLabel()}`
                      : "กรุณาเลือกระดับการศึกษาก่อน"
                  }
                  disabled={!formData.education}
                  className={`w-full px-4 py-3 ${showInstitutionDropdown && filteredInstitutions.length > 0 ? "pr-10" : ""
                    } border-2 rounded-xl focus:outline-none transition-colors ${hasError("institution")
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 focus:border-primary-600"
                    } ${!formData.education ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                />
                {/* Dropdown Arrow Icon - แสดงเฉพาะตอนมี dropdown */}
                {showInstitutionDropdown && filteredInstitutions.length > 0 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showInstitutionDropdown && filteredInstitutions.length > 0 && (
                <div
                  ref={institutionDropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredInstitutions.map((institution) => (
                    <button
                      key={institution.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur from firing
                        handleInstitutionSelect(institution);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-primary-50 hover:text-primary-600 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
                    >
                      {institution.name}
                    </button>
                  ))}
                </div>
              )}

              {hasError("institution") && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <ErrorIcon />
                  {errors.institution}
                </p>
              )}
            </div>

            {/* Faculty - Only show for university and other */}
            {(formData.education === "university" ||
              formData.education === "other") && (
                <div data-field="faculty">
                  <label
                    htmlFor="faculty"
                    className={`block text-sm mb-2 ${hasError("faculty")
                      ? "text-red-500 font-semibold"
                      : "text-gray-800 font-semibold"
                      }`}
                  >
                    คณะ {formData.education === "university" && <span className="text-primary-600">*</span>}
                  </label>
                  <input
                    type="text"
                    id="faculty"
                    value={formData.faculty}
                    onChange={(e) => handleChange("faculty", e.target.value)}
                    onBlur={() => handleBlur("faculty")}
                    placeholder="คณะ"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${hasError("faculty")
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 focus:border-primary-600"
                      }`}
                  />
                  {hasError("faculty") && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <ErrorIcon />
                      {errors.faculty}
                    </p>
                  )}
                </div>
              )}

            {/* Major */}
            <div data-field="major">
              <label
                htmlFor="major"
                className={`block text-sm mb-2 ${hasError("major")
                  ? "text-red-500 font-semibold"
                  : "text-gray-800 font-semibold"
                  }`}
              >
                {formData.education === "high_school"
                  ? "แผนการเรียน"
                  : "สาขาวิชา"}{" "}
                {formData.education !== "other" && <span className="text-primary-600">*</span>}
              </label>
              <input
                type="text"
                id="major"
                value={formData.major}
                onChange={(e) => handleChange("major", e.target.value)}
                onBlur={() => handleBlur("major")}
                placeholder={
                  formData.education === "high_school"
                    ? "แผนการเรียน"
                    : "สาขาวิชา"
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${hasError("major")
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-200 focus:border-primary-600"
                  }`}
              />
              {hasError("major") && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <ErrorIcon />
                  {errors.major}
                </p>
              )}
            </div>

            {/* Row: Password & Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div data-field="password">
                <label
                  htmlFor="password"
                  className={`block text-sm mb-2 ${hasError("password")
                    ? "text-red-500 font-semibold"
                    : "text-gray-800 font-semibold"
                    }`}
                >
                  รหัสผ่าน <span className="text-primary-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder="รหัสผ่าน"
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors ${hasError("password")
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
                {hasError("password") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon />
                    {errors.password}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร
                </p>
              </div>

              {/* Confirm Password */}
              <div data-field="confirmPassword">
                <label
                  htmlFor="confirmPassword"
                  className={`block text-sm mb-2 ${hasError("confirmPassword")
                    ? "text-red-500 font-semibold"
                    : "text-gray-800 font-semibold"
                    }`}
                >
                  ยืนยันรหัสผ่าน <span className="text-primary-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    onBlur={() => handleBlur("confirmPassword")}
                    placeholder={formData.password.length >= 8 ? "ยืนยันรหัสผ่าน" : "ยืนยันรหัสผ่าน"}
                    disabled={formData.password.length < 8}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors ${formData.password.length < 8
                      ? "bg-gray-100 cursor-not-allowed opacity-60 border-gray-200"
                      : hasError("confirmPassword")
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-primary-600"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
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
                {hasError("confirmPassword") && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <ErrorIcon />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={handleBackClick}
                className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors cursor-pointer active:scale-95"
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 bg-primary-600 text-white rounded-xl font-medium transition-colors active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700 cursor-pointer'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    กำลังลงทะเบียน...
                  </span>
                ) : (
                  'ลงทะเบียน'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal: ยืนยันการละทิ้งข้อมูล */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">ยืนยันการละทิ้งข้อมูล</h3>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowBackConfirm(false)}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={() => router.push("/login/intern")}
                className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors cursor-pointer"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันการลงทะเบียน */}
      {showRegisterConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">ยืนยันการลงทะเบียน</h3>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowRegisterConfirm(false)}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleConfirmRegister}
                className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors cursor-pointer"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ลงทะเบียนสำเร็จ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">ลงทะเบียนสำเร็จ</h3>
          </div>
        </div>
      )}

      {/* Modal: เกิดข้อผิดพลาด (อีเมลซ้ำ/เบอร์โทรซ้ำ/อื่นๆ) */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">ลงทะเบียนไม่สำเร็จ</h3>
            <p className="text-gray-600 mb-6">{errorModalMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-8 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
