import React from "react";

interface PaginationControlProps {
  pagination: {
    page: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onExport: () => void;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  pagination,
  onPageChange,
  onExport,
}) => {
  return (
    <div className="flex flex-row items-center justify-between gap-4 shrink-0 pb-8 mt-auto pt-4">
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-2 font-bold text-[15px] hover:opacity-80 text-gray-700 dark:text-gray-300 whitespace-nowrap"
      >
        <span className="material-symbols-rounded !text-[20px] sm:!text-[24px] text-[#b40e56]">
          ios_share
        </span>
        <span className="hidden sm:inline">ส่งออกตาราง</span>
        <span className="sm:hidden text-sm">ส่งออกตาราง</span>
      </button>

      <div className="inline-flex items-center border border-gray-200 dark:border-gray-700 rounded-full overflow-x-auto shadow-sm w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 disabled:opacity-50"
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

        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
          let pageNum = 1;
          if (pagination.totalPages <= 5) pageNum = i + 1;
          else if (pagination.page <= 3) pageNum = i + 1;
          else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
          else pageNum = pagination.page - 2 + i;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-2.5 py-1 sm:px-3.5 sm:py-1 text-xs sm:text-base font-bold border-r border-gray-200 dark:border-gray-700 shrink-0 ${pagination.page === pageNum
                ? "text-gray-800 dark:text-gray-200 bg-[#dce0e5] dark:bg-gray-600"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212]"
                }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] flex items-center justify-center shrink-0 disabled:opacity-50"
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
