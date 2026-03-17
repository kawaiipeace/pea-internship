"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OwnerNavbar from "@/components/ui/OwnerNavbar";
import VideoLoading from "@/components/ui/VideoLoading";
import ThaiDateInput from "@/components/ui/ThaiDateInput";
import {
  AnnouncementFormErrors,
} from "@/types/announcement";
import { relatedFieldOptions } from "../../../../data/mockAnnouncements";
import { positionApi, positionToAnnouncement, UpdatePositionData, userApi, StaffUser } from "@/services/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ประเภทข้อมูลฟอร์มสำหรับ Edit
interface EditFormData {
  title: string;
  department: string;
  location: string;
  maxApplicants: number;
  startDate: string;
  endDate: string;
  relatedFields: string[];
  requiredDocuments: ('portfolio' | 'resume')[];
  status: 'draft' | 'open' | 'closed';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export default function EditAnnouncementPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState<EditFormData | null>(null);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [errors, setErrors] = useState<AnnouncementFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for major dropdown
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [majorSearchText, setMajorSearchText] = useState("");
  const [customMajorOptions, setCustomMajorOptions] = useState<string[]>([]);
  const majorDropdownRef = useRef<HTMLDivElement>(null);

  // State for status dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // State for list items (editable boxes like create page)
  const [jobDetailsList, setJobDetailsList] = useState<string[]>([""]);
  const [requirementsList, setRequirementsList] = useState<string[]>([""]);
  const [benefitsList, setBenefitsList] = useState<string[]>(["ไม่มีค่าตอบแทน"]);

  // Staff list for mentor selection
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [showMentorDropdown, setShowMentorDropdown] = useState<number | null>(null);
  const [mentors, setMentors] = useState<{ staffProfileId: number | null; name: string; email: string; phone: string }[]>([
    { staffProfileId: null, name: "", email: "", phone: "" }
  ]);
  const mentorDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Current user (owner) info
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Mentor delete confirmation modal
  const [showDeleteMentorModal, setShowDeleteMentorModal] = useState(false);
  const [deleteMentorIndex, setDeleteMentorIndex] = useState<number | null>(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

  // Cancel confirmation modal
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

  // Edit confirmation modal
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [editErrorModal, setEditErrorModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Figma: radio toggles for position count and apply period
  const [isUnlimitedCount, setIsUnlimitedCount] = useState(false);
  const [isNoTimeLimit, setIsNoTimeLimit] = useState(false);
  // Tooltip visibility for location
  const [showLocationTooltip, setShowLocationTooltip] = useState(false);

  // Compute announcement status from dates (for conditional sidebar)
  const computedStatus = (() => {
    if (!formData) return "NOT_YET";
    if (formData.status === "closed") return "CLOSE";
    const now = new Date();
    const recruitStart = formData.startDate ? new Date(formData.startDate) : null;
    const recruitEnd = formData.endDate ? new Date(formData.endDate) : null;
    if (isNoTimeLimit || (!recruitStart && !recruitEnd)) return "OPEN";
    if (recruitStart && now < recruitStart) return "NOT_YET";
    if (recruitEnd && now > recruitEnd) return "EXPIRED";
    return "OPEN";
  })();
  const isNotYetStatus = computedStatus === "NOT_YET";

  // Document types
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  const docTypes: { id: 'portfolio' | 'resume'; name: string; description?: string }[] = [
    { id: 'resume', name: 'Resume', description: 'ใบสมัครและประวัติการศึกษา' },
    { id: 'portfolio', name: 'Portfolio', description: 'ผลงานและประสบการณ์' },
  ];

  // Close major dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(event.target as Node)) {
        setShowFieldDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    if (showFieldDropdown || showStatusDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFieldDropdown, showStatusDropdown]);

  // Close mentor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMentorDropdown !== null) {
        const ref = mentorDropdownRefs.current[showMentorDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setShowMentorDropdown(null);
        }
      }
    };

    if (showMentorDropdown !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMentorDropdown]);

  // All major options (predefined + custom)
  const allMajorOptions = [...relatedFieldOptions, ...customMajorOptions];

  // Filter majors based on search text
  const filteredMajorOptions = allMajorOptions.filter((opt) =>
    opt.toLowerCase().includes(majorSearchText.toLowerCase())
  );

  // Check if user can add new major
  const canAddNewMajor =
    majorSearchText.trim() !== "" &&
    !allMajorOptions.some(
      (opt) => opt.toLowerCase() === majorSearchText.toLowerCase()
    );

  // Handle add custom major
  const handleAddCustomMajor = () => {
    if (canAddNewMajor && formData) {
      const newMajor = majorSearchText.trim();
      setCustomMajorOptions([...customMajorOptions, newMajor]);
      setFormData({
        ...formData,
        relatedFields: [...formData.relatedFields, newMajor],
      });
      setMajorSearchText("");
    }
  };

  // Load current user profile
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const profile = await userApi.getUserProfile();
        if (profile) {
          const user: StaffUser = {
            id: profile.id,
            roleId: profile.roleId,
            departmentId: profile.departmentId,
            fname: profile.fname,
            lname: profile.lname,
            username: profile.username,
            displayUsername: profile.displayUsername,
            phoneNumber: profile.phoneNumber,
            email: profile.email,
            gender: profile.gender,
            emailVerified: profile.emailVerified,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          };
          setCurrentUser(user);
        }
      } catch (error) {
        console.log("Failed to load current user:", error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Load staff list from API for mentor selection
  useEffect(() => {
    const fetchStaff = async () => {
      if (loadingUser) return;

      try {
        const staff = await userApi.getStaff();
        const validStaff = (staff || []).filter(s => {
          const hasProfileId = s.staffProfileId != null;
          const sameDepartment = currentUser?.departmentId ? s.departmentId === currentUser.departmentId : true;
          return hasProfileId && sameDepartment;
        });
        setStaffList(validStaff);
      } catch (error) {
        console.log("Failed to load staff list:", error);
        setStaffList([]);
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaff();
  }, [currentUser, loadingUser]);

  // Once staffList loads, set staffProfileId on currentUser from the staffList match
  useEffect(() => {
    if (!currentUser || staffList.length === 0) return;
    const match = staffList.find(s => s.id === currentUser.id);
    if (match?.staffProfileId != null && currentUser.staffProfileId !== match.staffProfileId) {
      setCurrentUser(prev => prev ? { ...prev, staffProfileId: match.staffProfileId } : prev);
    }
  }, [staffList, currentUser]);

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const positionId = parseInt(id);
        if (isNaN(positionId)) {
          console.error("Invalid position ID");
          setIsLoading(false);
          return;
        }

        const position = await positionApi.getPositionById(positionId);
        if (position) {
          const announcement = positionToAnnouncement(position);
          setAcceptedCount(position.acceptedCount ?? 0);

          const formatDateForInput = (dateStr: string | null | undefined): string => {
            if (!dateStr) return "";
            const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
            if (match) {
              return match[1];
            }
            return "";
          };

          // Detect unlimited count and no time limit from loaded data
          const loadedUnlimited = position.positionCount === null || position.positionCount === 0;
          const loadedNoTimeLimit = !position.recruitStart && !position.recruitEnd;
          setIsUnlimitedCount(loadedUnlimited);
          setIsNoTimeLimit(loadedNoTimeLimit);

          setFormData({
            title: announcement.title,
            department: announcement.department,
            location: announcement.location,
            maxApplicants: announcement.maxApplicants,
            startDate: formatDateForInput(position.recruitStart),
            endDate: formatDateForInput(position.recruitEnd),
            relatedFields: announcement.relatedFields,
            requiredDocuments: announcement.requiredDocuments,
            status: announcement.status === "expired" ? "closed" : announcement.status,
            contactName: announcement.contactName,
            contactEmail: announcement.contactEmail,
            contactPhone: announcement.contactPhone,
          });

          // Set list items from loaded data
          const responsibilities = announcement.responsibilities.length > 0 ? announcement.responsibilities : [""];
          const qualifications = announcement.qualifications.length > 0 ? announcement.qualifications : [""];
          const benefits = announcement.benefits ? announcement.benefits.split(/\r?\n/).filter(b => b.trim()) : ["ไม่มีค่าตอบแทน"];
          setJobDetailsList(responsibilities);
          setRequirementsList(qualifications);
          setBenefitsList(benefits.length > 0 ? benefits : ["ไม่มีค่าตอบแทน"]);

          // Set mentors from loaded data
          if (position.mentors && position.mentors.length > 0) {
            setMentors(position.mentors.map(m => ({
              staffProfileId: m.staffId,
              name: m.name,
              email: m.email,
              phone: m.phoneNumber || "",
            })));
          }

          console.log("Loaded position:", position);
        }
      } catch (error) {
        console.error("Error loading announcement:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Handle mentor selection for a specific index
  const handleMentorSelect = (staff: StaffUser, index: number) => {
    const profileId = staff.staffProfileId ?? null;
    // ถ้าพี่เลี้ยงที่เลือกเป็นคนเดียวกับผู้ประกาศรับสมัคร → ใช้เบอร์จากฟอร์มด้านบน
    const isSameAsContact = currentUser && staff.id === currentUser.id;
    const phone = (isSameAsContact && formData) ? formData.contactPhone : (staff.phoneNumber || "");
    const newMentors = [...mentors];
    newMentors[index] = {
      staffProfileId: profileId,
      name: `${staff.fname} ${staff.lname}`,
      email: staff.email || "",
      phone,
    };
    setMentors(newMentors);
    setShowMentorDropdown(null);
  };

  // Add new mentor slot (max 5)
  const handleAddMentor = () => {
    if (mentors.length >= 5) return;
    setMentors([...mentors, { staffProfileId: null, name: "", email: "", phone: "" }]);
  };

  // Sync mentor phone when contactPhone changes and mentor is the same person
  useEffect(() => {
    if (!currentUser || !formData) return;
    const updated = mentors.map((m) => {
      if (m.staffProfileId === currentUser.staffProfileId && currentUser.staffProfileId != null) {
        return { ...m, phone: formData.contactPhone };
      }
      return m;
    });
    const changed = updated.some((m, i) => m.phone !== mentors[i].phone);
    if (changed) setMentors(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.contactPhone, currentUser]);

  // Remove mentor at index
  const handleRemoveMentor = (index: number) => {
    if (mentors.length <= 1) return;
    const mentor = mentors[index];
    if (mentor.staffProfileId !== null || mentor.name) {
      setDeleteMentorIndex(index);
      setShowDeleteMentorModal(true);
    } else {
      setMentors(mentors.filter((_, i) => i !== index));
    }
  };

  // Confirm delete mentor
  const confirmDeleteMentor = () => {
    if (deleteMentorIndex !== null) {
      setMentors(mentors.filter((_, i) => i !== deleteMentorIndex));
      setShowDeleteMentorModal(false);
      setDeleteMentorIndex(null);
      setShowDeleteSuccessModal(true);
      setTimeout(() => setShowDeleteSuccessModal(false), 1500);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData) return false;
    const newErrors: AnnouncementFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "ระบุชื่อตำแหน่งงาน";
    }
    if (!formData.department.trim()) {
      newErrors.department = "ระบุกองงาน";
    }
    if (!formData.location.trim()) {
      newErrors.location = "ระบุสถานที่ปฏิบัติงาน";
    }
    if (isUnlimitedCount === null) {
      newErrors.maxApplicants = "กรุณาเลือกจำนวนผู้สมัครที่เปิดรับ";
    } else if (!isUnlimitedCount && (!formData.maxApplicants || formData.maxApplicants < 1)) {
      newErrors.maxApplicants = "ระบุจำนวนที่เปิดรับ";
    } else if (
      !isUnlimitedCount &&
      formData.maxApplicants < acceptedCount
    ) {
      newErrors.maxApplicants = `จำนวนที่เปิดรับต้องไม่น้อยกว่าจำนวนนักศึกษาที่ตอบรับแล้ว (${acceptedCount} คน)`;
    }
    if (isNoTimeLimit === null) {
      newErrors.startDate = "กรุณาเลือกระยะเวลาที่เปิดรับสมัคร";
    } else if (!isNoTimeLimit && !formData.startDate) {
      newErrors.startDate = "ระบุวันที่เปิดรับสมัคร";
    }
    if (isNoTimeLimit === false && !formData.endDate) {
      newErrors.endDate = "ระบุวันที่ปิดรับสมัคร";
    }
    if (formData.relatedFields.length === 0) {
      newErrors.relatedFields = "เพิ่มสาขาวิชาที่เกี่ยวข้องอย่างน้อย 1 สาขา";
    }
    if (jobDetailsList.filter(d => d.trim()).length === 0) {
      newErrors.responsibilities = "ระบุลักษณะงาน";
    }
    if (requirementsList.filter(r => r.trim()).length === 0) {
      newErrors.qualifications = "ระบุคุณสมบัติ";
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = "ระบุชื่อผู้ติดต่อ";
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "ระบุอีเมลผู้ติดต่อ";
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "ระบุเบอร์โทรกองงาน";
    } else if (formData.contactPhone.replace(/\D/g, "").length !== 10) {
      newErrors.contactPhone = "เบอร์โทรต้องมี 10 หลัก";
    }
    // Validate mentor selection
    const hasAtLeastOneMentor = mentors.some(m => m.staffProfileId !== null);
    if (!hasAtLeastOneMentor) {
      newErrors.mentorName = "กรุณาเลือกพี่เลี้ยงอย่างน้อย 1 คน";
    }
    // Validate mentor phones (10 digits)
    mentors.forEach((m, i) => {
      if (m.staffProfileId !== null && m.phone.replace(/\D/g, "").length !== 10) {
        newErrors[`mentorPhone_${i}` as keyof AnnouncementFormErrors] = "เบอร์โทรพี่เลี้ยงต้องมี 10 หลัก";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle edit button click - show confirmation first
  const handleEditClick = () => {
    if (!formData || !validateForm()) return;
    setShowEditConfirmModal(true);
  };

  // Handle form submission (called after confirmation)
  const handleSubmit = async () => {
    setShowEditConfirmModal(false);
    if (!formData) return;

    setIsSubmitting(true);
    try {
      const positionId = parseInt(id);
      if (isNaN(positionId)) {
        throw new Error("Invalid position ID");
      }

      const resumeRq = formData.requiredDocuments.includes('resume');
      const portfolioRq = formData.requiredDocuments.includes('portfolio');

      const mentorStaffIds: number[] = mentors
        .filter(m => m.staffProfileId !== null)
        .map(m => m.staffProfileId as number);

      const updateData: UpdatePositionData = {
        name: formData.title,
        location: formData.location,
        positionCount: isUnlimitedCount ? null : formData.maxApplicants,
        major: formData.relatedFields.join(", "),
        recruitStart: isNoTimeLimit ? null : (formData.startDate ? new Date(formData.startDate).toISOString() : null),
        recruitEnd: isNoTimeLimit ? null : (formData.endDate ? new Date(formData.endDate).toISOString() : null),
        jobDetails: jobDetailsList.filter(d => d.trim()).join("\n"),
        requirement: requirementsList.filter(r => r.trim()).join("\n"),
        benefits: benefitsList.filter(b => b.trim()).join("\n"),
        recruitmentStatus: formData.status === "open" ? "OPEN" : "CLOSE",
        resumeRq,
        portfolioRq,
        mentorStaffIds,
      };

      console.log("Updating position:", positionId, updateData);
      // Save phone number to user profile (non-blocking)
      if (formData.contactPhone) {
        try {
          await userApi.updateUser({ phoneNumber: formData.contactPhone });
        } catch (phoneErr) {
          console.warn("Failed to update phone number:", phoneErr);
          setEditErrorModal({
            title: "แก้ไขประกาศไม่สำเร็จ",
            message: "ไม่สามารถบันทึกเบอร์โทรได้ เบอร์โทรนี้อาจถูกใช้งานในระบบแล้ว",
          });
        }
      }
      await positionApi.updatePosition(positionId, updateData);
      // Show success modal then redirect
      setShowEditSuccessModal(true);
      setTimeout(() => {
        setShowEditSuccessModal(false);
        router.push("/owner/announcements");
      }, 1500);
    } catch (error: unknown) {
      console.error("Error updating announcement:", error);

      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

      if (axiosError.response?.status === 404) {
        setEditErrorModal({
          title: "แก้ไขประกาศไม่สำเร็จ",
          message: "ไม่พบประกาศนี้ หรือคุณไม่มีสิทธิ์แก้ไขประกาศนี้",
        });
      } else if (axiosError.response?.status === 401) {
        setEditErrorModal({
          title: "แก้ไขประกาศไม่สำเร็จ",
          message: "กรุณาเข้าสู่ระบบก่อนแก้ไขประกาศ",
        });
        router.push("/login/owner");
      } else {
        const message = axiosError.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง";
        const isPositionCountError =
          message.includes("จำนวนที่เปิดรับต้องไม่น้อยกว่า") ||
          message.includes("acceptedCount");
        setEditErrorModal({
          title: "แก้ไขประกาศไม่สำเร็จ",
          message: isPositionCountError
            ? "จำนวนที่เปิดรับต้องไม่น้อยกว่าจำนวนนักศึกษาที่ตอบรับแล้วในประกาศนี้"
            : message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add field
  const handleAddField = (field: string) => {
    if (!formData || formData.relatedFields.includes(field)) return;
    setFormData({
      ...formData,
      relatedFields: [...formData.relatedFields, field],
    });
  };

  // Remove field
  const handleRemoveField = (field: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      relatedFields: formData.relatedFields.filter((f) => f !== field),
    });
  };

  // Job Details handlers (editable boxes)
  const handleAddJobDetail = () => {
    setJobDetailsList([...jobDetailsList, ""]);
  };
  const handleUpdateJobDetail = (index: number, value: string) => {
    const updated = [...jobDetailsList];
    updated[index] = value;
    setJobDetailsList(updated);
  };
  const handleRemoveJobDetail = (index: number) => {
    setJobDetailsList(jobDetailsList.filter((_, i) => i !== index));
  };

  // Requirements handlers (editable boxes)
  const handleAddRequirement = () => {
    setRequirementsList([...requirementsList, ""]);
  };
  const handleUpdateRequirement = (index: number, value: string) => {
    const updated = [...requirementsList];
    updated[index] = value;
    setRequirementsList(updated);
  };
  const handleRemoveRequirement = (index: number) => {
    setRequirementsList(requirementsList.filter((_, i) => i !== index));
  };

  // Benefits handlers (editable boxes)
  const handleAddBenefit = () => {
    setBenefitsList([...benefitsList, ""]);
  };
  const handleUpdateBenefit = (index: number, value: string) => {
    const updated = [...benefitsList];
    updated[index] = value;
    setBenefitsList(updated);
  };
  const handleRemoveBenefit = (index: number) => {
    setBenefitsList(benefitsList.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OwnerNavbar />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 5rem)" }}>
          <VideoLoading message="กำลังโหลดข้อมูล..." />
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OwnerNavbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">ไม่พบประกาศ</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OwnerNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/owner/announcements" className="text-gray-500 hover:text-primary-600">
              ประกาศที่รับสมัครอยู่
            </Link>
            <span className="text-gray-400">{">"}</span>
            <span className="text-primary-600 font-medium">แก้ไขประกาศ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">แก้ไขประกาศรับสมัครฝึกงาน</h1>
          <p className="text-gray-500 mt-1">แก้ไขรายละเอียดประกาศรับสมัครฝึกงาน</p>
        </div>

        <div className={isNotYetStatus ? "max-w-3xl mx-auto" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
          {/* Main Form */}
          <div className={isNotYetStatus ? "space-y-6" : "lg:col-span-2 space-y-6"}>
            {/* Basic Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลพื้นฐาน</h2>

              {/* Title */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${errors.title ? "text-red-500" : "text-gray-700"}`}>
                  ชื่อตำแหน่งงาน *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ชื่อตำแหน่งงาน"
                  className={`w-full px-4 py-3 rounded-lg border ${errors.title ? "border-red-300 focus:ring-red-600" : "border-gray-200 focus:ring-primary-600"
                    } focus:outline-none focus:ring-2`}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Department & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    กองงาน *
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    disabled
                    placeholder="กำลังโหลด..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${errors.location ? "text-red-500" : "text-gray-700"}`}>
                    <span className="flex items-center gap-1">
                      สถานที่ปฏิบัติงาน *
                      <span className="relative inline-block">
                        <button
                          type="button"
                          onMouseEnter={() => setShowLocationTooltip(true)}
                          onMouseLeave={() => setShowLocationTooltip(false)}
                          onClick={() => setShowLocationTooltip(!showLocationTooltip)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        {showLocationTooltip && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-50">
                            เช่น การไฟฟ้าสำนักงานใหญ่ กรุงเทพฯ อาคาร 4 ชั้น 7
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                          </div>
                        )}
                      </span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="สถานที่ปฏิบัติงาน"
                    className={`w-full px-4 py-3 rounded-lg border ${errors.location ? "border-red-300 focus:ring-red-600" : "border-gray-200 focus:ring-primary-600"
                      } focus:outline-none focus:ring-2`}
                  />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                </div>
              </div>

              {/* Position Count - Radio buttons */}
              <div className="mb-4" data-field="maxApplicants">
                <label className={`block text-sm font-medium mb-2 ${errors.maxApplicants ? "text-red-500" : "text-gray-700"}`}>
                  จำนวนผู้สมัครที่เปิดรับ *
                </label>
                <div className="flex items-center gap-6">
                  {/* Option 1: Unlimited */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="positionCountType"
                      checked={isUnlimitedCount === true}
                      onChange={() => {
                        setIsUnlimitedCount(true);
                        setFormData({ ...formData, maxApplicants: 0 });
                      }}
                      className="w-4 h-4 accent-[#9B1F7A] cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">ไม่จำกัดจำนวน</span>
                  </label>
                  {/* Option 2: Specific count */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="positionCountType"
                        checked={isUnlimitedCount === false}
                        onChange={() => {
                          setIsUnlimitedCount(false);
                          if (formData.maxApplicants === 0) {
                            setFormData({ ...formData, maxApplicants: 1 });
                          }
                        }}
                        className="w-4 h-4 accent-[#9B1F7A] cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">จำนวนที่เปิดรับ</span>
                    </label>
                    {isUnlimitedCount === false && (
                      <input
                        type="number"
                        min={Math.max(1, acceptedCount)}
                        value={formData.maxApplicants || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, maxApplicants: val === "" ? 0 : (parseInt(val) || 0) });
                        }}
                        placeholder="ระบุจำนวน"
                        className={`w-32 px-3 py-2 rounded-lg border ${errors.maxApplicants ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-primary-600"
                          } focus:outline-none focus:ring-2 text-sm`}
                      />
                    )}
                  </div>
                </div>
                {errors.maxApplicants && <p className="text-red-500 text-xs mt-1">{errors.maxApplicants}</p>}
                {acceptedCount > 0 && isUnlimitedCount === false && (
                  <p className="text-gray-500 text-xs mt-1">
                    ปัจจุบันมีนักศึกษาที่ตอบรับแล้ว {acceptedCount} คน จึงไม่สามารถลดจำนวนที่เปิดรับต่ำกว่านี้ได้
                  </p>
                )}
              </div>

              {/* Related Fields */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${errors.relatedFields ? "text-red-500" : "text-gray-700"}`}>
                  สาขาวิชาที่เกี่ยวข้อง (เพิ่มได้มากกว่า 1 สาขา) *
                </label>

                {/* Added Fields */}
                {formData.relatedFields.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.relatedFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{field}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Dropdown with Search */}
                <div className="relative" ref={majorDropdownRef}>
                  <div
                    onClick={() => setShowFieldDropdown(true)}
                    className={`w-full px-4 py-3 rounded-lg border ${showFieldDropdown
                      ? "border-primary-600 ring-2 ring-primary-600"
                      : errors.relatedFields
                        ? "border-red-300"
                        : "border-gray-200"
                      } bg-white flex items-center justify-between cursor-pointer`}
                  >
                    <input
                      type="text"
                      value={majorSearchText}
                      onChange={(e) => {
                        setMajorSearchText(e.target.value);
                        if (!showFieldDropdown) setShowFieldDropdown(true);
                      }}
                      onFocus={() => setShowFieldDropdown(true)}
                      placeholder="สาขาวิชาที่เกี่ยวข้อง"
                      className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-500"
                    />
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${showFieldDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Dropdown Menu */}
                  {showFieldDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-primary-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {/* Select All Option (only when no search) */}
                      {/* {majorSearchText === "" && (
                        <label className="flex items-center gap-3 px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100">
                          <input
                            type="checkbox"
                            checked={formData.relatedFields.length === allMajorOptions.length && allMajorOptions.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  relatedFields: [...allMajorOptions],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  relatedFields: [],
                                });
                              }
                            }}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                          />
                          <span className="text-sm text-gray-700">ทั้งหมด ({allMajorOptions.length})</span>
                        </label>
                      )} */}

                      {/* Filtered Options */}
                      {filteredMajorOptions.length > 0 ? (
                        filteredMajorOptions.map((opt, index) => (
                          <label
                            key={index}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-primary-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.relatedFields.includes(opt)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleAddField(opt);
                                } else {
                                  handleRemoveField(opt);
                                }
                              }}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                            />
                            <span className="text-sm text-gray-700">{opt}</span>
                          </label>
                        ))
                      ) : (
                        !canAddNewMajor && (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            ไม่พบสาขาที่ค้นหา
                          </div>
                        )
                      )}

                      {/* Add New Major Button */}
                      {canAddNewMajor && (
                        <button
                          type="button"
                          onClick={handleAddCustomMajor}
                          className="w-full flex items-center gap-2 px-4 py-3 text-left text-primary-600 hover:bg-primary-50 border-t border-gray-100"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-sm font-medium">เพิ่มสาขา &quot;{majorSearchText}&quot;</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {errors.relatedFields && <p className="text-red-500 text-xs mt-1">{errors.relatedFields}</p>}
              </div>
            </div>

            {/* Duration - Application Period */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">ระยะเวลาที่เปิดรับสมัคร</h2>

              <div className="flex items-center gap-6 mb-4">
                {/* Option 1: No time limit */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="applyPeriodType"
                    checked={isNoTimeLimit === true}
                    onChange={() => {
                      setIsNoTimeLimit(true);
                      setFormData({ ...formData, startDate: "", endDate: "" });
                    }}
                    className="w-4 h-4 accent-[#9B1F7A] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">ไม่กำหนดระยะเวลา</span>
                </label>
                {/* Option 2: Specify period */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="applyPeriodType"
                    checked={isNoTimeLimit === false}
                    onChange={() => setIsNoTimeLimit(false)}
                    className="w-4 h-4 accent-[#9B1F7A] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">กำหนดระยะเวลา</span>
                </label>
              </div>

              {isNoTimeLimit === false && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div data-field="startDate">
                    <label className={`block text-sm font-medium mb-1 ${errors.startDate ? "text-red-500" : "text-gray-700"}`}>
                      วันที่เปิดรับสมัคร *
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <ThaiDateInput
                        value={formData.startDate}
                        onChange={(val) => setFormData({ ...formData, startDate: val })}
                        className={`pl-12 pr-4 py-3 rounded-lg border ${errors.startDate ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-primary-600"
                          } focus:outline-none focus:ring-2`}
                      />
                    </div>
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                  </div>
                  <div data-field="endDate">
                    <label className={`block text-sm font-medium mb-1 ${errors.endDate ? "text-red-500" : "text-gray-700"}`}>
                      วันที่ปิดรับสมัคร *
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <ThaiDateInput
                        value={formData.endDate}
                        min={formData.startDate}
                        onChange={(val) => setFormData({ ...formData, endDate: val })}
                        className={`pl-12 pr-4 py-3 rounded-lg border ${errors.endDate ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-primary-600"
                          } focus:outline-none focus:ring-2`}
                      />
                    </div>
                    {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Required Documents */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">เอกสารที่ต้องการเพิ่ม</h2>
              <p className="text-gray-500 text-sm mb-4">เลือกเอกสารที่ต้องการให้นักศึกษาแนบมาพร้อมใบสมัคร</p>
              {loadingDocTypes ? (
                <div className="flex gap-4">
                  <div className="animate-pulse flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg w-40 h-16 bg-gray-100"></div>
                  <div className="animate-pulse flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg w-40 h-16 bg-gray-100"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {docTypes.map((docType) => (
                    <label
                      key={docType.id}
                      className={`flex items-center gap-4 px-4 py-4 border-2 rounded-2xl cursor-pointer hover:bg-gray-50 transition-all min-w-[240px] ${formData.requiredDocuments.includes(docType.id)
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200"
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${formData.requiredDocuments.includes(docType.id)
                        ? "border-primary-600 bg-primary-600"
                        : "border-gray-300"
                        }`}>
                        {formData.requiredDocuments.includes(docType.id) && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.requiredDocuments.includes(docType.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              requiredDocuments: [...formData.requiredDocuments, docType.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              requiredDocuments: formData.requiredDocuments.filter((d) => d !== docType.id),
                            });
                          }
                        }}
                        className="sr-only"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 text-base">{docType.name}</p>
                        {docType.description && (
                          <p className="text-sm text-gray-500 mt-1">{docType.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">รายละเอียดงาน</h2>

              {/* Responsibilities - Editable boxes */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-1 ${errors.responsibilities ? "text-red-500" : "text-gray-700"}`}>
                  ลักษณะงาน *
                </label>

                <div className="space-y-2 mb-2">
                  {jobDetailsList.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleUpdateJobDetail(index, e.target.value)}
                        placeholder="ลักษณะงาน"
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-primary-600 focus:outline-none focus:ring-2 text-sm text-gray-700"
                      />
                      {jobDetailsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveJobDetail(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.responsibilities && <p className="text-red-500 text-xs mt-1">{errors.responsibilities}</p>}

                <button
                  type="button"
                  onClick={handleAddJobDetail}
                  className="mt-2 flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มลักษณะงาน
                </button>
              </div>

              {/* Qualifications - Editable boxes */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-1 ${errors.qualifications ? "text-red-500" : "text-gray-700"}`}>
                  คุณสมบัติ *
                </label>

                <div className="space-y-2 mb-2">
                  {requirementsList.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleUpdateRequirement(index, e.target.value)}
                        placeholder="คุณสมบัติ"
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-primary-600 focus:outline-none focus:ring-2 text-sm text-gray-700"
                      />
                      {requirementsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.qualifications && <p className="text-red-500 text-xs mt-1">{errors.qualifications}</p>}

                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="mt-2 flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มคุณสมบัติ
                </button>
              </div>

              {/* Benefits - Editable boxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สวัสดิการ
                </label>

                <div className="space-y-2 mb-2">
                  {benefitsList.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleUpdateBenefit(index, e.target.value)}
                        disabled={item === "ไม่มีค่าตอบแทน"}
                        placeholder="สวัสดิการ"
                        className={`flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-primary-600 focus:outline-none focus:ring-2 text-sm text-gray-700 ${item === "ไม่มีค่าตอบแทน" ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      />
                      {benefitsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="mt-2 flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มสวัสดิการ
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">รายละเอียดผู้ประกาศรับสมัคร</h2>
              <p className="text-gray-500 text-sm mb-4">ข้อมูลจากบัญชีผู้ใช้ของคุณ</p>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${errors.contactName ? "text-red-500" : "text-gray-700"}`}>
                    ชื่อผู้ประกาศรับสมัคร *
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    disabled
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                  {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${errors.contactEmail ? "text-red-500" : "text-gray-700"}`}>
                      อีเมลผู้ประกาศรับสมัคร *
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      disabled
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                    {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${errors.contactPhone ? "text-red-500" : "text-gray-700"}`}>
                      เบอร์โทรผู้ประกาศรับสมัคร *
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData({ ...formData, contactPhone: digits });
                      }}
                      maxLength={10}
                      placeholder="เบอร์โทรผู้ประกาศรับสมัคร"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.contactPhone ? "border-red-400 focus:ring-red-400 focus:outline-none focus:ring-2 text-gray-700" : "border-gray-200 focus:ring-primary-600 focus:outline-none focus:ring-2 text-gray-700"}`}
                    />
                    {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Mentor Info - Separate cards per mentor */}
            {mentors.map((mentor, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-semibold text-gray-800">รายละเอียดพี่เลี้ยง {index + 1}</h2>
                  {mentors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMentor(index)}
                      className="p-2 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors border border-gray-200 rounded-lg hover:border-red-300 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                {index === 0 && (
                  <p className="text-sm text-gray-500 mb-3">พี่เลี้ยงหลักของระบบ (ค่าเริ่มต้น)</p>
                )}
                {index !== 0 && <div className="mb-3" />}

                {/* Mentor Selection Dropdown */}
                <div ref={(el) => { mentorDropdownRefs.current[index] = el; }} className="relative mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อพี่เลี้ยง *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMentorDropdown(showMentorDropdown === index ? null : index)}
                    disabled={loadingStaff}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <span className={mentor.name ? "text-gray-800" : "text-gray-400"}>
                      {loadingStaff ? "กำลังโหลด..." : (mentor.name || "เลือกพี่เลี้ยง")}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${showMentorDropdown === index ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showMentorDropdown === index && !loadingStaff && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {staffList.length > 0 ? (
                        staffList
                          .filter(s => !mentors.some((m, i) => i !== index && m.staffProfileId === s.staffProfileId))
                          .map((staff) => (
                            <button
                              key={staff.id}
                              type="button"
                              onClick={() => handleMentorSelect(staff, index)}
                              className={`w-full px-4 py-3 text-left hover:bg-primary-50 border-b border-gray-100 last:border-b-0 ${mentor.staffProfileId === staff.staffProfileId ? "bg-primary-100 text-primary-800" : "text-gray-700"
                                }`}
                            >
                              <div className="font-medium">{staff.fname} {staff.lname}</div>
                              <div className="text-sm text-gray-500">{staff.email}</div>
                            </button>
                          ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">ไม่พบรายชื่อพนักงานที่สามารถเป็นพี่เลี้ยงได้</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อีเมลพี่เลี้ยง *
                    </label>
                    <input
                      type="email"
                      value={mentor.email}
                      onChange={(e) => {
                        const newMentors = [...mentors];
                        newMentors[index] = { ...newMentors[index], email: e.target.value };
                        setMentors(newMentors);
                      }}
                      disabled={mentor.staffProfileId != null && currentUser?.staffProfileId != null && mentor.staffProfileId === currentUser.staffProfileId}
                      placeholder="อีเมลพี่เลี้ยง"
                      className={`w-full px-4 py-3 rounded-lg border ${mentor.staffProfileId != null && currentUser?.staffProfileId != null && mentor.staffProfileId === currentUser.staffProfileId ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed" : "border-gray-200 focus:ring-primary-600 focus:outline-none focus:ring-2 text-gray-700"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เบอร์โทรพี่เลี้ยง *
                    </label>
                    <input
                      type="tel"
                      value={mentor.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        const newMentors = [...mentors];
                        newMentors[index] = { ...newMentors[index], phone: digits };
                        setMentors(newMentors);
                      }}
                      maxLength={10}
                      disabled={mentor.staffProfileId != null && currentUser?.staffProfileId != null && mentor.staffProfileId === currentUser.staffProfileId}
                      placeholder="เบอร์โทรพี่เลี้ยง"
                      className={`w-full px-4 py-3 rounded-lg border ${mentor.staffProfileId != null && currentUser?.staffProfileId != null && mentor.staffProfileId === currentUser.staffProfileId ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed" : (errors as Record<string, string>)[`mentorPhone_${index}`] ? "border-red-400 focus:ring-red-400 focus:outline-none focus:ring-2 text-gray-700" : "border-gray-200 focus:ring-primary-600 focus:outline-none focus:ring-2 text-gray-700"}`}
                    />
                    {(errors as Record<string, string>)[`mentorPhone_${index}`] && <p className="text-red-500 text-xs mt-1">{(errors as Record<string, string>)[`mentorPhone_${index}`]}</p>}
                  </div>
                </div>

                {/* เพิ่มพี่เลี้ยง button - only on last card, max 5 */}
                {index === mentors.length - 1 && mentors.length < 5 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleAddMentor}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl hover:border-primary-600 hover:text-primary-600 transition-colors text-sm"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      เพิ่มพี่เลี้ยง
                    </button>
                  </div>
                )}
              </div>
            ))}

            {errors.mentorName && (
              <p className="text-sm text-red-500 px-1">{errors.mentorName}</p>
            )}
          </div>

          {/* Sidebar - Status (only when NOT "ยังไม่ถึงกำหนด") */}
          {!isNotYetStatus && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border-2 border-primary-600 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-800">สถานะประกาศ</h2>
                <hr className="my-4 border-gray-200" />

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                  <div className="relative" ref={statusDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-primary-600 bg-white text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-primary-600"
                    >
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${formData.status === "open"
                        ? "bg-green-50 text-green-700 border border-green-500"
                        : "bg-red-50 text-red-600 border border-red-500"
                        }`}>
                        {formData.status === "open" ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Status Dropdown Menu */}
                    {showStatusDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, status: "open" });
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-primary-50 ${formData.status === "open" ? "bg-primary-200 text-primary-800" : "text-gray-700"
                            }`}
                        >
                          เปิดรับสมัคร
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, status: "closed" });
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-primary-100 ${formData.status === "closed" ? "bg-primary-200 text-primary-800" : "text-gray-700"
                            }`}
                        >
                          ปิดรับสมัคร
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirmModal(true)}
                    className="flex-1 px-4 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-center font-medium cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleEditClick}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed text-center"
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "ยืนยันแก้ไขประกาศ"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom action buttons when status is NOT_YET (no sidebar) */}
        {isNotYetStatus && (
          <div className="max-w-3xl mx-auto mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setShowCancelConfirmModal(true)}
              className="px-8 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleEditClick}
              disabled={isSubmitting}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? "กำลังบันทึก..." : "ยืนยันแก้ไขประกาศ"}
            </button>
          </div>
        )}
      </main>

      {/* Cancel Edit Confirmation Modal */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ยกเลิกการแก้ไขข้อมูล</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirmModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirmModal(false);
                  router.push("/owner/announcements");
                }}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Mentor Confirmation Modal */}
      {showDeleteMentorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ยืนยันการลบข้อมูลพี่เลี้ยง</h3>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteMentorModal(false);
                  setDeleteMentorIndex(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={confirmDeleteMentor}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">ลบข้อมูลเรียบร้อยแล้ว</h3>
          </div>
        </div>
      )}

      {/* Edit Confirmation Modal */}
      {showEditConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ยืนยันการ<br />แก้ไขประกาศหรือไม่</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditConfirmModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Success Modal */}
      {showEditSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">แก้ไขประกาศเรียบร้อยแล้ว</h3>
          </div>
        </div>
      )}

      {editErrorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full">
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">{editErrorModal.title}</h3>
              <p className="text-lg text-gray-500 leading-relaxed whitespace-pre-line mb-8">{editErrorModal.message}</p>
              <button
                onClick={() => setEditErrorModal(null)}
                className="px-10 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors text-lg font-medium"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
