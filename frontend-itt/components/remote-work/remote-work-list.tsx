import React from "react";

interface Student {
  id: string;
  name: string;
  nickname: string;
}

interface OffsiteTask {
  id: number;
  workDate: string;
  createdAt: string;
  locationName: string;
  taskDetail: string;
  assignedBy: string;
  isOwner: boolean;
  students: Student[];
  updatedAt?: string;
}

interface RemoteWorkListProps {
  tasks: OffsiteTask[];
  isLoading: boolean;
  onCardClick: (id: number) => void;
  onEditClick: (e: React.MouseEvent, id: number) => void;
}

const RemoteWorkList: React.FC<RemoteWorkListProps> = ({
  tasks,
  isLoading,
  onCardClick,
  onEditClick,
}) => {
  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const months = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const formatFullThaiDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const months = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full h-[120px] bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-[15px] p-4 flex gap-4 items-center animate-pulse"
          >
            <div className="w-[80px] h-[80px] bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if ((tasks || []).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        {/* Illustration Image */}
        <div className="mb-6 flex items-center justify-center">
          <img
            src="/romotework.png"
            alt="No remote work schedule"
            className="w-[178px] h-[158px] object-contain"
          />
        </div>

        <div className="text-center space-y-5">
          <h3 className="text-[24px]  text-[#61646C] dark:text-white">
            ไม่พบกำหนดการปฏิบัติงานนอกสถานที่
          </h3>
          <div className="text-[16px] sm:text-[16px] text-[#61646C] dark:text-gray-400 space-y-1">
            <p>ยังไม่พบกำหนดการปฏิบัติงานนอกสถานที่ในขณะนี้</p>
            <p>กรุณาตรวจสอบอีกครั้งในภายหลัง หรือปรับเงื่อนไขการกรอง</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-2">
      {tasks.map((item) => (
        <div
          key={item.id}
          onClick={() => onCardClick(item.id)}
          className="w-full bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-[15px] p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-stretch shadow-sm hover:shadow-md transition-shadow relative cursor-pointer group/card"
        >
          {/* Date Badge */}
          <div className="w-full sm:w-[110px] h-auto sm:h-auto bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-xl flex flex-row sm:flex-col items-center justify-center shrink-0 gap-3 sm:gap-0 p-2.5 sm:py-4">
            <span className="text-[18px] sm:text-[20px] font-medium text-[#0C111D] dark:text-white leading-tight text-center">
              {formatThaiDate(item.workDate).split(" ")[0]}
            </span>
            <span className="text-[16px] sm:text-[20px] font-medium text-[#0C111D] dark:text-white leading-tight text-center">
              {formatThaiDate(item.workDate).split(" ")[1]}
            </span>
            <span className="text-[16px] sm:text-[20px] font-medium text-[#0C111D] dark:text-white leading-tight text-center mt-0 sm:mt-1">
              {formatThaiDate(item.workDate).split(" ")[2]}
            </span>
          </div>

          {/* Card Content */}
          <div className="flex-1 flex flex-col justify-between py-1">
            <div className="space-y-1 mt-1">
              <h3 className="text-[16px] text-[#344054] dark:text-gray-100 flex items-center">
                <span className="font-bold mr-1">สถานที่ :</span>{" "}
                {item.locationName}
              </h3>
              <h3 className="text-[16px] text-[#344054] dark:text-gray-100 flex items-center">
                <span className="font-bold mr-1">รายละเอียดงาน :</span>{" "}
                {item.taskDetail}
              </h3>
              <h3 className="text-[16px] text-[#344054] dark:text-gray-100 flex items-center">
                <span className="font-bold mr-1">ผู้มอบหมาย :</span>{" "}
                {item.assignedBy}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[16px] font-bold text-[#344054] dark:text-gray-100">
                  นักศึกษาที่ได้รับมอบหมาย :
                </span>
                <span className="text-[16px] text-[#344054] dark:text-gray-100">
                  {(item.students || [])
                    .map((student) => student.nickname || student.name)
                    .join(", ")}
                </span>
              </div>
              <div className="text-[12px] text-[#344054] dark:text-gray-400 mt-0.5">
                {item.updatedAt &&
                new Date(item.updatedAt).getTime() >
                  new Date(item.createdAt).getTime() ? (
                  <>
                    วันที่ทำการมอบหมาย : {formatFullThaiDate(item.updatedAt)}{" "}
                    <span className="text-[#A80689] font-medium">(แก้ไข)</span>
                  </>
                ) : (
                  <>วันที่ทำการมอบหมาย : {formatFullThaiDate(item.createdAt)}</>
                )}
              </div>
            </div>
          </div>

          {/* Actions Right Side */}
          <div className="flex items-center gap-2 sm:gap-0 sm:ml-4 sm:self-start mt-3 sm:mt-1 w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-800">
            {item.isOwner &&
              (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const workDate = new Date(item.workDate);
                workDate.setHours(0, 0, 0, 0);
                const isPast = workDate < today;

                return (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        if (!isPast) onEditClick(e, item.id);
                        else e.stopPropagation();
                      }}
                      disabled={isPast}
                      className={`p-2 transition-colors rounded-full ${
                        isPast
                          ? "text-gray-400 cursor-not-allowed opacity-70"
                          : "text-gray-500 hover:text-[#A80689] hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      title={
                        isPast ? "ไม่สามารถแก้ไขงานที่ผ่านไปแล้วได้" : "แก้ไข"
                      }
                    >
                      <span className="material-symbols-rounded !text-[20px]">
                        edit_square
                      </span>
                    </button>
                  </div>
                );
              })()}
            <button className="ml-auto sm:ml-2 bg-[#E4E7EC] dark:bg-gray-800 text-[#333] dark:text-gray-300 px-5 sm:px-4 py-2 rounded-[8px] sm:rounded-[5px] text-[13px] sm:text-[12px] font-bold sm:font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group-hover/card:text-[#A80689]">
              ดูรายละเอียด
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RemoteWorkList;
