"use client";

import { useState, useRef, useEffect } from "react";
import {
  highSchools,
  vocationalSchools,
  highVocationalSchools,
  universities,
} from "../../app/data/institutions";

// Institution categories
const institutionCategories = [
  { id: "all", label: "ทั้งหมด", count: 4 },
  { id: "high_school", label: "มัธยมศึกษาตอนปลาย", schools: highSchools },
  {
    id: "vocational",
    label: "ประกาศนียบัตรวิชาชีพ (ปวช.)",
    schools: vocationalSchools,
  },
  {
    id: "high_vocational",
    label: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
    schools: highVocationalSchools,
  },
  { id: "university", label: "มหาวิทยาลัย", schools: universities },
];

interface OwnerSearchSectionProps {
  onSearch?: (filters: {
    keyword: string;
    selectedInstitutions: string[];
  }) => void;
}

export default function OwnerSearchSection({
  onSearch,
}: OwnerSearchSectionProps) {
  const [keyword, setKeyword] = useState("");

  // Institution dropdown state
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>(
    [],
  );
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [institutionSearch, setInstitutionSearch] = useState("");
  const institutionDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        institutionDropdownRef.current &&
        !institutionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowInstitutionDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle "ทั้งหมด" selection
  const handleSelectAll = () => {
    if (selectedInstitutions.includes("all")) {
      setSelectedInstitutions([]);
    } else {
      setSelectedInstitutions(["all"]);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    const newSelection = selectedInstitutions.filter((s) => s !== "all");
    if (newSelection.includes(categoryId)) {
      const filtered = newSelection.filter((s) => s !== categoryId);
      setSelectedInstitutions(filtered);
    } else {
      setSelectedInstitutions([...newSelection, categoryId]);
    }
  };

  // Handle individual school selection
  const handleSchoolSelect = (school: string) => {
    const newSelection = selectedInstitutions.filter((s) => s !== "all");
    if (newSelection.includes(school)) {
      const filtered = newSelection.filter((s) => s !== school);
      setSelectedInstitutions(filtered);
    } else {
      setSelectedInstitutions([...newSelection, school]);
    }
  };

  // Get filtered schools based on search
  const getFilteredSchools = (schools: string[]) => {
    if (!institutionSearch) return schools;
    return schools.filter((school) =>
      school.toLowerCase().includes(institutionSearch.toLowerCase()),
    );
  };

  // Get display text for institution dropdown
  const getInstitutionDisplayText = () => {
    return "ชื่อสถาบันศึกษา";
  };

  // Handle search submit
  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        keyword,
        selectedInstitutions: selectedInstitutions,
      });
    }
  };

  // Close dropdown
  const handleCloseDropdown = () => {
    setShowInstitutionDropdown(false);
  };

  // Toggle dropdown
  const handleToggleDropdown = () => {
    setShowInstitutionDropdown(!showInstitutionDropdown);
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
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center gap-4">
          {/* Keyword Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
              placeholder="ค้นหาตำแหน่งหรือชื่อผู้สมัคร..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-primary-300 outline-none text-gray-700 bg-white"
            />
          </div>

          {/* Institution Dropdown */}
          <div className="md:w-64 relative" ref={institutionDropdownRef}>
            <button
              onClick={handleToggleDropdown}
              className="w-full px-4 py-3 rounded-lg border-2 border-primary-600 focus:ring-2 focus:ring-primary-300 outline-none text-gray-700 bg-white flex items-center justify-between cursor-pointer"
            >
              <span className="text-gray-700 truncate">
                {getInstitutionDisplayText()}
              </span>
              <svg
                className={`w-5 h-5 text-primary-600 transition-transform ${showInstitutionDropdown ? "rotate-180" : ""}`}
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

            {showInstitutionDropdown && (
              <div className="absolute top-full right-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-medium text-gray-900">
                    ชื่อสถาบันศึกษา
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleDropdown}
                      className="text-gray-400 hover:text-gray-600"
                    >
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCloseDropdown}
                      className="text-gray-400 hover:text-gray-600"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Search in dropdown */}
                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อสถาบันศึกษา..."
                    value={institutionSearch}
                    onChange={(e) => setInstitutionSearch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm"
                  />
                </div>

                <div className="p-3 max-h-80 overflow-y-auto">
                  {/* ทั้งหมด option */}
                  <div
                    className="flex items-center gap-3 px-2 py-2.5 cursor-pointer hover:bg-gray-50 rounded-lg"
                    onClick={handleSelectAll}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedInstitutions.includes("all") ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
                    >
                      {selectedInstitutions.includes("all") && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-700">ทั้งหมด (4)</span>
                  </div>

                  {/* Category list */}
                  {institutionCategories
                    .filter((cat) => cat.id !== "all")
                    .map((category) => (
                      <div key={category.id}>
                        {/* Category header */}
                        <div className="flex items-center justify-between px-2 py-2.5">
                          <div
                            className="flex items-center gap-3 cursor-pointer flex-1"
                            onClick={() => handleCategorySelect(category.id)}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedInstitutions.includes(category.id) ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
                            >
                              {selectedInstitutions.includes(category.id) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="text-gray-700">
                              {category.label}
                            </span>
                          </div>
                          {category.schools && (
                            <button
                              onClick={() =>
                                setExpandedCategory(
                                  expandedCategory === category.id
                                    ? null
                                    : category.id,
                                )
                              }
                              className="text-primary-600 hover:text-primary-700 p-1"
                            >
                              <svg
                                className={`w-5 h-5 transition-transform ${expandedCategory === category.id ? "rotate-180" : ""}`}
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
                          )}
                        </div>

                        {/* Schools list */}
                        {category.schools &&
                          expandedCategory === category.id && (
                            <div className="ml-6 space-y-1">
                              {getFilteredSchools(category.schools)
                                .slice(0, 10)
                                .map((school, idx) => (
                                  <div
                                    key={`${category.id}-${idx}`}
                                    className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-gray-50 rounded-lg"
                                    onClick={() => handleSchoolSelect(school)}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedInstitutions.includes(school) ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
                                    >
                                      {selectedInstitutions.includes(
                                        school,
                                      ) && (
                                        <svg
                                          className="w-3 h-3 text-white"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-gray-600 text-sm">
                                      {school}
                                    </span>
                                  </div>
                                ))}
                              {getFilteredSchools(category.schools).length ===
                                0 && (
                                <p className="text-xs text-gray-400 px-2 py-2">
                                  ไม่พบผลลัพธ์
                                </p>
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
              placeholder="ค้นหาตำแหน่งหรือชื่อผู้สมัคร..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-primary-300 outline-none text-gray-700 bg-white"
            />
          </div>

          {/* Institution Dropdown */}
          <div className="relative" ref={institutionDropdownRef}>
            <button
              onClick={handleToggleDropdown}
              className="w-full px-4 py-3 rounded-lg border-2 border-primary-600 focus:ring-2 focus:ring-primary-300 outline-none text-gray-700 bg-white flex items-center justify-between cursor-pointer"
            >
              <span className="text-gray-700 truncate">
                {getInstitutionDisplayText()}
              </span>
              <svg
                className={`w-5 h-5 text-primary-600 transition-transform ${showInstitutionDropdown ? "rotate-180" : ""}`}
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

            {showInstitutionDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-medium text-gray-900">
                    ชื่อสถาบันศึกษา
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleDropdown}
                      className="text-gray-400 hover:text-gray-600"
                    >
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCloseDropdown}
                      className="text-gray-400 hover:text-gray-600"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อสถาบันศึกษา..."
                    value={institutionSearch}
                    onChange={(e) => setInstitutionSearch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm"
                  />
                </div>

                <div className="p-3 max-h-72 overflow-y-auto">
                  {/* ทั้งหมด option */}
                  <div
                    className="flex items-center gap-3 px-2 py-2.5 cursor-pointer hover:bg-gray-50 rounded-lg"
                    onClick={handleSelectAll}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedInstitutions.includes("all") ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
                    >
                      {selectedInstitutions.includes("all") && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-700">ทั้งหมด (4)</span>
                  </div>

                  {/* Category list */}
                  {institutionCategories
                    .filter((cat) => cat.id !== "all")
                    .map((category) => (
                      <div key={category.id}>
                        <div className="flex items-center justify-between px-2 py-2.5">
                          <div
                            className="flex items-center gap-3 cursor-pointer flex-1"
                            onClick={() => handleCategorySelect(category.id)}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedInstitutions.includes(category.id) ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
                            >
                              {selectedInstitutions.includes(category.id) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="text-gray-700">
                              {category.label}
                            </span>
                          </div>
                          {category.schools && (
                            <button
                              onClick={() =>
                                setExpandedCategory(
                                  expandedCategory === category.id
                                    ? null
                                    : category.id,
                                )
                              }
                              className="text-primary-600 hover:text-primary-700 p-1"
                            >
                              <svg
                                className={`w-5 h-5 transition-transform ${expandedCategory === category.id ? "rotate-180" : ""}`}
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
                          )}
                        </div>

                        {category.schools &&
                          expandedCategory === category.id && (
                            <div className="ml-6 space-y-1">
                              {getFilteredSchools(category.schools)
                                .slice(0, 10)
                                .map((school, idx) => (
                                  <div
                                    key={`${category.id}-${idx}`}
                                    className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-gray-50 rounded-lg"
                                    onClick={() => handleSchoolSelect(school)}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedInstitutions.includes(school) ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
                                    >
                                      {selectedInstitutions.includes(
                                        school,
                                      ) && (
                                        <svg
                                          className="w-3 h-3 text-white"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-gray-600 text-sm">
                                      {school}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
