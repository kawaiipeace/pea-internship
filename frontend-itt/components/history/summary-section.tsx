import React from "react";

interface SummaryItem {
  title: string;
  days: number;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconBg: string;
}

interface SummarySectionProps {
  summaryData: SummaryItem[];
  selectedFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  thaiMonthsFull: string[];
  currentMonth: number | null;
}

const SummarySection: React.FC<SummarySectionProps> = ({
  summaryData,
  selectedFilter,
  onFilterChange,
  thaiMonthsFull,
  currentMonth,
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
      <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-[13px] pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {summaryData.map((item, index) => {
          const isSelected = selectedFilter === item.title;

          return (
            <button
              key={index}
              type="button"
              onClick={() =>
                onFilterChange(isSelected ? null : item.title)
              }
              className={`panel ${item.bgColor} flex flex-col sm:flex-row justify-between sm:justify-start items-center sm:items-center p-3 sm:px-4 sm:py-5 rounded-[10px] shadow-none dark:bg-opacity-20 shrink-0 w-[100px] h-[120px] sm:w-[200px] sm:h-[90px] text-center sm:text-left transition-all ${isSelected ? `border-2 ${item.borderColor}` : "border-2 border-transparent hover:-translate-y-1"}`}
            >
              <div
                className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center sm:mr-4 ${item.iconBg} shadow-sm sm:shadow-none`}
              >
                <span className={`material-symbols-rounded !text-[24px] sm:!text-[28px] text-white flex items-center justify-center leading-none translate-x-[0.5px] ${item.icon === 'close' ? 'translate-y-[0.5px]' : '-translate-y-[0.5px]'}`}>
                  {item.icon}
                </span>
              </div>
              <div className="flex flex-col mt-2 sm:mt-0">
                <div className="font-bold text-gray-800 dark:text-gray-200 text-[14px] sm:text-[16px] mb-1 sm:mb-0.5 leading-tight">
                  {item.title}
                </div>
                <div className="text-[14px] sm:text-[16px] font-bold text-black dark:text-white leading-none">
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
