import React from "react";
import MonthPicker from "@/components/history/month-picker";

interface RemoteWorkHeaderProps {
  currentMonth: number | null;
  currentYear: number | null;
  onMonthSelect: (month: number | null, year: number | null) => void;
}

const RemoteWorkHeader: React.FC<RemoteWorkHeaderProps> = ({
  currentMonth,
  currentYear,
  onMonthSelect,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start pt-4 gap-4">
      <div>
        <h1 className="text-[20px] sm:text-[24px] font-bold text-black dark:text-white mb-1">
          ปฏิบัติงานนอกสถานที่
        </h1>
        <p className="text-[14px] sm:text-[16px] text-[#61646C] dark:text-gray-400">
          กำหนดการวันที่นักศึกษาต้องไปปฏิบัติงานนอกสถานที่
        </p>
      </div>

      {/* Month Filter */}
      <MonthPicker
        currentMonth={currentMonth}
        currentYear={currentYear}
        onSelect={onMonthSelect}
        placeholder="เลือกช่วงเวลาที่ต้องการดู..."
      />
    </div>
  );
};

export default RemoteWorkHeader;
