import React from "react";

interface SummaryCard {
  title: string;
  days: number;
  icon: string;
  bgColor: string;
  textColor: string;
  activeBorderClass: string;
  hoverBorderClass: string;
}

interface SummarySectionProps {
  summaryCards: SummaryCard[];
  selectedFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  currentMonth: number | null;
  thaiMonthsFull: string[];
}

const SummarySection: React.FC<SummarySectionProps> = ({
  summaryCards,
  selectedFilter,
  onFilterChange,
  currentMonth,
  thaiMonthsFull,
}) => {
  return (
    <div className="shrink-0 flex flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#000000]">
          สรุปการลงเวลา {currentMonth !== null ? `(${thaiMonthsFull[currentMonth]})` : ''}
        </h2>
        {selectedFilter && (
          <button
            onClick={() => onFilterChange(null)}
            className="text-sm text-blue-500 hover:underline"
          >
            แสดงทั้งหมด
          </button>
        )}
      </div>
      <div className="flex flex-row overflow-x-auto sm:overflow-visible gap-[13px] pt-1 w-full mx-auto sm:mx-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {summaryCards.map((item, index) => {
          const isSelected =
            selectedFilter === item.title ||
            (selectedFilter === null && item.title === "ลาทั้งหมด");

          return (
            <button
              key={index}
              type="button"
              onClick={() => onFilterChange(isSelected ? null : item.title)}
              className={`w-[100px] sm:w-auto flex-none sm:flex-1 ${item.bgColor} flex flex-col sm:flex-row justify-between sm:justify-start items-center sm:items-center p-3 sm:px-4 sm:py-5 rounded-[12px] shadow-none h-[115px] sm:h-[90px] text-center sm:text-left transition-all border-2 ${isSelected ? item.activeBorderClass : `border-transparent hover:-translate-y-1 ${item.hoverBorderClass}`}`}
            >
              <div
                className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full ${
                  item.title === "ลาทั้งหมด"
                    ? "bg-[#03A9F4]"
                    : item.title === "ลากิจ"
                    ? "bg-[#1A3CFF]"
                    : "bg-[#FF1A7D]"
                } sm:mr-4`}
              >
                <span
                  className={`material-symbols-rounded !text-[24px] sm:!text-[28px] text-white flex items-center justify-center leading-none translate-x-[0.5px] ${item.icon === "close" ? "translate-y-[0.5px]" : "-translate-y-[0.5px]"}`}
                >
                  {item.icon}
                </span>
              </div>
              <div className="flex flex-col mt-2 sm:mt-0">
                <div className="font-bold text-gray-800 dark:text-gray-200 text-[13px] sm:text-[15px] mb-0.5 sm:mb-0.5 leading-tight">
                  {item.title}
                </div>
                <div className="text-[15px] sm:text-[22px] font-bold text-black dark:text-white leading-none">
                  {item.days} วัน
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SummarySection;
