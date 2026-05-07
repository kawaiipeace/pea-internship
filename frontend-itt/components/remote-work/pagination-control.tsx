import React from "react";

interface MetaData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginationControlProps {
  meta: MetaData | null;
  onPageChange: (page: number) => void;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  meta,
  onPageChange,
}) => {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex justify-end items-center mt-6 mb-10">
      <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[14px] overflow-hidden shadow-sm">
        <button
          onClick={() => onPageChange(Math.max(1, meta.page - 1))}
          disabled={meta.page === 1}
          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-rounded !text-[20px]">
            chevron_left
          </span>
        </button>

        {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 flex items-center justify-center text-[14px] font-bold border-r border-gray-200 dark:border-gray-700 transition-colors ${
              meta.page === page
                ? "bg-[#E4E7EC] dark:bg-gray-700 text-[#344054] dark:text-white"
                : "text-[#344054] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(meta.totalPages, meta.page + 1))}
          disabled={meta.page === meta.totalPages}
          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-rounded !text-[20px]">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
};

export default PaginationControl;
