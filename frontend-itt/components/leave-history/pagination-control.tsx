import React from "react";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onExport: () => void;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onExport,
}) => {
  return (
    <div className="flex flex-row items-center justify-between gap-4 shrink-0 pb-8 mt-auto pt-4">
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-2 font-bold text-[15px] hover:opacity-80 text-[#b40e56] whitespace-nowrap"
      >
        <span className="material-symbols-rounded !text-[20px] sm:!text-[24px]">
          ios_share
        </span>
        <span className="hidden sm:inline">ส่งออกตาราง</span>
        <span className="sm:hidden text-sm">ส่งออกตาราง</span>
      </button>

      <div className="inline-flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto shadow-sm w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <svg
            className="w-3.5 h-3.5 stroke-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-2.5 py-1 sm:px-3.5 sm:py-1 text-xs sm:text-base font-bold border-r border-gray-200 dark:border-gray-700 shrink-0 ${
              currentPage === page
                ? "bg-[#dce0e5] dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] flex items-center justify-center shrink-0 disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <svg
            className="w-3.5 h-3.5 stroke-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PaginationControl;
