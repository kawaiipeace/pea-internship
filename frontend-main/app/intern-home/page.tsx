"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NavbarIntern } from "../components";
import VideoLoading from "../components/ui/VideoLoading";
import SearchSection from "../components/ui/SearchSection";
import JobCard, { Job } from "../components/ui/JobCard";
import JobDetailPanel from "../components/ui/JobDetailPanel";
import Pagination from "../components/ui/Pagination";
import Toast from "../components/ui/Toast";
import {
  positionApi,
  positionToJobWithStaff,
  userApi,
  StaffUser,
  favoriteApi,
  jobIdToPositionId,
  positionIdToJobId,
  applicationApi,
} from "../services/api";

export default function InternHomePage() {
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success",
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResetKey, setSearchResetKey] = useState(0);

  // Load jobs from API on mount
  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      try {
        const response = await positionApi.getPositions({ limit: 100 });
        const positions = response.data || [];

        // ลองดึง staff list (อาจ fail ถ้าไม่มีสิทธิ์)
        let staffList: StaffUser[] = [];
        try {
          staffList = await userApi.getStaff();
        } catch {
          // ไม่มีสิทธิ์ดึง staff - ใช้ข้อมูลว่าง
        }

        // Convert positions to Job format with staff data
        // Filter: only OPEN positions within their apply period (or no time limit)
        const now = new Date();
        // Helper: normalize PostgreSQL timestamp "YYYY-MM-DD HH:MM:SS" → ISO "YYYY-MM-DDTHH:MM:SS"
        const safeDate = (d: string | null | undefined): Date | null => {
          if (!d) return null;
          const parsed = new Date(d.includes("T") ? d : d.replace(" ", "T"));
          return isNaN(parsed.getTime()) ? null : parsed;
        };
        const apiJobs = positions
          .filter((p) => {
            if (p.recruitmentStatus !== "OPEN") return false;
            const start = safeDate(p.applyStart);
            const end = safeDate(p.applyEnd);
            if (start && now < start) return false; // not yet open
            if (end) {
              // Position remains visible until end of the last day (23:59:59)
              const endOfDay = new Date(end);
              endOfDay.setHours(23, 59, 59, 999);
              if (now > endOfDay) return false; // expired
            }
            return true;
          })
          .map((p) => positionToJobWithStaff(p, staffList));

        // Combine API jobs with mock jobs (API jobs first)
        const combinedJobs = [...apiJobs];
        setAllJobs(combinedJobs);
        setFilteredJobs(combinedJobs);
      } catch {
        // Fallback to mock jobs if API fails
        setAllJobs([]);
        setFilteredJobs([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadJobs();
  }, []);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const totalJobs = filteredJobs.length;
  const jobsPerPage = 10;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  // Get current page jobs
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  // Load favorites from API on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await favoriteApi.getFavorites();
        const now = new Date();
        // Helper: normalize PostgreSQL timestamp → Date
        const safeDate = (d: string | null | undefined): Date | null => {
          if (!d) return null;
          const parsed = new Date(d.includes("T") ? d : d.replace(" ", "T"));
          return isNaN(parsed.getTime()) ? null : parsed;
        };
        // Filter out expired/closed positions
        const activeItems = response.data.filter((item) => {
          const p = item.position;
          if (p.recruitmentStatus !== "OPEN") return false;
          const start = safeDate(p.applyStart);
          const end = safeDate(p.applyEnd);
          if (start && now < start) return false;
          if (end) {
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);
            if (now > endOfDay) return false;
          }
          return true;
        });
        const favoriteJobIds = activeItems.map((item) =>
          positionIdToJobId(item.favorite.positionId),
        );
        setFavorites(favoriteJobIds);
        localStorage.setItem("favorites", JSON.stringify(favoriteJobIds));
        window.dispatchEvent(new Event("favoritesUpdated"));
      } catch {
        // Fallback to localStorage
        const savedFavorites = localStorage.getItem("favorites");
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      }
    };
    loadFavorites();
  }, []);

  // Auto-select first job when filteredJobs or page changes
  useEffect(() => {
    if (currentJobs.length > 0) {
      setSelectedJob(currentJobs[0]);
    } else {
      setSelectedJob(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredJobs, currentPage]);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedJob(null);
  };

  const handleSearch = (keyword: string, jobTypes: string[]) => {
    setSearchKeyword(keyword);
    setSelectedJobTypes(jobTypes);
    setCurrentPage(1);

    let results = allJobs;

    // Filter by keyword (search in title, department, location, tags)
    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      results = results.filter(
        (job) =>
          job.title.toLowerCase().includes(lowerKeyword) ||
          job.department.toLowerCase().includes(lowerKeyword) ||
          job.location.toLowerCase().includes(lowerKeyword) ||
          job.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword)),
      );
    }

    // Filter by job types (สาขาวิชา) — compare Thai labels directly against job tags
    if (jobTypes.length > 0 && !jobTypes.includes("all")) {
      results = results.filter((job) => {
        const jobTags = job.tags.map((tag) => tag.toLowerCase().trim());
        return jobTypes.some((type) => {
          const lowerType = type.toLowerCase().trim();
          return jobTags.some(
            (tag) => tag.includes(lowerType) || lowerType.includes(tag),
          );
        });
      });
    }

    setFilteredJobs(results);
    setSelectedJob(results.length > 0 ? results[0] : null);
  };

  const handleApply = async () => {
    if (selectedJob) {
      // ตรวจสอบว่าตำแหน่งเต็มหรือไม่
      if (
        selectedJob.maxApplicants > 0 &&
        selectedJob.currentApplicants >= selectedJob.maxApplicants
      ) {
        setToastMessage("ตำแหน่งนี้รับสมัครเต็มแล้ว");
        setToastType("error");
        setShowToast(true);
        return;
      }
      // Call API to validate application (backend checks internshipStatus + position status)
      const positionId = jobIdToPositionId(selectedJob.id);
      if (positionId) {
        try {
          await applicationApi.createApplication(positionId);
          // Store positionId for use in intern-info page
          localStorage.setItem("currentPositionId", String(positionId));
        } catch (err: unknown) {
          const error = err as { response?: { data?: { message?: string } } };
          const msg =
            error?.response?.data?.message ||
            "ไม่สามารถสมัครได้ กรุณาลองใหม่อีกครั้ง";
          setToastMessage(msg);
          setToastType("error");
          setShowToast(true);
          return;
        }
      }

      router.push("/intern-info");
    }
  };

  const handleBookmarkClick = useCallback(
    async (jobId: string) => {
      const positionId = jobIdToPositionId(jobId);
      let newFavorites: string[];
      let message: string;
      let type: "success" | "error" | "info";
      if (favorites.includes(jobId)) {
        newFavorites = favorites.filter((id) => id !== jobId);
        message = "ลบตำแหน่งงานออกจากรายการโปรดแล้ว";
        type = "error";
        // Call API to remove favorite
        if (positionId) {
          await favoriteApi.removeFavorite(positionId);
        }
      } else {
        newFavorites = [...favorites, jobId];
        message = "บันทึกตำแหน่งงานของคุณเรียบร้อยแล้ว";
        type = "success";
        // Call API to add favorite
        if (positionId) {
          await favoriteApi.addFavorite(positionId);
        }
      }
      setFavorites(newFavorites);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      // Dispatch event to update Navbar favorites count
      window.dispatchEvent(new Event("favoritesUpdated"));
      setToastMessage(message);
      setToastType(type);
      setShowToast(true);
    },
    [favorites],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarIntern favoritesCount={favorites.length} />
        <VideoLoading message="กำลังโหลดตำแหน่งฝึกงาน..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <NavbarIntern favoritesCount={favorites.length} />

      {/* Search Section */}
      <SearchSection onSearch={handleSearch} resetKey={searchResetKey} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            ตำแหน่งฝึกงาน
          </h1>
          <p className="text-gray-500">
            ค้นหาโอกาสฝึกงานที่เหมาะสมกับคุณจาก {totalJobs} ตำแหน่ง
          </p>
        </div>

        {/* <div className="mb-4">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-primary-600 text-gray-600 rounded-full text-sm font-medium  transition-colors">
            ตำแหน่งงานทั้งหมด
          </button>
        </div> */}

        {/* Job Listings Grid */}
        {totalJobs === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <img
              src="/images/Empty.png"
              alt="ไม่พบตำแหน่งฝึกงาน"
              className="w-40 h-40 mb-6 opacity-80"
            />
            <h2 className="text-xl font-semibold text-gray-500 mb-3">
              ไม่พบตำแหน่งฝึกงานที่เปิดรับสมัคร
            </h2>
            <p className="text-gray-400 text-center text-sm max-w-md mb-6 leading-relaxed">
              ยังไม่พบตำแหน่งงานที่เปิดรับสมัครในขณะนี้
              <br />
              กรุณาตรวจสอบอีกครั้งในภายหลัง หรือปรับเงื่อนไขการค้นหา
            </p>
            <button
              onClick={() => {
                // Refresh the page to reload everything
                window.location.reload();
              }}
              className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-full text-gray-500 hover:bg-gray-100 transition-colors text-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Job Cards */}
            <div className="space-y-4">
              {currentJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJob?.id === job.id}
                  isFavorite={favorites.includes(job.id)}
                  onClick={handleJobClick}
                  onBookmarkClick={handleBookmarkClick}
                  navigateOnMobile={isMobile}
                  mobileDetailPath="intern"
                />
              ))}

              {/* Pagination Info */}
              <div className="text-sm text-gray-500 text-center">
                แสดง {indexOfFirstJob + 1}-{Math.min(indexOfLastJob, totalJobs)}{" "}
                จากทั้งหมด {totalJobs}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>

            {/* Right Side - Job Detail Panel */}
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <JobDetailPanel
                  selectedJob={selectedJob}
                  onApplyClick={handleApply}
                  isFavorite={
                    selectedJob ? favorites.includes(selectedJob.id) : false
                  }
                  onBookmarkClick={handleBookmarkClick}
                  onViewDetailClick={() => {
                    if (selectedJob) {
                      localStorage.setItem(
                        "selectedJobDetail",
                        JSON.stringify(selectedJob),
                      );
                    }
                    router.push("/intern-home/job-detail");
                  }}
                  isApplyDisabled={
                    selectedJob
                      ? selectedJob.maxApplicants > 0 &&
                        selectedJob.currentApplicants >=
                          selectedJob.maxApplicants
                      : false
                  }
                  disabledMessage={
                    selectedJob &&
                    selectedJob.maxApplicants > 0 &&
                    selectedJob.currentApplicants >= selectedJob.maxApplicants
                      ? "ตำแหน่งนี้รับสมัครเต็มแล้ว"
                      : ""
                  }
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />
    </div>
  );
}
