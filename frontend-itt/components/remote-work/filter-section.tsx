import React from "react";

interface Staff {
  id: string;
  fname: string;
  lname: string;
  displayUsername: string | null;
}

interface FilterSectionProps {
  onAddClick: () => void;
  // Work Date Sort
  isWorkDateDropdownOpen: boolean;
  setIsWorkDateDropdownOpen: (open: boolean) => void;
  activeSortField: "workDate" | "assignedDate" | null;
  dateSortOrder: "desc" | "asc";
  onWorkDateSortChange: (order: "desc" | "asc") => void;
  // Assigned Date Sort
  isAssignedDateDropdownOpen: boolean;
  setIsAssignedDateDropdownOpen: (open: boolean) => void;
  assignedDateSortOrder: "desc" | "asc";
  onAssignedDateSortChange: (order: "desc" | "asc") => void;
  // Assigner Filter
  isAssignerDropdownOpen: boolean;
  setIsAssignerDropdownOpen: (open: boolean) => void;
  assignerFilter: { label: string; value: string };
  onAssignerFilterChange: (filter: { label: string; value: string }) => void;
  staffList: Staff[];
  // Search
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  onAddClick,
  isWorkDateDropdownOpen,
  setIsWorkDateDropdownOpen,
  activeSortField,
  dateSortOrder,
  onWorkDateSortChange,
  isAssignedDateDropdownOpen,
  setIsAssignedDateDropdownOpen,
  assignedDateSortOrder,
  onAssignedDateSortChange,
  isAssignerDropdownOpen,
  setIsAssignerDropdownOpen,
  assignerFilter,
  onAssignerFilterChange,
  staffList,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Section Header & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-4">
        <h2 className="text-[16px] font-bold text-black dark:text-white">
          รายการประวัติการลงเวลา
        </h2>
        <button
          onClick={onAddClick}
          className="w-full sm:w-[236px] h-[44px] bg-[#A80689] hover:bg-[#8e0574] text-white rounded-[5px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
        >
          <span className="material-symbols-rounded !text-[24px]">add</span>
          เพิ่มวันทำงานนอกสถานที่
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Work Date Dropdown */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setIsWorkDateDropdownOpen(!isWorkDateDropdownOpen)}
            className={`flex items-center gap-4 bg-white dark:bg-gray-800 border ${
              activeSortField === "workDate"
                ? "border-[#A80689]"
                : "border-gray-200 dark:border-gray-700"
            } rounded-lg px-3 py-2.5 sm:py-2 text-[12px] font-medium text-[#333] shadow-sm w-full sm:min-w-[150px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`}
          >
            วันที่ปฏิบัติงาน{" "}
            {activeSortField === "workDate"
              ? ` : ${dateSortOrder === "desc" ? "มากไปน้อย" : "น้อยไปมาก"}`
              : ""}
            <span
              className={`material-symbols-rounded !text-[18px] transition-transform ${
                isWorkDateDropdownOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>

          {isWorkDateDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-[40]"
                onClick={() => setIsWorkDateDropdownOpen(false)}
              ></div>
              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[50] overflow-hidden py-1">
                <button
                  onClick={() => onWorkDateSortChange("desc")}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    activeSortField === "workDate" && dateSortOrder === "desc"
                      ? "bg-[#FDF2FE] text-[#A80689] font-medium"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  มากไปน้อย
                </button>
                <button
                  onClick={() => onWorkDateSortChange("asc")}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    activeSortField === "workDate" && dateSortOrder === "asc"
                      ? "bg-[#FDF2FE] text-[#A80689] font-medium"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  น้อยไปมาก
                </button>
              </div>
            </>
          )}
        </div>

        {/* Assigned Date Dropdown */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() =>
              setIsAssignedDateDropdownOpen(!isAssignedDateDropdownOpen)
            }
            className={`flex items-center gap-4 bg-white dark:bg-gray-800 border ${
              activeSortField === "assignedDate"
                ? "border-[#A80689]"
                : "border-gray-200 dark:border-gray-700"
            } rounded-lg px-3 py-2.5 sm:py-2 text-[12px] font-medium text-[#333] shadow-sm w-full sm:min-w-[150px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`}
          >
            วันที่มอบหมาย{" "}
            {activeSortField === "assignedDate"
              ? ` : ${
                  assignedDateSortOrder === "desc" ? "มากไปน้อย" : "น้อยไปมาก"
                }`
              : ""}
            <span
              className={`material-symbols-rounded !text-[18px] transition-transform ${
                isAssignedDateDropdownOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>

          {isAssignedDateDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-[40]"
                onClick={() => setIsAssignedDateDropdownOpen(false)}
              ></div>
              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[50] overflow-hidden py-1">
                <button
                  onClick={() => onAssignedDateSortChange("desc")}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    activeSortField === "assignedDate" &&
                    assignedDateSortOrder === "desc"
                      ? "bg-[#FDF2FE] text-[#A80689] font-medium"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  มากไปน้อย
                </button>
                <button
                  onClick={() => onAssignedDateSortChange("asc")}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    activeSortField === "assignedDate" &&
                    assignedDateSortOrder === "asc"
                      ? "bg-[#FDF2FE] text-[#A80689] font-medium"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  น้อยไปมาก
                </button>
              </div>
            </>
          )}
        </div>

        {/* Assigner Dropdown */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setIsAssignerDropdownOpen(!isAssignerDropdownOpen)}
            className={`flex items-center gap-4 bg-white dark:bg-gray-800 border ${
              assignerFilter.value !== "all"
                ? "border-[#A80689]"
                : "border-gray-200 dark:border-gray-700"
            } rounded-lg px-3 py-2.5 sm:py-2 text-[12px] font-medium text-[#333] shadow-sm w-full sm:min-w-[150px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`}
          >
            ผู้มอบหมาย : {assignerFilter.label}
            <span
              className={`material-symbols-rounded !text-[18px] transition-transform ${
                isAssignerDropdownOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>

          {isAssignerDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-[40]"
                onClick={() => setIsAssignerDropdownOpen(false)}
              ></div>
              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[50] overflow-hidden py-1 max-h-[300px] overflow-y-auto">
                {/* All Option */}
                <button
                  onClick={() => {
                    onAssignerFilterChange({ label: "ทั้งหมด", value: "all" });
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    assignerFilter.value === "all"
                      ? "bg-[#FDF2FE] text-[#A80689] font-medium"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  ทั้งหมด
                </button>
                {/* Staff List */}
                {staffList.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => {
                      onAssignerFilterChange({
                        label: `${staff.fname} ${staff.lname}`,
                        value: staff.id,
                      });
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      assignerFilter.value === staff.id
                        ? "bg-[#FDF2FE] text-[#A80689] font-medium"
                        : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {staff.fname} {staff.lname}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full mt-1">
        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 !text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="พิมพ์ชื่อนักศึกษา ตำแหน่งเพื่อค้นหา..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white dark:bg-[#121212] border border-[#CECFD2] dark:border-gray-700 rounded-lg pl-11 pr-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#A80689] focus:border-[#A80689] transition-all"
        />
      </div>
    </div>
  );
};

export default FilterSection;
