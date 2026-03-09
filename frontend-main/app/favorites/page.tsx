"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavbarIntern } from "../components";
import VideoLoading from "../components/ui/VideoLoading";
import { Job } from "../components/ui/JobCard";
import { favoriteApi, positionIdToJobId, jobIdToPositionId, FavoriteItem, positionToJob, applicationApi, canApplyForNewJob, MyApplicationData } from "../services/api";

export default function FavoritesPage() {
  const router = useRouter();
  const [favoriteJobs, setFavoriteJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveApplication, setHasActiveApplication] = useState(false);

  // Check for active application on mount
  useEffect(() => {
    const checkActiveApplication = async () => {
      try {
        const app = await applicationApi.getMyLatestApplication();
        setHasActiveApplication(!canApplyForNewJob(app));
      } catch {
        setHasActiveApplication(false);
      }
    };
    checkActiveApplication();
  }, []);

  // Load favorites from API on mount
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const response = await favoriteApi.getFavorites();
        const now = new Date();
        // Helper: normalize PostgreSQL timestamp → Date
        const safeDate = (d: string | null | undefined): Date | null => {
          if (!d) return null;
          const parsed = new Date(d.includes('T') ? d : d.replace(' ', 'T'));
          return isNaN(parsed.getTime()) ? null : parsed;
        };
        // Filter out expired/closed positions (same logic as intern-home)
        const activeItems = response.data.filter((item: FavoriteItem) => {
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
        const jobs: Job[] = activeItems.map((item: FavoriteItem) => {
          return positionToJob(item.position);
        });
        setFavoriteJobs(jobs);
        // Sync localStorage
        const favoriteJobIds = jobs.map(j => j.id);
        localStorage.setItem("favorites", JSON.stringify(favoriteJobIds));
        window.dispatchEvent(new Event("favoritesUpdated"));
      } catch {
        setFavoriteJobs([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (jobId: string) => {
    const positionId = jobIdToPositionId(jobId);
    if (positionId) {
      await favoriteApi.removeFavorite(positionId);
    }
    const newJobs = favoriteJobs.filter((job) => job.id !== jobId);
    setFavoriteJobs(newJobs);
    // Sync localStorage
    const favoriteJobIds = newJobs.map(j => j.id);
    localStorage.setItem("favorites", JSON.stringify(favoriteJobIds));
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <NavbarIntern />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1 ">
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 21V5C5 4.45 5.19583 3.97917 5.5875 3.5875C5.97917 3.19583 6.45 3 7 3H17C17.55 3 18.0208 3.19583 18.4125 3.5875C18.8042 3.97917 19 4.45 19 5V21L12 18L5 21Z"
                fill="#A80689"
              />
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-black">
                รายการโปรดของคุณ
              </h1>
              <p className="text-gray-500">ตำแหน่งงานที่คุณสนใจ</p>
            </div>
          </div>
        </div>

        {/* Count */}
        <p className="text-gray-600 mb-4">พบ {favoriteJobs.length} ตำแหน่ง</p>

        {isLoading ? (
          <div className="min-h-screen bg-gray-50 fixed inset-0 z-40">
            <NavbarIntern />
            <VideoLoading message="กำลังโหลดรายการโปรด..." />
          </div>
        ) : favoriteJobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">ไม่พบรายการโปรดของคุณ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favoriteJobs.map((job) => (
              <div
                key={job.id}
                onClick={(e) => {
                  e.stopPropagation();
                  // Save job data to localStorage before navigating
                  localStorage.setItem("selectedJobDetail", JSON.stringify(job));
                  router.push("/intern-home/job-detail");
                }}
                className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:shadow-md hover:border-primary-600 transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-gray-900 font-semibold text-base leading-tight">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* View Detail Icon */}
                    {/* Bookmark Filled Icon - Click to remove */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(job.id);
                      }}
                      className="cursor-pointer text-primary-600 hover:text-primary-700 transition-colors p-2 rounded-2xl  hover:bg-gray-100"
                    >
                      <svg
                        width="14"
                        height="17"
                        viewBox="0 0 14 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7 15L2.8 16.8C2.13333 17.0833 1.5 17.0292 0.9 16.6375C0.3 16.2458 0 15.6917 0 14.975V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V14.975C14 15.6917 13.7 16.2458 13.1 16.6375C12.5 17.0292 11.8667 17.0833 11.2 16.8L7 15Z"
                          fill="#A80689"
                        />
                      </svg>
                    </button>
                    {/* Apply Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!hasActiveApplication) {
                          router.push("/intern-info");
                        }
                      }}
                      disabled={hasActiveApplication}
                      className={`cursor-pointer px-4 py-1.5 border-2 rounded-lg text-sm font-medium transition-colors ${hasActiveApplication
                          ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-primary-600 border-primary-600 text-white hover:bg-white hover:text-primary-600"
                        }`}
                      title={hasActiveApplication ? "คุณมีการสมัครที่กำลังดำเนินการอยู่" : ""}
                    >
                      สมัคร
                    </button>
                  </div>
                </div>

                {/* Department */}
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
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

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
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

                {/* Positions */}
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
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
                  <span>
                    {job.currentApplicants}/{job.maxApplicants} ตำแหน่ง
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <svg
                    width="18"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H18C18.55 2 19.0208 2.19583 19.4125 2.5875C19.8042 2.97917 20 3.45 20 4V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM6 20H18V4H16V10.125C16 10.325 15.9167 10.4708 15.75 10.5625C15.5833 10.6542 15.4167 10.65 15.25 10.55L14.025 9.8C13.8583 9.7 13.6875 9.65 13.5125 9.65C13.3375 9.65 13.1667 9.7 13 9.8L11.775 10.55C11.6083 10.65 11.4375 10.6542 11.2625 10.5625C11.0875 10.4708 11 10.325 11 10.125V4H6V20Z"
                      fill="#A80689"
                    />
                  </svg>
                  {job.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-50 text-gray-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <svg
                    width="15"
                    height="18"
                    viewBox="0 0 20 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6H16V4H2V6ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V1C3 0.716667 3.09583 0.479167 3.2875 0.2875C3.47917 0.0958333 3.71667 0 4 0C4.28333 0 4.52083 0.0958333 4.7125 0.2875C4.90417 0.479167 5 0.716667 5 1V2H13V1C13 0.716667 13.0958 0.479167 13.2875 0.2875C13.4792 0.0958333 13.7167 0 14 0C14.2833 0 14.5208 0.0958333 14.7125 0.2875C14.9042 0.479167 15 0.716667 15 1V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V8.675C18 8.95833 17.9042 9.19583 17.7125 9.3875C17.5208 9.57917 17.2833 9.675 17 9.675C16.7167 9.675 16.4792 9.57917 16.2875 9.3875C16.0958 9.19583 16 8.95833 16 8.675V8H2V18H7.8C8.08333 18 8.32083 18.0958 8.5125 18.2875C8.70417 18.4792 8.8 18.7167 8.8 19C8.8 19.2833 8.70417 19.5208 8.5125 19.7125C8.32083 19.9042 8.08333 20 7.8 20H2ZM15 21C13.6167 21 12.4375 20.5125 11.4625 19.5375C10.4875 18.5625 10 17.3833 10 16C10 14.6167 10.4875 13.4375 11.4625 12.4625C12.4375 11.4875 13.6167 11 15 11C16.3833 11 17.5625 11.4875 18.5375 12.4625C19.5125 13.4375 20 14.6167 20 16C20 17.3833 19.5125 18.5625 18.5375 19.5375C17.5625 20.5125 16.3833 21 15 21ZM15.5 15.8V13.5C15.5 13.3667 15.45 13.25 15.35 13.15C15.25 13.05 15.1333 13 15 13C14.8667 13 14.75 13.05 14.65 13.15C14.55 13.25 14.5 13.3667 14.5 13.5V15.775C14.5 15.9083 14.525 16.0375 14.575 16.1625C14.625 16.2875 14.7 16.4 14.8 16.5L16.325 18.025C16.425 18.125 16.5417 18.175 16.675 18.175C16.8083 18.175 16.925 18.125 17.025 18.025C17.125 17.925 17.175 17.8083 17.175 17.675C17.175 17.5417 17.125 17.425 17.025 17.325L15.5 15.8Z"
                      fill="#A80689"
                    />
                  </svg>
                  <span>
                    รอบที่เปิดรับสมัคร: {job.startDate} - {job.endDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
