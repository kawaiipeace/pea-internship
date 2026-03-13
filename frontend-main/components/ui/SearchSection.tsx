"use client";

import { useState, useRef, useEffect } from "react";
import { relatedFieldOptions } from "@/app/data/mockAnnouncements";

interface SearchSectionProps {
  onSearch?: (keyword: string, jobTypes: string[]) => void;
  resetKey?: number;
}

const jobTypeOptions = [
  ...relatedFieldOptions.map((field) => ({
    value: field,
    label: field,
  })),
];

export default function SearchSection({
  onSearch,
  resetKey,
}: SearchSectionProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [isJobTypeOpen, setIsJobTypeOpen] = useState(false);
  const [jobTypeSearch, setJobTypeSearch] = useState("");

  // Reset all filters when resetKey changes
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      setKeyword("");
      setSelectedJobTypes([]);
      setIsJobTypeOpen(false);
    }
  }, [resetKey]);

  const jobTypeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        jobTypeRef.current &&
        !jobTypeRef.current.contains(event.target as Node)
      ) {
        setIsJobTypeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleJobTypeChange = (value: string) => {
    setSelectedJobTypes((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  // Trigger search on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(keyword, selectedJobTypes);
    }
  };

  // Auto-search when filters change
  useEffect(() => {
    if (onSearch) {
      onSearch(keyword, selectedJobTypes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, selectedJobTypes]);

  const getJobTypeLabel = () => {
    if (selectedJobTypes.length === 0) return "สาขาวิชาทั้งหมด";
    if (selectedJobTypes.length === 1) {
      const selected = jobTypeOptions.find(
        (opt) => opt.value === selectedJobTypes[0],
      );
      return selected?.label || "สาขาวิชาทั้งหมด";
    }
    return `เลือก ${selectedJobTypes.length} สาขา`;
  };

  return (
    <div
      className="bg-primary-600 py-10 px-4 relative"
      style={{
        backgroundImage: "url(/images/Navbar.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay to maintain contrast */}
      <div className="absolute inset-0 bg-primary-600 opacity-20"></div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาตำแหน่ง..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-primary-300 outline-none text-gray-700 bg-white"
            />
          </div>

          {/* Job Type Dropdown */}
          <div className="flex-1 relative" ref={jobTypeRef}>
            <button
              type="button"
              onClick={() => {
                setIsJobTypeOpen(!isJobTypeOpen);
                if (!isJobTypeOpen) setJobTypeSearch("");
              }}
              className="w-full px-4 py-3 rounded-lg border-2 border-primary-600 focus:ring-2 focus:ring-primary-300 outline-none text-gray-700 bg-white flex items-center justify-between cursor-pointer"
            >
              <span
                className={
                  selectedJobTypes.length > 0
                    ? "text-gray-700"
                    : "text-gray-500"
                }
              >
                {getJobTypeLabel()}
              </span>
              <svg
                className={`w-5 h-5 text-primary-600 transition-transform ${
                  isJobTypeOpen ? "rotate-180" : ""
                }`}
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

            {/* Job Type Dropdown Menu */}
            {isJobTypeOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-80 flex flex-col">
                {/* Search Input */}
                <div className="px-3 pb-2 border-b border-gray-100">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="ค้นหาสาขาวิชา..."
                      value={jobTypeSearch}
                      onChange={(e) => setJobTypeSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                    />
                  </div>
                </div>

                {/* Options List */}
                <div className="overflow-y-auto max-h-56">
                  {jobTypeOptions
                    .filter((option) =>
                      option.label
                        .toLowerCase()
                        .includes(jobTypeSearch.toLowerCase()),
                    )
                    .map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-primary-100 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedJobTypes.includes(option.value)}
                          onChange={() => handleJobTypeChange(option.value)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 accent-primary-600"
                        />
                        <span className="text-gray-700 text-sm">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  {jobTypeOptions.filter((option) =>
                    option.label
                      .toLowerCase()
                      .includes(jobTypeSearch.toLowerCase()),
                  ).length === 0 &&
                    jobTypeSearch && (
                      <p className="px-4 py-3 text-sm text-gray-400 text-center">
                        ไม่พบสาขาวิชาที่ค้นหา
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
