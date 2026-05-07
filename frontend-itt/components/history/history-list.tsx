import React from "react";

interface HistoryItem {
  id: any;
  workDate: string;
  date: string;
  month: string;
  monthFull: string;
  year: number;
  labelMobile: string;
  time: string;
  status: string;
  statusType: string;
  checkInTime: string;
  checkOutTime: string;
  location: string;
  workingHours: string;
  approvalStatus: string | null;
  isLeave: boolean;
  startDate: string;
  endDate: string;
  isEdited: boolean;
  correctionId: number;
  leaveType?: string;
  leaveReason?: string;
  evidence?: string | null;
  evidenceUrl?: string;
}

interface HistoryListProps {
  items: HistoryItem[];
  selectedFilter: string | null;
  onItemClick: (item: HistoryItem) => void;
  thaiMonthsShort: string[];
}

const HistoryList: React.FC<HistoryListProps> = ({
  items,
  selectedFilter,
  onItemClick,
  thaiMonthsShort,
}) => {
  const getStatusBadge = (type: string, status: string) => {
    let icon = null;
    let colorClass = "";

    if (type === "success" || status === "เข้างานปกติ") {
      icon = (
        <div className="w-4 h-4 rounded-full bg-[#079455] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
          <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0.5px]">
            check
          </span>
        </div>
      );
      colorClass =
        "px-2 py-1 bg-[#e7faef] text-[#079455] border border-[#079455] rounded-full flex items-center gap-1.5 text-[11px] font-bold";
    } else if (type === "warning" || status === "สาย") {
      icon = (
        <div className="w-4 h-4 rounded-full bg-[#FDB022] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
          <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0.5px]">
            schedule
          </span>
        </div>
      );
      colorClass =
        "px-2 py-1 bg-[#fdf4d6] text-[#FDB022] border border-[#FDB022] rounded-full flex items-center gap-1.5 text-[11px] font-bold";
    } else if (type === "info" || status === "ลา") {
      icon = (
        <div className="w-4 h-4 rounded-full bg-[#1AB3FF] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
          <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0.5px]">
            lab_profile
          </span>
        </div>
      );
      colorClass =
        "px-2 py-1 bg-[#eef8ff] text-[#1AB3FF] border border-[#1AB3FF] rounded-full flex items-center gap-1.5 text-[11px] font-bold";
    } else if (type === "danger" || status === "ขาด") {
      icon = (
        <div className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
          <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0.5px]">
            close
          </span>
        </div>
      );
      colorClass =
        "px-2 py-1 bg-[#FCEDED] text-[#EF4444] border border-[#EF4444] rounded-full flex items-center gap-1.5 text-[11px] font-bold";
    } else if (type === "default" || status === "ไม่ลงเวลาออก") {
      icon = (
        <div className="w-[18px] h-[18px] rounded-full bg-[#6B7280] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
          <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0.5px] -translate-y-[0.5px]">
            hourglass_disabled
          </span>
        </div>
      );
      colorClass =
        "w-[100px] h-[26px] px-1 bg-[#F3F4F6] text-[#6B7280] border border-[#6B7280] rounded-full flex items-center gap-1.5 text-[11px] font-bold shrink-0";
    }

    return (
      <div className={colorClass}>
        {icon}
        {status}
      </div>
    );
  };

  return (
    <div className="shrink-0 flex flex-col gap-[16px]">
      <h2 className="text-[20px] font-bold text-[#000000]">
        รายการประวัติการลงเวลา{" "}
        {selectedFilter && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            (แสดงเฉพาะ: {selectedFilter})
          </span>
        )}
      </h2>
      <div className="flex flex-col gap-[14px]">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={index}
              onClick={() => onItemClick(item)}
              className={`relative w-full max-sm:min-h-[98px] sm:h-[88px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 border border-[#CECFD2] dark:border-gray-700 rounded-[14px] p-3.5 sm:px-4 sm:py-2 bg-white dark:bg-[#121212] overflow-hidden animate-[fadeIn_0.3s_ease-in-out] ${item.isLeave || item.statusType === "warning" || item.statusType === "danger" || item.statusType === "success" || item.statusType === "default" ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-[1.01]" : ""}`}
            >
              <div className="hidden sm:flex flex-col items-center justify-center bg-[#E4E7EC] dark:bg-gray-800 rounded-xl w-[70px] h-[70px] shrink-0 border border-[#CECFD2] dark:border-gray-700 px-1 text-center">
                {item.startDate !== item.endDate ? (
                  <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200 leading-tight">
                    {new Date(item.startDate).getDate()} - {new Date(item.endDate).getDate()} {thaiMonthsShort[new Date(item.endDate).getMonth()]}
                  </span>
                ) : (
                  <>
                    <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200 leading-tight mb-1">
                      {item.date} {thaiMonthsShort[new Date(item.startDate).getMonth()]}
                    </span>
                    <span className="text-[14px] text-gray-800 dark:text-gray-300 font-bold leading-tight">
                      {item.year}
                    </span>
                  </>
                )}
              </div>

              <div className="flex-1 flex flex-col py-0.5 gap-[2px] sm:gap-1">
                <div className="flex items-center justify-between sm:block">
                  <div className="text-[14px] sm:text-[14px] font-medium text-gray-900 dark:text-gray-100 sm:hidden">
                    {item.labelMobile}
                  </div>

                  {item.approvalStatus && (
                    <div
                      className={`px-3 py-1 rounded-full text-[12px] whitespace-nowrap sm:absolute sm:top-3 sm:right-4 ${item.approvalStatus === "approved"
                        ? "bg-[#EBFBF3] text-[#10B981]"
                        : item.approvalStatus === "denied"
                          ? "bg-[#FEE4E2] text-[#B42318]"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                    >
                      {item.approvalStatus === "approved"
                        ? "อนุมัติการแก้ไขเวลา"
                        : item.approvalStatus === "denied"
                          ? "ไม่อนุมัติการแก้ไขเวลา"
                          : "รออนุมัติการแก้ไขเวลา"}
                    </div>
                  )}
                </div>

                <div className="font-bold text-[16px] sm:text-[19px] text-gray-900 dark:text-gray-100 leading-none">
                  {item.time}
                </div>

                <div className="inline-flex self-start mt-1 sm:mt-0">
                  {getStatusBadge(item.statusType, item.status)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 mt-4">
            <div className="mb-4 flex items-center justify-center">
              <img 
                src="/history.png" 
                alt="No history data" 
                className="w-[178px] h-[158px] object-contain"
              />
            </div>
            <div className="text-center space-y-5">
              <h3 className="text-[20px]  text-[#61646C] dark:text-white">
                ยังไม่มีรายการ
              </h3>
              <div className="text-[16px] sm:text-[16px] text-[#61646C] dark:text-gray-400 space-y-1">
                <p>ยังไม่มีรายการประวัติ</p>
                <p>เมื่อมีการบันทึกข้อมูล รายการจะปรากฏที่นี่</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryList;
