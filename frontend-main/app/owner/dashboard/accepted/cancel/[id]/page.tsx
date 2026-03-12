"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import OwnerNavbar from "../../../../../components/ui/OwnerNavbar";
import {
  Application,
  fetchAllApplications,
} from "../../../utils/applicationMapper";

// Thai month names
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

// Format date to Thai format
const formatDateThai = (dateString: string): string => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  return `${day} ${thaiMonths[month]} ${year}`;
};

export default function CancelInternshipPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  useEffect(() => {
    fetchAllApplications().then((apps) => {
      const found = apps.find((app) => app.id === applicationId);
      setApplication(found || null);
    });
  }, [applicationId]);

  const [reason, setReason] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showMentorInfo, setShowMentorInfo] = useState(false);

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OwnerNavbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p>ไม่พบข้อมูลใบสมัคร</p>
        </div>
      </div>
    );
  }

  const hasDocuments =
    application.documents && application.documents.length > 0;
  const hasAnalysisDocuments =
    application.analysisDocuments && application.analysisDocuments.length > 0;

  const handleConfirmCancel = () => {
    // Save cancellation to localStorage
    const cancelledApps = (() => {
      try {
        const stored = localStorage.getItem("pea_cancelled_apps");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    })();

    const today = new Date();
    const buddhistYear = today.getFullYear() + 543;
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const cancelDate = `${buddhistYear}-${month}-${day}`;

    // Add this cancellation (avoid duplicates)
    if (!cancelledApps.find((c: { id: string }) => c.id === applicationId)) {
      cancelledApps.push({
        id: applicationId,
        reason: reason,
        cancelledBy: "เจ้าของหน่วยงาน",
        cancelledDate: cancelDate,
      });
      localStorage.setItem("pea_cancelled_apps", JSON.stringify(cancelledApps));
    }

    setShowConfirmModal(false);
    setShowSuccessModal(true);
    // Auto close success modal after 2 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
      router.push("/owner/dashboard/accepted");
    }, 500);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push("/owner/dashboard/accepted");
  };

  // Document icon SVG component
  const DocIcon = () => (
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z"
        fill="#A80689"
      />
    </svg>
  );

  // Download icon SVG component
  const DownloadIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <OwnerNavbar />

      {/* Search Section */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link
            href="/owner/dashboard"
            className="text-gray-500 hover:text-primary-600"
          >
            แดชบอร์ดพนักงาน
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-primary-600 font-medium">ยกเลิกฝึกงาน</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            ดำเนินการยกเลิกฝึกงาน
          </h1>
          <p className="text-gray-600">
            ใช้สำหรับยกเลิกสถานะการฝึกงานของผู้สมัคร
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Application Detail Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Name */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {application.firstName} {application.lastName}
            </h3>
            {/* Status badges below name */}
            <div className="flex flex-wrap gap-1 mb-4">
              <span className="text-sm px-3 py-1 rounded-full bg-[#DCFAE6] text-[#085D3A] border border-[#A9EFC5] font-medium">
                รับเข้าฝึกงาน
              </span>
              <span className="text-sm px-3 py-1 rounded-full bg-[#DCFAE6] text-[#085D3A] border border-[#A9EFC5] font-medium">
                เอกสารผ่าน
              </span>
            </div>

            {/* Department */}
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <svg
                width="20"
                height="19"
                viewBox="0 0 20 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM2 17H18V6H2V17ZM8 4H12V2H8V4Z"
                  fill="#A80689"
                />
              </svg>
              <span className="text-sm">
                นักศึกษาฝึกงาน ฝ่ายเทคโนโลยีสารสนเทศ
              </span>
            </div>

            {/* Training period card */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">
                    ระยะเวลาการฝึกงาน
                  </p>
                  <p className="text-gray-900 font-medium text-sm">
                    {formatDateThai(application.startDate)} -{" "}
                    {formatDateThai(application.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm mb-1">
                    ชั่วโมงที่ต้องฝึก
                  </p>
                  <p className="text-gray-900 font-medium text-sm">
                    {application.trainingHours} ชั่วโมง
                  </p>
                </div>
              </div>
            </div>

            {/* เอกสารแนบ */}
            <div className="mb-6">
              <h4 className="text-md font-bold text-gray-900 mb-3">
                เอกสารแนบ
              </h4>
              {hasDocuments ? (
                <div className="space-y-2">
                  {application.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <DocIcon />
                        <span className="text-gray-700 text-sm">
                          {doc.name}
                        </span>
                      </div>
                      <button className="p-2 text-gray-400 group-hover:text-primary-600 transition-colors">
                        <DownloadIcon />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="group flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <svg
                      width="16"
                      height="20"
                      viewBox="0 0 16 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z"
                        fill="#A80689"
                      />
                    </svg>
                    <span className="text-gray-400">ยังไม่มีเอกสารแนบ</span>
                  </div>
                </div>
              )}
            </div>

            {/* เอกสารแนบเพิ่ม */}
            <div className="mb-6">
              <h4 className="text-md font-bold text-gray-900 mb-3">
                เอกสารแนบเพิ่ม
              </h4>
              {hasAnalysisDocuments ? (
                <div className="space-y-2">
                  {application.analysisDocuments?.map((doc, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <DocIcon />
                        <span className="text-gray-700 text-sm">
                          เอกสารขอความอนุเคราะห์.PDF
                        </span>
                      </div>
                      <button className="p-2 text-gray-400 group-hover:text-primary-600 transition-colors">
                        <DownloadIcon />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="group flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <svg
                      width="16"
                      height="20"
                      viewBox="0 0 16 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z"
                        fill="#A80689"
                      />
                    </svg>
                    <span className="text-gray-400">ยังไม่มีเอกสารแนบ</span>
                  </div>
                </div>
              )}
            </div>

            {/* ข้อมูลติดต่อ */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="text-md font-bold text-gray-900 mb-3">
                ข้อมูลติดต่อ
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">อีเมล</p>
                  <p className="text-gray-900 text-sm">{application.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">เบอร์โทร</p>
                  <p className="text-gray-900 text-sm">{application.phone}</p>
                </div>
              </div>
            </div>

            {/* ข้อมูลเพิ่มเติมผู้สมัคร */}
            <div className="border-t border-gray-100">
              <button
                onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">
                  ข้อมูลเพิ่มเติมผู้สมัคร
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${showAdditionalInfo ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showAdditionalInfo && (
                <div className="pb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">
                        การศึกษาปัจจุบัน
                      </p>
                      <p className="font-medium text-gray-900">มหาวิทยาลัย</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">ชื่อสถาบัน</p>
                      <p className="font-medium text-gray-900">
                        {application.institution}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">คณะ</p>
                      <p className="font-medium text-gray-900">
                        เทคโนโลยีและการจัดการอุตสาหกรรม
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">สาขา</p>
                      <p className="font-medium text-gray-900">
                        {application.major}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">
                      ทักษะด้านต่าง ๆ ของผู้สมัคร
                    </p>
                    <p className="text-gray-900 text-sm">
                      มีทักษะ UX/UI ทำ Wireframe และออกแบบด้วย Figma เข้าใจ
                      Usability และ Responsive Design
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">
                      สิ่งที่คาดหวังจากการฝึกงาน
                    </p>
                    <p className="text-gray-900 text-sm">
                      {application.expectation ||
                        "คาดหวังได้เรียนรู้การทำงานจริงด้าน UX/UI และพัฒนาทักษะการออกแบบเพื่อนำไปใช้งานในอนาคต"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mentor Info Dropdown */}
            <div className="border-t border-gray-100">
              <button
                onClick={() => setShowMentorInfo(!showMentorInfo)}
                className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">
                  ข้อมูลพี่เลี้ยง
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${showMentorInfo ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showMentorInfo && (
                <div className="pb-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <div>
                        <p className="text-gray-400 text-sm">ชื่อพี่เลี้ยง</p>
                        <p className="font-medium text-gray-900">
                          {application.mentors?.[0]
                            ? `${application.mentors[0].fname || ""} ${application.mentors[0].lname || ""}`.trim() ||
                              "-"
                            : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <p className="text-gray-400 text-sm">อีเมล</p>
                        <p className="font-medium text-gray-900">
                          {application.mentors?.[0]?.email || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <div>
                        <p className="text-gray-400 text-sm">เบอร์โทร</p>
                        <p className="font-medium text-gray-900">
                          {application.mentors?.[0]?.phone || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-red-500 text-sm mt-3">
                    *หมายเหตุ:
                    หากประสงค์ให้ลงนามในเอกสารตอบรับกรุณาติดต่อพี่เลี้ยง
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cancel Reason Form */}
          <div className="h-fit">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                เหตุผลประกอบการยกเลิกฝึกงาน
              </h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="กรุณาระบุเหตุผลที่ชี้แจง..."
                className="w-full h-40 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring focus:ring-primary-600 focus:border-primary-500 text-gray-900 placeholder-gray-400"
              />
              <div className="flex justify-end gap-3 mt-6">
                <Link
                  href="/owner/dashboard/accepted"
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ยกเลิก
                </Link>
                <button
                  onClick={() => {
                    if (reason.trim()) {
                      setShowConfirmModal(true);
                    }
                  }}
                  disabled={!reason.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
                >
                  <svg
                    width="14"
                    height="15"
                    viewBox="0 0 14 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.5 15C2.04167 15 1.64931 14.8368 1.32292 14.5104C0.996528 14.184 0.833333 13.7917 0.833333 13.3333V2.5C0.597222 2.5 0.399306 2.42014 0.239583 2.26042C0.0798611 2.10069 0 1.90278 0 1.66667C0 1.43056 0.0798611 1.23264 0.239583 1.07292C0.399306 0.913194 0.597222 0.833333 0.833333 0.833333H4.16667C4.16667 0.597222 4.24653 0.399306 4.40625 0.239583C4.56597 0.0798611 4.76389 0 5 0H8.33333C8.56944 0 8.76736 0.0798611 8.92708 0.239583C9.08681 0.399306 9.16667 0.597222 9.16667 0.833333H12.5C12.7361 0.833333 12.934 0.913194 13.0938 1.07292C13.2535 1.23264 13.3333 1.43056 13.3333 1.66667C13.3333 1.90278 13.2535 2.10069 13.0938 2.26042C12.934 2.42014 12.7361 2.5 12.5 2.5V13.3333C12.5 13.7917 12.3368 14.184 12.0104 14.5104C11.684 14.8368 11.2917 15 10.8333 15H2.5ZM10.8333 2.5H2.5V13.3333H10.8333V2.5ZM5 11.6667C5.23611 11.6667 5.43403 11.5868 5.59375 11.4271C5.75347 11.2674 5.83333 11.0694 5.83333 10.8333V5C5.83333 4.76389 5.75347 4.56597 5.59375 4.40625C5.43403 4.24653 5.23611 4.16667 5 4.16667C4.76389 4.16667 4.56597 4.24653 4.40625 4.40625C4.24653 4.56597 4.16667 4.76389 4.16667 5V10.8333C4.16667 11.0694 4.24653 11.2674 4.40625 11.4271C4.56597 11.5868 4.76389 11.6667 5 11.6667ZM8.33333 11.6667C8.56944 11.6667 8.76736 11.5868 8.92708 11.4271C9.08681 11.2674 9.16667 11.0694 9.16667 10.8333V5C9.16667 4.76389 9.08681 4.56597 8.92708 4.40625C8.76736 4.24653 8.56944 4.16667 8.33333 4.16667C8.09722 4.16667 7.89931 4.24653 7.73958 4.40625C7.57986 4.56597 7.5 4.76389 7.5 5V10.8333C7.5 11.0694 7.57986 11.2674 7.73958 11.4271C7.89931 11.5868 8.09722 11.6667 8.33333 11.6667Z"
                      fill="white"
                    />
                  </svg>
                  ยืนยันการยกเลิกฝึกงาน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ยืนยันการยกเลิกฝึกงาน?
              </h3>
              <p className="text-gray-600 mb-6">
                คุณต้องการยกเลิกการฝึกงานของ{" "}
                <span className="font-semibold">
                  {application.firstName} {application.lastName}
                </span>{" "}
                ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium cursor-pointer"
                >
                  ยืนยันยกเลิกฝึกงาน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ยกเลิกฝึกงานเรียบร้อย
              </h3>
              <p className="text-gray-600 mb-6">
                ระบบได้ดำเนินการยกเลิกฝึกงานเรียบร้อยแล้ว
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
