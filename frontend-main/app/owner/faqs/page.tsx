"use client";

import { useState } from "react";
import OwnerNavbar from "@/components/ui/OwnerNavbar";

// FAQ Item Component
interface FAQItemProps {
  question: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FAQItem({ question, children, defaultOpen = false }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="relative">
      <div className="-mx-4 md:-mx-6 border-t border-gray-200" />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
      >
        <span className="font-bold text-gray-900 text-sm md:text-base">
          {question}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ease-in-out shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pb-4 text-gray-600 text-sm">{children}</div>
      </div>
    </div>
  );
}

// Document Icon
const DocumentIcon = () => (
  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-pink-300/50 flex items-center justify-center">
    <svg
      className="w-4 h-4 md:w-5 md:h-5 text-primary-600"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 13.2833 8.09583 13.5208 8.2875 13.7125C8.47917 13.9042 8.71667 14 9 14ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z" />
    </svg>
  </div>
);

// Doc file icon for document list
const DocFileIcon = () => (
  <svg
    width="16"
    height="20"
    viewBox="0 0 16 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z"
      fill="#A80689"
    />
  </svg>
);

// Step data
const steps = [
  {
    number: 1,
    title: "รอเอกสารจากผู้สมัคร",
    description: "รอผู้สมัครส่งเอกสารเข้ามา",
    action: "สิ่งที่ต้องทำ: ดูใบสมัครและคัดกรอง",
  },
  {
    number: 2,
    title: "สัมภาษณ์ผู้สมัคร",
    description: "ดำเนินการสัมภาษณ์ผู้สมัครตามความเหมาะสม",
    action: "สิ่งที่ต้องทำ: นัดวันเพื่อสัมภาษณ์ผู้สมัคร",
  },
  {
    number: 3,
    title: "ยืนยันสถานะการสมัคร",
    description: "ยืนยันผลการสมัคร",
    action: "สิ่งที่ต้องทำ: ยืนยันสถานะการรับสมัคร ผ่านหรือไม่ผ่าน",
  },
  {
    number: 4,
    title: "รอเอกสารขอความอนุเคราะห์จากผู้สมัคร",
    description: "รอผู้สมัครส่งเอกสารขอความอนุเคราะห์เข้ามา",
    action: "สิ่งที่ต้องทำ: HR ดาวน์โหลดและตรวจสอบเอกสาร",
  },
  {
    number: 5,
    title: "รอ HR ตรวจสอบความถูกต้องของเอกสาร",
    description: "รอ HR ตรวจสอบและอนุมัติเอกสารขอความอนุเคราะห์",
    action: "สิ่งที่ต้องทำ: ติดตามสถานะจาก HR",
  },
  {
    number: 6,
    title: "รับผู้สมัครเข้าฝึกงาน",
    description: "ผู้สมัครพร้อมเข้าฝึกงาน",
    action: "สิ่งที่ต้องทำ: เตรียมความพร้อมในด้านต่าง ๆ",
  },
];

// Document list
const documents = [
  {
    name: "เอกสารรักษาความลับ",
    example: "/ตัวอย่าง การกรอกสัญญาการรักษาข้อมูล.pdf",
    download: "/สัญญาการรักษาข้อมูลที่เป็นความลับ (Destination).pdf",
  },
  {
    name: "เอกสารการลางาน",
    example: "/ใบลาป่วย ลากิจส่วนตัว.pdf",
    download: "/ใบลาป่วย ลากิจส่วนตัว.pdf",
  },
  {
    name: "เอกสารกฎระเบียบ",
    example: "/ข้อปฏิบัติ (Regulation).pdf",
    download: "/ข้อปฏิบัติ (Regulation).pdf",
  },
  {
    name: "เอกสารเข้า - ออกงาน",
    example: "/ใบลงเวลา.pdf",
    download: "/ใบลงเวลา.pdf",
  },
  {
    name: "เอกสารออกนอกสถานที่",
    example: "/หนังสือยินยอมผู้ปกครอง-สถาบันการศึกษา.pdf",
    download: "/หนังสือยินยอมผู้ปกครอง-สถาบันการศึกษา.pdf",
  },
];

export default function OwnerFAQsPage() {
  return (
    <div className="min-h-screen bg-white">
      <OwnerNavbar />
      

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
            คำถามที่พบบ่อย
          </h1>
          <p className="text-gray-500 text-base md:text-lg">
            รวมคำถามและตอบคำถามที่พบบ่อยเกี่ยวกับการรับสมัครฝึกงาน
          </p>
        </div>

        {/* FAQ Section */}
        <div className="flex flex-col gap-8 md:gap-10">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <div className="bg-pink-50/80 px-4 md:px-6 py-3 md:py-4 flex items-center gap-3">
              <DocumentIcon />
              <h2 className="font-bold text-gray-900 text-lg md:text-xl">
                ขั้นตอนการรับสมัครและแนวทางการเริ่มฝึกงาน
              </h2>
            </div>

            {/* Content */}
            <div className="px-4 md:px-6">
              {/* ขั้นตอนการรับสมัคร */}
              <FAQItem question="ขั้นตอนการรับสมัคร">
                <div className="space-y-3 mt-2">
                  {steps.map((step) => (
                    <div
                      key={step.number}
                      className="bg-white border border-gray-200 rounded-xl p-4  "
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {step.number}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">
                            {step.title}
                          </h4>
                          <p className="text-gray-500 text-sm mt-0.5">
                            {step.description}
                          </p>
                          <p className="text-primary-600 text-sm font-medium mt-1">
                            {step.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </FAQItem>

              {/* แนวทางการปฏิบัติในวันเริ่มฝึกงาน */}
              <FAQItem question="แนวทางการปฏิบัติในวันเริ่มฝึกงานของผู้สมัคร">
                <div className="space-y-6 mt-2">
                  {/* Instructions */}
                  <div className="space-y-2">
                    <p className="text-gray-900 text-sm">
                      <span className="text-primary-600 font-bold">* </span>
                      <span className="font-bold text-gray-900">
                        วันเข้ารับการฝึกงานนำ
                      </span>
                      <span className="text-primary-600 font-bold">
                        เอกสารรักษาความลับมา 2 ฉบับ
                      </span>
                      <span className="font-bold text-gray-900">
                        {" "}
                        รายงานตัวที่ตึก LED ชั้น 18
                      </span>
                    </p>
                    <p className="text-gray-900 text-sm">
                      <span className="text-primary-600 font-bold">* </span>
                      <span className="font-bold text-gray-900">
                        นำใบส่งตัวจากมหาวิทยาลัยส่งที่กองฝึกงานของตนเอง
                      </span>
                    </p>
                  </div>

                  {/* Document list */}
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-4">
                      <span className="text-primary-600">*</span>
                      เอกสารของการไฟฟ้า
                    </h4>
                    <div className="space-y-3">
                      {documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <DocFileIcon />
                            <span className="text-gray-700 text-sm">
                              {doc.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => window.open(doc.example, "_blank")}
                              className="px-4 py-1.5 border-2 border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors cursor-pointer active:scale-95"
                            >
                              ตัวอย่างเอกสาร
                            </button>
                            <a
                              href={doc.download}
                              download
                              className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors cursor-pointer active:scale-95"
                            >
                              ดาวน์โหลดเอกสาร
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FAQItem>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
