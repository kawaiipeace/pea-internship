import React, { Fragment, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import IconX from "@/components/icon/icon-x";
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

interface LeaveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHistoryItem: LeaveHistoryItem | null;
  onViewFile: (item: LeaveHistoryItem) => void;
  onDeleteRequest: (ids: number[]) => void;
  onResubmitLeave: (item: LeaveHistoryItem) => void;
}

const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
  isOpen,
  onClose,
  selectedHistoryItem,
  onViewFile,
  onDeleteRequest,
  onResubmitLeave,
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
    }
    setTouchStart(null);
    setTouchTranslateY(0);
  };

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

  if (!selectedHistoryItem) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[999]"
        open={isOpen}
        onClose={onClose}
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
          <div className="flex min-h-full justify-center p-0 sm:p-4 text-center items-end sm:items-center">
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
                className="w-full sm:max-w-[550px] transform text-left align-middle shadow-xl transition-all rounded-t-[25px] sm:rounded-2xl bg-white dark:bg-[#1A1A1A] p-6 h-[62vh] sm:h-auto max-h-[62vh] sm:max-h-none flex flex-col overflow-hidden sm:block sm:overflow-y-auto sm:overflow-visible"
                style={{
                  transform:
                    touchTranslateY > 0
                      ? `translateY(${touchTranslateY}px)`
                      : undefined,
                  transition:
                    touchStart === null ? "transform 0.3s ease-out" : "none",
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
                  <IconX className="w-5 h-5" />
                </button>

                <div className="flex-1 overflow-y-auto sm:overflow-visible space-y-4 text-black dark:text-white-light sm:pb-0 pb-6 pr-0.5 custom-scrollbar">
                  {/* Unified Detail Layout */}
                  <div className="flex flex-col items-center">
                    {/* Header Region */}
                    <div className="w-full h-auto flex flex-col pt-1 touch-none">
                      <div className="flex items-center justify-between mt-1 mb-2">
                        <div className="text-[16px]  text-gray-800 dark:text-gray-200">
                          {selectedHistoryItem.date} {selectedHistoryItem.month}{" "}
                          {selectedHistoryItem.year}
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusBadge(
                            selectedHistoryItem.statusType,
                            selectedHistoryItem.status,
                          )}
                          {selectedHistoryItem.status === "รอการอนุมัติ" ||
                          selectedHistoryItem.status === "รออนุมัติการลา" ? (
                            <button
                              type="button"
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                Swal.fire({
                                  html: `
                                    <div class="flex flex-col items-center">
                                      <div class="mb-6 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#FEE4E2]">
                                        <div class="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#D92D20] text-white">
                                          <span class="material-symbols-rounded !text-[24px]">close</span>
                                        </div>
                                      </div>
                                      <h2 class="text-[20px] font-bold text-[#1C1C1C] dark:text-white mb-2">ยกเลิกส่งคำขอ</h2>
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
                                    onDeleteRequest(selectedHistoryItem.ids);
                                  }
                                });
                              }}
                            >
                              <span className="material-symbols-rounded !text-[20px] translate-y-[1.5px]">
                                delete
                              </span>
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-[19px] sm:text-[22px] font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                        ลางาน
                      </div>

                      {/* Leave Type Tag */}
                      <div className="mb-3">
                        {selectedHistoryItem.leaveType === "ลากิจ" ? (
                          <div className="inline-flex items-center w-[60px] h-[26px] bg-[#E2E4FF] text-[#4b5e71] border border-[#1A3CFF] rounded-full text-[10px] font-bold px-1 gap-1">
                            <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#1A3CFF] shadow-sm overflow-hidden">
                              <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0.5px]">
                                business_center
                              </span>
                            </div>
                            <span className="leading-none text-gray-500">
                              ลากิจ
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center w-[60px] h-[26px] bg-[#FFD7EF] text-[#4b5e71] border border-[#FF1A7D] rounded-full text-[10px] font-bold px-1 gap-1">
                            <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#FF1A7D] shadow-sm overflow-hidden">
                              <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0px]">
                                health_cross
                              </span>
                            </div>
                            <span className="leading-none text-gray-500">
                              ลาป่วย
                            </span>
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
                          onClick={() => onViewFile(selectedHistoryItem)}
                          className="bg-[#F2F4F7] active:scale-95 transition-transform dark:bg-gray-800 border border-[#CECFD2] dark:border-gray-700 rounded-[6px] px-2 flex items-center gap-1.5 w-auto min-w-[111px] h-[35px] shrink-0 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center justify-center shrink-0 text-black">
                            <span className="material-symbols-rounded !text-[20px]">
                              picture_as_pdf
                            </span>
                          </div>
                          <div className="text-[12px] font-medium text-black dark:text-white truncate max-w-[250px] px-1">
                            {selectedHistoryItem.evidence
                              ? "หลักฐาน"
                              : "ไม่มีไฟล์แนบ"}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Rejection Reason Section */}
                    {selectedHistoryItem.status === "ไม่อนุมัติการลา" && (
                      <div className="w-full space-y-3 mt-6">
                        <div className="flex items-center gap-2 text-[16px] text-[#B42318] font-bold">
                          <span className="material-symbols-rounded !text-[20px]">
                            error
                          </span>
                          เหตุผลที่ไม่สามารถอนุมัติการลา
                        </div>
                        <div className="w-full bg-[#FFFBFA] dark:bg-red-900/10 border border-[#FDA29B] dark:border-red-800 rounded-[6px] px-4 py-2 min-h-[40px] flex items-center text-[15px] text-[#B42318] dark:text-red-400 shadow-sm">
                          {selectedHistoryItem.mentorReason || "ไม่ระบุเหตุผล"}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {selectedHistoryItem.status === "ไม่อนุมัติการลา" && (
                      <div className="mt-6 w-full">
                        <button
                          type="button"
                          className="w-full h-[50px] bg-[#A80689] text-white rounded-[12px] text-[17px] font-bold flex items-center justify-center shadow-lg shadow-purple-100 active:scale-[0.98] transition-transform"
                          onClick={() => onResubmitLeave(selectedHistoryItem)}
                        >
                          ส่งคำขอการลาอีกครั้ง
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LeaveDetailModal;
