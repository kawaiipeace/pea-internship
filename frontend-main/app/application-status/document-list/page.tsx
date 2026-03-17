"use client";

import Link from "next/link";
import { NavbarIntern } from "@/components";

const documents = [
  {
    id: 1,
    name: "เอกสารรักษาความลับ",
    example: "/ตัวอย่าง การกรอกสัญญาการรักษาข้อมูล.pdf",
    download: "/สัญญาการรักษาข้อมูลที่เป็นความลับ (Destination).pdf",
  },
  {
    id: 2,
    name: "เอกสารการลางาน",
    example: "/ใบลาป่วย ลากิจส่วนตัว.pdf",
    download: "/ใบลาป่วย ลากิจส่วนตัว.pdf",
  },
  {
    id: 3,
    name: "เอกสารกฎระเบียบ",
    example: "/ข้อปฏิบัติ (Regulation).pdf",
    download: "/ข้อปฏิบัติ (Regulation).pdf",
  },
  {
    id: 4,
    name: "เอกสารเข้า - ออกงาน",
    example: "/ใบลงเวลา.pdf",
    download: "/ใบลงเวลา.pdf",
  },
  {
    id: 5,
    name: "เอกสารออกนอกสถานที่",
    example: "/หนังสือยินยอมผู้ปกครอง-สถาบันการศึกษา.pdf",
    download: "/หนังสือยินยอมผู้ปกครอง-สถาบันการศึกษา.pdf",
  },
];

export default function DocumentListPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarIntern />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
          รายการเอกสาร
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          เอกสารที่ต้องเตรียมมาในวันเข้าฝึกงาน
        </p>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <p className="text-gray-800">
            <span className="text-red-500 text-base sm:text-xl font-bold">
              *{" "}
            </span>
            <span className="text-black text-base sm:text-xl font-bold">
              วันเข้ารับการฝึกงานนำ
            </span>{" "}
            <span className="text-primary-600 text-base sm:text-xl font-bold">
              เอกสารรักษาความลับมา 2 ฉบับ
            </span>{" "}
            <span className="text-black text-base sm:text-xl font-bold">
              ที่มีลายเซ็นจริงรายงานตัวที่ตึก LED ชั้น 18 เวลา 08.30 น.
            </span>
          </p>

          <p className="text-gray-800 mt-2">
            <span className="text-red-500 text-base sm:text-xl font-bold">
              *{" "}
            </span>
            <span className="text-black text-base sm:text-xl font-bold">
              นำใบส่งตัวจากมหาวิทยาลัยส่งที่กองฝึกงานของตนเอง
            </span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6">
            <span className="text-red-500">*</span>เอกสารของการไฟฟ้า
          </h2>

          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0 gap-3"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 12.2833 8.09583 12.5208 8.2875 12.7125C8.47917 12.9042 8.71667 13 9 13H15ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z"
                      fill="#A80689"
                    />
                  </svg>
                  <span className="text-sm sm:text-base text-gray-800">
                    {doc.name}
                  </span>
                </div>

                {/* ✅ แก้ตรงนี้: ให้ปุ่ม 2 อันพอดีแถวเดียวในมือถือ */}
                <div className="flex w-full sm:w-auto gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(doc.example, "_blank")}
                    className="
                      flex-1 sm:flex-none
                      px-3 py-2
                      text-xs
                      border-2 border-primary-600 text-primary-600
                      rounded-lg font-medium
                      hover:bg-primary-600 hover:text-white
                      transition-colors
                      cursor-pointer
                      whitespace-nowrap
                      min-w-0
                      active:scale-95
                    "
                  >
                    ตัวอย่างเอกสาร
                  </button>
                  <a
                    href={doc.download}
                    download
                    className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 text-xs text-center bg-primary-600 border-2 border-primary-600 text-white rounded-lg font-medium hover:bg-white hover:text-primary-600 transition-colors cursor-pointer whitespace-nowrap min-w-0 active:scale-95"
                  >
                    ดาวน์โหลดเอกสาร
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
