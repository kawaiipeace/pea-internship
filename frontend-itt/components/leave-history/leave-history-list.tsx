import React from "react";
import Swal from "sweetalert2";

interface LeaveHistoryItem {
  id: any;
  ids: number[];
  date: string;
  month: string;
  monthShort: string;
  year: string;
  labelMobile: string;
  time: string;
  status: string;
  statusType: string;
  isLeave: boolean;
  leaveType: string;
  leaveReason: string;
  evidence: string;
  evidenceUrl: string;
  isRange: boolean;
  startDateStr: string;
  endDateStr: string;
  mentorReason: string;
}

interface LeaveHistoryListProps {
  items: LeaveHistoryItem[];
  isLoading: boolean;
  selectedFilter: string | null;
  onItemClick: (item: LeaveHistoryItem) => void;
  onDeleteRequest: (ids: number[]) => void;
  onAddRequest: () => void;
}

const LeaveHistoryList: React.FC<LeaveHistoryListProps> = ({
  items,
  isLoading,
  selectedFilter,
  onItemClick,
  onDeleteRequest,
  onAddRequest,
}) => {
  const getStatusBadge = (type: string, status: string) => {
    let colorClass = "";

    if (type === "success" || status === "อนุมัติการลา") {
      colorClass =
        "px-3 py-1 bg-[#DCFAE6] text-[#067647] rounded-full text-[12px] whitespace-nowrap font-medium";
    } else if (type === "danger" || status === "ไม่อนุมัติการลา") {
      colorClass =
        "px-3 py-1 bg-[#FEE4E2] text-[#B42318] rounded-full text-[12px] whitespace-nowrap font-medium";
    } else {
      colorClass =
        "px-3 py-1 bg-[#F0F1F1] text-[#61646C] rounded-full text-[12px] whitespace-nowrap font-medium";
    }

    return <div className={colorClass}>{status}</div>;
  };

  const handleDeleteClick = (e: React.MouseEvent, ids: number[]) => {
    e.stopPropagation();
    Swal.fire({
      html: `
        <div class="flex flex-col items-center">
          <div class="mb-6 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#FEE4E2]">
            <div class="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#D92D20] text-white">
              <span class="material-symbols-rounded !text-[24px]">close</span>
            </div>
          </div>
          <h2 class="text-[20px] font-bold text-[#1C1C1C] dark:text-white mb-2 text-center">ยกเลิกส่งคำขอ</h2>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ดำเนินการต่อ",
      buttonsStyling: false,
      customClass: {
        popup:
          "rounded-[24px] p-10 w-auto min-w-[340px] max-w-[400px] bg-white dark:bg-[#1A1A1A] shadow-xl",
        actions: "flex gap-4 w-full px-2 mt-4",
        confirmButton:
          "flex-1 h-[48px] bg-[#D92D20] hover:bg-[#B42318] text-white rounded-[12px] text-[16px] font-bold order-2 shadow-md transition-colors",
        cancelButton:
          "flex-1 h-[48px] bg-white border border-[#1C1C1C] text-[#1C1C1C] rounded-[12px] text-[16px] font-bold order-1 transition-colors",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteRequest(ids);
      }
    });
  };

  return (
    <div className="shrink-0 flex flex-col gap-[16px]">
      <div className="flex items-center justify-between mt-2 px-1 sm:px-0">
        <h2 className="text-[20px] font-bold text-[#333]">รายการประวัติการลา</h2>
        <button
          className="w-[130px] h-[35px] bg-[#A80689] text-white rounded-[10px] text-[13px] font-bold shadow-sm hover:bg-[#900b45] transition-colors flex items-center justify-center gap-1 shrink-0"
          onClick={onAddRequest}
        >
          <span className="text-xl font-normal mb-0.5">+</span> ส่งคำขอการลา
        </button>
      </div>
      <div className="flex flex-col gap-[14px]">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full h-[88px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-[14px]"
              ></div>
            ))}
          </div>
        ) : items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={index}
              className={`relative w-full max-sm:min-h-0 sm:h-[88px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 border border-[#CECFD2] dark:border-gray-700 rounded-[14px] p-3 sm:px-4 sm:py-2 bg-white dark:bg-[#121212] overflow-hidden animate-[fadeIn_0.3s_ease-in-out] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-[1.01] mx-auto sm:mx-0`}
              onClick={() => onItemClick(item)}
            >
              {/* Mobile Responsive Layout */}
              <div className="sm:hidden flex-1 flex flex-col justify-between sm:justify-center py-0.5 sm:gap-1 relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[14px] text-[#000000] whitespace-nowrap">
                    {item.date} {item.month} {item.year}
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusBadge(item.statusType, item.status)}
                    {item.statusType === "warning" && (
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        onClick={(e) => handleDeleteClick(e, item.ids)}
                      >
                        <span className="material-symbols-rounded !text-[18px] translate-y-[1.5px]">
                          delete
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="font-bold text-[16px] text-gray-900 dark:text-gray-100 leading-none mt-[2px]">
                  ลางาน
                </div>

                <div className="inline-flex mt-1.5">
                  {item.leaveType === "ลากิจ" ? (
                    <div className="inline-flex items-center w-[60px] h-[26px] bg-[#E2E4FF] text-[#4b5e71] border border-[#1A3CFF] rounded-full text-[10px] font-bold px-1 gap-1">
                      <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#1A3CFF] shadow-sm overflow-hidden">
                        <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0.5px]">
                          business_center
                        </span>
                      </div>
                      <span className="leading-none text-gray-500">ลากิจ</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center w-[60px] h-[26px] bg-[#FFD7EF] text-[#4b5e71] border border-[#FF1A7D] rounded-full text-[10px] font-bold px-1 gap-1">
                      <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#FF1A7D] shadow-sm overflow-hidden">
                        <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0px]">
                          health_cross
                        </span>
                      </div>
                      <span className="leading-none text-gray-500">ลาป่วย</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center gap-[14px] w-full">
                {/* Desktop Date Badge */}
                <div className="hidden sm:flex flex-col items-center justify-center bg-[#E4E7EC] dark:bg-gray-800 rounded-xl w-[70px] h-[70px] shrink-0 border border-[#CECFD2] dark:border-gray-700 px-1 text-center">
                  <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200 leading-tight mb-1">
                    {item.date} {item.month}
                  </span>
                  <span className="text-[14px] text-gray-800 dark:text-gray-300 font-bold leading-tight">
                    {item.year || "2569"}
                  </span>
                </div>

                {/* Details Container */}
                <div className="flex flex-col w-full gap-2 sm:gap-1 pl-0 sm:pl-1 flex-1">
                  <div className="font-bold text-[16px] sm:text-[19px] text-gray-900 dark:text-gray-100 leading-none">
                    ลางาน
                  </div>
                  <div className="inline-flex self-start">
                    {item.leaveType === "ลากิจ" ? (
                      <div className="inline-flex items-center w-[60px] h-[26px] bg-[#E2E4FF] text-[#4b5e71] border border-[#4F46E5] rounded-[15px] text-[10px] font-bold px-1 gap-1">
                        <div className="w-[18px] h-[18px] rounded-full bg-[#1A3CFF] flex items-center justify-center shrink-0 shadow-sm overflow-hidden text-white">
                          <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0px] -translate-y-[0.5px]">
                            business_center
                          </span>
                        </div>
                        <span className="leading-none text-gray-500">ลากิจ</span>
                      </div>
                    ) : item.leaveType === "ลาป่วย" ? (
                      <div className="inline-flex items-center w-[60px] h-[26px] bg-[#FFD7EF] text-[#4b5e71] border border-[#FF1A7D] rounded-[15px] text-[10px] font-bold px-1 gap-1">
                        <div className="w-[18px] h-[18px] rounded-full bg-[#FF1A7D] flex items-center justify-center shrink-0 shadow-sm overflow-hidden text-white">
                          <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0px] -translate-y-[0px]">
                            health_cross
                          </span>
                        </div>
                        <span className="leading-none text-gray-500">
                          ลาป่วย
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-3 py-1 bg-[#f0f9ff] text-[#0ea5e9] border border-[#bae6fd] rounded-full text-xs font-bold gap-1.5">
                        <span className="material-symbols-rounded !text-[14px]">
                          lab_profile
                        </span>
                        {item.leaveType}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-auto sm:absolute sm:top-3 sm:right-4">
                  {getStatusBadge(item.statusType, item.status)}
                  {item.statusType === "warning" && (
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      onClick={(e) => handleDeleteClick(e, item.ids)}
                    >
                      <span className="material-symbols-rounded !text-[22px] translate-y-[1.5px]">
                        delete
                      </span>
                    </button>
                  )}
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

export default LeaveHistoryList;
