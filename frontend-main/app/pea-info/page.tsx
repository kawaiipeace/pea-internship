"use client";

import Link from "next/link";
import Navbar from "../components/ui/Navbar";

export default function PEAInfoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-800 mb-8">
            การไฟฟ้าส่วนภูมิภาค (กฟภ.) สำนักงานใหญ่
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Information */}
            <div className="space-y-6">
              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 mt-1">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    สถานที่ตั้ง
                  </h2>
                  <p className="text-gray-600">
                    200 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 mt-1">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    เวลาทำการ
                  </h2>
                  <p className="text-gray-600">
                    วันจันทร์ถึงวันศุกร์ เวลา 8:30 น. ถึง 16:30 น.
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 mt-1">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 8H14C13.7167 8 13.4792 7.90417 13.2875 7.7125C13.0958 7.52083 13 7.28333 13 7C13 6.71667 13.0958 6.47917 13.2875 6.2875C13.4792 6.09583 13.7167 6 14 6H16V4C16 3.71667 16.0958 3.47917 16.2875 3.2875C16.4792 3.09583 16.7167 3 17 3C17.2833 3 17.5208 3.09583 17.7125 3.2875C17.9042 3.47917 18 3.71667 18 4V6H20C20.2833 6 20.5208 6.09583 20.7125 6.2875C20.9042 6.47917 21 6.71667 21 7C21 7.28333 20.9042 7.52083 20.7125 7.7125C20.5208 7.90417 20.2833 8 20 8H18V10C18 10.2833 17.9042 10.5208 17.7125 10.7125C17.5208 10.9042 17.2833 11 17 11C16.7167 11 16.4792 10.9042 16.2875 10.7125C16.0958 10.5208 16 10.2833 16 10V8ZM19.95 21C17.8667 21 15.8083 20.5458 13.775 19.6375C11.7417 18.7292 9.89167 17.4417 8.225 15.775C6.55833 14.1083 5.27083 12.2583 4.3625 10.225C3.45417 8.19167 3 6.13333 3 4.05C3 3.75 3.1 3.5 3.3 3.3C3.5 3.1 3.75 3 4.05 3H8.1C8.33333 3 8.54167 3.07917 8.725 3.2375C8.90833 3.39583 9.01667 3.58333 9.05 3.8L9.7 7.3C9.73333 7.56667 9.725 7.79167 9.675 7.975C9.625 8.15833 9.53333 8.31667 9.4 8.45L6.975 10.9C7.30833 11.5167 7.70417 12.1125 8.1625 12.6875C8.62083 13.2625 9.125 13.8167 9.675 14.35C10.1917 14.8667 10.7333 15.3458 11.3 15.7875C11.8667 16.2292 12.4667 16.6333 13.1 17L15.45 14.65C15.6 14.5 15.7958 14.3875 16.0375 14.3125C16.2792 14.2375 16.5167 14.2167 16.75 14.25L20.2 14.95C20.4333 15.0167 20.625 15.1375 20.775 15.3125C20.925 15.4875 21 15.6833 21 15.9V19.95C21 20.25 20.9 20.5 20.7 20.7C20.5 20.9 20.25 21 19.95 21ZM6.025 9L7.675 7.35L7.25 5H5.025C5.10833 5.68333 5.225 6.35833 5.375 7.025C5.525 7.69167 5.74167 8.35 6.025 9ZM14.975 17.95C15.625 18.2333 16.2875 18.4583 16.9625 18.625C17.6375 18.7917 18.3167 18.9 19 18.95V16.75L16.65 16.275L14.975 17.95Z"
                      fill="#A80689"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    โทรศัพท์
                  </h2>
                  <p className="text-gray-600">
                    ติดต่อสอบถามเกี่ยวกับเอกสาร ติดต่อ : 02-590-5866
                  </p>
                </div>
              </div>

              {/* Bus Routes */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 mt-1">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 19V19.5C8 19.9167 7.85417 20.2708 7.5625 20.5625C7.27083 20.8542 6.91667 21 6.5 21C6.08333 21 5.72917 20.8542 5.4375 20.5625C5.14583 20.2708 5 19.9167 5 19.5V17.95C4.7 17.6167 4.45833 17.2458 4.275 16.8375C4.09167 16.4292 4 15.9833 4 15.5V6C4 4.61667 4.64167 3.60417 5.925 2.9625C7.20833 2.32083 9.23333 2 12 2C14.8667 2 16.9167 2.30833 18.15 2.925C19.3833 3.54167 20 4.56667 20 6V15.5C20 15.9833 19.9083 16.4292 19.725 16.8375C19.5417 17.2458 19.3 17.6167 19 17.95V19.5C19 19.9167 18.8542 20.2708 18.5625 20.5625C18.2708 20.8542 17.9167 21 17.5 21C17.0833 21 16.7292 20.8542 16.4375 20.5625C16.1458 20.2708 16 19.9167 16 19.5V19H8ZM6 10H18V7H6V10ZM8.5 16C8.91667 16 9.27083 15.8542 9.5625 15.5625C9.85417 15.2708 10 14.9167 10 14.5C10 14.0833 9.85417 13.7292 9.5625 13.4375C9.27083 13.1458 8.91667 13 8.5 13C8.08333 13 7.72917 13.1458 7.4375 13.4375C7.14583 13.7292 7 14.0833 7 14.5C7 14.9167 7.14583 15.2708 7.4375 15.5625C7.72917 15.8542 8.08333 16 8.5 16ZM15.5 16C15.9167 16 16.2708 15.8542 16.5625 15.5625C16.8542 15.2708 17 14.9167 17 14.5C17 14.0833 16.8542 13.7292 16.5625 13.4375C16.2708 13.1458 15.9167 13 15.5 13C15.0833 13 14.7292 13.1458 14.4375 13.4375C14.1458 13.7292 14 14.0833 14 14.5C14 14.9167 14.1458 15.2708 14.4375 15.5625C14.7292 15.8542 15.0833 16 15.5 16ZM6.45 5H17.65C17.4 4.71667 16.8625 4.47917 16.0375 4.2875C15.2125 4.09583 13.8833 4 12.05 4C10.2667 4 8.9625 4.10417 8.1375 4.3125C7.3125 4.52083 6.75 4.75 6.45 5ZM8 17H16C16.55 17 17.0208 16.8042 17.4125 16.4125C17.8042 16.0208 18 15.55 18 15V12H6V15C6 15.55 6.19583 16.0208 6.5875 16.4125C6.97917 16.8042 7.45 17 8 17Z"
                      fill="#A80689"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    สายรถประจำทาง
                  </h2>
                  <p className="text-gray-600">
                    24, 63, 69 (2-13), 114, 134 (2-20), 191, 522 (1-22E), 545
                    (2-26), 1-62, 2-17R
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Google Map */}
            <div className="h-80 lg:h-full min-h-[300px] rounded-xl overflow-hidden shadow-md">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3873.5936927089796!2d100.5555335!3d13.8508743!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29d7e60c964fd%3A0xd27b30619b734631!2z4LiB4Liy4Lij4LmE4Lif4Lif4LmJ4Liy4Liq4LmI4Lin4LiZ4Lig4Li54Lih4Li04Lig4Liy4LiEICjguKrguLPguJnguLHguIHguIfguLLguJnguYPguKvguI3guYgp!5e0!3m2!1sth!2sth!4v1700000000000!5m2!1sth!2sth"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="แผนที่การไฟฟ้าส่วนภูมิภาค สำนักงานใหญ่"
              />
            </div>
          </div>
        </div>

        {/* Back Button - Outside Card */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-primary-600 text-white rounded-2xl font-medium hover:bg-white hover:text-primary-600 border-2 border-primary-600 transition-colors text-base active:scale-95"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </main>
    </div>
  );
}
