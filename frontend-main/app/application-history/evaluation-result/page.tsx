"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NavbarIntern } from "@/components";
import {
  applicationApi,
  studentProfileApi,
  userApi,
  applicationDocumentsApi,
  MyApplicationData,
} from "@/services/api";

// Institution type label mapping
const INST_TYPE_LABELS: Record<string, string> = {
  UNIVERSITY: "มหาวิทยาลัย",
  VOCATIONAL: "ปวส./ปวช.",
  SCHOOL: "มัธยมศึกษาตอนปลาย",
  OTHERS: "อื่น ๆ",
};

// Document type mapping
const DOC_TYPE_MAP: Record<number, { name: string; category: "score" | "additional" }> = {
  1: { name: "Transcript.PDF", category: "score" },
  2: { name: "Resume.PDF", category: "score" },
  3: { name: "Portfolio.PDF", category: "score" },
  4: { name: "เอกสารขอความอนุเคราะห์.PDF", category: "additional" },
};

interface EvalPageData {
  internName: string;
  position: string;
  internshipPeriod: string;
  requiredHours: string;
  documents: { name: string; type: string; url: string }[];
  cancellationReason: string;
  cancelledBy: string;
  cancelledDate: string;
  contactInfo: { email: string; phone: string };
  applicantInfo: {
    educationType: string;
    institution: string;
    faculty: string;
    major: string;
    skills: string;
    expectations: string;
  };
}

function formatThaiDate(d: string | null): string {
  if (!d) return "-";
  const date = new Date(d);
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

export default function EvaluationResultPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}>
      <EvaluationResultPage />
    </Suspense>
  );
}

function EvaluationResultPage() {
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [evalData, setEvalData] = useState<EvalPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const applicationId = searchParams.get("applicationId");
  const isInTraining = status === "in-training";

  const loadData = useCallback(async () => {
    try {
      const history = await applicationApi.getMyHistory();
      let app: MyApplicationData | null = null;
      if (applicationId) {
        app = history.find((h) => h.applicationId === Number(applicationId)) || null;
      }
      if (!app && history.length > 0) app = history[0];
      if (!app) return;

      const profileFull = await studentProfileApi.getMyStudentProfileFull();
      const profile = await userApi.getMyProfile();

      let docs: { name: string; type: string; url: string }[] = [];
      try {
        const docsRes = await applicationDocumentsApi.getDocuments({ limit: 50 });
        docs = docsRes.data.map((d) => {
          const mapped = DOC_TYPE_MAP[d.docTypeId];
          return {
            name: mapped?.name || d.docTypeName || `เอกสาร ${d.docTypeId}`,
            type: mapped?.category || "score",
            url: d.docFile || "#",
          };
        });
      } catch { /* docs may not be accessible */ }

      const startDate = formatThaiDate(profile?.studentProfile?.startDate || null);
      const endDate = formatThaiDate(profile?.studentProfile?.endDate || null);
      const period = startDate !== "-" && endDate !== "-" ? `${startDate} - ${endDate}` : "-";

      setEvalData({
        internName: `${profile?.user?.fname || ""} ${profile?.user?.lname || ""}`.trim() || "-",
        position: app.positionName || "-",
        internshipPeriod: period,
        requiredHours: profile?.studentProfile?.hours ? `${profile.studentProfile.hours} ชั่วโมง` : "-",
        documents: docs,
        cancellationReason: app.statusNote || "-",
        cancelledBy: "-",
        cancelledDate: formatThaiDate(app.updatedAt),
        contactInfo: { email: profile?.user?.email || "-", phone: profile?.user?.phoneNumber || "-" },
        applicantInfo: {
          educationType: profileFull?.institution ? (INST_TYPE_LABELS[profileFull.institution.institutionsType] || profileFull.institution.institutionsType) : "-",
          institution: profileFull?.institution?.name || "-",
          faculty: profileFull?.faculty?.name || "-",
          major: profile?.studentProfile?.major || "-",
          skills: "-",
          expectations: "-",
        },
      });
    } catch (err) {
      console.error("Failed to load evaluation data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { loadData(); }, [loadData]);

  const data = evalData;

  // Function to open document in new tab
  const handleDocumentClick = (url: string) => {
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarIntern />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarIntern />
        <div className="text-center py-20 text-gray-500">ไม่พบข้อมูลใบสมัคร</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <NavbarIntern />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <Link
            href="/application-history"
            className="text-gray-500 hover:text-primary-600"
          >
            ประวัติการสมัคร
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-primary-600 font-medium">
            ผลประเมินการฝึกงาน
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            ผลประเมินการฝึกงาน
          </h1>
          <p className="text-gray-500">ดูผลประเมินการฝึกงานของผู้สมัคร</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Intern Info */}
          <div className="space-y-6">
            {/* Intern Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {data.internName}
                </h2>
                {isInTraining ? (
                  <div className="flex gap-2">
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-600 rounded-full font-bold text-sm">
                      อยู่ระหว่างฝึกงาน
                    </span>
                  </div>
                ) : (
                  <span className="px-4 py-2 bg-red-100 text-red-500 rounded-full font-bold text-sm">
                    ยกเลิกฝึกงาน
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z"
                    fill="#A80689"
                  />
                </svg>
                <span>{data.position}</span>
              </div>

              {/* Internship Period Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    ระยะเวลาการฝึกงาน
                  </p>
                  <p className="font-medium text-gray-700">
                    {data.internshipPeriod}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    ชั่วโมงที่ต้องฝึก
                  </p>
                  <p className="font-medium text-gray-700">
                    {data.requiredHours}
                  </p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">เอกสารแนบ</h3>
                {data.documents
                  .filter((doc) => doc.type === "score")
                  .map((doc, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl mb-2 cursor-pointer transition-colors hover:bg-primary-100 hover:border-primary-600"
                      onClick={() => handleDocumentClick(doc.url)}
                    >
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

                        <span className="text-gray-700">{doc.name}</span>
                      </div>
                      <button
                        className="p-2 cursor-pointer rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download logic here
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-gray-800 group-hover:text-primary-600 transition-colors"
                        >
                          <path
                            d="M8 11.575C7.86667 11.575 7.74167 11.5542 7.625 11.5125C7.50833 11.4708 7.4 11.4 7.3 11.3L3.7 7.7C3.5 7.5 3.40417 7.26667 3.4125 7C3.42083 6.73333 3.51667 6.5 3.7 6.3C3.9 6.1 4.1375 5.99583 4.4125 5.9875C4.6875 5.97917 4.925 6.075 5.125 6.275L7 8.15V1C7 0.716667 7.09583 0.479167 7.2875 0.2875C7.47917 0.0958333 7.71667 0 8 0C8.28333 0 8.52083 0.0958333 8.7125 0.2875C8.90417 0.479167 9 0.716667 9 1V8.15L10.875 6.275C11.075 6.075 11.3125 5.97917 11.5875 5.9875C11.8625 5.99583 12.1 6.1 12.3 6.3C12.4833 6.5 12.5792 6.73333 12.5875 7C12.5958 7.26667 12.5 7.5 12.3 7.7L8.7 11.3C8.6 11.4 8.49167 11.4708 8.375 11.5125C8.25833 11.5542 8.13333 11.575 8 11.575ZM2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V12C0 11.7167 0.0958333 11.4792 0.2875 11.2875C0.479167 11.0958 0.716667 11 1 11C1.28333 11 1.52083 11.0958 1.7125 11.2875C1.90417 11.4792 2 11.7167 2 12V14H14V12C14 11.7167 14.0958 11.4792 14.2875 11.2875C14.4792 11.0958 14.7167 11 15 11C15.2833 11 15.5208 11.0958 15.7125 11.2875C15.9042 11.4792 16 11.7167 16 12V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>

              {/* Additional Documents */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">เอกสารแนบเพิ่ม</h3>
                {data.documents
                  .filter((doc) => doc.type === "additional")
                  .map((doc, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl mb-2 cursor-pointer transition-colors hover:bg-primary-100 hover:border-primary-600"
                      onClick={() => handleDocumentClick(doc.url)}
                    >
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

                        <span className="text-gray-700">{doc.name}</span>
                      </div>
                      <button
                        className="p-2 cursor-pointer rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download logic here
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-gray-800 group-hover:text-primary-600 transition-colors"
                        >
                          <path
                            d="M8 11.575C7.86667 11.575 7.74167 11.5542 7.625 11.5125C7.50833 11.4708 7.4 11.4 7.3 11.3L3.7 7.7C3.5 7.5 3.40417 7.26667 3.4125 7C3.42083 6.73333 3.51667 6.5 3.7 6.3C3.9 6.1 4.1375 5.99583 4.4125 5.9875C4.6875 5.97917 4.925 6.075 5.125 6.275L7 8.15V1C7 0.716667 7.09583 0.479167 7.2875 0.2875C7.47917 0.0958333 7.71667 0 8 0C8.28333 0 8.52083 0.0958333 8.7125 0.2875C8.90417 0.479167 9 0.716667 9 1V8.15L10.875 6.275C11.075 6.075 11.3125 5.97917 11.5875 5.9875C11.8625 5.99583 12.1 6.1 12.3 6.3C12.4833 6.5 12.5792 6.73333 12.5875 7C12.5958 7.26667 12.5 7.5 12.3 7.7L8.7 11.3C8.6 11.4 8.49167 11.4708 8.375 11.5125C8.25833 11.5542 8.13333 11.575 8 11.575ZM2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V12C0 11.7167 0.0958333 11.4792 0.2875 11.2875C0.479167 11.0958 0.716667 11 1 11C1.28333 11 1.52083 11.0958 1.7125 11.2875C1.90417 11.4792 2 11.7167 2 12V14H14V12C14 11.7167 14.0958 11.4792 14.2875 11.2875C14.4792 11.0958 14.7167 11 15 11C15.2833 11 15.5208 11.0958 15.7125 11.2875C15.9042 11.4792 16 11.7167 16 12V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>

              {/* Contact Info */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-gray-800 mb-3">ข้อมูลติดต่อ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">อีเมล</p>
                    <p className="text-gray-700">
                      {data.contactInfo.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">เบอร์โทร</p>
                    <p className="text-gray-700">
                      {data.contactInfo.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ Additional Info Accordion (Merged into one block) */}
              <div className="mt-4 border border-gray-200 rounded-xl bg-white overflow-hidden ">
                <button
                  type="button"
                  onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-gray-800">
                    ข้อมูลเพิ่มเติมผู้สมัคร
                  </span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transform transition-transform ${
                      showAdditionalInfo ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M7 10L12 15L17 10H7Z" fill="#61646C" />
                  </svg>
                </button>

                {showAdditionalInfo && (
                  <div className="border-t border-gray-200 p-4 space-y-6 bg-white">
                    {/* Education Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">
                          การศึกษาปัจจุบัน
                        </p>
                        <p className="text-gray-700">
                          {data.applicantInfo.educationType}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">ชื่อสถาบัน</p>
                        <p className="text-gray-700">
                          {data.applicantInfo.institution}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">คณะ</p>
                        <p className="text-gray-700">
                          {data.applicantInfo.faculty}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">สาขา</p>
                        <p className="text-gray-700">
                          {data.applicantInfo.major}
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        ทักษะด้านต่าง ๆ ของผู้สมัคร
                      </p>
                      <p className="text-gray-700">
                        {data.applicantInfo.skills}
                      </p>
                    </div>

                    {/* Expectations */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        สิ่งที่คาดหวังจากการฝึกงาน
                      </p>
                      <p className="text-gray-700">
                        {data.applicantInfo.expectations}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Cancellation Info or In-Training Info */}
          <div>
            {isInTraining ? (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    อยู่ระหว่างฝึกงาน
                  </h2>
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                          fill="#D97706"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    ผู้สมัครกำลังอยู่ระหว่างการฝึกงาน
                    รอการประเมินผลเมื่อเสร็จสิ้นการฝึกงาน
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 mb-6">
                  <div className="flex items-start gap-2 mb-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 15C10.2833 15 10.5208 14.9042 10.7125 14.7125C10.9042 14.5208 11 14.2833 11 14V10C11 9.71667 10.9042 9.47917 10.7125 9.2875C10.5208 9.09583 10.2833 9 10 9C9.71667 9 9.47917 9.09583 9.2875 9.2875C9.09583 9.47917 9 9.71667 9 10V14C9 14.2833 9.09583 14.5208 9.2875 14.7125C9.47917 14.9042 9.71667 15 10 15ZM10 7C10.2833 7 10.5208 6.90417 10.7125 6.7125C10.9042 6.52083 11 6.28333 11 6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6C9 6.28333 9.09583 6.52083 9.2875 6.7125C9.47917 6.90417 9.71667 7 10 7ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20Z"
                        fill="#D97706"
                      />
                    </svg>
                    <span className="font-bold text-yellow-700">
                      ข้อมูลการฝึกงาน
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        ระยะเวลาฝึกงาน
                      </p>
                      <p className="font-medium text-gray-700">
                        {data.internshipPeriod}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        ชั่วโมงที่ต้องฝึก
                      </p>
                      <p className="font-medium text-gray-700">
                        {data.requiredHours}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    การฝึกงานถูกยกเลิก
                  </h2>
                  {/* Cancel Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <svg
                        width="36"
                        height="27"
                        viewBox="0 0 36 27"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M30.8333 11.5417L28.5 13.8333C28.1944 14.1389 27.8125 14.2986 27.3542 14.3125C26.8958 14.3264 26.5 14.1667 26.1667 13.8333C25.8611 13.5278 25.7083 13.1389 25.7083 12.6667C25.7083 12.1944 25.8611 11.8056 26.1667 11.5L28.4583 9.16667L26.1667 6.875C25.8611 6.56944 25.7083 6.1875 25.7083 5.72917C25.7083 5.27083 25.8611 4.875 26.1667 4.54167C26.5 4.20833 26.8958 4.04167 27.3542 4.04167C27.8125 4.04167 28.2083 4.20833 28.5417 4.54167L30.8333 6.83333L33.125 4.5C33.4306 4.16667 33.8125 4 34.2708 4C34.7292 4 35.125 4.16667 35.4583 4.5C35.7917 4.83333 35.9583 5.22917 35.9583 5.6875C35.9583 6.14583 35.7917 6.54167 35.4583 6.875L33.1667 9.16667L35.5 11.5C35.8333 11.8333 35.9931 12.2222 35.9792 12.6667C35.9653 13.1111 35.7917 13.5 35.4583 13.8333C35.125 14.1389 34.7361 14.2986 34.2917 14.3125C33.8472 14.3264 33.4583 14.1667 33.125 13.8333L30.8333 11.5417ZM13.3333 13.3333C11.5 13.3333 9.93056 12.6806 8.625 11.375C7.31945 10.0694 6.66667 8.5 6.66667 6.66667C6.66667 4.83333 7.31945 3.26389 8.625 1.95833C9.93056 0.652778 11.5 0 13.3333 0C15.1667 0 16.7361 0.652778 18.0417 1.95833C19.3472 3.26389 20 4.83333 20 6.66667C20 8.5 19.3472 10.0694 18.0417 11.375C16.7361 12.6806 15.1667 13.3333 13.3333 13.3333ZM0 23.3333V22C0 21.0556 0.243056 20.1875 0.729167 19.3958C1.21528 18.6042 1.86111 18 2.66667 17.5833C4.38889 16.7222 6.13889 16.0764 7.91667 15.6458C9.69444 15.2153 11.5 15 13.3333 15C15.1667 15 16.9722 15.2153 18.75 15.6458C20.5278 16.0764 22.2778 16.7222 24 17.5833C24.8056 18 25.4514 18.6042 25.9375 19.3958C26.4236 20.1875 26.6667 21.0556 26.6667 22V23.3333C26.6667 24.25 26.3403 25.0347 25.6875 25.6875C25.0347 26.3403 24.25 26.6667 23.3333 26.6667H3.33333C2.41667 26.6667 1.63194 26.3403 0.979167 25.6875C0.326389 25.0347 0 24.25 0 23.3333ZM3.33333 23.3333H23.3333V22C23.3333 21.6944 23.2569 21.4167 23.1042 21.1667C22.9514 20.9167 22.75 20.7222 22.5 20.5833C21 19.8333 19.4861 19.2708 17.9583 18.8958C16.4306 18.5208 14.8889 18.3333 13.3333 18.3333C11.7778 18.3333 10.2361 18.5208 8.70833 18.8958C7.18056 19.2708 5.66667 19.8333 4.16667 20.5833C3.91667 20.7222 3.71528 20.9167 3.5625 21.1667C3.40972 21.4167 3.33333 21.6944 3.33333 22V23.3333ZM13.3333 10C14.25 10 15.0347 9.67361 15.6875 9.02083C16.3403 8.36806 16.6667 7.58333 16.6667 6.66667C16.6667 5.75 16.3403 4.96528 15.6875 4.3125C15.0347 3.65972 14.25 3.33333 13.3333 3.33333C12.4167 3.33333 11.6319 3.65972 10.9792 4.3125C10.3264 4.96528 10 5.75 10 6.66667C10 7.58333 10.3264 8.36806 10.9792 9.02083C11.6319 9.67361 12.4167 10 13.3333 10Z"
                          fill="#F04438"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Cancellation Reason */}
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
                  <div className="flex items-start gap-2 mb-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 15C10.2833 15 10.5208 14.9042 10.7125 14.7125C10.9042 14.5208 11 14.2833 11 14V10C11 9.71667 10.9042 9.47917 10.7125 9.2875C10.5208 9.09583 10.2833 9 10 9C9.71667 9 9.47917 9.09583 9.2875 9.2875C9.09583 9.47917 9 9.71667 9 10V14C9 14.2833 9.09583 14.5208 9.2875 14.7125C9.47917 14.9042 9.71667 15 10 15ZM10 7C10.2833 7 10.5208 6.90417 10.7125 6.7125C10.9042 6.52083 11 6.28333 11 6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6C9 6.28333 9.09583 6.52083 9.2875 6.7125C9.47917 6.90417 9.71667 7 10 7ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z"
                        fill="#D92D20"
                      />
                    </svg>

                    <span className="font-bold text-red-600">
                      เหตุผลประกอบการยกเลิกฝึกงาน
                    </span>
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    {data.cancellationReason}
                  </p>

                  {/* ✅ เส้นคั่นแบบในรูป */}
                  <div className="my-4 h-px w-full bg-red-200/80" />

                  {/* Cancelled By Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        ผู้ดำเนินการ:
                      </p>
                      <p className="font-medium text-gray-700">
                        {data.cancelledBy}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        วันที่ยกเลิก:
                      </p>
                      <p className="font-medium text-gray-700">
                        {data.cancelledDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cancelled By Info */}
                {/* <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">ผู้ดำเนินการ:</p>
                  <p className="font-medium text-gray-700">
                    {data.cancelledBy}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">วันที่ยกเลิก:</p>
                  <p className="font-medium text-gray-700">
                    {data.cancelledDate}
                  </p>
                </div>
              </div> */}
              </div>
            )}

            {/* Back Button - Fixed on mobile */}
            <div className="hidden md:block mt-6">
              <div className="flex justify-center">
                <Link
                  href="/application-history"
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 border border-gray-300 transition-colors"
                >
                  ย้อนกลับ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Back Button for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <Link
          href="/application-history"
          className="block w-full py-3 bg-white text-primary-600 rounded-xl font-medium border-2 border-primary-600 text-center hover:bg-primary-50 transition-colors active:scale-95"
        >
          ย้อนกลับ
        </Link>
      </div>
    </div>
  );
}
