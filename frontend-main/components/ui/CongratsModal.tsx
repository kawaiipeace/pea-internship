"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Confetti from "./Confetti";

interface CongratsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const documents = [
  { id: 1, name: "เอกสารรักษาความลับ 2 ฉบับ", required: true },
  { id: 2, name: "เอกสารลางาน" },
  { id: 3, name: "เอกสารกฎระเบียบ" },
  { id: 4, name: "เอกสารเข้า - ออกงาน" },
  { id: 5, name: "เอกสารออกนอกสถานที่" },
];

export default function CongratsModal({ isOpen, onClose }: CongratsModalProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay so the animation is visible
      requestAnimationFrame(() => {
        setIsVisible(true);
        setShowConfetti(true);
      });
    } else {
      setIsVisible(false);
      setShowConfetti(false);
    }
  }, [isOpen]);

  const handleAcknowledge = () => {
    setShowConfetti(false);
    setIsVisible(false);
    onClose();
  };

  const handleDownloadAll = () => {
    const files = [
      "/สัญญาการรักษาข้อมูลที่เป็นความลับ (Destination).pdf",
      "/ใบลาป่วย ลากิจส่วนตัว.pdf",
      "/ข้อปฏิบัติ (Regulation).pdf",
      "/ใบลงเวลา.pdf",
      "/หนังสือยินยอมผู้ปกครอง-สถาบันการศึกษา.pdf",
    ];
    for (const file of files) {
      const a = document.createElement("a");
      a.href = file;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Confetti isActive={showConfetti} duration={4000} />

      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 transition-opacity duration-300" />

        {/* Modal */}
        <div
          className={`relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden transition-all duration-500 ${
            isVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-90 translate-y-8"
          }`}
        >
          {/* Header */}
          <div className="pt-8 pb-4 px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-600">
              ยินดีด้วย! คุณผ่านการคัดเลือกแล้ว
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
            {/* Instructions */}
            <div className="mb-5 space-y-2 text-sm sm:text-base">
              <p className="text-gray-800">
                <span className="text-red-500 font-bold">* </span>
                <span className="font-bold">วันเข้ารับการฝึกงานนำ </span>
                <span className="text-primary-600 font-bold">
                  เอกสารรักษาความลับมา 2 ฉบับ
                </span>{" "}
                <span className="font-bold">
                  ที่มีลายเซ็นจริง รายงานตัวที่ตึก LED ชั้น 18 เวลา 08.30 น.
                </span>
              </p>
              <p className="text-gray-800">
                <span className="text-red-500 font-bold">* </span>
                <span className="font-bold">
                  นำใบส่งตัวจากมหาวิทยาลัยส่งที่กองฝึกงานของตนเอง
                </span>
              </p>
            </div>

            {/* Document List */}
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 12.2833 8.09583 12.5208 8.2875 12.7125C8.47917 12.9042 8.71667 13 9 13ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z"
                      fill="#A80689"
                    />
                  </svg>
                  <span className="text-sm sm:text-base text-gray-800">
                    {doc.name}
                    {doc.required && (
                      <span className="text-red-500 font-bold"> *</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Download All Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleDownloadAll}
                className="px-6 py-3 bg-primary-600 text-white rounded-full font-medium text-sm sm:text-base hover:bg-primary-700 transition-colors active:scale-95"
              >
                คลิกเพื่อดาวน์โหลดเอกสารทั้งหมด
              </button>
            </div>

            {/* Acknowledge Link */}
            <div className="mt-4 text-center text-sm sm:text-base text-gray-600">
              คลิก{" "}
              <button
                onClick={handleAcknowledge}
                className="text-primary-600 font-bold underline underline-offset-2 hover:text-primary-700 transition-colors cursor-pointer"
              >
                &quot;รับทราบแล้ว&quot;
              </button>{" "}
              เพื่อความสู่เว็บไซต์
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
