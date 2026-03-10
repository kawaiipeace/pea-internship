"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavbarIntern } from "../components";
import VideoLoading from "../components/ui/VideoLoading";
import { applicationApi, MyApplicationData, APP_STATUS_TO_STEP, AppStatusEnum, positionApi, positionToJob } from "../services/api";

type ApplicationStatus =
  | "active"
  | "accepted"
  | "accepted-doc-failed"
  | "cancelled"
  | "rejected"
  | "completed"
  | "in-training";

interface AppliedJob {
  id: string;
  title: string;
  department: string;
  location: string;
  positions?: string;
  currentApplicants?: number;
  maxApplicants?: number;
  tags: string[];
  applicationPeriod?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  // Extra fields for per-card state
  positionId: number | null;
  applicationId: number;
  applicationStatus: ApplicationStatus;
  applicationStep: string | null;
  rejectionReason: string;
  isCurrentApplication: boolean;
}

// Map backend status to frontend ApplicationStatus
function mapBackendStatus(status: AppStatusEnum): ApplicationStatus {
  switch (status) {
    case "CANCEL":
      return "rejected";
    case "ABORT":
      return "cancelled";
    case "COMPLETE":
      return "completed";
    default:
      // All PENDING_* statuses are "active"
      return "active";
  }
}

export default function ApplicationHistoryPage() {
  const router = useRouter();
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load ALL application data from API on mount
  useEffect(() => {
    const loadApplications = async () => {
      try {
        const allApps = await applicationApi.getMyHistory();
        if (!allApps || allApps.length === 0) {
          setAppliedJobs([]);
          setIsLoading(false);
          return;
        }

        // Build all job cards in parallel
        const jobPromises = allApps.map(async (app, index) => {
          const appStatus = mapBackendStatus(app.applicationStatus);
          const appStep = APP_STATUS_TO_STEP[app.applicationStatus];
          const reason = ((app.applicationStatus === "CANCEL" || app.applicationStatus === "ABORT") && app.statusNote) ? app.statusNote : "";

          // Determine if this is the "current" application:
          // Only the first active (non-CANCEL/COMPLETE) application is considered current
          const isCurrent = app.isActive && app.applicationStatus !== "CANCEL" && app.applicationStatus !== "ABORT" && app.applicationStatus !== "COMPLETE";

          let department = "";
          let location = "";
          let positions = "";
          let tags: string[] = [];
          let applicationPeriod = "";
          let startDate = "";
          let endDate = "";
          let currentApplicants = 0;
          let maxApplicants = 0;

          if (app.positionId) {
            try {
              const position = await positionApi.getPositionById(app.positionId);
              if (position) {
                const jobData = positionToJob(position);
                department = jobData.department;
                location = jobData.location;
                tags = jobData.tags;
                applicationPeriod = jobData.recruitStartDate && jobData.recruitEndDate && jobData.recruitStartDate !== "-" && jobData.recruitEndDate !== "-" ? `${jobData.recruitStartDate} - ${jobData.recruitEndDate}` : "ไม่กำหนดระยะเวลา";
                startDate = jobData.startDate;
                endDate = jobData.endDate;
                currentApplicants = jobData.currentApplicants;
                maxApplicants = jobData.maxApplicants;
                positions = maxApplicants === 0 ? "ไม่จำกัดจำนวน" : `${currentApplicants}/${maxApplicants} คน`;
              }
            } catch { /* fallback to basic data */ }
          }

          return {
            id: `pos-${app.positionId}-${app.applicationId}`,
            positionId: app.positionId,
            applicationId: app.applicationId,
            title: app.positionName || "ตำแหน่งฝึกงาน",
            department,
            location,
            positions,
            currentApplicants,
            maxApplicants,
            tags,
            applicationPeriod,
            startDate,
            endDate,
            applicationStatus: appStatus,
            applicationStep: appStep,
            rejectionReason: reason,
            isCurrentApplication: isCurrent,
          } as AppliedJob;
        });

        const jobs = await Promise.all(jobPromises);
        setAppliedJobs(jobs);
      } catch {
        setAppliedJobs([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadApplications();
  }, []);

  const handleViewDetails = (job: AppliedJob) => {
    const { applicationStatus, applicationStep } = job;

    if (applicationStatus === "rejected") {
      router.push("/application-status?step=rejected");
    } else if (applicationStatus === "completed") {
      setShowEvaluationModal(true);
    } else if (applicationStatus === "cancelled") {
      router.push("/application-history/evaluation-result");
    } else if (applicationStatus === "accepted-doc-failed") {
      router.push("/application-status?step=รอการตรวจสอบ&docStatus=failed");
    } else if (applicationStatus === "in-training") {
      router.push("/application-history/evaluation-result?status=in-training");
    } else if (applicationStatus === "active") {
      if (applicationStep) {
        router.push(`/application-status?step=${encodeURIComponent(applicationStep)}`);
      } else {
        router.push("/application-status");
      }
    } else {
      router.push("/application-status?step=เสร็จสิ้น");
    }
  };

  const handleExternalLinkClick = (job: AppliedJob) => {
    const { applicationStatus, positionId, applicationId } = job;
    const params = new URLSearchParams();
    if (positionId) params.set("positionId", positionId.toString());
    params.set("applicationId", applicationId.toString());
    if (applicationStatus === "rejected") {
      params.set("status", "rejected");
    } else if (applicationStatus === "completed") {
      params.set("status", "completed");
    } else if (applicationStatus === "cancelled") {
      params.set("status", "cancelled");
    } else if (applicationStatus === "accepted-doc-failed") {
      params.set("status", "accepted-doc-failed");
    } else if (applicationStatus === "in-training") {
      params.set("status", "in-training");
    }
    router.push(`/application-history/job-detail?${params.toString()}`);
  };

  const getStatusBadges = (job: AppliedJob) => {
    const { applicationStatus, applicationStep } = job;

    if (applicationStatus === "active") {
      return (
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-full font-bold text-sm">
            กำลังดำเนินการ
          </span>
          {applicationStep && (
            <span className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-full font-bold text-sm">
              {applicationStep}
            </span>
          )}
        </div>
      );
    }

    switch (applicationStatus) {
      case "rejected":
        return (
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 bg-red-100 text-red-500 rounded-full font-bold text-sm">
              ไม่ผ่าน
            </span>
          </div>
        );
      case "completed":
        return (
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 bg-green-100 text-green-500 rounded-full font-bold text-sm">
              ฝึกงานเสร็จสิ้น
            </span>
          </div>
        );
      case "cancelled":
        return (
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 bg-gray-100 text-gray-500 rounded-full font-bold text-sm">
              ยกเลิกการสมัคร
            </span>
          </div>
        );
      case "in-training":
        return (
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 bg-yellow-100 text-yellow-600 rounded-full font-bold text-sm">
              อยู่ระหว่างฝึกงาน
            </span>
          </div>
        );
      case "accepted-doc-failed":
        return (
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 bg-green-100 text-green-500 rounded-full font-bold text-sm">
              รับเข้าฝึกงาน
            </span>
            <span className="px-3 py-2 bg-red-100 text-red-500 rounded-full font-bold text-sm">
              เอกสารไม่ผ่าน
            </span>
          </div>
        );
      default:
        return (
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 bg-green-100 text-green-500 rounded-full font-bold text-sm">
              รับเข้าฝึกงาน
            </span>
            <span className="px-3 py-2 bg-green-100 text-green-500 rounded-full font-bold text-sm">
              เอกสารผ่าน
            </span>
          </div>
        );
    }
  };

  const getButtonText = (job: AppliedJob) => {
    if (job.applicationStatus === "completed") return "ดูผลการประเมิน";
    if (job.applicationStatus === "active") return "ดูสถานะการสมัคร";
    return "ดูรายละเอียด";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarIntern />
        <VideoLoading message="กำลังโหลดประวัติการสมัคร..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <NavbarIntern />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">ประวัติการสมัคร</h1>
          <p className="text-gray-500">ข้อมูลการสมัครของคุณ</p>
        </div>

        {/* Application Cards or Empty State */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
            <h2 className="text-lg font-bold text-gray-800">
              รายการสมัครงานของฉัน
            </h2>
          </div>

          {appliedJobs.length === 0 ? (
            /* Empty State - No applications */
            <div className="flex flex-col items-center justify-center py-16">
              <img
                src="/images/Empty.png"
                alt="ไม่มีประวัติการสมัคร"
                className="w-32 h-32 mb-6 opacity-80"
              />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">
                ยังไม่มีประวัติการสมัคร
              </h3>
              <p className="text-gray-400 text-center text-sm max-w-md mb-6 leading-relaxed">
                คุณยังไม่ได้สมัครตำแหน่งฝึกงาน
                <br />
                ไปค้นหาตำแหน่งฝึกงานที่เหมาะสมกับคุณได้เลย
              </p>
              <button
                onClick={() => router.push("/intern-home")}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                ค้นหาตำแหน่งฝึกงาน
              </button>
            </div>
          ) : (
            /* All Job Cards */
            <div className="space-y-4">
              {appliedJobs.map((job) => (
                <div
                  key={job.id}
                  className="border-2 border-gray-200 rounded-xl p-4 cursor-pointer transition-transform active:border-primary-600 active:scale-[0.98] md:active:scale-100 hover:shadow-sm
                             md:pointer-events-none"
                  onClick={() => handleExternalLinkClick(job)}
                >
                  {/* Job Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3 gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base md:text-lg font-bold text-gray-800">
                          {job.title}
                        </h3>
                      </div>

                      {/* Status badges - shown below title on mobile */}
                      <div className="flex md:hidden items-center gap-2 mt-2">
                        {getStatusBadges(job)}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                      {/* Desktop: clickable icon only */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExternalLinkClick(job);
                        }}
                        className="md:pointer-events-auto cursor-pointer w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-primary-600 hover:bg-gray-100 transition-colors active:scale-95 active:text-primary-600"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 0C1.45 0 0.979167 0.195833 0.5875 0.5875C0.195833 0.979166 0 1.45 0 2V16C0 16.55 0.195833 17.0208 0.5875 17.4125C0.979167 17.8042 1.45 18 2 18H16C16.55 18 17.0208 17.8042 17.4125 17.4125C17.8042 17.0208 18 16.55 18 16V10C18 9.71667 17.9042 9.47917 17.7125 9.2875C17.5208 9.09583 17.2833 9 17 9C16.7167 9 16.4792 9.09583 16.2875 9.2875C16.0958 9.47917 16 9.71667 16 10V16H2V2H8C8.28333 2 8.52083 1.90417 8.7125 1.7125C8.90417 1.52083 9 1.28333 9 1C9 0.716667 8.90417 0.479168 8.7125 0.2875C8.52083 0.0958328 8.28333 0 8 0H2ZM14.6 2L6 10.6C5.81667 10.7833 5.72083 11.0125 5.7125 11.2875C5.70417 11.5625 5.8 11.8 6 12C6.18333 12.1833 6.41667 12.275 6.7 12.275C6.98333 12.275 7.21667 12.1833 7.4 12L16 3.425V6C16 6.28333 16.0958 6.52083 16.2875 6.7125C16.4792 6.90417 16.7167 7 17 7C17.2833 7 17.5208 6.90417 17.7125 6.7125C17.9042 6.52083 18 6.28333 18 6V1C18 0.716667 17.9042 0.479168 17.7125 0.2875C17.5208 0.0958328 17.2833 0 17 0H12C11.7167 0 11.4792 0.0958328 11.2875 0.2875C11.0958 0.479168 11 0.716667 11 1C11 1.28333 11.0958 1.52083 11.2875 1.7125C11.4792 1.90417 11.7167 2 12 2H14.6Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>

                      {/* Desktop: badge not clickable */}
                      <div className="md:pointer-events-none">
                        {getStatusBadges(job)}
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg
                        width="13"
                        height="17"
                        viewBox="0 0 16 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 19.325C7.76667 19.325 7.53333 19.2833 7.3 19.2C7.06667 19.1167 6.85833 18.9917 6.675 18.825C5.59167 17.825 4.63333 16.85 3.8 15.9C2.96667 14.95 2.27083 14.0292 1.7125 13.1375C1.15417 12.2458 0.729167 11.3875 0.4375 10.5625C0.145833 9.7375 0 8.95 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 8.95 15.8542 9.7375 15.5625 10.5625C15.2708 11.3875 14.8458 12.2458 14.2875 13.1375C13.7292 14.0292 13.0333 14.95 12.2 15.9C11.3667 16.85 10.4083 17.825 9.325 18.825C9.14167 18.9917 8.93333 19.1167 8.7 19.2C8.46667 19.2833 8.23333 19.325 8 19.325ZM8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span>{job.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg
                        width="15"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H4V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V8H16C16.55 8 17.0208 8.19583 17.4125 8.5875C17.8042 8.97917 18 9.45 18 10V16C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H10V14H8V18H2ZM2 16H4V14H2V16ZM2 12H4V10H2V12ZM2 8H4V6H2V8ZM6 12H8V10H6V12ZM6 8H8V6H6V8ZM6 4H8V2H6V4ZM10 12H12V10H10V12ZM10 8H12V6H10V8ZM10 4H12V2H10V4ZM14 16H16V14H14V16ZM14 12H16V10H14V12Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span>{job.department}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-5 text-primary-600"
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
                      <span>{job.positions || ((job.maxApplicants || 0) === 0 ? "ไม่จำกัดจำนวน" : `${job.currentApplicants || 0}/${job.maxApplicants || 0} คน`)}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 ">
                      <svg
                        width="18"
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
                        {job.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-gray-800 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 mt-2">
                      <svg width="15" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.24167 1.75833C8.08055 1.59722 8 1.4 8 1.16667C8 0.933333 8.08055 0.736111 8.24167 0.575C8.40278 0.413889 8.6 0.333333 8.83333 0.333333C9.06667 0.333333 9.26389 0.413889 9.425 0.575C9.58611 0.736111 9.66667 0.933333 9.66667 1.16667C9.66667 1.4 9.58611 1.59722 9.425 1.75833C9.26389 1.91944 9.06667 2 8.83333 2C8.6 2 8.40278 1.91944 8.24167 1.75833ZM8.24167 12.7583C8.08055 12.5972 8 12.4 8 12.1667C8 11.9333 8.08055 11.7361 8.24167 11.575C8.40278 11.4139 8.6 11.3333 8.83333 11.3333C9.06667 11.3333 9.26389 11.4139 9.425 11.575C9.58611 11.7361 9.66667 11.9333 9.66667 12.1667C9.66667 12.4 9.58611 12.5972 9.425 12.7583C9.26389 12.9194 9.06667 13 8.83333 13C8.6 13 8.40278 12.9194 8.24167 12.7583ZM10.9083 4.09167C10.7472 3.93056 10.6667 3.73333 10.6667 3.5C10.6667 3.26667 10.7472 3.06944 10.9083 2.90833C11.0694 2.74722 11.2667 2.66667 11.5 2.66667C11.7333 2.66667 11.9306 2.74722 12.0917 2.90833C12.2528 3.06944 12.3333 3.26667 12.3333 3.5C12.3333 3.73333 12.2528 3.93056 12.0917 4.09167C11.9306 4.25278 11.7333 4.33333 11.5 4.33333C11.2667 4.33333 11.0694 4.25278 10.9083 4.09167ZM10.9083 10.425C10.7472 10.2639 10.6667 10.0667 10.6667 9.83333C10.6667 9.6 10.7472 9.40278 10.9083 9.24167C11.0694 9.08055 11.2667 9 11.5 9C11.7333 9 11.9306 9.08055 12.0917 9.24167C12.2528 9.40278 12.3333 9.6 12.3333 9.83333C12.3333 10.0667 12.2528 10.2639 12.0917 10.425C11.9306 10.5861 11.7333 10.6667 11.5 10.6667C11.2667 10.6667 11.0694 10.5861 10.9083 10.425ZM11.9083 7.25833C11.7472 7.09722 11.6667 6.9 11.6667 6.66667C11.6667 6.43333 11.7472 6.23611 11.9083 6.075C12.0694 5.91389 12.2667 5.83333 12.5 5.83333C12.7333 5.83333 12.9306 5.91389 13.0917 6.075C13.2528 6.23611 13.3333 6.43333 13.3333 6.66667C13.3333 6.9 13.2528 7.09722 13.0917 7.25833C12.9306 7.41944 12.7333 7.5 12.5 7.5C12.2667 7.5 12.0694 7.41944 11.9083 7.25833ZM6.66667 13.3333C5.74444 13.3333 4.87778 13.1583 4.06667 12.8083C3.25556 12.4583 2.55 11.9833 1.95 11.3833C1.35 10.7833 0.875 10.0778 0.525 9.26667C0.175 8.45555 0 7.58889 0 6.66667C0 5.74444 0.175 4.87778 0.525 4.06667C0.875 3.25556 1.35 2.55 1.95 1.95C2.55 1.35 3.25556 0.875 4.06667 0.525C4.87778 0.175 5.74444 0 6.66667 0V1.33333C5.17778 1.33333 3.91667 1.85 2.88333 2.88333C1.85 3.91667 1.33333 5.17778 1.33333 6.66667C1.33333 8.15555 1.85 9.41667 2.88333 10.45C3.91667 11.4833 5.17778 12 6.66667 12V13.3333ZM8.86667 9.8L6 6.93333V3.33333H7.33333V6.4L9.8 8.86667L8.86667 9.8Z" fill="#A80689" />
                      </svg>
                      <span>
                        รอบที่เปิดรับสมัคร:{" "}
                        {job.applicationPeriod ||
                          `${job.startDate} - ${job.endDate}`}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {job.applicationStatus === "rejected" && job.rejectionReason && (
                    <div className="mt-3">
                      <h4 className="font-bold text-gray-800 text-sm mb-1.5">
                        เหตุผลที่ไม่ผ่าน
                      </h4>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm">
                          {job.rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* View Details Button - ONLY for the current/active application */}
                  {job.isCurrentApplication && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(job);
                      }}
                      className="w-full mt-4 py-3 bg-primary-600 border-2 border-primary-600 text-white rounded-xl font-medium hover:bg-white hover:text-primary-600 transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-95 active:bg-primary-700 active:text-white
                                 md:pointer-events-auto"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor" />
                      </svg>
                      {getButtonText(job)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evaluation Modal */}
        {showEvaluationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    แบบประเมินผลการฝึกงาน
                  </h2>
                  <p className="text-gray-600 mt-1">
                    ประเมินผลฝึกงานของ สมชาย ใจดี
                  </p>
                </div>
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="#61646C"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">{/* ... modal content ... */}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
