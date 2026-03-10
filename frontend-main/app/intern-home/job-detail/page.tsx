"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavbarIntern } from "../../components";
import Toast from "../../components/ui/Toast";
import VideoLoading from "../../components/ui/VideoLoading";
import { applicationApi, favoriteApi, jobIdToPositionId } from "../../services/api";

// Helper function to format date to Thai format
const formatDateToThai = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const thaiMonths = [
    "ม.ค", "ก.พ", "มี.ค", "เม.ย", "พ.ค", "มิ.ย",
    "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค"
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

// Default job detail (fallback)
const defaultJobDetail = {
  id: "1",
  title: "นักศึกษาฝึกงาน ฝ่ายเทคโนโลยีสารสนเทศ",
  location: "สำนักงานใหญ่ กรุงเทพฯ ตึก LED ชั้น 7",
  department: "กองงานออกแบบและพัฒนาระบบดิจิทัล 1",
  positions: "0/2 ตำแหน่ง",
  tags: ["เทคโนโลยีสารสนเทศ", "วิทยาการคอมพิวเตอร์", "วิศวกรรมคอมพิวเตอร์"],
  applicationPeriod: "1 ต.ค 2568 - 31 ก.ค 2569",
  responsibilities: [
    "ออกแบบเว็บไซต์และ User Interface",
    "เรียนรู้และใช้โปรแกรม Figma ในการออกแบบ",
    "ทำงานร่วมกับทีมพัฒนาในการวิเคราะห์และแก้ไขปัญหา",
    "พัฒนาและปรับปรุง Web Application",
  ],
  qualifications: [
    "กำลังศึกษาอยู่ชั้นปริญญาตรี สาขาเทคโนโลยีสารสนเทศ",
    "มีทักษะการสื่อสารทำงานเป็นทีม",
    "สามารถฝึกงานได้เต็มเวลา 5 วันต่อสัปดาห์",
    "มีความสนใจในการเรียนรู้เทคโนโลยีใหม่ ๆ",
  ],
  benefits: "ไม่มีค่าตอบแทน",
};

interface JobDetail {
  id: string;
  title: string;
  location: string;
  department: string;
  positions: string;
  tags: string[];
  applicationPeriod: string;
  startDate?: string;
  endDate?: string;
  recruitStartDate?: string;
  recruitEndDate?: string;
  responsibilities: string[];
  qualifications: string[];
  benefits?: string;
  maxApplicants?: number;
  currentApplicants?: number;
  requiredDocuments?: string[];
  supervisorName?: string;
  supervisorEmail?: string;
  supervisorPhone?: string;
  mentorName?: string;
  mentorEmail?: string;
  mentorPhone?: string;
}

export default function InternJobDetailPage() {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobDetail>(defaultJobDetail);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [isLoading, setIsLoading] = useState(true);

  // Load job from localStorage on mount
  useEffect(() => {
    const loadJobDetail = () => {
      setIsLoading(true);

      // Load from selectedJobDetail (when clicking "go to" button)
      const savedJob = localStorage.getItem("selectedJobDetail");

      if (savedJob) {
        const parsedJob = JSON.parse(savedJob);

        // Use data directly from localStorage (already parsed from API in intern-home page)
        setJobDetail({
          ...defaultJobDetail,
          id: parsedJob.id || defaultJobDetail.id,
          title: parsedJob.title || defaultJobDetail.title,
          location: parsedJob.location || defaultJobDetail.location,
          department: parsedJob.department || defaultJobDetail.department,
          tags: parsedJob.tags || defaultJobDetail.tags,
          applicationPeriod: parsedJob.applicationPeriod ||
            (parsedJob.startDate && parsedJob.endDate
              ? `${parsedJob.startDate} - ${parsedJob.endDate}`
              : defaultJobDetail.applicationPeriod),
          positions: parsedJob.positions || ((parsedJob.maxApplicants || 0) === 0 ? "ไม่จำกัดจำนวน" : `0/${parsedJob.maxApplicants || 1} ตำแหน่ง`),
          responsibilities: parsedJob.responsibilities || defaultJobDetail.responsibilities,
          qualifications: parsedJob.qualifications || defaultJobDetail.qualifications,
          benefits: parsedJob.benefits || defaultJobDetail.benefits,
          recruitStartDate: parsedJob.recruitStartDate,
          recruitEndDate: parsedJob.recruitEndDate,
          requiredDocuments: parsedJob.requiredDocuments,
          supervisorName: parsedJob.supervisorName,
          supervisorEmail: parsedJob.supervisorEmail,
          supervisorPhone: parsedJob.supervisorPhone,
          mentorName: parsedJob.mentorName,
          mentorEmail: parsedJob.mentorEmail,
          mentorPhone: parsedJob.mentorPhone,
        });

        // Check favorites
        const savedFavorites = localStorage.getItem("favorites");
        if (savedFavorites) {
          const favorites: string[] = JSON.parse(savedFavorites);
          setIsFavorite(favorites.includes(parsedJob.id));
        }
      }

      setIsLoading(false);
    };

    loadJobDetail();
  }, []);

  const handleToggleFavorite = async () => {
    const positionId = jobIdToPositionId(jobDetail.id);
    let message: string;
    let type: "success" | "error";

    if (isFavorite) {
      // Remove favorite via API
      if (positionId) {
        await favoriteApi.removeFavorite(positionId);
      }
      // Update localStorage
      const savedFavorites = localStorage.getItem("favorites");
      let favorites: string[] = savedFavorites ? JSON.parse(savedFavorites) : [];
      favorites = favorites.filter((id) => id !== jobDetail.id);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      message = "ลบตำแหน่งงานออกจากรายการโปรดแล้ว";
      type = "error";
    } else {
      // Add favorite via API
      if (positionId) {
        await favoriteApi.addFavorite(positionId);
      }
      // Update localStorage
      const savedFavorites = localStorage.getItem("favorites");
      let favorites: string[] = savedFavorites ? JSON.parse(savedFavorites) : [];
      favorites = [...favorites, jobDetail.id];
      localStorage.setItem("favorites", JSON.stringify(favorites));
      message = "บันทึกตำแหน่งงานของคุณเรียบร้อยแล้ว";
      type = "success";
    }

    setIsFavorite(!isFavorite);

    // Dispatch event to update Navbar favorites count
    window.dispatchEvent(new Event("favoritesUpdated"));

    // Show toast notification
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleApply = async () => {
    // ตรวจสอบว่าตำแหน่งเต็มหรือไม่
    if ((jobDetail.maxApplicants ?? 0) > 0 && (jobDetail.currentApplicants ?? 0) >= (jobDetail.maxApplicants ?? 0)) {
      setToastMessage("ตำแหน่งนี้รับสมัครเต็มแล้ว");
      setToastType("error");
      setShowToast(true);
      return;
    }
    // Call API to validate application (backend checks internshipStatus + position status)
    const positionId = jobIdToPositionId(jobDetail.id);
    if (positionId) {
      try {
        await applicationApi.createApplication(positionId);
        // Store positionId for use in intern-info page
        localStorage.setItem("currentPositionId", String(positionId));
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        const msg = error?.response?.data?.message || "ไม่สามารถสมัครได้ กรุณาลองใหม่อีกครั้ง";
        setToastMessage(msg);
        setToastType("error");
        setShowToast(true);
        return;
      }
    }

    router.push("/intern-info");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <NavbarIntern />

      {/* Loading State */}
      {isLoading ? (
        <VideoLoading message="กำลังโหลดข้อมูล..." />
      ) : (
        <>
          {/* Main Content */}
          <main className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-8">
            {/* Breadcrumb - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2 text-sm mb-4">
              <Link
                href="/intern-home"
                className="text-gray-500 hover:text-primary-600"
              >
                ตำแหน่งฝึกงาน
              </Link>
              <span className="text-gray-400">&gt;</span>
              <span className="text-primary-600 font-medium">รายละเอียดงาน</span>
            </div>

            {/* Page Title - Mobile: Job title in purple, Desktop: Section title */}
            <h1 className="text-xl lg:text-2xl font-bold text-black lg:text-gray-800 mb-4 lg:mb-6">{jobDetail.title}</h1>

            {/* Job Summary Card - Card styling only on desktop */}
            <div className="lg:bg-white lg:rounded-2xl lg:shadow-sm lg:p-6 mb-6">
              <div className="hidden lg:flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-black mb-4">
                    {jobDetail.title}
                  </h2>

                  <div className="space-y-3 text-sm text-gray-600">
                    {/* Location */}
                    <div className="flex items-center gap-3">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 19.325C7.76667 19.325 7.53333 19.2833 7.3 19.2C7.06667 19.1167 6.85833 18.9917 6.675 18.825C5.59167 17.825 4.63333 16.85 3.8 15.9C2.96667 14.95 2.27083 14.0292 1.7125 13.1375C1.15417 12.2458 0.729167 11.3875 0.4375 10.5625C0.145833 9.7375 0 8.95 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 8.95 15.8542 9.7375 15.5625 10.5625C15.2708 11.3875 14.8458 12.2458 14.2875 13.1375C13.7292 14.0292 13.0333 14.95 12.2 15.9C11.3667 16.85 10.4083 17.825 9.325 18.825C9.14167 18.9917 8.93333 19.1167 8.7 19.2C8.46667 19.2833 8.23333 19.325 8 19.325ZM8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span>{jobDetail.location}</span>
                    </div>

                    {/* Department */}
                    <div className="flex items-center gap-3">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H4V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V8H16C16.55 8 17.0208 8.19583 17.4125 8.5875C17.8042 8.97917 18 9.45 18 10V16C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H10V14H8V18H2ZM2 16H4V14H2V16ZM2 12H4V10H2V12ZM2 8H4V6H2V8ZM6 12H8V10H6V12ZM6 8H8V6H6V8ZM6 4H8V2H6V4ZM10 12H12V10H10V12ZM10 8H12V6H10V8ZM10 4H12V2H10V4ZM14 16H16V14H14V16ZM14 12H16V10H14V12Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span>{jobDetail.department}</span>
                    </div>

                    {/* Positions */}
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span>{jobDetail.positions}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex items-start gap-3">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0 mt-0.5"
                      >
                        <path
                          d="M6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H18C18.55 2 19.0208 2.19583 19.4125 2.5875C19.8042 2.97917 20 3.45 20 4V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM6 20H18V4H16V10.125C16 10.325 15.9167 10.4708 15.75 10.5625C15.5833 10.6542 15.4167 10.65 15.25 10.55L14.025 9.8C13.8583 9.7 13.6875 9.65 13.5125 9.65C13.3375 9.65 13.1667 9.7 13 9.8L11.775 10.55C11.6083 10.65 11.4375 10.6542 11.2625 10.5625C11.0875 10.4708 11 10.325 11 10.125V4H6V20Z"
                          fill="#A80689"
                        />
                      </svg>
                      <div className="flex gap-2 flex-wrap">
                        {jobDetail.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-gray-800 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Application Period */}
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 11 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.24167 1.75833C8.08055 1.59722 8 1.4 8 1.16667C8 0.933333 8.08055 0.736111 8.24167 0.575C8.40278 0.413889 8.6 0.333333 8.83333 0.333333C9.06667 0.333333 9.26389 0.413889 9.425 0.575C9.58611 0.736111 9.66667 0.933333 9.66667 1.16667C9.66667 1.4 9.58611 1.59722 9.425 1.75833C9.26389 1.91944 9.06667 2 8.83333 2C8.6 2 8.40278 1.91944 8.24167 1.75833ZM8.24167 12.7583C8.08055 12.5972 8 12.4 8 12.1667C8 11.9333 8.08055 11.7361 8.24167 11.575C8.40278 11.4139 8.6 11.3333 8.83333 11.3333C9.06667 11.3333 9.26389 11.4139 9.425 11.575C9.58611 11.7361 9.66667 11.9333 9.66667 12.1667C9.66667 12.4 9.58611 12.5972 9.425 12.7583C9.26389 12.9194 9.06667 13 8.83333 13C8.6 13 8.40278 12.9194 8.24167 12.7583ZM10.9083 4.09167C10.7472 3.93056 10.6667 3.73333 10.6667 3.5C10.6667 3.26667 10.7472 3.06944 10.9083 2.90833C11.0694 2.74722 11.2667 2.66667 11.5 2.66667C11.7333 2.66667 11.9306 2.74722 12.0917 2.90833C12.2528 3.06944 12.3333 3.26667 12.3333 3.5C12.3333 3.73333 12.2528 3.93056 12.0917 4.09167C11.9306 4.25278 11.7333 4.33333 11.5 4.33333C11.2667 4.33333 11.0694 4.25278 10.9083 4.09167ZM10.9083 10.425C10.7472 10.2639 10.6667 10.0667 10.6667 9.83333C10.6667 9.6 10.7472 9.40278 10.9083 9.24167C11.0694 9.08055 11.2667 9 11.5 9C11.7333 9 11.9306 9.08055 12.0917 9.24167C12.2528 9.40278 12.3333 9.6 12.3333 9.83333C12.3333 10.0667 12.2528 10.2639 12.0917 10.425C11.9306 10.5861 11.7333 10.6667 11.5 10.6667C11.2667 10.6667 11.0694 10.5861 10.9083 10.425ZM11.9083 7.25833C11.7472 7.09722 11.6667 6.9 11.6667 6.66667C11.6667 6.43333 11.7472 6.23611 11.9083 6.075C12.0694 5.91389 12.2667 5.83333 12.5 5.83333C12.7333 5.83333 12.9306 5.91389 13.0917 6.075C13.2528 6.23611 13.3333 6.43333 13.3333 6.66667C13.3333 6.9 13.2528 7.09722 13.0917 7.25833C12.9306 7.41944 12.7333 7.5 12.5 7.5C12.2667 7.5 12.0694 7.41944 11.9083 7.25833ZM6.66667 13.3333C5.74444 13.3333 4.87778 13.1583 4.06667 12.8083C3.25556 12.4583 2.55 11.9833 1.95 11.3833C1.35 10.7833 0.875 10.0778 0.525 9.26667C0.175 8.45555 0 7.58889 0 6.66667C0 5.74444 0.175 4.87778 0.525 4.06667C0.875 3.25556 1.35 2.55 1.95 1.95C2.55 1.35 3.25556 0.875 4.06667 0.525C4.87778 0.175 5.74444 0 6.66667 0V1.33333C5.17778 1.33333 3.91667 1.85 2.88333 2.88333C1.85 3.91667 1.33333 5.17778 1.33333 6.66667C1.33333 8.15555 1.85 9.41667 2.88333 10.45C3.91667 11.4833 5.17778 12 6.66667 12V13.3333ZM8.86667 9.8L6 6.93333V3.33333H7.33333V6.4L9.8 8.86667L8.86667 9.8Z" fill="#A80689" />
                      </svg>
                      <span>
                        ระยะเวลาที่เปิดรับสมัคร: {jobDetail.recruitStartDate && jobDetail.recruitEndDate && jobDetail.recruitStartDate !== "-" && jobDetail.recruitEndDate !== "-" ? `${jobDetail.recruitStartDate} - ${jobDetail.recruitEndDate}` : (jobDetail.applicationPeriod && jobDetail.applicationPeriod !== "- - -" ? jobDetail.applicationPeriod : "ไม่กำหนดระยะเวลา")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Hidden on mobile */}
                <div className="hidden lg:flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3">
                    {/* Bookmark Button */}
                    <button
                      onClick={handleToggleFavorite}
                      className="p-2 rounded-2xl  hover:bg-gray-100 transition-colors active:scale-95"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={isFavorite ? "#A80689" : "none"}
                        stroke={isFavorite ? "#A80689" : "#666"}
                        strokeWidth="2"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>

                    {/* Apply Button */}
                    <button
                      onClick={handleApply}
                      disabled={(jobDetail.maxApplicants ?? 0) > 0 && (jobDetail.currentApplicants ?? 0) >= (jobDetail.maxApplicants ?? 0)}
                      className={`px-8 py-2 border-2 rounded-lg font-medium transition-colors active:scale-95 ${(jobDetail.maxApplicants ?? 0) > 0 && (jobDetail.currentApplicants ?? 0) >= (jobDetail.maxApplicants ?? 0)
                          ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-primary-600 border-primary-600 text-white hover:bg-white hover:text-primary-600"
                        }`}
                      title={(jobDetail.maxApplicants ?? 0) > 0 && (jobDetail.currentApplicants ?? 0) >= (jobDetail.maxApplicants ?? 0) ? "ตำแหน่งนี้รับสมัครเต็มแล้ว" : undefined}
                    >
                      {(jobDetail.maxApplicants ?? 0) > 0 && (jobDetail.currentApplicants ?? 0) >= (jobDetail.maxApplicants ?? 0) ? "รับสมัครเต็มแล้ว" : "สมัคร"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Card - Card styling only on desktop */}
            <div className="lg:bg-white lg:rounded-3xl lg:shadow-sm lg:p-6">
              <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">
                รายละเอียดงาน
              </h3>

              {/* Responsibilities */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-4">ลักษณะงาน</h4>
                <ul className="space-y-3">
                  {jobDetail.responsibilities.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-gray-600"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M10.6 13.8L8.45 11.65C8.26667 11.4667 8.03333 11.375 7.75 11.375C7.46667 11.375 7.23333 11.4667 7.05 11.65C6.86667 11.8333 6.775 12.0667 6.775 12.35C6.775 12.6333 6.86667 12.8667 7.05 13.05L9.9 15.9C10.1 16.1 10.3333 16.2 10.6 16.2C10.8667 16.2 11.1 16.1 11.3 15.9L16.95 10.25C17.1333 10.0667 17.225 9.83333 17.225 9.55C17.225 9.26667 17.1333 9.03333 16.95 8.85C16.7667 8.66667 16.5333 8.575 16.25 8.575C15.9667 8.575 15.7333 8.66667 15.55 8.85L10.6 13.8ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z"
                          fill="#17B26A"
                        />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Qualifications */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-4">คุณสมบัติ</h4>
                <ul className="space-y-3">
                  {jobDetail.qualifications.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-gray-600"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 13.2833 8.09583 13.5208 8.2875 13.7125C8.47917 13.9042 8.71667 14 9 14ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-4">สวัสดิการ</h4>
                <div className="space-y-2">
                  {(jobDetail.benefits ? jobDetail.benefits.split(/\r?\n/).filter(b => b.trim()) : ["ไม่มีค่าตอบแทน"]).map((item, index) => (
                    <div key={index} className="flex items-start gap-3 text-gray-600">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 20 19"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM2 17H18V6H2V17ZM8 4H12V2H8V4Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Documents */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-4">เอกสารที่ต้องใช้</h4>
                <div className="space-y-2">
                  {(jobDetail.requiredDocuments || ["Transcript"]).map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-gray-600">
                      <svg width="24" height="24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.66667 10.3333V11.6667C9.66667 11.7556 9.7 11.8333 9.76667 11.9C9.83333 11.9667 9.91111 12 10 12C10.0889 12 10.1667 11.9667 10.2333 11.9C10.3 11.8333 10.3333 11.7556 10.3333 11.6667V10.3333H11.6667C11.7556 10.3333 11.8333 10.3 11.9 10.2333C11.9667 10.1667 12 10.0889 12 10C12 9.91111 11.9667 9.83333 11.9 9.76667C11.8333 9.7 11.7556 9.66667 11.6667 9.66667H10.3333V8.33333C10.3333 8.24444 10.3 8.16667 10.2333 8.1C10.1667 8.03333 10.0889 8 10 8C9.91111 8 9.83333 8.03333 9.76667 8.1C9.7 8.16667 9.66667 8.24444 9.66667 8.33333V9.66667H8.33333C8.24444 9.66667 8.16667 9.7 8.1 9.76667C8.03333 9.83333 8 9.91111 8 10C8 10.0889 8.03333 10.1667 8.1 10.2333C8.16667 10.3 8.24444 10.3333 8.33333 10.3333H9.66667ZM1.33333 12C0.966667 12 0.652778 11.8694 0.391667 11.6083C0.130556 11.3472 0 11.0333 0 10.6667V1.33333C0 0.966667 0.130556 0.652778 0.391667 0.391667C0.652778 0.130556 0.966667 0 1.33333 0H10.6667C11.0333 0 11.3472 0.130556 11.6083 0.391667C11.8694 0.652778 12 0.966667 12 1.33333V4.66667C12 4.85556 11.9361 5.01389 11.8083 5.14167C11.6806 5.26944 11.5222 5.33333 11.3333 5.33333C11.1444 5.33333 10.9861 5.26944 10.8583 5.14167C10.7306 5.01389 10.6667 4.85556 10.6667 4.66667V1.33333H1.33333V10.6667H4.66667C4.85556 10.6667 5.01389 10.7306 5.14167 10.8583C5.26944 10.9861 5.33333 11.1444 5.33333 11.3333C5.33333 11.5222 5.26944 11.6806 5.14167 11.8083C5.01389 11.9361 4.85556 12 4.66667 12H1.33333ZM1.33333 10.6667V1.33333V5.38333V5.33333V10.6667ZM2.66667 8.66667C2.66667 8.85555 2.73056 9.01389 2.85833 9.14167C2.98611 9.26944 3.14444 9.33333 3.33333 9.33333H4.71667C4.90556 9.33333 5.06389 9.26944 5.19167 9.14167C5.31944 9.01389 5.38333 8.85555 5.38333 8.66667C5.38333 8.47778 5.31944 8.31944 5.19167 8.19167C5.06389 8.06389 4.90556 8 4.71667 8H3.33333C3.14444 8 2.98611 8.06389 2.85833 8.19167C2.73056 8.31944 2.66667 8.47778 2.66667 8.66667ZM2.66667 6C2.66667 6.18889 2.73056 6.34722 2.85833 6.475C2.98611 6.60278 3.14444 6.66667 3.33333 6.66667H6.66667C6.85556 6.66667 7.01389 6.60278 7.14167 6.475C7.26944 6.34722 7.33333 6.18889 7.33333 6C7.33333 5.81111 7.26944 5.65278 7.14167 5.525C7.01389 5.39722 6.85556 5.33333 6.66667 5.33333H3.33333C3.14444 5.33333 2.98611 5.39722 2.85833 5.525C2.73056 5.65278 2.66667 5.81111 2.66667 6ZM2.66667 3.33333C2.66667 3.52222 2.73056 3.68056 2.85833 3.80833C2.98611 3.93611 3.14444 4 3.33333 4H8.66667C8.85555 4 9.01389 3.93611 9.14167 3.80833C9.26944 3.68056 9.33333 3.52222 9.33333 3.33333C9.33333 3.14444 9.26944 2.98611 9.14167 2.85833C9.01389 2.73056 8.85555 2.66667 8.66667 2.66667H3.33333C3.14444 2.66667 2.98611 2.73056 2.85833 2.85833C2.73056 2.98611 2.66667 3.14444 2.66667 3.33333ZM10 13.3333C9.07778 13.3333 8.29167 13.0083 7.64167 12.3583C6.99167 11.7083 6.66667 10.9222 6.66667 10C6.66667 9.07778 6.99167 8.29167 7.64167 7.64167C8.29167 6.99167 9.07778 6.66667 10 6.66667C10.9222 6.66667 11.7083 6.99167 12.3583 7.64167C13.0083 8.29167 13.3333 9.07778 13.3333 10C13.3333 10.9222 13.0083 11.7083 12.3583 12.3583C11.7083 13.0083 10.9222 13.3333 10 13.3333Z" fill="#A80689" />
                      </svg>
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor Info */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-4">รายละเอียดผู้ประกาศรับสมัคร</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C10.9 12 9.95833 11.6083 9.175 10.825C8.39167 10.0417 8 9.1 8 8C8 6.9 8.39167 5.95833 9.175 5.175C9.95833 4.39167 10.9 4 12 4C13.1 4 14.0417 4.39167 14.825 5.175C15.6083 5.95833 16 6.9 16 8C16 9.1 15.6083 10.0417 14.825 10.825C14.0417 11.6083 13.1 12 12 12ZM4 18V17.2C4 16.6333 4.14583 16.1125 4.4375 15.6375C4.72917 15.1625 5.11667 14.8 5.6 14.55C6.63333 14.0333 7.68333 13.6458 8.75 13.3875C9.81667 13.1292 10.9 13 12 13C13.1 13 14.1833 13.1292 15.25 13.3875C16.3167 13.6458 17.3667 14.0333 18.4 14.55C18.8833 14.8 19.2708 15.1625 19.5625 15.6375C19.8542 16.1125 20 16.6333 20 17.2V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18ZM6 18H18V17.2C18 17.0167 17.9542 16.85 17.8625 16.7C17.7708 16.55 17.65 16.4333 17.5 16.35C16.6 15.9 15.6917 15.5625 14.775 15.3375C13.8583 15.1125 12.9333 15 12 15C11.0667 15 10.1417 15.1125 9.225 15.3375C8.30833 15.5625 7.4 15.9 6.5 16.35C6.35 16.4333 6.22917 16.55 6.1375 16.7C6.04583 16.85 6 17.0167 6 17.2V18ZM12 10C12.55 10 13.0208 9.80417 13.4125 9.4125C13.8042 9.02083 14 8.55 14 8C14 7.45 13.8042 6.97917 13.4125 6.5875C13.0208 6.19583 12.55 6 12 6C11.45 6 10.9792 6.19583 10.5875 6.5875C10.1958 6.97917 10 7.45 10 8C10 8.55 10.1958 9.02083 10.5875 9.4125C10.9792 9.80417 11.45 10 12 10Z" fill="#A80689" />
                    </svg>
                    <span className="text-gray-600">{jobDetail.supervisorName || "ยังไม่ระบุ"}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 20C3.45 20 2.97917 19.8042 2.5875 19.4125C2.19583 19.0208 2 18.55 2 18V6C2 5.45 2.19583 4.97917 2.5875 4.5875C2.97917 4.19583 3.45 4 4 4H20C20.55 4 21.0208 4.19583 21.4125 4.5875C21.8042 4.97917 22 5.45 22 6V18C22 18.55 21.8042 19.0208 21.4125 19.4125C21.0208 19.8042 20.55 20 20 20H4ZM12 13L4 8V18H20V8L12 13ZM12 11L20 6H4L12 11ZM4 8V6V18V8Z" fill="#A80689" />
                    </svg>
                    <span className="text-gray-600">{jobDetail.supervisorEmail || "ยังไม่ระบุ"}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.95 21C17.8667 21 15.8083 20.5458 13.775 19.6375C11.7417 18.7292 9.89167 17.4417 8.225 15.775C6.55833 14.1083 5.27083 12.2583 4.3625 10.225C3.45417 8.19167 3 6.13333 3 4.05C3 3.75 3.1 3.5 3.3 3.3C3.5 3.1 3.75 3 4.05 3H8.1C8.33333 3 8.54167 3.07917 8.725 3.2375C8.90833 3.39583 9.01667 3.58333 9.05 3.8L9.7 7.3C9.73333 7.56667 9.725 7.79167 9.675 7.975C9.625 8.15833 9.53333 8.31667 9.4 8.45L6.975 10.9C7.30833 11.5167 7.70417 12.1125 8.1625 12.6875C8.62083 13.2625 9.125 13.8167 9.675 14.35C10.1917 14.8667 10.7333 15.3458 11.3 15.7875C11.8667 16.2292 12.4667 16.6333 13.1 17L15.45 14.65C15.6 14.5 15.7958 14.3875 16.0375 14.3125C16.2792 14.2375 16.5167 14.2167 16.75 14.25L20.2 14.95C20.4333 15.0167 20.625 15.1375 20.775 15.3125C20.925 15.4875 21 15.6833 21 15.9V19.95C21 20.25 20.9 20.5 20.7 20.7C20.5 20.9 20.25 21 19.95 21ZM6.025 9L7.675 7.35L7.25 5H5.025C5.10833 5.68333 5.225 6.35833 5.375 7.025C5.525 7.69167 5.74167 8.35 6.025 9ZM14.975 17.95C15.625 18.2333 16.2875 18.4583 16.9625 18.625C17.6375 18.7917 18.3167 18.9 19 18.95V16.75L16.65 16.275L14.975 17.95Z" fill="#A80689" />
                    </svg>
                    <span className="text-gray-600">{jobDetail.supervisorPhone || "ยังไม่ระบุ"}</span>
                  </div>
                </div>
              </div>

              {/* Mentor Info */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-4">รายละเอียดพี่เลี้ยง</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C10.9 12 9.95833 11.6083 9.175 10.825C8.39167 10.0417 8 9.1 8 8C8 6.9 8.39167 5.95833 9.175 5.175C9.95833 4.39167 10.9 4 12 4C13.1 4 14.0417 4.39167 14.825 5.175C15.6083 5.95833 16 6.9 16 8C16 9.1 15.6083 10.0417 14.825 10.825C14.0417 11.6083 13.1 12 12 12ZM4 18V17.2C4 16.6333 4.14583 16.1125 4.4375 15.6375C4.72917 15.1625 5.11667 14.8 5.6 14.55C6.63333 14.0333 7.68333 13.6458 8.75 13.3875C9.81667 13.1292 10.9 13 12 13C13.1 13 14.1833 13.1292 15.25 13.3875C16.3167 13.6458 17.3667 14.0333 18.4 14.55C18.8833 14.8 19.2708 15.1625 19.5625 15.6375C19.8542 16.1125 20 16.6333 20 17.2V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18ZM6 18H18V17.2C18 17.0167 17.9542 16.85 17.8625 16.7C17.7708 16.55 17.65 16.4333 17.5 16.35C16.6 15.9 15.6917 15.5625 14.775 15.3375C13.8583 15.1125 12.9333 15 12 15C11.0667 15 10.1417 15.1125 9.225 15.3375C8.30833 15.5625 7.4 15.9 6.5 16.35C6.35 16.4333 6.22917 16.55 6.1375 16.7C6.04583 16.85 6 17.0167 6 17.2V18ZM12 10C12.55 10 13.0208 9.80417 13.4125 9.4125C13.8042 9.02083 14 8.55 14 8C14 7.45 13.8042 6.97917 13.4125 6.5875C13.0208 6.19583 12.55 6 12 6C11.45 6 10.9792 6.19583 10.5875 6.5875C10.1958 6.97917 10 7.45 10 8C10 8.55 10.1958 9.02083 10.5875 9.4125C10.9792 9.80417 11.45 10 12 10Z" fill="#A80689" />
                    </svg>
                    <span className="text-gray-600">{jobDetail.mentorName || "ยังไม่ระบุ"}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 20C3.45 20 2.97917 19.8042 2.5875 19.4125C2.19583 19.0208 2 18.55 2 18V6C2 5.45 2.19583 4.97917 2.5875 4.5875C2.97917 4.19583 3.45 4 4 4H20C20.55 4 21.0208 4.19583 21.4125 4.5875C21.8042 4.97917 22 5.45 22 6V18C22 18.55 21.8042 19.0208 21.4125 19.4125C21.0208 19.8042 20.55 20 20 20H4ZM12 13L4 8V18H20V8L12 13ZM12 11L20 6H4L12 11ZM4 8V6V18V8Z" fill="#A80689" />
                    </svg>
                    <span className="text-gray-600">{jobDetail.mentorEmail || "ยังไม่ระบุ"}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.95 21C17.8667 21 15.8083 20.5458 13.775 19.6375C11.7417 18.7292 9.89167 17.4417 8.225 15.775C6.55833 14.1083 5.27083 12.2583 4.3625 10.225C3.45417 8.19167 3 6.13333 3 4.05C3 3.75 3.1 3.5 3.3 3.3C3.5 3.1 3.75 3 4.05 3H8.1C8.33333 3 8.54167 3.07917 8.725 3.2375C8.90833 3.39583 9.01667 3.58333 9.05 3.8L9.7 7.3C9.73333 7.56667 9.725 7.79167 9.675 7.975C9.625 8.15833 9.53333 8.31667 9.4 8.45L6.975 10.9C7.30833 11.5167 7.70417 12.1125 8.1625 12.6875C8.62083 13.2625 9.125 13.8167 9.675 14.35C10.1917 14.8667 10.7333 15.3458 11.3 15.7875C11.8667 16.2292 12.4667 16.6333 13.1 17L15.45 14.65C15.6 14.5 15.7958 14.3875 16.0375 14.3125C16.2792 14.2375 16.5167 14.2167 16.75 14.25L20.2 14.95C20.4333 15.0167 20.625 15.1375 20.775 15.3125C20.925 15.4875 21 15.6833 21 15.9V19.95C21 20.25 20.9 20.5 20.7 20.7C20.5 20.9 20.25 21 19.95 21ZM6.025 9L7.675 7.35L7.25 5H5.025C5.10833 5.68333 5.225 6.35833 5.375 7.025C5.525 7.69167 5.74167 8.35 6.025 9ZM14.975 17.95C15.625 18.2333 16.2875 18.4583 16.9625 18.625C17.6375 18.7917 18.3167 18.9 19 18.95V16.75L16.65 16.275L14.975 17.95Z" fill="#A80689" />
                    </svg>
                    <span className="text-gray-600">{jobDetail.mentorPhone || "ยังไม่ระบุ"}</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Fixed Bottom Bar - Mobile Only */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-40">
            <div className="flex items-center gap-3">
              <button
                onClick={handleApply}
                disabled={(jobDetail.maxApplicants ?? 0) > 0 && (jobDetail.currentApplicants ?? 0) >= (jobDetail.maxApplicants ?? 0)}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors text-lg active:scale-95 ${(jobDetail.maxApplicants ?? 0) > 0 && (jobDetail.currentApplicants ?? 0) >= (jobDetail.maxApplicants ?? 0)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-700"
                  }`}
              >
                {(jobDetail.maxApplicants ?? 0) > 0 && (jobDetail.currentApplicants ?? 0) >= (jobDetail.maxApplicants ?? 0) ? "รับสมัครเต็มแล้ว" : "สมัคร"}
              </button>
              <button
                onClick={handleToggleFavorite}
                className="p-3 border-2 border-gray-300 rounded-xl text-gray-500 hover:text-primary-600 hover:border-primary-600 transition-colors active:scale-95"
              >
                <svg
                  className="w-6 h-6"
                  fill={isFavorite ? "#A80689" : "none"}
                  stroke={isFavorite ? "#A80689" : "currentColor"}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          <Toast
            message={toastMessage}
            isVisible={showToast}
            onClose={() => setShowToast(false)}
            type={toastType}
            bottomOffset="bottom-24 lg:bottom-6"
          />
        </>
      )}
    </div>
  );
}
