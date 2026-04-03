"use client";
import React, { useState, useRef, useEffect } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import "@/styles/flatpickr.css";

// สร้าง Interface สำหรับจัดการ Error ของแต่ละช่อง
interface FormErrors {
  leaveDate?: boolean;
  leaveType?: boolean;
  details?: boolean;
}

const LeaveRequestPage = () => {
  const [leaveDate, setLeaveDate] = useState<any>("");
  const [leaveType, setLeaveType] = useState<"sick" | "personal" | "">("");
  const [details, setDetails] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  
  // State สำหรับจัดการ Error
  const [errors, setErrors] = useState<FormErrors>({});

  // Ensure the Flatpickr input always replaces 'to' with '-' even after React re-renders.
  useEffect(() => {
    const inputElement = document.querySelector(
      ".flatpickr-input"
    ) as HTMLInputElement | null;
    if (inputElement && inputElement.value.includes(" to ")) {
      inputElement.value = inputElement.value.replace(" to ", " - ");
    }
  }, [leaveDate, leaveType, details, attachment]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert("ไฟล์มีขนาดเกิน 5 MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า");
      return;
    }
    setAttachment(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    // ตรวจสอบความครบถ้วนของข้อมูลทีละช่อง
    if (!leaveDate || (Array.isArray(leaveDate) && leaveDate.length === 0)) {
      newErrors.leaveDate = true;
    }
    if (!leaveType) {
      newErrors.leaveType = true;
    }
    if (!details.trim()) {
      newErrors.details = true;
    }

    // ถ้ามี Error เกิดขึ้น ให้เซ็ต State และหยุดการส่งฟอร์ม
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ถ้าผ่านหมด เคลียร์ Error และเปิด Modal ยืนยัน
    setErrors({});
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    setIsSuccessOpen(true);

    // TODO: Implement actual API submission
    console.log("Form submitted:", {
      leaveDate,
      leaveType,
      details,
      attachment,
    });

    // Auto close success modal after 2 seconds and reset form
    setTimeout(() => {
      setIsSuccessOpen(false);
      setLeaveDate("");
      setLeaveType("");
      setDetails("");
      setAttachment(null);
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 2000);
  };

  return (
    <div className="-m-6 min-h-screen bg-[#fffbf7] dark:bg-black p-4 sm:p-10">
      <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1b2e4b] sm:p-10">
          <h1 className="mb-6 text-xl font-bold text-gray-800 dark:text-white-light sm:mb-2 sm:text-2xl">
            การลาปฏิบัติงาน
          </h1>
          <p className="mb-8 hidden text-sm text-gray-500 dark:text-white-dark sm:block">
            กรุณากรอกข้อมูลการลาให้ครบถ้วน ข้อมูลนี้จะถูกจัดส่งให้พี่เลี้ยงฝึกงานตรวจสอบ
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* ===== Section 1: ข้อมูลการลา ===== */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdf2f8] dark:bg-white/10">
                  <span className="material-symbols-rounded text-[20px] text-[#A80689] dark:text-[#B10073]">calendar_today</span>
                </div>
                <div>
                  <h5 className="text-[15px] font-bold text-[#A80689] dark:text-[#B10073]">
                    ข้อมูลการลา
                  </h5>
                  <p className="text-[13px] text-gray-500 dark:text-white-dark">
                    เลือกวันที่ต้องการลา
                  </p>
                </div>
              </div>

              <div>
                <Flatpickr
                  value={leaveDate}
                  options={{
                    mode: "range",
                    dateFormat: "d/m/Y",
                    minDate: "today",
                    disableMobile: true,
                    closeOnSelect: false,
                    onReady: (_selectedDates, _dateStr, instance) => {
                      (instance as any)._okClicked = false;

                      const calendarContainer = instance.calendarContainer;
                      const btnContainer = document.createElement("div");
                      btnContainer.style.cssText =
                        "display:flex;justify-content:center;gap:12px;padding:8px 12px 12px;border-top:1px solid #e5e7eb;";

                      const clearBtn = document.createElement("button");
                      clearBtn.textContent = "Clear";
                      clearBtn.type = "button";
                      clearBtn.style.cssText =
                        "padding:8px 28px;border-radius:8px;border:1px solid #d1d5db;background:#fff;color:#374151;font-weight:600;font-size:14px;cursor:pointer;";
                      clearBtn.addEventListener("click", () => {
                        instance.clear();
                        setLeaveDate("");
                      });

                      const okBtn = document.createElement("button");
                      okBtn.textContent = "Ok";
                      okBtn.type = "button";
                      okBtn.style.cssText =
                        "padding:8px 28px;border-radius:8px;border:none;background:#A80689;color:#fff;font-weight:600;font-size:14px;cursor:pointer;";
                      okBtn.addEventListener("click", () => {
                        (instance as any)._okClicked = true;
                        const dates = instance.selectedDates;
                        if (dates.length === 1) {
                          setLeaveDate([dates[0], dates[0]]);
                          setErrors(prev => ({ ...prev, leaveDate: false })); // เคลียร์ Error เมื่อเลือกข้อมูลแล้ว
                        } else if (dates.length >= 2) {
                          setLeaveDate([...dates]);
                          setErrors(prev => ({ ...prev, leaveDate: false }));
                        }
                        instance.close();
                      });

                      btnContainer.appendChild(clearBtn);
                      btnContainer.appendChild(okBtn);
                      calendarContainer.appendChild(btnContainer);
                    },
                    onClose: (_selectedDates, _dateStr, instance) => {
                      if (!(instance as any)._okClicked) {
                        setTimeout(() => instance.open(), 0);
                      }
                      (instance as any)._okClicked = false;
                    },
                  }}
                  onChange={([start, end], dateStr, instance) => {
                    if (start && end && start !== end) {
                      setTimeout(() => {
                        if (instance.input) {
                          instance.input.value = instance.input.value.replace(
                            " to ",
                            " - "
                          );
                        }
                      }, 0);
                    }
                  }}
                  // ปรับ Class ให้แสดงขอบแดงหากเกิด Error
                  className={`form-input w-full cursor-pointer rounded-lg text-sm focus:ring-0 sm:max-w-md transition-colors ${
                    errors.leaveDate
                      ? "border-red-500 hover:border-red-500 focus:border-red-500 dark:border-red-500"
                      : "border-gray-200 focus:border-[#A80689] dark:border-[#17263c]"
                  } dark:bg-[#121e32] dark:text-white-light`}
                  placeholder="วว/ดด/ปปปป"
                />
                {errors.leaveDate && <p className="mt-1 text-xs text-red-500">กรุณาเลือกวันที่ต้องการลา</p>}
              </div>
            </div>

            {/* ===== Section 2: รายละเอียดการลา ===== */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdf2f8] dark:bg-white/10">
                  <span className="material-symbols-rounded text-[20px] text-[#A80689] dark:text-[#B10073]">description</span>
                </div>
                <div>
                  <h5 className="text-[15px] font-bold text-[#A80689] dark:text-[#B10073]">
                    รายละเอียดการลา
                  </h5>
                  <p className="text-[13px] text-gray-500 dark:text-white-dark">
                    ระบุประเภท เหตุผล และหลักฐานการลาให้ครบถ้วน
                  </p>
                </div>
              </div>

              {/* Leave Type Radio Buttons */}
              <div>
                <div className="grid w-full grid-cols-2 gap-3 sm:max-w-md">
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 ${
                      leaveType === "sick"
                        ? "border-[#A80689] bg-[#fdf2f8] dark:border-[#B10073] dark:bg-white/5"
                        : errors.leaveType
                        ? "border-red-500 hover:border-red-500 bg-white dark:bg-[#121e32]"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-[#17263c] dark:bg-[#121e32] dark:hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="leaveType"
                      value="sick"
                      checked={leaveType === "sick"}
                      onChange={() => {
                        setLeaveType("sick");
                        setErrors(prev => ({ ...prev, leaveType: false })); // เคลียร์ Error
                      }}
                      className="h-4 w-4 border-gray-300 text-[#A80689] focus:ring-0 dark:border-[#17263c] dark:bg-[#121e32]"
                    />
                    <span className="text-gray-700 dark:text-white-light">
                      ลาป่วย
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 ${
                      leaveType === "personal"
                        ? "border-[#A80689] bg-[#fdf2f8] dark:border-[#B10073] dark:bg-white/5"
                        : errors.leaveType
                        ? "border-red-500 hover:border-red-500 bg-white dark:bg-[#121e32]"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-[#17263c] dark:bg-[#121e32] dark:hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="leaveType"
                      value="personal"
                      checked={leaveType === "personal"}
                      onChange={() => {
                        setLeaveType("personal");
                        setErrors(prev => ({ ...prev, leaveType: false })); // เคลียร์ Error
                      }}
                      className="h-4 w-4 border-gray-300 text-[#A80689] focus:ring-0 dark:border-[#17263c] dark:bg-[#121e32]"
                    />
                    <span className="text-gray-700 dark:text-white-light">
                      ลากิจ
                    </span>
                  </label>
                </div>
                {errors.leaveType && <p className="mt-1 text-xs text-red-500">กรุณาเลือกประเภทการลา</p>}
              </div>

              {/* Leave Details */}
              <div className="pt-2">
                <label
                  htmlFor="details"
                  className="text-[13px] font-bold text-gray-700 dark:text-white-light"
                >
                  รายละเอียดการลา<span className="text-red-500">*</span>
                </label>
                <textarea
                  id="details"
                  name="details"
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    if (e.target.value.trim() !== "") {
                      setErrors(prev => ({ ...prev, details: false })); // เคลียร์ Error ทันทีที่พิมพ์
                    }
                  }}
                  className={`form-textarea mt-1 min-h-[100px] w-full resize-none rounded-lg text-sm focus:ring-[#A80689] transition-colors ${
                    errors.details
                      ? "border-red-500 hover:border-red-500 focus:border-red-500 dark:border-red-500"
                      : "border-gray-200 focus:border-[#A80689] dark:border-[#17263c] dark:focus:border-[#A80689] focus:ring-[#A80689] "
                  } dark:bg-[#121e32] dark:text-white-light`}
                  placeholder="ระบุเหตุผลการลา..."
                />
                {errors.details && <p className="mt-1 text-xs text-red-500">กรุณาระบุรายละเอียดการลา</p>}
              </div>

              {/* File Upload */}
              <div className="pt-2">
                <div className="mb-2 flex items-center gap-1.5">
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-white-light">
                    แนบหลักฐาน (ถ้ามี)
                  </label>
                  <span className="material-symbols-rounded text-[13px] text-gray-400">info</span>
                </div>

                {!attachment ? (
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center transition-colors hover:border-[#A80689] dark:border-white/10 dark:bg-[#121e32] dark:hover:border-[#A80689]"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
                      <span className="material-symbols-rounded text-[18px] text-gray-500 dark:text-white-dark">cloud_download</span>
                    </div>
                    <p className="text-[12px] text-gray-400 dark:text-white-dark">
                      <span className=" text-[#A80689] dark:text-[#B10073]">
                        คลิกเพื่ออัปโหลด
                      </span>{" "}
                      ขนาดไฟล์ไม่เกิน 5 MB
                    </p>
                    <p className="text-[12px] text-gray-400 dark:text-white-dark">
                      ( ประเภทไฟล์ที่รองรับ: .pdf, .jpg, .jpeg, .png )
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#121e32]">
                    <span className="truncate text-[13px] text-gray-800 dark:text-white-light">
                      {attachment.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="ml-2 text-gray-600 hover:text-red-500 dark:text-white-dark dark:hover:text-red-400"
                    >
                      <span className="material-symbols-rounded text-[16px]">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ===== Bottom Notice + Submit ===== */}
              <p className=" text-[13px] text-gray-400 dark:text-white-dark">
                ตรวจสอบข้อมูลให้ถูกต้องก่อนกดส่งและจะบันทึกในประวัติการลา
              </p>
              <div className="flex w-full flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setLeaveDate("");
                    setLeaveType("");
                    setDetails("");
                    setAttachment(null);
                    setErrors({}); // เคลียร์ Error ตอนกดยกเลิก
                    handleRemoveFile();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#A80689] bg-white px-6 py-3 text-[15px] font-bold text-[#A80689] transition-all duration-300 hover:bg-[#fdf2f8] dark:bg-transparent dark:text-white-light dark:hover:bg-white/10 sm:flex-1"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A80689] px-6 py-3 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-[#8e0e6f] dark:bg-[#A80689] dark:hover:bg-[#8e0e6f] sm:flex-1"
                >
                  ส่งคำขอลา
                </button>
              </div>

          </form>
        </div>
      </div>

      {/* ===== Confirm Modal ===== */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[999] overflow-y-auto">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsConfirmOpen(false)}
          />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative z-[1000] flex w-[320px] flex-col items-center rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-[#1a1a1a] sm:w-[400px] lg:ml-[260px]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#11A75C] text-white">
                <span className="material-symbols-rounded text-[28px]">check_circle</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                ยืนยันส่งคำขอลา
              </h3>

              <div className="mt-6 flex w-full flex-col-reverse justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-300 sm:flex-1 sm:py-2.5"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="btn-success w-full rounded-xl px-6 py-3 text-sm font-bold text-white hover:bg-[#157347] sm:flex-1 sm:py-2.5"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Success Modal ===== */}
      {isSuccessOpen && (
        <div className="fixed inset-0 z-[999] overflow-y-auto">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsSuccessOpen(false)}
          />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative z-[1000] flex w-[290px] flex-col items-center rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-[#1a1a1a] lg:ml-[260px]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#11A75C] text-white">
                <span className="material-symbols-rounded text-[28px]">check_circle</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                ส่งคำขอลาสำเร็จ
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestPage;