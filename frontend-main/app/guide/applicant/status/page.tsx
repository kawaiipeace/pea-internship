import Link from "next/link";

export default function ApplicantStatusPage() {
    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/guide" className="hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <Link href="/guide/applicant" className="hover:text-primary-600 transition-colors">
                    วิธีการใช้งานระบบ PEA Internship ผู้สมัคร
                </Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-700 font-medium">การติดตามสถานะ</span>
            </div>

            {/* On-page navigation */}
            <div className="flex flex-wrap gap-2 mb-10 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-500 mr-1 font-medium">ในหน้านี้:</span>
                {[
                    { id: "track", label: "การติดตามสถานะการสมัคร" },
                    { id: "notify", label: "การแจ้งเตือนสถานะการสมัคร" },
                ].map((item) => (
                    <a key={item.id} href={`#${item.id}`} className="text-sm text-primary-600 hover:underline">
                        {item.label}
                    </a>
                ))}
            </div>

            {/* ── การติดตามสถานะการสมัคร ── */}
            <section id="track" className="scroll-mt-24 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">การติดตามสถานะการสมัคร</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                    ผู้สมัครสามารถตรวจสอบสถานะการสมัครได้ตลอดเวลา ผ่านเมนู <span className="font-medium">"ติดตามสถานะการสมัคร"</span> หรือ <span className="font-medium">"ประวัติการสมัคร"</span> ที่อยู่ในแถบนำทางของเว็บไซต์
                    โดยในหน้านี้จะแสดงข้อมูลสำคัญของการสมัครแต่ละรายการ ได้แก่
                </p>
                <ul className="space-y-2 mb-6">
                    {[
                        "ตำแหน่งที่สมัคร",
                        "หน่วยงาน",
                        "สถานะปัจจุบันของการสมัคร",
                        "ปุ่มสำหรับดูรายละเอียดเพิ่มเติม",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-gray-600">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-600 mt-2" />
                            {item}
                        </li>
                    ))}
                </ul>
                <p className="text-gray-600 leading-relaxed">
                    ผู้สมัครควรติดตามสถานะการสมัครอย่างสม่ำเสมอ เพื่อดำเนินการในขั้นตอนต่างๆ ได้อย่างทันท่วงที และไม่พลาดการอัปเดตสำคัญจากหน่วยงาน
                </p>
            </section>

            <hr className="border-gray-200 mb-12" />

            {/* ── การแจ้งเตือนสถานะการสมัคร ── */}
            <section id="notify" className="scroll-mt-24 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">การแจ้งเตือนสถานะการสมัคร</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                    ระบบ PEA Internship มีการแจ้งเตือนผู้สมัครทุกครั้งที่มีการเปลี่ยนแปลงสถานะการสมัคร
                    โดยระบบจะแจ้งเตือนผู้สมัครผ่าน 2 ช่องทาง ได้แก่
                </p>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-gray-600">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-600 mt-2" />
                        <span>
                            <span className="font-medium">การแจ้งเตือนผ่านอีเมล (Email)</span>
                            <span className="block text-sm text-gray-500 mt-0.5">ระบบจะส่งอีเมลแจ้งเตือนไปยังที่อยู่อีเมลที่ผู้สมัครลงทะเบียนไว้ เมื่อมีการเปลี่ยนแปลงสถานะ เพื่อให้ผู้สมัครได้รับข้อมูลแม้ไม่ได้เปิดเว็บไซต์อยู่</span>
                        </span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-600">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-600 mt-2" />
                        <span>
                            <span className="font-medium">การแจ้งเตือนภายในเว็บไซต์ (Notification)</span>
                            <span className="block text-sm text-gray-500 mt-0.5">ระบบจะแสดงการแจ้งเตือนผ่านไอคอนกระดิ่งที่อยู่ในแถบนำทางด้านบนของเว็บไซต์ ผู้สมัครสามารถกดเพื่อดูรายละเอียดการแจ้งเตือนทั้งหมดได้</span>
                        </span>
                    </li>
                </ul>
            </section>

            {/* Navigation footer */}
            <div className="mt-4 flex justify-between items-center pt-8 border-t border-gray-200">
                <Link href="/guide/applicant/howto" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    คู่มืออธิบายการใช้งานระบบ
                </Link>
                <Link href="/guide/applicant/itt" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
                    ระบบ ITT
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
