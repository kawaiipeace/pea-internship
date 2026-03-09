"use client";

import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { NavbarIntern } from "../components";
import VideoLoading from "../components/ui/VideoLoading";
import { applicationApi, MyApplicationData, APP_STATUS_TO_STEP, positionApi, positionToJob } from "../services/api";
import type { Job } from "../components/ui/JobCard";

type ApplicationStep =
  | "รอยื่นเอกสาร"
  | "รอสัมภาษณ์"
  | "รอการยืนยัน"
  | "รอยื่นเอกสารขอความอนุเคราะห์"
  | "รอการตรวจสอบ";

const steps: ApplicationStep[] = [
  "รอยื่นเอกสาร",
  "รอสัมภาษณ์",
  "รอการยืนยัน",
  "รอยื่นเอกสารขอความอนุเคราะห์",
  "รอการตรวจสอบ",
];

function ApplicationStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");

  const getInitialStep = (): ApplicationStep => {
    if (stepParam === "rejected") {
      return "รอการยืนยัน";
    }
    // When step is "เสร็จสิ้น", set to final step "รอการตรวจสอบ"
    if (stepParam === "เสร็จสิ้น") {
      return "รอการตรวจสอบ";
    }
    if (stepParam && steps.includes(stepParam as ApplicationStep)) {
      return stepParam as ApplicationStep;
    }
    return "รอยื่นเอกสาร";
  };

  const docStatusParam = searchParams.get("docStatus");

  const getInitialDocumentStatus = ():
    | "รอการดำเนินการ"
    | "รอการตรวจสอบ"
    | "เอกสารผ่าน"
    | "เอกสารไม่ผ่าน" => {
    // When coming from application history with document failed status
    if (docStatusParam === "failed") {
      return "เอกสารไม่ผ่าน";
    }
    if (stepParam === "เสร็จสิ้น") {
      return "เอกสารผ่าน";
    }
    // When step is รอการตรวจสอบ, document should be รอการตรวจสอบ
    if (stepParam === "รอการตรวจสอบ") {
      return "รอการตรวจสอบ";
    }
    // When step is รอยื่นเอกสารขอความอนุเคราะห์, document should be รอการดำเนินการ
    if (stepParam === "รอยื่นเอกสารขอความอนุเคราะห์") {
      return "รอการดำเนินการ";
    }
    return "รอการดำเนินการ";
  };

  const isRejectedApplication = stepParam === "rejected";

  const [currentStep, setCurrentStep] =
    useState<ApplicationStep>(getInitialStep());
  const [transcript, setTranscript] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [portfolio, setPortfolio] = useState<File | null>(null);

  // Applied job data from API
  const [appliedJob, setAppliedJob] = useState<Job | null>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(["Transcript"]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Save original file names for display persistence across page reloads
  const [transcriptName, setTranscriptName] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("uploadedTranscriptName") || "";
    return "";
  });
  const [resumeName, setResumeName] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("uploadedResumeName") || "";
    return "";
  });
  const [portfolioName, setPortfolioName] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("uploadedPortfolioName") || "";
    return "";
  });
  const [hasApplication, setHasApplication] = useState(false);

  // Load application data from API on mount
  useEffect(() => {
    const loadApplication = async () => {
      setIsLoadingData(true);
      try {
        const app = await applicationApi.getMyLatestApplication();
        if (app) {
          setApplicationId(app.applicationId);

          // Check if application is active (not cancelled or completed without stepParam)
          if (app.applicationStatus === "CANCEL" || app.applicationStatus === "COMPLETE") {
            if (!stepParam) {
              // No active application, show empty state
              setHasApplication(false);
            } else {
              setHasApplication(true);
            }
          } else {
            setHasApplication(true);
          }

          // Fetch full position data for required docs, mentor info, etc.
          if (app.positionId) {
            try {
              const position = await positionApi.getPositionById(app.positionId);
              if (position) {
                const jobData = positionToJob(position);
                // Set required documents from actual position data
                if (jobData.requiredDocuments && jobData.requiredDocuments.length > 0) {
                  setRequiredDocuments(jobData.requiredDocuments);
                }
                setAppliedJob({
                  id: `pos-${app.positionId}`,
                  title: jobData.title,
                  department: jobData.department,
                  location: jobData.location,
                  currentApplicants: jobData.currentApplicants,
                  maxApplicants: jobData.maxApplicants,
                  tags: jobData.tags,
                  applicationPeriod: `${jobData.applyStartDate} - ${jobData.applyEndDate}`,
                  startDate: jobData.startDate,
                  endDate: jobData.endDate,
                  requiredDocuments: jobData.requiredDocuments,
                  mentorName: jobData.mentorName,
                  mentorEmail: jobData.mentorEmail,
                  mentorPhone: jobData.mentorPhone,
                  supervisorName: jobData.supervisorName,
                  supervisorEmail: jobData.supervisorEmail,
                  supervisorPhone: jobData.supervisorPhone,
                } as Job);
              } else if (app.positionName) {
                // Fallback if position not found
                setAppliedJob({
                  id: `pos-${app.positionId}`,
                  title: app.positionName,
                  department: "",
                  location: "",
                  currentApplicants: 0,
                  maxApplicants: 0,
                  tags: [],
                  applicationPeriod: "",
                  startDate: "",
                  endDate: "",
                  requiredDocuments: requiredDocuments,
                } as Job);
              }
            } catch {
              // Fallback to basic data from history
              if (app.positionName) {
                setAppliedJob({
                  id: `pos-${app.positionId}`,
                  title: app.positionName,
                  department: "",
                  location: "",
                  currentApplicants: 0,
                  maxApplicants: 0,
                  tags: [],
                  applicationPeriod: "",
                  startDate: "",
                  endDate: "",
                  requiredDocuments: requiredDocuments,
                } as Job);
              }
            }
          }

          // If CANCEL, mark as rejected and store the reason
          if (app.applicationStatus === "CANCEL") {
            setIsRejected(true);
            if (app.statusNote) {
              setRejectionReason(app.statusNote);
            }
            // Set step to "รอการยืนยัน" (step 3) — rejection happens at interview/confirmation stage
            if (!stepParam) {
              setCurrentStep("รอการยืนยัน");
            }
          } else {
            // Set step from backend status if no stepParam override
            if (!stepParam) {
              const backendStep = APP_STATUS_TO_STEP[app.applicationStatus];
              if (backendStep && steps.includes(backendStep as ApplicationStep)) {
                setCurrentStep(backendStep as ApplicationStep);
              }
            }
          }
        }
      } catch { /* user might not be logged in */ } finally {
        setIsLoadingData(false);
      }
    };
    loadApplication();
  }, [stepParam]);

  // Check if all required documents are uploaded
  const allRequiredDocsUploaded = useCallback(() => {
    if (!transcript) return false;
    if (requiredDocuments.includes("Resume") && !resume) return false;
    if (requiredDocuments.includes("Portfolio") && !portfolio) return false;
    return true;
  }, [transcript, resume, portfolio, requiredDocuments]);

  // Check if documents should be shown as already uploaded (when viewing from ติดตามสถานะการสมัคร)
  // Also check currentStep (set from backend API status) so uploaded docs persist after navigation
  const isViewingCompleted =
    stepParam === "เสร็จสิ้น" ||
    stepParam === "รอยื่นเอกสารขอความอนุเคราะห์" ||
    stepParam === "รอการตรวจสอบ" ||
    stepParam === "รอสัมภาษณ์" ||
    stepParam === "รอการยืนยัน" ||
    stepParam === "rejected" ||
    (currentStep !== "รอยื่นเอกสาร" && !stepParam);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmSuccessModal, setShowConfirmSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [signatureOption, setSignatureOption] = useState<string>("");
  const [courtesyDocument, setCourtesyDocument] = useState<File | null>(null);
  const [isCourtesySubmitted, setIsCourtesySubmitted] = useState(false);
  const [documentStatus, _setDocumentStatus] = useState<
    "รอการดำเนินการ" | "รอการตรวจสอบ" | "เอกสารผ่าน" | "เอกสารไม่ผ่าน"
  >(getInitialDocumentStatus());

  // Wrapper to persist document status (no longer uses localStorage)
  const setDocumentStatus = (status: "รอการดำเนินการ" | "รอการตรวจสอบ" | "เอกสารผ่าน" | "เอกสารไม่ผ่าน") => {
    _setDocumentStatus(status);
  };
  const [documentError, setDocumentError] = useState<string>("");
  const [isReuploadReady, setIsReuploadReady] = useState(false);
  const [isMentorContactOpen, setIsMentorContactOpen] = useState(false);

  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const courtesyDocInputRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = steps.indexOf(currentStep);

  // Auto-dismiss success modal after 2 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  const handleTranscriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTranscript(e.target.files[0]);
      const name = e.target.files[0].name;
      setTranscriptName(name);
      localStorage.setItem("uploadedTranscriptName", name);
      setShowSuccessModal(true);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
      const name = e.target.files[0].name;
      setResumeName(name);
      localStorage.setItem("uploadedResumeName", name);
      setShowSuccessModal(true);
    }
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPortfolio(e.target.files[0]);
      const name = e.target.files[0].name;
      setPortfolioName(name);
      localStorage.setItem("uploadedPortfolioName", name);
      setShowSuccessModal(true);
    }
  };

  const handleCourtesyDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCourtesyDocument(e.target.files[0]);
      setShowSuccessModal(true);
      // If document status was "ไม่ครบถ้วน", mark as ready for reupload
      if (documentStatus === "เอกสารไม่ผ่าน") {
        setIsReuploadReady(true);
      }
    }
  };

  const handleReuploadConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleFinalReuploadConfirm = () => {
    setShowConfirmModal(false);
    setShowConfirmSuccessModal(true);
    setDocumentStatus("รอการตรวจสอบ");
    setDocumentError("");
    setIsReuploadReady(false);
    // Move to เสร็จสิ้น step after successful reupload
    setTimeout(() => {
      setShowConfirmSuccessModal(false);
    }, 800);
  };

  const handleConfirmCourtesyUpload = () => {
    if (courtesyDocument) {
      setShowConfirmModal(true);
    }
  };

  const handleFinalCourtesyConfirm = () => {
    setShowConfirmModal(false);
    setShowConfirmSuccessModal(true);
    setIsCourtesySubmitted(true);
    // Set document status to "รอการตรวจสอบ" after upload confirmation
    setDocumentStatus("รอการตรวจสอบ");
    setTimeout(() => {
      setShowConfirmSuccessModal(false);
    }, 800);
  };

  const handleConfirmApplication = () => {
    if (allRequiredDocsUploaded()) {
      setShowConfirmModal(true);
    }
  };

  const handleFinalConfirm = async () => {
    setShowConfirmModal(false);
    setIsUploading(true);

    try {
      if (applicationId) {
        // Upload all documents via API
        if (transcript) {
          await applicationApi.uploadTranscript(applicationId, transcript);
        }
        if (resume && requiredDocuments.includes("Resume")) {
          await applicationApi.uploadResume(applicationId, resume);
        }
        if (portfolio && requiredDocuments.includes("Portfolio")) {
          await applicationApi.uploadPortfolio(applicationId, portfolio);
        }
      }
    } catch (err) {
      console.error("Failed to upload documents:", err);
      // Continue anyway (graceful degradation)
    } finally {
      setIsUploading(false);
    }

    setShowConfirmSuccessModal(true);
    // Auto close and move to next step after 2 seconds
    setTimeout(() => {
      setShowConfirmSuccessModal(false);
      setCurrentStep("รอสัมภาษณ์");
    }, 800);
  };

  const handleCancelApplication = () => {
    setShowCancelModal(true);
  };

  const handleFinalCancel = async () => {
    setShowCancelModal(false);
    try {
      if (applicationId) {
        await applicationApi.cancelApplication(applicationId);
      }
      setShowCancelSuccessModal(true);
      // Auto close after 2 seconds and redirect to intern home
      setTimeout(() => {
        setShowCancelSuccessModal(false);
        router.push("/intern-home");
      }, 800);
    } catch (err) {
      console.error("Failed to cancel application:", err);
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || "ไม่สามารถยกเลิกใบสมัครได้";
      alert(msg);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarIntern />
        <VideoLoading message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  // No active application — show empty state
  if (!hasApplication) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarIntern />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-800">ติดตามสถานะการสมัคร</h1>
            <p className="text-gray-500 text-sm mt-1">ติดตามสถานะการสมัครของคุณ</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-base">ไม่พบสถานะการสมัคร</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <NavbarIntern />

      {/* Main Content */}
      <main
        className={`max-w-6xl mx-auto px-4 py-8 ${(currentStep === "รอยื่นเอกสาร" && allRequiredDocsUploaded()) || (currentStep === "รอยื่นเอกสารขอความอนุเคราะห์" && !isCourtesySubmitted) ? "pb-28 md:pb-8" : ""}`}
      >
        {/* Mobile Progress Pie Chart - Only visible on mobile */}
        <div className="md:hidden mb-6 py-4 px-2">
          {(() => {
            // Calculate progress step number for pie chart
            // N/5 means N steps completed (5 steps total, no เสร็จสิ้น step)
            let progressStepNumber = 0;
            const isDocumentPendingReview =
              documentStatus === "รอการตรวจสอบ" ||
              documentStatus === "เอกสารไม่ผ่าน";
            const isDocumentFullyApproved = documentStatus === "เอกสารผ่าน";

            // Map currentStep to progress number (how many steps completed)
            if (currentStep === "รอยื่นเอกสารขอความอนุเคราะห์") {
              if (isDocumentPendingReview) {
                progressStepNumber = 4; // At step 5 (รอการตรวจสอบ)
              } else if (isDocumentFullyApproved) {
                progressStepNumber = 5; // All 5 steps completed
              } else {
                progressStepNumber = 3; // At step 4
              }
            } else if (currentStep === "รอการตรวจสอบ") {
              if (isDocumentFullyApproved) {
                progressStepNumber = 5; // All 5 steps completed
              } else {
                progressStepNumber = 4;
              }
            } else if (currentStep === "รอการยืนยัน") {
              progressStepNumber = 2; // At step 3, 2 steps completed
            } else if (currentStep === "รอสัมภาษณ์") {
              progressStepNumber = 1; // At step 2, 1 step completed
            } else if (currentStep === "รอยื่นเอกสาร") {
              progressStepNumber = 0; // At step 1, 0 steps completed
            }

            // Progress percentage for the pie chart (0-100)
            const progressPercentage = (progressStepNumber / 5) * 100;

            // Get current step title and next step
            // Title shows currentStep directly (matching status badge in desktop)
            // nextStepText shows what comes after the current step
            let currentTitle: string = currentStep;
            let nextStepText = "";

            // Define next steps based on currentStep (5 steps, no เสร็จสิ้น)
            const stepOrder = [
              "รอยื่นเอกสาร",
              "รอสัมภาษณ์",
              "รอการยืนยัน",
              "รอยื่นเอกสารขอความอนุเคราะห์",
              "รอการตรวจสอบ",
            ];
            const currentIndex = stepOrder.indexOf(currentStep);

            if (currentStep === "รอยื่นเอกสารขอความอนุเคราะห์") {
              if (isDocumentPendingReview) {
                currentTitle = "รอการตรวจสอบ";
                nextStepText = "รอการอนุมัติเอกสาร";
              } else if (isDocumentFullyApproved) {
                currentTitle = "การตรวจสอบเสร็จสิ้น";
                nextStepText = "ดำเนินการครบถ้วนตามขั้นตอน";
              } else {
                nextStepText = "ขั้นตอนถัดไป: รอการตรวจสอบ";
              }
            } else if (currentStep === "รอการตรวจสอบ") {
              if (isDocumentFullyApproved) {
                currentTitle = "การตรวจสอบเสร็จสิ้น";
                nextStepText = "ดำเนินการครบถ้วนตามขั้นตอน";
              } else {
                nextStepText = "รอการอนุมัติเอกสาร";
              }
            } else if (currentIndex < stepOrder.length - 1) {
              nextStepText = `ขั้นตอนถัดไป: ${stepOrder[currentIndex + 1]}`;
            }

            // SVG circle parameters
            const size = 120;
            const strokeWidth = 8;
            const radius = (size - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset =
              circumference - (progressPercentage / 100) * circumference;

            return (
              <div className="flex items-center gap-6">
                {/* Pie Chart */}
                <div className="relative flex-shrink-0">
                  <svg
                    width={size}
                    height={size}
                    className="transform -rotate-90"
                  >
                    {/* Background circle */}
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke="#A80689"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-800">
                      {progressStepNumber}/5
                    </span>
                  </div>
                </div>

                {/* Step Info */}
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-800">
                    {currentTitle}
                  </span>
                  <span className="text-sm text-gray-500">{nextStepText}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Desktop Progress Stepper - Hidden on mobile */}
        <div className="hidden md:block mb-6 md:mb-8 py-4 md:py-6 px-2 md:px-4 overflow-x-auto">
          <div className="relative" style={{ minWidth: "580px" }}>
            {/* Progress Line Background - Behind circles */}
            <div
              className="absolute top-4 md:top-5 h-0.5 bg-gray-300"
              style={{
                left: "calc(8.33% + 16px)",
                right: "calc(8.33% + 16px)",
              }}
            />
            {/* Progress Line Active - Calculate width based on current step */}
            {(() => {
              // Calculate which step to show progress to
              const isDocumentFullyApproved = documentStatus === "เอกสารผ่าน";
              const isDocumentPendingReview =
                documentStatus === "รอการตรวจสอบ" ||
                documentStatus === "เอกสารไม่ผ่าน";

              let progressToStep = currentStepIndex;
              if (currentStep === "รอยื่นเอกสารขอความอนุเคราะห์") {
                if (isDocumentPendingReview) {
                  // Document uploaded but pending review - progress line goes to step 4 (รอการตรวจสอบ)
                  progressToStep = 4;
                } else if (isDocumentFullyApproved) {
                  // Document fully approved - progress line goes to last step
                  progressToStep = steps.length - 1;
                }
              } else if (
                currentStep === "รอการตรวจสอบ" &&
                isDocumentFullyApproved
              ) {
                progressToStep = steps.length - 1;
              }

              const stepWidth = 100 / steps.length; // 16.67%
              const lineWidth = progressToStep * stepWidth; // Width from first to current step center

              return (
                <div
                  className="absolute top-4 md:top-5 h-0.5 bg-primary-600 transition-all duration-500"
                  style={{
                    left: "calc(8.33% + 16px)",
                    width: lineWidth > 0 ? `calc(${lineWidth}%)` : "0px",
                  }}
                />
              );
            })()}

            {/* Steps */}
            <div className="flex items-start justify-between relative">
              {steps.map((step, index) => {
                // Determine completion state based on document verification status
                const isDocumentFullyApproved = documentStatus === "เอกสารผ่าน";
                const isDocumentPendingReview =
                  documentStatus === "รอการตรวจสอบ" ||
                  documentStatus === "เอกสารไม่ผ่าน";

                // Step is completed if:
                // 1. It's before current step index
                // 2. Document is fully approved (เอกสารผ่าน) - all steps complete
                // 3. When at รอยื่นเอกสารขอความอนุเคราะห์ and document is uploaded:
                //    - Mark steps 0-3 as completed
                //    - Mark step 4 (รอการตรวจสอบ) as completed ONLY if document is fully approved
                let isCompleted =
                  index < currentStepIndex || isDocumentFullyApproved;

                if (currentStep === "รอยื่นเอกสารขอความอนุเคราะห์") {
                  if (isDocumentPendingReview) {
                    // Document uploaded but pending review - mark steps 0-3 as completed, not step 4
                    isCompleted = index <= 3;
                  } else if (isDocumentFullyApproved) {
                    // Document fully approved - mark all steps as completed
                    isCompleted = true;
                  }
                } else if (
                  currentStep === "รอการตรวจสอบ" &&
                  isDocumentFullyApproved
                ) {
                  isCompleted = true;
                }

                // Check if this is the current step that's "on hold" (waiting for action)
                // This is the step where the user needs to take action
                let isOnHold = false;

                if (currentStep === "รอยื่นเอกสารขอความอนุเคราะห์") {
                  if (isDocumentPendingReview) {
                    // Document is pending review - รอการตรวจสอบ (index 4) should be on hold
                    isOnHold = index === 4;
                  } else if (!isDocumentFullyApproved) {
                    // No document uploaded yet - current step is on hold
                    isOnHold = index === currentStepIndex;
                  }
                } else if (!isDocumentFullyApproved) {
                  // For other steps, the current step is on hold (unless all completed)
                  isOnHold = index === currentStepIndex;
                }

                // Determine if this step should be highlighted (active)
                const isActive = isCompleted || isOnHold;

                return (
                  <div
                    key={step}
                    className="flex flex-col items-center z-10"
                    style={{ width: `${100 / steps.length}%` }}
                  >
                    {/* Circle */}
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                        ? "bg-primary-600" // Completed: solid primary color
                        : isOnHold
                          ? "bg-white border-[3px] border-primary-600" // On Hold: white center with primary border
                          : "bg-gray-300" // Pending: gray
                        }`}
                    >
                      {/* Checkmark - only show for completed steps */}
                      {isCompleted && (
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {/* On Hold indicator - empty (just the ring) */}
                    </div>
                    {/* Label */}
                    <span
                      className={`mt-2 md:mt-3 text-[10px] md:text-xs text-center leading-tight font-medium ${isActive ? "text-primary-600" : "text-gray-400"
                        }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
          {/* Application Status Card - Third on mobile, Second on desktop */}
          <div className="flex flex-col gap-4 md:gap-6 order-3 md:order-2">
            {/* Application Status Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border-2 border-gray-200 md:border-primary-600 h-fit">
              <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">
                ติดตามสถานะการสมัครงาน
              </h2>

              {/* Check if this is a rejected application view */}
              {isRejectedApplication || (isRejected && !stepParam) ? (
                <div className="space-y-3 md:space-y-4">
                  {/* Status: ไม่ผ่าน */}
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 13.2833 8.09583 13.5208 8.2875 13.7125C8.47917 13.9042 8.71667 14 9 14ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z"
                        fill="#A80689"
                      />
                    </svg>
                    <span className="font-medium text-gray-700 text-sm md:text-base">
                      สถานะ :
                    </span>
                    <span className="px-3 md:px-4 py-1 rounded-full text-xs md:text-sm bg-red-100 border border-red-400 text-red-600">
                      ไม่ผ่าน
                    </span>
                  </div>

                  {/* Rejection Reason */}
                  {rejectionReason && (
                    <div className="mt-3 md:mt-4">
                      <h3 className="font-bold text-gray-800 text-sm md:text-base mb-2">
                        เหตุผลที่ไม่ผ่าน
                      </h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3">
                        <p className="text-red-700 text-xs md:text-sm">
                          {rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : currentStep === "รอยื่นเอกสารขอความอนุเคราะห์" ||
                currentStep === "รอการตรวจสอบ" ? (
                <div className="space-y-3 md:space-y-4">
                  {/* Status: รับเข้าฝึกงาน */}
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 13.2833 8.09583 13.5208 8.2875 13.7125C8.47917 13.9042 8.71667 14 9 14ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z"
                        fill="#A80689"
                      />
                    </svg>
                    <span className="font-medium text-gray-700 text-sm md:text-base">
                      สถานะ :
                    </span>
                    <span className="px-3 md:px-4 py-1 rounded-full text-xs md:text-sm bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]">
                      รับเข้าฝึกงาน
                    </span>
                  </div>

                  {/* Document Status - Dynamic based on state */}
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 13.2833 8.09583 13.5208 8.2875 13.7125C8.47917 13.9042 8.71667 14 9 14ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z"
                        fill="#A80689"
                      />
                    </svg>
                    <span className="font-medium text-gray-700 text-sm md:text-base">
                      ความถูกต้องเอกสาร :
                    </span>
                    <span
                      className={`px-3 md:px-4 py-1 rounded-full text-xs md:text-sm ${documentStatus === "รอการดำเนินการ" ? "bg-yellow-100 border border-yellow-400 text-yellow-700" : documentStatus === "รอการตรวจสอบ" ? "bg-yellow-100 border border-yellow-400 text-yellow-700" : documentStatus === "เอกสารผ่าน" ? "bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]" : "bg-red-100 border border-red-400 text-red-600"}`}
                    >
                      {documentStatus}
                    </span>
                  </div>

                  {/* Document Error Section */}
                  {documentStatus === "เอกสารไม่ผ่าน" && documentError && (
                    <div className="mt-3 md:mt-4">
                      <h3 className="font-bold text-gray-800 text-sm md:text-base mb-2">
                        ข้อผิดพลาดของเอกสาร
                      </h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3">
                        <p className="text-red-700 text-xs md:text-sm">
                          {documentError}
                        </p>
                      </div>
                    </div>
                  )}


                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 13.2833 8.09583 13.5208 8.2875 13.7125C8.47917 13.9042 8.71667 14 9 14ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z"
                        fill="#A80689"
                      />
                    </svg>
                    <span className="font-medium text-gray-700 text-sm md:text-base">
                      สถานะ :
                    </span>
                    <span
                      className={`px-3 md:px-4 py-1 rounded-full text-xs md:text-sm ${isRejected ? "bg-red-100 border border-red-400 text-red-600" : currentStep === "รอสัมภาษณ์" ? "bg-yellow-100 border border-yellow-400 text-yellow-700" : currentStep === "รอยื่นเอกสาร" ? "bg-yellow-100 border border-yellow-400 text-yellow-700" : currentStep === "รอการยืนยัน" ? "bg-yellow-100 border border-yellow-400 text-yellow-700" : "bg-blue-50 border border-blue-300 text-blue-600"}`}
                    >
                      {isRejected ? "ไม่ผ่าน" : currentStep}
                    </span>
                  </div>

                  {/* Rejection Reason (when isRejected via API) */}
                  {isRejected && rejectionReason && (
                    <div className="mt-3 md:mt-4">
                      <h3 className="font-bold text-gray-800 text-sm md:text-base mb-2">
                        เหตุผลที่ไม่ผ่าน
                      </h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3">
                        <p className="text-red-700 text-xs md:text-sm">
                          {rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Information - Collapsible Dropdown */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsMentorContactOpen(!isMentorContactOpen)}
                  className="w-full flex items-center justify-between text-base md:text-lg font-bold text-gray-800 transition-colors cursor-pointer"
                >
                  <span>ข้อมูลติดต่อพี่เลี้ยง</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isMentorContactOpen ? "rotate-180" : ""}`}
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
                </button>
                {isMentorContactOpen && (
                  <div className="space-y-2 mt-3 md:mt-4">
                    <div className="flex items-center gap-2 text-gray-700 text-sm md:text-base">
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 12C10.9 12 9.95833 11.6083 9.175 10.825C8.39167 10.0417 8 9.1 8 8C8 6.9 8.39167 5.95833 9.175 5.175C9.95833 4.39167 10.9 4 12 4C13.1 4 14.0417 4.39167 14.825 5.175C15.6083 5.95833 16 6.9 16 8C16 9.1 15.6083 10.0417 14.825 10.825C14.0417 11.6083 13.1 12 12 12ZM4 20V17.2C4 16.6333 4.14583 16.1125 4.4375 15.6375C4.72917 15.1625 5.11667 14.8 5.6 14.55C6.63333 14.0333 7.68333 13.6458 8.75 13.3875C9.81667 13.1292 10.9 13 12 13C13.1 13 14.1833 13.1292 15.25 13.3875C16.3167 13.6458 17.3667 14.0333 18.4 14.55C18.8833 14.8 19.2708 15.1625 19.5625 15.6375C19.8542 16.1125 20 16.6333 20 17.2V20H4Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span className="font-medium">ชื่อ :</span>
                      <span>{appliedJob?.mentorName || "ไม่ระบุ"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 text-sm md:text-base">
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 20C3.45 20 2.97917 19.8042 2.5875 19.4125C2.19583 19.0208 2 18.55 2 18V6C2 5.45 2.19583 4.97917 2.5875 4.5875C2.97917 4.19583 3.45 4 4 4H20C20.55 4 21.0208 4.19583 21.4125 4.5875C21.8042 4.97917 22 5.45 22 6V18C22 18.55 21.8042 19.0208 21.4125 19.4125C21.0208 19.8042 20.55 20 20 20H4ZM12 13L4 8V18H20V8L12 13ZM12 11L20 6H4L12 11ZM4 8V6V18V8Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span className="font-medium">อีเมล :</span>
                      <span>{appliedJob?.mentorEmail || "ไม่ระบุ"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 text-sm md:text-base">
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19.95 21C17.8667 21 15.8083 20.5458 13.775 19.6375C11.7417 18.7292 9.89167 17.4417 8.225 15.775C6.55833 14.1083 5.27083 12.2583 4.3625 10.225C3.45417 8.19167 3 6.13333 3 4.05C3 3.75 3.1 3.5 3.3 3.3C3.5 3.1 3.75 3 4.05 3H8.1C8.33333 3 8.54167 3.07917 8.725 3.2375C8.90833 3.39583 9.01667 3.58333 9.05 3.8L9.7 7.3C9.73333 7.56667 9.725 7.79167 9.675 7.975C9.625 8.15833 9.53333 8.31667 9.4 8.45L6.975 10.9C7.30833 11.5167 7.70417 12.1125 8.1625 12.6875C8.62083 13.2625 9.125 13.8167 9.675 14.35C10.1917 14.8667 10.7333 15.3458 11.3 15.7875C11.8667 16.2292 12.4667 16.6333 13.1 17L15.45 14.65C15.6 14.5 15.7958 14.3875 16.0375 14.3125C16.2792 14.2375 16.5167 14.2167 16.75 14.25L20.2 14.95C20.4333 15.0167 20.625 15.1375 20.775 15.3125C20.925 15.4875 21 15.6833 21 15.9V19.95C21 20.25 20.9 20.5 20.7 20.7C20.5 20.9 20.25 21 19.95 21Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span className="font-medium">เบอร์โทร :</span>
                      <span>{appliedJob?.mentorPhone || "ไม่ระบุ"}</span>
                    </div>
                    <div className="text-xs md:text-sm">
                      <span className="text-red-500">*</span>
                      <span className="text-gray-700">
                        หมายเหตุ: หากประสงค์ให้ลงนามในเอกสารตอบรับ
                        กรุณาติดต่อพี่เลี้ยง
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Document List Card - Show when document is fully approved - Hidden on mobile, shown on desktop */}
            {documentStatus === "เอกสารผ่าน" && (
              <div className="hidden md:block bg-white rounded-2xl shadow-sm p-4 md:p-6 border-2 border-primary-600 h-fit">
                <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">
                  <span className="text-red-500">*</span>{" "}
                  รายการเอกสารที่ต้องเตรียม
                </h2>
                <Link
                  href="/application-status/document-list"
                  className="group inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 border-2 border-primary-600 bg-primary-600 text-white rounded-lg font-medium text-sm md:text-base hover:bg-white hover:text-primary-600 transition-colors active:scale-95"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 13.2833 8.09583 13.5208 8.2875 13.7125C8.47917 13.9042 8.71667 14 9 14ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z" />
                  </svg>
                  <span>รายการเอกสาร</span>
                </Link>
              </div>
            )}

            {/* Select New Job Button - Desktop - Show when rejected or isRejectedApplication */}
            {(isRejected || isRejectedApplication) && (
              <button
                onClick={() => router.push("/intern-home")}
                className="hidden md:block w-full py-3 bg-primary-600 text-white rounded-xl font-medium text-base hover:bg-primary-700 transition-colors cursor-pointer"
              >
                เลือกตำแหน่งงานใหม่
              </button>
            )}
          </div>
          {/* Document Upload Card - Second on mobile */}{" "}
          {/* Document Upload Section - First on mobile, Second on desktop */}
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 h-fit order-1 md:order-1 border-2 border-primary-600 md:border-gray-200">
            <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">
              <span className="text-red-500">*</span>เอกสารที่ต้องอัปโหลด
            </h2>

            {/* Transcript Upload */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5ZM5 19H19V5H5V19ZM8 17H13C13.2833 17 13.5208 16.9042 13.7125 16.7125C13.9042 16.5208 14 16.2833 14 16C14 15.7167 13.9042 15.4792 13.7125 15.2875C13.5208 15.0958 13.2833 15 13 15H8C7.71667 15 7.47917 15.0958 7.2875 15.2875C7.09583 15.4792 7 15.7167 7 16C7 16.2833 7.09583 16.5208 7.2875 16.7125C7.47917 16.9042 7.71667 17 8 17ZM8 13H16C16.2833 13 16.5208 12.9042 16.7125 12.7125C16.9042 12.5208 17 12.2833 17 12C17 11.7167 16.9042 11.4792 16.7125 11.2875C16.5208 11.0958 16.2833 11 16 11H8C7.71667 11 7.47917 11.0958 7.2875 11.2875C7.09583 11.4792 7 11.7167 7 12C7 12.2833 7.09583 12.5208 7.2875 12.7125C7.47917 12.9042 7.71667 13 8 13ZM8 9H16C16.2833 9 16.5208 8.90417 16.7125 8.7125C16.9042 8.52083 17 8.28333 17 8C17 7.71667 16.9042 7.47917 16.7125 7.2875C16.5208 7.09583 16.2833 7 16 7H8C7.71667 7 7.47917 7.09583 7.2875 7.2875C7.09583 7.47917 7 7.71667 7 8C7 8.28333 7.09583 8.52083 7.2875 8.7125C7.47917 8.90417 7.71667 9 8 9Z"
                    fill="#A80689"
                  />
                </svg>
                <span className="font-bold text-gray-800 text-sm md:text-base">
                  Transcript (PDF)<span className="text-red-500">*</span>
                </span>
              </div>
              {/* Sample Document Button */}
              <a
                href="/Transcript.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-lg text-gray-400 hover:text-primary-600 text-xs md:text-sm transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.63333 10.6667C6.86667 10.6667 7.06389 10.5861 7.225 10.425C7.38611 10.2639 7.46667 10.0667 7.46667 9.83333C7.46667 9.6 7.38611 9.40278 7.225 9.24167C7.06389 9.08055 6.86667 9 6.63333 9C6.4 9 6.20278 9.08055 6.04167 9.24167C5.88056 9.40278 5.8 9.6 5.8 9.83333C5.8 10.0667 5.88056 10.2639 6.04167 10.425C6.20278 10.5861 6.4 10.6667 6.63333 10.6667ZM6.66667 13.3333C5.74444 13.3333 4.87778 13.1583 4.06667 12.8083C3.25556 12.4583 2.55 11.9833 1.95 11.3833C1.35 10.7833 0.875 10.0778 0.525 9.26667C0.175 8.45555 0 7.58889 0 6.66667C0 5.74444 0.175 4.87778 0.525 4.06667C0.875 3.25556 1.35 2.55 1.95 1.95C2.55 1.35 3.25556 0.875 4.06667 0.525C4.87778 0.175 5.74444 0 6.66667 0C7.58889 0 8.45555 0.175 9.26667 0.525C10.0778 0.875 10.7833 1.35 11.3833 1.95C11.9833 2.55 12.4583 3.25556 12.8083 4.06667C13.1583 4.87778 13.3333 5.74444 13.3333 6.66667C13.3333 7.58889 13.1583 8.45555 12.8083 9.26667C12.4583 10.0778 11.9833 10.7833 11.3833 11.3833C10.7833 11.9833 10.0778 12.4583 9.26667 12.8083C8.45555 13.1583 7.58889 13.3333 6.66667 13.3333ZM6.73333 3.8C7.01111 3.8 7.25278 3.88889 7.45833 4.06667C7.66389 4.24444 7.76667 4.46667 7.76667 4.73333C7.76667 4.97778 7.69167 5.19444 7.54167 5.38333C7.39167 5.57222 7.22222 5.75 7.03333 5.91667C6.77778 6.13889 6.55278 6.38333 6.35833 6.65C6.16389 6.91667 6.06667 7.21667 6.06667 7.55C6.06667 7.70555 6.125 7.83611 6.24167 7.94167C6.35833 8.04722 6.49444 8.1 6.65 8.1C6.81667 8.1 6.95833 8.04444 7.075 7.93333C7.19167 7.82222 7.26667 7.68333 7.3 7.51667C7.34444 7.28333 7.44444 7.075 7.6 6.89167C7.75556 6.70833 7.92222 6.53333 8.1 6.36667C8.35556 6.12222 8.575 5.85556 8.75833 5.56667C8.94167 5.27778 9.03333 4.95556 9.03333 4.6C9.03333 4.03333 8.80278 3.56944 8.34167 3.20833C7.88056 2.84722 7.34444 2.66667 6.73333 2.66667C6.31111 2.66667 5.90833 2.75556 5.525 2.93333C5.14167 3.11111 4.85 3.38333 4.65 3.75C4.57222 3.88333 4.54722 4.025 4.575 4.175C4.60278 4.325 4.67778 4.43889 4.8 4.51667C4.95556 4.60556 5.11667 4.63333 5.28333 4.6C5.45 4.56667 5.58889 4.47222 5.7 4.31667C5.82222 4.15 5.975 4.02222 6.15833 3.93333C6.34167 3.84444 6.53333 3.8 6.73333 3.8Z"
                    fill="CurrentColor"
                  />
                </svg>
                ตัวอย่างเอกสาร
              </a>
              <div
                onClick={() =>
                  currentStep === "รอยื่นเอกสาร" &&
                  !isViewingCompleted &&
                  transcriptInputRef.current?.click()
                }
                className={`flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 border-2 rounded-xl transition-colors text-sm md:text-base ${currentStep === "รอยื่นเอกสาร" && !isViewingCompleted ? "cursor-pointer hover:bg-gray-50" : "cursor-default"} ${transcript || isViewingCompleted ? "border-primary-600" : "border-gray-200 hover:border-primary-600"}`}
              >
                <span
                  className={
                    transcript || isViewingCompleted
                      ? "text-black"
                      : "text-black/60"
                  }
                >
                  {transcript
                    ? transcript.name
                    : transcriptName
                      ? transcriptName
                      : isViewingCompleted
                        ? "Transcript.PDF"
                        : "Choose File"}
                </span>
                {transcript || isViewingCompleted ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.6 13.8L8.45 11.65C8.26667 11.4667 8.03333 11.375 7.75 11.375C7.46667 11.375 7.23333 11.4667 7.05 11.65C6.86667 11.8333 6.775 12.0667 6.775 12.35C6.775 12.6333 6.86667 12.8667 7.05 13.05L9.9 15.9C10.1 16.1 10.3333 16.2 10.6 16.2C10.8667 16.2 11.1 16.1 11.3 15.9L16.95 10.25C17.1333 10.0667 17.225 9.83333 17.225 9.55C17.225 9.26667 17.1333 9.03333 16.95 8.85C16.7667 8.66667 16.5333 8.575 16.25 8.575C15.9667 8.575 15.7333 8.66667 15.55 8.85L10.6 13.8ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22Z"
                      fill="#17B26A"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                )}
              </div>
              <input
                ref={transcriptInputRef}
                type="file"
                accept=".pdf"
                onChange={handleTranscriptChange}
                className="hidden"
              />
            </div>

            {/* Resume Upload - conditional */}
            {requiredDocuments.includes("Resume") && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5ZM5 19H19V5H5V19ZM8 17H13C13.2833 17 13.5208 16.9042 13.7125 16.7125C13.9042 16.5208 14 16.2833 14 16C14 15.7167 13.9042 15.4792 13.7125 15.2875C13.5208 15.0958 13.2833 15 13 15H8C7.71667 15 7.47917 15.0958 7.2875 15.2875C7.09583 15.4792 7 15.7167 7 16C7 16.2833 7.09583 16.5208 7.2875 16.7125C7.47917 16.9042 7.71667 17 8 17ZM8 13H16C16.2833 13 16.5208 12.9042 16.7125 12.7125C16.9042 12.5208 17 12.2833 17 12C17 11.7167 16.9042 11.4792 16.7125 11.2875C16.5208 11.0958 16.2833 11 16 11H8C7.71667 11 7.47917 11.0958 7.2875 11.2875C7.09583 11.4792 7 11.7167 7 12C7 12.2833 7.09583 12.5208 7.2875 12.7125C7.47917 12.9042 7.71667 13 8 13ZM8 9H16C16.2833 9 16.5208 8.90417 16.7125 8.7125C16.9042 8.52083 17 8.28333 17 8C17 7.71667 16.9042 7.47917 16.7125 7.2875C16.5208 7.09583 16.2833 7 16 7H8C7.71667 7 7.47917 7.09583 7.2875 7.2875C7.09583 7.47917 7 7.71667 7 8C7 8.28333 7.09583 8.52083 7.2875 8.7125C7.47917 8.90417 7.71667 9 8 9Z"
                      fill="#A80689"
                    />
                  </svg>
                  <span className="font-bold text-gray-800 text-sm md:text-base">
                    Resume (PDF/DOC)<span className="text-red-500">*</span>
                  </span>
                </div>
                <div
                  onClick={() =>
                    currentStep === "รอยื่นเอกสาร" &&
                    !isViewingCompleted &&
                    resumeInputRef.current?.click()
                  }
                  className={`flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 border-2 rounded-xl transition-colors text-sm md:text-base ${currentStep === "รอยื่นเอกสาร" && !isViewingCompleted ? "cursor-pointer hover:bg-gray-50" : "cursor-default"} ${resume || isViewingCompleted ? "border-primary-600" : "border-gray-200 hover:border-primary-600"}`}
                >
                  <span
                    className={
                      resume || isViewingCompleted
                        ? "text-black"
                        : "text-black/60"
                    }
                  >
                    {resume
                      ? resume.name
                      : resumeName
                        ? resumeName
                        : isViewingCompleted
                          ? "Resume.PDF"
                          : "Choose File"}
                  </span>
                  {resume || isViewingCompleted ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.6 13.8L8.45 11.65C8.26667 11.4667 8.03333 11.375 7.75 11.375C7.46667 11.375 7.23333 11.4667 7.05 11.65C6.86667 11.8333 6.775 12.0667 6.775 12.35C6.775 12.6333 6.86667 12.8667 7.05 13.05L9.9 15.9C10.1 16.1 10.3333 16.2 10.6 16.2C10.8667 16.2 11.1 16.1 11.3 15.9L16.95 10.25C17.1333 10.0667 17.225 9.83333 17.225 9.55C17.225 9.26667 17.1333 9.03333 16.95 8.85C16.7667 8.66667 16.5333 8.575 16.25 8.575C15.9667 8.575 15.7333 8.66667 15.55 8.85L10.6 13.8ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22Z"
                        fill="#17B26A"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  )}
                </div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Portfolio Upload - conditional */}
            {requiredDocuments.includes("Portfolio") && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5ZM5 19H19V5H5V19ZM8 17H13C13.2833 17 13.5208 16.9042 13.7125 16.7125C13.9042 16.5208 14 16.2833 14 16C14 15.7167 13.9042 15.4792 13.7125 15.2875C13.5208 15.0958 13.2833 15 13 15H8C7.71667 15 7.47917 15.0958 7.2875 15.2875C7.09583 15.4792 7 15.7167 7 16C7 16.2833 7.09583 16.5208 7.2875 16.7125C7.47917 16.9042 7.71667 17 8 17ZM8 13H16C16.2833 13 16.5208 12.9042 16.7125 12.7125C16.9042 12.5208 17 12.2833 17 12C17 11.7167 16.9042 11.4792 16.7125 11.2875C16.5208 11.0958 16.2833 11 16 11H8C7.71667 11 7.47917 11.0958 7.2875 11.2875C7.09583 11.4792 7 11.7167 7 12C7 12.2833 7.09583 12.5208 7.2875 12.7125C7.47917 12.9042 7.71667 13 8 13ZM8 9H16C16.2833 9 16.5208 8.90417 16.7125 8.7125C16.9042 8.52083 17 8.28333 17 8C17 7.71667 16.9042 7.47917 16.7125 7.2875C16.5208 7.09583 16.2833 7 16 7H8C7.71667 7 7.47917 7.09583 7.2875 7.2875C7.09583 7.47917 7 7.71667 7 8C7 8.28333 7.09583 8.52083 7.2875 8.7125C7.47917 8.90417 7.71667 9 8 9Z"
                      fill="#A80689"
                    />
                  </svg>
                  <span className="font-bold text-gray-800 text-sm md:text-base">
                    Portfolio (PDF)<span className="text-red-500">*</span>
                  </span>
                </div>
                <div
                  onClick={() =>
                    currentStep === "รอยื่นเอกสาร" &&
                    !isViewingCompleted &&
                    portfolioInputRef.current?.click()
                  }
                  className={`flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 border-2 rounded-xl transition-colors text-sm md:text-base ${currentStep === "รอยื่นเอกสาร" && !isViewingCompleted ? "cursor-pointer hover:bg-gray-50" : "cursor-default"} ${portfolio || isViewingCompleted ? "border-primary-600" : "border-gray-200 hover:border-primary-600"}`}
                >
                  <span
                    className={
                      portfolio || isViewingCompleted
                        ? "text-black"
                        : "text-black/60"
                    }
                  >
                    {portfolio
                      ? portfolio.name
                      : portfolioName
                        ? portfolioName
                        : isViewingCompleted
                          ? "Portfolio.PDF"
                          : "Choose File"}
                  </span>
                  {portfolio || isViewingCompleted ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.6 13.8L8.45 11.65C8.26667 11.4667 8.03333 11.375 7.75 11.375C7.46667 11.375 7.23333 11.4667 7.05 11.65C6.86667 11.8333 6.775 12.0667 6.775 12.35C6.775 12.6333 6.86667 12.8667 7.05 13.05L9.9 15.9C10.1 16.1 10.3333 16.2 10.6 16.2C10.8667 16.2 11.1 16.1 11.3 15.9L16.95 10.25C17.1333 10.0667 17.225 9.83333 17.225 9.55C17.225 9.26667 17.1333 9.03333 16.95 8.85C16.7667 8.66667 16.5333 8.575 16.25 8.575C15.9667 8.575 15.7333 8.66667 15.55 8.85L10.6 13.8ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22Z"
                        fill="#17B26A"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  )}
                </div>
                <input
                  ref={portfolioInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePortfolioChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Signature Option - Show only when step is รอยื่นเอกสารขอความอนุเคราะห์ or รอการตรวจสอบ */}
            {(currentStep === "รอยื่นเอกสารขอความอนุเคราะห์" ||
              currentStep === "รอการตรวจสอบ") && (
                <>
                  {/* Additional Document Upload Section */}
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      {documentStatus !== "เอกสารผ่าน" && (
                        <span className="text-red-500">*</span>
                      )}
                      เอกสารขอความอนุเคราะห์จากสถาบัน
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5ZM5 19H19V5H5V19ZM8 17H13C13.2833 17 13.5208 16.9042 13.7125 16.7125C13.9042 16.5208 14 16.2833 14 16C14 15.7167 13.9042 15.4792 13.7125 15.2875C13.5208 15.0958 13.2833 15 13 15H8C7.71667 15 7.47917 15.0958 7.2875 15.2875C7.09583 15.4792 7 15.7167 7 16C7 16.2833 7.09583 16.5208 7.2875 16.7125C7.47917 16.9042 7.71667 17 8 17ZM8 13H16C16.2833 13 16.5208 12.9042 16.7125 12.7125C16.9042 12.5208 17 12.2833 17 12C17 11.7167 16.9042 11.4792 16.7125 11.2875C16.5208 11.0958 16.2833 11 16 11H8C7.71667 11 7.47917 11.0958 7.2875 11.2875C7.09583 11.4792 7 11.7167 7 12C7 12.2833 7.09583 12.5208 7.2875 12.7125C7.47917 12.9042 7.71667 13 8 13ZM8 9H16C16.2833 9 16.5208 8.90417 16.7125 8.7125C16.9042 8.52083 17 8.28333 17 8C17 7.71667 16.9042 7.47917 16.7125 7.2875C16.5208 7.09583 16.2833 7 16 7H8C7.71667 7 7.47917 7.09583 7.2875 7.2875C7.09583 7.47917 7 7.71667 7 8C7 8.28333 7.09583 8.52083 7.2875 8.7125C7.47917 8.90417 7.71667 9 8 9Z"
                          fill="#A80689"
                        />
                      </svg>
                      <span className="font-medium text-gray-700">
                        เอกสารขอความอนุเคราะห์ (PDF)
                      </span>
                    </div>
                    {/* Sample Document Button */}
                    <a
                      href="/เอกสารขอความอนุเคราะห์.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-lg text-gray-400 hover:text-primary-600 text-sm transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.63333 10.6667C6.86667 10.6667 7.06389 10.5861 7.225 10.425C7.38611 10.2639 7.46667 10.0667 7.46667 9.83333C7.46667 9.6 7.38611 9.40278 7.225 9.24167C7.06389 9.08055 6.86667 9 6.63333 9C6.4 9 6.20278 9.08055 6.04167 9.24167C5.88056 9.40278 5.8 9.6 5.8 9.83333C5.8 10.0667 5.88056 10.2639 6.04167 10.425C6.20278 10.5861 6.4 10.6667 6.63333 10.6667ZM6.66667 13.3333C5.74444 13.3333 4.87778 13.1583 4.06667 12.8083C3.25556 12.4583 2.55 11.9833 1.95 11.3833C1.35 10.7833 0.875 10.0778 0.525 9.26667C0.175 8.45555 0 7.58889 0 6.66667C0 5.74444 0.175 4.87778 0.525 4.06667C0.875 3.25556 1.35 2.55 1.95 1.95C2.55 1.35 3.25556 0.875 4.06667 0.525C4.87778 0.175 5.74444 0 6.66667 0C7.58889 0 8.45555 0.175 9.26667 0.525C10.0778 0.875 10.7833 1.35 11.3833 1.95C11.9833 2.55 12.4583 3.25556 12.8083 4.06667C13.1583 4.87778 13.3333 5.74444 13.3333 6.66667C13.3333 7.58889 13.1583 8.45555 12.8083 9.26667C12.4583 10.0778 11.9833 10.7833 11.3833 11.3833C10.7833 11.9833 10.0778 12.4583 9.26667 12.8083C8.45555 13.1583 7.58889 13.3333 6.66667 13.3333ZM6.73333 3.8C7.01111 3.8 7.25278 3.88889 7.45833 4.06667C7.66389 4.24444 7.76667 4.46667 7.76667 4.73333C7.76667 4.97778 7.69167 5.19444 7.54167 5.38333C7.39167 5.57222 7.22222 5.75 7.03333 5.91667C6.77778 6.13889 6.55278 6.38333 6.35833 6.65C6.16389 6.91667 6.06667 7.21667 6.06667 7.55C6.06667 7.70555 6.125 7.83611 6.24167 7.94167C6.35833 8.04722 6.49444 8.1 6.65 8.1C6.81667 8.1 6.95833 8.04444 7.075 7.93333C7.19167 7.82222 7.26667 7.68333 7.3 7.51667C7.34444 7.28333 7.44444 7.075 7.6 6.89167C7.75556 6.70833 7.92222 6.53333 8.1 6.36667C8.35556 6.12222 8.575 5.85556 8.75833 5.56667C8.94167 5.27778 9.03333 4.95556 9.03333 4.6C9.03333 4.03333 8.80278 3.56944 8.34167 3.20833C7.88056 2.84722 7.34444 2.66667 6.73333 2.66667C6.31111 2.66667 5.90833 2.75556 5.525 2.93333C5.14167 3.11111 4.85 3.38333 4.65 3.75C4.57222 3.88333 4.54722 4.025 4.575 4.175C4.60278 4.325 4.67778 4.43889 4.8 4.51667C4.95556 4.60556 5.11667 4.63333 5.28333 4.6C5.45 4.56667 5.58889 4.47222 5.7 4.31667C5.82222 4.15 5.975 4.02222 6.15833 3.93333C6.34167 3.84444 6.53333 3.8 6.73333 3.8Z"
                          fill="CurrentColor"
                        />
                      </svg>
                      ตัวอย่าง
                    </a>
                    {documentStatus === "เอกสารผ่าน" ? (
                      /* Read-only display for completed step */
                      <div className="flex items-center justify-between px-4 py-3 border-2 border-primary-600 rounded-xl bg-gray-50">
                        <span className="text-black">
                          {courtesyDocument
                            ? courtesyDocument.name
                            : "courtesy_document.pdf"}
                        </span>
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10.6 13.8L8.45 11.65C8.26667 11.4667 8.03333 11.375 7.75 11.375C7.46667 11.375 7.23333 11.4667 7.05 11.65C6.86667 11.8333 6.775 12.0667 6.775 12.35C6.775 12.6333 6.86667 12.8667 7.05 13.05L9.9 15.9C10.1 16.1 10.3333 16.2 10.6 16.2C10.8667 16.2 11.1 16.1 11.3 15.9L16.95 10.25C17.1333 10.0667 17.225 9.83333 17.225 9.55C17.225 9.26667 17.1333 9.03333 16.95 8.85C16.7667 8.66667 16.5333 8.575 16.25 8.575C15.9667 8.575 15.7333 8.66667 15.55 8.85L10.6 13.8ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22Z"
                            fill="#17B26A"
                          />
                        </svg>
                      </div>
                    ) : (
                      /* Editable upload for other steps */
                      <>
                        <div
                          onClick={() => courtesyDocInputRef.current?.click()}
                          className={`flex items-center justify-between px-4 py-3 border-2 rounded-xl cursor-pointer transition-colors hover:bg-gray-50 ${courtesyDocument
                            ? "border-primary-600"
                            : "border-gray-200 hover:border-primary-600"
                            }`}
                        >
                          <span
                            className={
                              courtesyDocument ? "text-black" : "text-black/60"
                            }
                          >
                            {courtesyDocument
                              ? courtesyDocument.name
                              : "Choose File"}
                          </span>
                          {courtesyDocument ? (
                            documentStatus === "เอกสารไม่ผ่าน" &&
                              !isReuploadReady ? (
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20ZM9.4 15L12 12.4L14.6 15L16 13.6L13.4 11L16 8.4L14.6 7L12 9.6L9.4 7L8 8.4L10.6 11L8 13.6L9.4 15Z"
                                  fill="#F04438"
                                />
                              </svg>
                            ) : (
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10.6 13.8L8.45 11.65C8.26667 11.4667 8.03333 11.375 7.75 11.375C7.46667 11.375 7.23333 11.4667 7.05 11.65C6.86667 11.8333 6.775 12.0667 6.775 12.35C6.775 12.6333 6.86667 12.8667 7.05 13.05L9.9 15.9C10.1 16.1 10.3333 16.2 10.6 16.2C10.8667 16.2 11.1 16.1 11.3 15.9L16.95 10.25C17.1333 10.0667 17.225 9.83333 17.225 9.55C17.225 9.26667 17.1333 9.03333 16.95 8.85C16.7667 8.66667 16.5333 8.575 16.25 8.575C15.9667 8.575 15.7333 8.66667 15.55 8.85L10.6 13.8ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22Z"
                                  fill="#17B26A"
                                />
                              </svg>
                            )
                          ) : (
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                          )}
                        </div>
                        <input
                          ref={courtesyDocInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleCourtesyDocChange}
                          className="hidden"
                        />
                        {/* Error message for re-upload */}
                        {documentStatus === "เอกสารไม่ผ่าน" &&
                          !isReuploadReady && (
                            <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M6.66667 10C6.85556 10 7.01389 9.93611 7.14167 9.80833C7.26944 9.68056 7.33333 9.52222 7.33333 9.33333V6.66667C7.33333 6.47778 7.26944 6.31944 7.14167 6.19167C7.01389 6.06389 6.85556 6 6.66667 6C6.47778 6 6.31944 6.06389 6.19167 6.19167C6.06389 6.31944 6 6.47778 6 6.66667V9.33333C6 9.52222 6.06389 9.68056 6.19167 9.80833C6.31944 9.93611 6.47778 10 6.66667 10ZM6.66667 4.66667C6.85556 4.66667 7.01389 4.60278 7.14167 4.475C7.26944 4.34722 7.33333 4.18889 7.33333 4C7.33333 3.81111 7.26944 3.65278 7.14167 3.525C7.01389 3.39722 6.85556 3.33333 6.66667 3.33333C6.47778 3.33333 6.31944 3.39722 6.19167 3.525C6.06389 3.65278 6 3.81111 6 4C6 4.18889 6.06389 4.34722 6.19167 4.475C6.31944 4.60278 6.47778 4.66667 6.66667 4.66667ZM6.66667 13.3333C5.74444 13.3333 4.87778 13.1583 4.06667 12.8083C3.25556 12.4583 2.55 11.9833 1.95 11.3833C1.35 10.7833 0.875 10.0778 0.525 9.26667C0.175 8.45555 0 7.58889 0 6.66667C0 5.74444 0.175 4.87778 0.525 4.06667C0.875 3.25556 1.35 2.55 1.95 1.95C2.55 1.35 3.25556 0.875 4.06667 0.525C4.87778 0.175 5.74444 0 6.66667 0C7.58889 0 8.45555 0.175 9.26667 0.525C10.0778 0.875 10.7833 1.35 11.3833 1.95C11.9833 2.55 12.4583 3.25556 12.8083 4.06667C13.1583 4.87778 13.3333 5.74444 13.3333 6.66667C13.3333 7.58889 13.1583 8.45555 12.8083 9.26667C12.4583 10.0778 11.9833 10.7833 11.3833 11.3833C10.7833 11.9833 10.0778 12.4583 9.26667 12.8083C8.45555 13.1583 7.58889 13.3333 6.66667 13.3333ZM6.66667 12C8.15555 12 9.41667 11.4833 10.45 10.45C11.4833 9.41667 12 8.15555 12 6.66667C12 5.17778 11.4833 3.91667 10.45 2.88333C9.41667 1.85 8.15555 1.33333 6.66667 1.33333C5.17778 1.33333 3.91667 1.85 2.88333 2.88333C1.85 3.91667 1.33333 5.17778 1.33333 6.66667C1.33333 8.15555 1.85 9.41667 2.88333 10.45C3.91667 11.4833 5.17778 12 6.66667 12Z"
                                  fill="#F04438"
                                />
                              </svg>
                              โปรดอัปโหลดเอกสารใหม่
                            </div>
                          )}
                      </>
                    )}
                  </div>

                  {/* Submit Button for Courtesy Document - Only show for รอยื่นเอกสารขอความอนุเคราะห์ and not submitted - Hidden on mobile */}
                  {/* Fixed Mobile Courtesy Upload Button */}
                  {((currentStep === "รอยื่นเอกสารขอความอนุเคราะห์" &&
                    !isCourtesySubmitted) ||
                    (documentStatus === "เอกสารไม่ผ่าน" && isReuploadReady)) && (
                      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40">
                        <button
                          type="button"
                          onClick={
                            documentStatus === "เอกสารไม่ผ่าน"
                              ? handleReuploadConfirm
                              : handleConfirmCourtesyUpload
                          }
                          disabled={!courtesyDocument}
                          className={`w-full py-3 rounded-xl font-medium transition-colors active:scale-95 ${courtesyDocument
                            ? "bg-primary-600 text-white active:bg-primary-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          ยืนยันการอัปโหลดเอกสาร
                        </button>
                      </div>
                    )}

                  {/* Desktop Button for Courtesy Document Upload */}
                  {((currentStep === "รอยื่นเอกสารขอความอนุเคราะห์" &&
                    !isCourtesySubmitted) ||
                    (documentStatus === "เอกสารไม่ผ่าน" && isReuploadReady)) && (
                      <button
                        type="button"
                        onClick={
                          documentStatus === "เอกสารไม่ผ่าน"
                            ? handleReuploadConfirm
                            : handleConfirmCourtesyUpload
                        }
                        disabled={!courtesyDocument}
                        className={`hidden md:block w-full mt-6 py-3 rounded-xl font-medium transition-colors cursor-pointer active:scale-95 ${courtesyDocument
                          ? "bg-primary-600 text-white hover:bg-primary-700"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                      >
                        ยืนยันการอัปโหลดเอกสาร
                      </button>
                    )}
                </>
              )}

            {/* Action Buttons - Show only when step is รอยื่นเอกสาร and transcript is uploaded */}
            {currentStep === "รอยื่นเอกสาร" && allRequiredDocsUploaded() && (
              <div className="hidden md:flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancelApplication}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors cursor-pointer active:scale-95"
                >
                  ยกเลิกการสมัคร
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApplication}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-white hover:text-primary-600 hover:border-2 hover:border-primary-600 border-2 border-primary-600 transition-colors cursor-pointer active:scale-95"
                >
                  ยืนยันการสมัคร
                </button>
              </div>
            )}
          </div>
          {/* Mobile Document List Card - Show when document is fully approved - Separate card between Document Upload and Application Status */}
          {documentStatus === "เอกสารผ่าน" && (
            <div className="md:hidden bg-white rounded-2xl shadow-sm p-4 border-2 border-primary-600 order-2">
              <h2 className="text-base font-bold text-gray-800 mb-3 text-center">
                <span className="text-red-500">*</span>{" "}
                รายการเอกสารที่ต้องเตรียม
              </h2>
              <div className="flex justify-center">
                <Link
                  href="/application-status/document-list"
                  className="group inline-flex items-center gap-2 px-4 py-2 border-2 border-primary-600 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-white hover:text-primary-600 transition-colors active:scale-95"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 13.2833 8.09583 13.5208 8.2875 13.7125C8.47917 13.9042 8.71667 14 9 14ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z" />
                  </svg>
                  <span>รายการเอกสาร</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Select New Job Button - Mobile only - Show when rejected or isRejectedApplication (outside cards) */}
        {/* Fixed Mobile Select New Job Button */}
        {(isRejected || isRejectedApplication) && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40">
            <button
              onClick={() => router.push("/intern-home")}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium text-base hover:bg-primary-700 transition-colors active:scale-95"
            >
              เลือกตำแหน่งงานใหม่
            </button>
          </div>
        )}
      </main>

      {/* Fixed Mobile Action Buttons */}
      {currentStep === "รอยื่นเอกสาร" && allRequiredDocsUploaded() && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 md:hidden z-40">
          <button
            type="button"
            onClick={handleCancelApplication}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors cursor-pointer active:scale-95 active:bg-red-600 active:text-white active:border-red-600"
          >
            ยกเลิกการสมัคร
          </button>
          <button
            type="button"
            onClick={handleConfirmApplication}
            className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium border-2 border-primary-600 transition-colors cursor-pointer active:scale-95 active:bg-primary-700"
          >
            ยืนยันการสมัคร
          </button>
        </div>
      )}

      {/* Fixed Mobile Courtesy Upload Button */}
      {currentStep === "รอยื่นเอกสารขอความอนุเคราะห์" &&
        !isCourtesySubmitted && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40">
            <button
              type="button"
              onClick={handleConfirmCourtesyUpload}
              disabled={!courtesyDocument}
              className={`w-full py-3 rounded-xl font-medium transition-colors cursor-pointer active:scale-95 ${courtesyDocument
                ? "bg-primary-600 text-white active:bg-primary-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              ยืนยันการอัปโหลดเอกสาร
            </button>
          </div>
        )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              อัปโหลดเอกสารเสร็จสิ้น
            </h3>
          </div>
        </div>
      )}

      {/* Confirm Application Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-black mb-2">
              {currentStep === "รอยื่นเอกสารขอความอนุเคราะห์" || isReuploadReady
                ? "ยืนยันการอัปโหลดเอกสาร"
                : "ยืนยันการสมัคร"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {currentStep === "รอยื่นเอกสารขอความอนุเคราะห์" || isReuploadReady
                ? "กรุณาตรวจสอบเอกสารก่อนยืนยัน"
                : "ถ้าสมัครแล้วไม่สามารถเปลี่ยนตำแหน่งงานได้"}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={
                  isReuploadReady
                    ? handleFinalReuploadConfirm
                    : currentStep === "รอยื่นเอกสารขอความอนุเคราะห์"
                      ? handleFinalCourtesyConfirm
                      : handleFinalConfirm
                }
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors cursor-pointer"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Success Modal */}
      {showConfirmSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              {currentStep === "รอยื่นเอกสารขอความอนุเคราะห์" ||
                documentStatus === "เอกสารผ่าน"
                ? "ยืนยันการอัปโหลดเอกสารเรียบร้อยแล้ว"
                : "ยืนยันการสมัครเรียบร้อยแล้ว"}
            </h3>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-black mb-6">
              ยืนยันการยกเลิก
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleFinalCancel}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors cursor-pointer"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Success Modal */}
      {showCancelSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              ยกเลิกการสมัครเรียบร้อยแล้ว
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarIntern />
      <VideoLoading message="กำลังโหลดข้อมูล..." />
    </div>
  );
}

export default function ApplicationStatusPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ApplicationStatusContent />
    </Suspense>
  );
}
