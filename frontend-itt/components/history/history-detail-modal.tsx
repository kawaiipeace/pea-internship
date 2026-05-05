import React, { Fragment, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import EditTimeForm from "@/components/history/edit-time-form";

interface HistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHistoryItem: any;
  isEditingTime: boolean;
  setIsEditingTime: (val: boolean) => void;
  onViewLeaveFile: (item: any) => void;
  onViewFile: (key: string, filename: string) => void;
  onAutoResubmit: (item: any) => void;
  onEditClick: (item: any) => void;
  thaiMonthsFull: string[];
}

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({
  isOpen,
  onClose,
  selectedHistoryItem,
  isEditingTime,
  setIsEditingTime,
  onViewLeaveFile,
  onViewFile,
  onAutoResubmit,
  onEditClick,
  thaiMonthsFull,
}) => {
  // Swipe to close state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchTranslateY, setTouchTranslateY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart !== null) {
      const currentY = e.targetTouches[0].clientY;
      const diff = currentY - touchStart;
      if (diff > 0) {
        setTouchTranslateY(diff);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTranslateY > 100) {
      onClose();
      setIsEditingTime(false);
    }
    setTouchStart(null);
    setTouchTranslateY(0);
  };

  if (!selectedHistoryItem) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[999]"
        open={isOpen}
        onClose={() => {
          onClose();
          setIsEditingTime(false);
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={`flex min-h-full justify-center p-0 sm:p-4 text-center ${isEditingTime ? "items-stretch sm:items-center" : "items-end sm:items-center"}`}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                as="div"
                className={`w-full ${isEditingTime ? "sm:max-w-[880px]" : "max-w-lg"} transform text-left align-middle shadow-xl transition-all ${isEditingTime
                  ? "rounded-t-[25px] sm:rounded-2xl bg-white dark:bg-[#1A1A1A] px-6 pb-6 pt-2 h-[calc(100vh-48px)] mt-12 sm:mt-0 sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden sm:block sm:overflow-y-auto"
                  : "rounded-t-[25px] sm:rounded-2xl bg-white dark:bg-[#1A1A1A] p-6 h-[62vh] sm:h-auto max-h-[62vh] sm:max-h-none flex flex-col overflow-hidden sm:block sm:overflow-y-auto sm:overflow-visible"
                  }`}
                style={{
                  transform:
                    touchTranslateY > 0
                      ? `translateY(${touchTranslateY}px)`
                      : undefined,
                  transition:
                    touchStart === null
                      ? "transform 0.3s ease-out"
                      : "none",
                }}
              >
                {/* Drawer Handle for mobile */}
                <div
                  className="flex justify-center py-3 sm:hidden cursor-grab active:cursor-grabbing touch-none"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                {/* Close button for desktop */}
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 hidden sm:block"
                  onClick={onClose}
                >
                  <span className="material-symbols-rounded">close</span>
                </button>

                <div className="flex-1 overflow-y-auto sm:overflow-visible space-y-4 text-black dark:text-white-light sm:pb-0 pb-6 pr-0.5 scrollbar-hide">
                  {isEditingTime ? (
                    <EditTimeForm
                      selectedHistoryItem={selectedHistoryItem}
                      setIsEditingTime={setIsEditingTime}
                      handleTouchStart={handleTouchStart}
                      handleTouchMove={handleTouchMove}
                      handleTouchEnd={handleTouchEnd}
                    />
                  ) : selectedHistoryItem.statusType === "danger" &&
                    !selectedHistoryItem.approvalStatus ? (
                    <div className="flex flex-col pb-2">
                      {/* Header (No longer Sticky) */}
                      <div
                        className="pb-2 pt-1 touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        <div className="text-[14px] text-gray-800 dark:text-gray-200 mb-2">
                          {selectedHistoryItem.labelMobile}
                        </div>
                        <div className="inline-flex items-center px-2 py-1 bg-[#FCEDED] text-[#EF4444] border border-[#EF4444] rounded-full text-[11px] font-bold gap-1.5 w-fit">
                            <div className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                              <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none -translate-y-[0.5px]">
                                close
                              </span>
                            </div>
                          {selectedHistoryItem.status}
                        </div>
                      </div>

                      <hr className="mt-3 mb-6 h-[1px] bg-[#CECFD2] border-none dark:bg-gray-700" />

                      {/* Content */}
                      <div className="flex flex-col items-center justify-start flex-1 pt-0 pb-4 px-4">
                        {/* Custom CSS Absent Calendar Illustration */}
                        <div className="relative w-full h-auto mb-4 flex items-center justify-center">
                          <img 
                            src="/close.png" 
                            alt="Absent Illustration" 
                            className="w-[180px] h-auto object-contain" 
                          />
                        </div>
                        <div className="text-[16px] text-[#61646C] dark:text-gray-200 mb-1">
                          ไม่มีการลงเวลาในวันนี้
                        </div>
                        <div className="text-[14px] text-[#61646C] dark:text-gray-200 text-center">
                          หากมาทำงานปกติ โปรดส่งคำขอแก้ไขเวลา
                        </div>
                      </div>

                      {/* Button */}
                      <div className="flex justify-center mt-4 mb-1">
                        <button
                          type="button"
                          className="w-full h-[48px] bg-[#A80689] text-white rounded-[12px] text-[15px] font-bold shadow-sm hover:bg-[#A80689]/90 transition-colors flex items-center justify-center"
                          onClick={() => onEditClick(selectedHistoryItem)}
                        >
                          ส่งคำขอแก้ไขเวลา
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      {/* Unified Responsive Detail View (Mobile UI based) */}
                      <div className="flex flex-col gap-4 w-full max-w-[345px] sm:max-w-[500px] mx-auto">
                        {!selectedHistoryItem.isLeave && (
                          <div
                            className="pb-1 touch-none"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-start justify-between pr-4">
                                <div className="text-[14px] text-gray-900 leading-tight">
                                  {selectedHistoryItem.labelMobile}
                                </div>
                                {selectedHistoryItem.approvalStatus && (
                                  <div
                                    className={`px-3 py-1 rounded-full text-[12px] ${selectedHistoryItem.approvalStatus ===
                                      "approved"
                                      ? "bg-[#EBFBF3] text-[#10B981]"
                                      : selectedHistoryItem.approvalStatus ===
                                        "denied"
                                        ? "bg-[#FEE4E2] text-[#B42318]"
                                        : "bg-[#F3F4F6] text-[#6B7280]"
                                      }`}
                                  >
                                    {selectedHistoryItem.approvalStatus ===
                                      "approved"
                                      ? "อนุมัติการแก้ไขเวลา"
                                      : selectedHistoryItem.approvalStatus ===
                                        "denied"
                                        ? "ไม่อนุมัติการแก้ไขเวลา"
                                        : "รออนุมัติการแก้ไขเวลา"}
                                  </div>
                                )}
                              </div>
                              <div className="text-[17px] font-bold text-gray-900 leading-tight">
                                {selectedHistoryItem.statusType ===
                                  "danger"
                                  ? "ขาดงาน"
                                  : selectedHistoryItem.isLeave
                                    ? "ลางานเต็มวัน"
                                    : selectedHistoryItem.time}
                              </div>
                            </div>

                            <div
                              className={`mt-2 ${selectedHistoryItem.status === "ไม่ลงเวลาออก"
                                ? "w-[100px] h-[26px] px-1 bg-[#F3F4F6] text-[#6B7280] border-[#6B7280]"
                                : `w-fit px-2 py-1 ${selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.statusType === "success"
                                  ? "bg-[#E7FAEF] text-[#079455] border-[#079455]"
                                  : selectedHistoryItem.status === "สาย" || selectedHistoryItem.statusType === "warning"
                                    ? "bg-[#FDF4D6] text-[#FDB022] border-[#FDB022]"
                                    : selectedHistoryItem.status === "ขาด" || selectedHistoryItem.statusType === "danger"
                                      ? "bg-[#FCEDED] text-[#EF4444] border-[#EF4444]"
                                      : selectedHistoryItem.leaveType === "ลาป่วย"
                                        ? "bg-[#FFEBF5] text-[#D42A8C] border-[#D42A8C]"
                                        : "bg-[#EEF4FF] text-[#4386F9] border-[#4386F9]"
                                }`
                                } rounded-full flex items-center text-[11px] font-bold border gap-1.5 shadow-sm shrink-0`}
                            >
                              {selectedHistoryItem.status ===
                                "เข้างานปกติ" ||
                                selectedHistoryItem.statusType ===
                                "success" ? (
                                <div className="w-4 h-4 bg-[#079455] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                  <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white -translate-y-[0.5px]">check</span>
                                </div>
                              ) : selectedHistoryItem.status ===
                                "สาย" ||
                                selectedHistoryItem.statusType ===
                                "warning" ? (
                                <div className="w-4 h-4 bg-[#FDB022] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                  <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none -translate-y-[0.5px]">schedule</span>
                                </div>
                              ) : selectedHistoryItem.status ===
                                "ขาด" ||
                                selectedHistoryItem.statusType ===
                                "danger" ? (
                                <div className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                  <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white -translate-y-[0.5px]">close</span>
                                </div>
                              ) : selectedHistoryItem.leaveType ===
                                "ลาป่วย" ? (
                                <div className="w-4 h-4 bg-[#D42A8C] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                  <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0.5px] -translate-y-[0.5px] text-white">
                                    lab_profile
                                  </span>
                                </div>
                              ) : selectedHistoryItem.status === "ลา" ||
                                selectedHistoryItem.isLeave ? (
                                <div className="w-4 h-4 bg-[#1AB3FF] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                  <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none -translate-y-[0.5px]">lab_profile</span>
                                </div>
                              ) : (
                                <div className="w-[18px] h-[18px] rounded-full bg-[#6B7280] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                  <span className="material-symbols-rounded !text-[12px] leading-none">
                                    hourglass_disabled
                                  </span>
                                </div>
                              )}
                              <span className="text-[11px] font-bold">
                                {selectedHistoryItem.status === "ลา"
                                  ? selectedHistoryItem.leaveType
                                  : selectedHistoryItem.status ===
                                    "เข้างานปกติ" ||
                                    selectedHistoryItem.statusType ===
                                    "success"
                                    ? "เข้างานปกติ"
                                    : selectedHistoryItem.status}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Conditional Content based on Status */}
                        {selectedHistoryItem.isLeave ? (
                          /* Case: Leave Detail View (Exact same as Leave History) */
                          <div className="flex flex-col items-center">
                            {/* Header Region */}
                            <div className="w-full h-auto flex flex-col pt-1 touch-none">
                              <div className="flex items-center justify-between mt-1 mb-2">
                                <div className="text-[16px]  text-gray-800 dark:text-gray-200">
                                  {selectedHistoryItem.startDate !== selectedHistoryItem.endDate
                                    ? `${new Date(selectedHistoryItem.startDate).getDate()} - ${new Date(selectedHistoryItem.endDate).getDate()} ${thaiMonthsFull[new Date(selectedHistoryItem.endDate).getMonth()]} ${new Date(selectedHistoryItem.endDate).getFullYear() + 543}`
                                    : `${selectedHistoryItem.date} ${selectedHistoryItem.month} ${selectedHistoryItem.year}`
                                  }
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Note: Status badge and Delete button removed/omitted as requested for log view */}
                                </div>
                              </div>

                              <div className="text-[19px] sm:text-[22px] font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                ลางาน
                              </div>

                              {/* Leave Type Tag */}
                              <div className="mb-3">
                                {selectedHistoryItem.leaveType === 'ลากิจ' ? (
                                  <div className="inline-flex items-center w-[60px] h-[26px] bg-[#E2E4FF] text-[#4b5e71] border border-[#1A3CFF] rounded-full text-[10px] font-bold px-1 gap-1">
                                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#1A3CFF] shadow-sm overflow-hidden">
                                      <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0.5px]">business_center</span>
                                    </div>
                                    <span className="leading-none text-gray-500">ลากิจ</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center w-[60px] h-[26px] bg-[#FFD7EF] text-[#4b5e71] border border-[#FF1A7D] rounded-full text-[10px] font-bold px-1 gap-1">
                                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#FF1A7D] shadow-sm overflow-hidden">
                                      <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0px]">health_cross</span>
                                    </div>
                                    <span className="leading-none text-gray-500">ลาป่วย</span>
                                  </div>
                                )}
                              </div>

                              {/* Divider */}
                              <hr className="w-full h-[1px] bg-[#ECECED] dark:bg-gray-700 border-none mb-3" />
                            </div>

                            {/* Reasoning Section */}
                            <div className="w-full space-y-3 mb-6">
                              <div className="flex items-center gap-2 text-[16px] text-gray-800 dark:text-gray-200">
                                รายละเอียดการลา
                              </div>
                              <div className="w-full bg-[#F9FAFB] dark:bg-gray-800 border border-[#D0D5DD] dark:border-gray-700 rounded-[6px] px-4 py-2 min-h-[40px] flex items-center text-[15px] text-gray-700 dark:text-gray-300 shadow-sm">
                                {selectedHistoryItem.leaveReason}
                              </div>
                            </div>

                            {/* Evidence Section */}
                            <div className="w-full space-y-3">
                              <div className="flex items-center gap-2 text-[16px] text-gray-800 dark:text-gray-200">
                                <span className="whitespace-nowrap">ไฟล์แนบ :</span>
                                <button
                                  type="button"
                                  onClick={() => onViewLeaveFile(selectedHistoryItem)}
                                  className="bg-[#F2F4F7] active:scale-95 transition-transform dark:bg-gray-800 border border-[#CECFD2] dark:border-gray-700 rounded-[6px] px-2 flex items-center gap-1.5 w-auto min-w-[111px] h-[35px] shrink-0 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <div className="flex items-center justify-center shrink-0 text-black">
                                    <span className="material-symbols-rounded !text-[20px]">picture_as_pdf</span>
                                  </div>
                                  <div className="text-[12px] font-medium text-black dark:text-white truncate max-w-[250px] px-1">
                                    {selectedHistoryItem.evidence ? 'หลักฐาน' : 'ไม่มีไฟล์แนบ'}
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Case: Normal/Late/Default */
                          <div className="flex flex-col gap-6">
                            {selectedHistoryItem.approvalStatus ? (
                              /* Dual Card: Side-by-Side Comparison (Old vs New) */
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-1 w-full relative">
                                  {/* Card 1: Old Time */}
                                  <div className="flex-1 h-[175px] bg-white border border-[#CECFD2] rounded-[16px] p-3 shadow-sm flex flex-col min-w-0">
                                    <div className="inline-flex items-center gap-1.5 text-gray-500 font-bold text-[14px] mb-2.5">
                                      <div className="w-[30px] h-[30px] rounded-full bg-[#717171] flex items-center justify-center text-white shrink-0">
                                        <span className="material-symbols-rounded text-[20px]">
                                          calendar_clock
                                        </span>
                                      </div>
                                      <span className="whitespace-nowrap">
                                        เวลาเก่า
                                      </span>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-1 text-gray-700 font-bold text-[13px]">
                                        <span 
                                          className="material-symbols-rounded text-[18px]"
                                          style={{ 
                                            color: (selectedHistoryItem.location?.startsWith("ในสถานที่") || selectedHistoryItem.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem.location || selectedHistoryItem.location === "-")
                                                    ? "#079455" : "#FDB022" 
                                          }}
                                        >
                                          {(selectedHistoryItem.location?.startsWith("ในสถานที่") || selectedHistoryItem.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem.location || selectedHistoryItem.location === "-")
                                            ? "apartment" : "globe_location_pin"}
                                        </span>
                                        <span className="whitespace-nowrap truncate font-bold">
                                          {(selectedHistoryItem.location?.startsWith("ในสถานที่") || selectedHistoryItem.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem.location || selectedHistoryItem.location === "-")
                                            ? "อยู่ในสถานที่" : "อยู่นอกสถานที่"}
                                        </span>
                                      </div>
                                      <div className="space-y-1.5 text-[13px] text-gray-500 font-medium">
                                        <div>
                                          เวลาเข้า :{" "}
                                          {
                                            selectedHistoryItem.checkInTime
                                          }
                                        </div>
                                        <div>
                                          เวลาออก :{" "}
                                          {selectedHistoryItem.checkOutTime ===
                                            "ไม่ลงเวลาออก"
                                            ? "ไม่ลงเวลา"
                                            : selectedHistoryItem.checkOutTime}
                                        </div>
                                        <div className="truncate">
                                          ชั่วโมงทำงาน:{" "}
                                          {
                                            selectedHistoryItem.workingHours
                                          }
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Magenta Arrow Icon */}
                                  <div className="flex items-center justify-center shrink-0 z-10 px-0.5">
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M5 12H19M19 12L12 5M19 12L12 19"
                                        stroke="#A80689"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>

                                  {/* Card 2: New Time (Requested) */}
                                  <div className="flex-1 h-[175px] bg-[#FFF5FD] border border-[#A80689] rounded-[16px] p-3 shadow-sm flex flex-col min-w-0">
                                    <div className="inline-flex items-center gap-1.5 text-[#A80689] font-bold text-[14px] mb-2.5">
                                      <div className="w-[30px] h-[30px] rounded-full bg-[#A80689] flex items-center justify-center text-white shrink-0">
                                        <span className="material-symbols-rounded text-[20px]">
                                          calendar_clock
                                        </span>
                                      </div>
                                      <span className="whitespace-nowrap">
                                        เวลาใหม่
                                      </span>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-1 text-[#A80689] font-bold text-[13px]">
                                        <span 
                                          className="material-symbols-rounded text-[18px]"
                                          style={{ 
                                            color: (selectedHistoryItem.location?.startsWith("ในสถานที่") || selectedHistoryItem.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem.location || selectedHistoryItem.location === "-")
                                                    ? "#079455" : "#FDB022" 
                                          }}
                                        >
                                          {(selectedHistoryItem.location?.startsWith("ในสถานที่") || selectedHistoryItem.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem.location || selectedHistoryItem.location === "-")
                                            ? "apartment" : "globe_location_pin"}
                                        </span>
                                        <span className="whitespace-nowrap truncate font-bold">
                                          {(selectedHistoryItem.location?.startsWith("ในสถานที่") || selectedHistoryItem.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem.location || selectedHistoryItem.location === "-")
                                            ? "อยู่ในสถานที่" : "อยู่นอกสถานที่"}
                                        </span>
                                      </div>
                                      <div className="space-y-1.5 text-[13px] text-[#A80689] font-medium">
                                        <div>
                                          เวลาเข้า :{" "}
                                          {
                                            selectedHistoryItem.reqCheckInTime
                                          }
                                        </div>
                                        <div>
                                          เวลาออก :{" "}
                                          {
                                            selectedHistoryItem.reqCheckOutTime
                                          }
                                        </div>
                                        <div className="truncate">
                                          ชั่วโมงทำงาน:{" "}
                                          {
                                            selectedHistoryItem.reqWorkingHours
                                          }
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Separate Reason Section (Mobile) */}
                                <div className="w-full space-y-1">
                                  <div className="flex items-center gap-2 text-[16px]  text-gray-800">
                                    เหตุผลการแก้ไขเวลา
                                  </div>
                                  <div className="w-full min-h-[42px] bg-[#F9FAFB] border border-[#CECFD2] rounded-[10px] px-4 py-2.5 flex items-center text-[14px] text-gray-700 shadow-sm leading-relaxed">
                                    {selectedHistoryItem.reqReason ||
                                      "ไม่ได้ระบุ"}
                                  </div>
                                </div>

                                {/* Evidence Section (Updated Mobile) */}
                                <div className="w-full">
                                  <div className="flex items-center gap-2 text-[16px] text-gray-800">
                                    <span className="whitespace-nowrap">
                                      ไฟล์แนบ :
                                    </span>
                                    {selectedHistoryItem.evidence ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onViewFile(
                                            selectedHistoryItem.evidenceUrl || selectedHistoryItem.evidence,
                                            selectedHistoryItem.evidence,
                                          )
                                        }
                                        className="bg-[#F2F4F7] active:scale-95 transition-transform border border-[#CECFD2] rounded-[8px] px-2 flex items-center gap-1.5 h-[35px] shrink-0 shadow-sm hover:bg-gray-100 min-w-[120px]"
                                      >
                                        <div className="flex items-center justify-center shrink-0 text-black">
                                          <span className="material-symbols-rounded text-[20px]">
                                            picture_as_pdf
                                          </span>
                                        </div>
                                        <div className="text-[12px] font-bold text-black truncate max-w-[80px]">
                                          {selectedHistoryItem.evidence}
                                        </div>
                                      </button>
                                    ) : (
                                      <span className="text-[14px] text-gray-400 italic">
                                        ไม่มีไฟล์แนบ
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Rejection Reason - Highlighted for Denied Status */}
                                {selectedHistoryItem.approvalStatus === 'denied' && selectedHistoryItem.mentorReason && (
                                  <div className="w-full space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="flex items-center gap-2 text-[15px] font-bold text-red-600">
                                      <span className="material-symbols-outlined text-[20px]">assignment_late</span>
                                      เหตุผลที่ไม่สามารถอนุญาติแก้ไขเวลา
                                    </div>
                                    <div className="w-full min-h-[42px] bg-red-50/50 border border-red-200 rounded-[10px] px-4 py-3 flex items-start text-[14px] text-red-700 shadow-sm leading-relaxed font-medium">
                                      {selectedHistoryItem.mentorReason}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Normal Detail View (Simplified Redesign) */
                              <div className="space-y-4 pt-1">
                                <hr className="w-full h-[1px] bg-gray-100 border-none" />
                                <div className="flex flex-col gap-1 px-1">
                                  <div className="flex items-center gap-2 text-[#1C1C1C] font-bold text-[16px]">
                                    {(selectedHistoryItem.location?.startsWith("ในสถานที่") || selectedHistoryItem.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem.location || selectedHistoryItem.location === "-") ? (
                                      <span 
                                        className="material-symbols-rounded text-[24px]"
                                        style={{ color: "#079455" }}
                                      >
                                        apartment
                                      </span>
                                    ) : (
                                      <span 
                                        className="material-symbols-rounded text-[24px]"
                                        style={{ color: "#FDB022" }}
                                      >
                                        globe_location_pin
                                      </span>
                                    )}
                                    <span>
                                      {(selectedHistoryItem.location?.startsWith("ในสถานที่") || selectedHistoryItem.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem.location || selectedHistoryItem.location === "-")
                                        ? "อยู่ในสถานที่" : "อยู่นอกสถานที่"}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[16px]">
                                      <span className="text-[#333] font-medium whitespace-nowrap">
                                        เวลาเข้า :
                                      </span>
                                      <span className="font-bold text-[#1C1C1C]">
                                        {selectedHistoryItem.checkInTime}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[16px]">
                                      <span className="text-[#333] font-medium whitespace-nowrap">
                                        เวลาออก :
                                      </span>
                                      <span className="font-bold text-[#1C1C1C]">
                                        {selectedHistoryItem.checkOutTime ===
                                          "ไม่ลงเวลาออก"
                                          ? "ไม่ลงเวลา"
                                          : selectedHistoryItem.checkOutTime}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[16px]">
                                      <span className="text-[#333] font-medium whitespace-nowrap">
                                        ชั่วโมงทำงาน :
                                      </span>
                                      <span className="font-bold text-[#1C1C1C]">
                                        {selectedHistoryItem.status ===
                                          "ไม่ลงเวลาออก"
                                          ? "0 ชม."
                                          : selectedHistoryItem.workingHours
                                            ? selectedHistoryItem.workingHours
                                              .replace(" ชั่วโมง", " ชม.")
                                              .replace(" นาที", " นาที")
                                            : "0 ชม."}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {(!selectedHistoryItem.approvalStatus || selectedHistoryItem.approvalStatus === 'denied') &&
                          (selectedHistoryItem.status === "สาย" ||
                            selectedHistoryItem.status === "ขาด" ||
                            selectedHistoryItem.status === "ไม่ลงเวลาออก" ||
                            selectedHistoryItem.statusType === "warning" ||
                            selectedHistoryItem.statusType === "danger" ||
                            selectedHistoryItem.statusType === "default") && (
                            <div className="mt-4">
                              <button
                                type="button"
                                className="w-full h-[50px] bg-[#A80689] text-white rounded-[12px] text-[17px] font-bold flex items-center justify-center shadow-lg shadow-purple-100"
                                onClick={() => {
                                  if (selectedHistoryItem.approvalStatus === 'denied') {
                                    onAutoResubmit(selectedHistoryItem);
                                  } else {
                                    onEditClick(selectedHistoryItem);
                                  }
                                }}
                              >
                                {selectedHistoryItem.approvalStatus === 'denied' ? 'ส่งคำขอแก้ไขเวลาอีกครั้ง' : 'ส่งคำขอแก้ไขเวลา'}
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default HistoryDetailModal;
