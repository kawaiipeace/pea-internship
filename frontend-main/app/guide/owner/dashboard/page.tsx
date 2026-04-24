"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

function ZoomImage({ src, alt }: { src: string; alt: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="block w-full cursor-zoom-in focus:outline-none"
                aria-label={`ขยายภาพ: ${alt}`}
            >
                <div className="relative w-full" style={{ paddingBottom: "66.67%" }}>
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-cover rounded-xl border border-gray-200 shadow-sm"
                    />
                </div>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
                    onClick={() => setOpen(false)}
                >
                    <div className="relative max-w-5xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={src}
                            alt={alt}
                            width={1200}
                            height={800}
                            className="w-full h-auto rounded-xl shadow-2xl object-contain max-h-[85vh]"
                        />
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center shadow hover:bg-white transition-colors"
                            aria-label="ปิด"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default function StaffDashboardPage() {
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
                <Link href="/guide/owner" className="hover:text-primary-600 transition-colors">
                    วิธีการใช้งานระบบ PEA Internship พนักงาน
                </Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-700 font-medium">แดชบอร์ดสำหรับพนักงาน</span>
            </div>

            {/* On-page navigation */}
            <div className="flex flex-wrap gap-2 mb-10 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-500 mr-1 font-medium">ในหน้านี้:</span>
                {[
                    { id: "overview", label: "ภาพรวมข้อมูลการรับสมัคร" },
                    { id: "list", label: "รายชื่อนักศึกษาฝึกงาน" },
                ].map((item) => (
                    <a key={item.id} href={`#${item.id}`} className="text-sm text-primary-600 hover:underline">
                        {item.label}
                    </a>
                ))}
            </div>

            {/* Page heading */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">แดชบอร์ดสำหรับผู้ดูแล (Owner Dashboard)</h1>
            <p className="text-gray-600 leading-relaxed mb-8">
                หน้า แดชบอร์ด (Dashboard) เป็นหน้าสำหรับแสดงภาพรวมข้อมูลการรับสมัครและการฝึกงานของหน่วยงาน
                โดยช่วยให้ Owner สามารถติดตามสถานการณ์ทั้งหมดได้อย่างรวดเร็วในหน้าเดียว
            </p>

            {/* Dashboard preview images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 aspect-video flex items-center justify-center">
                    <ZoomImage src="/images/guideline/dashboardowner.png" alt="ตัวอย่างหน้าแดชบอร์ด" />
                </div>
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 aspect-video flex items-center justify-center">
                    <ZoomImage src="/images/guideline/dashboardowner2.png" alt="ตัวอย่างหน้าแดชบอร์ดส่วนกราฟ" />
                </div>
            </div>

            {/* ── ภาพรวมข้อมูลการรับสมัคร ── */}
            <section id="overview" className="scroll-mt-24 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">ภาพรวมข้อมูลการรับสมัคร</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                    ภายในส่วนบนของแดชบอร์ด จะแสดงข้อมูลสรุปในรูปแบบตัวเลข (Summary) เช่น
                </p>
                <ul className="space-y-2 mb-4 ml-2">
                    {[
                        "จำนวนประกาศรับสมัครทั้งหมด",
                        "จำนวนตำแหน่งที่เปิดรับ",
                        "จำนวนผู้สมัครทั้งหมด",
                        "จำนวนนักศึกษาฝึกงานทั้งหมด",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-gray-600">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
                <p className="text-gray-600 leading-relaxed">
                    Owner สามารถใช้ข้อมูลส่วนนี้เพื่อดูภาพรวมของการดำเนินงานในแต่ละช่วงเวลาได้ทันที
                </p>
            </section>

            <hr className="border-gray-200 mb-12" />

            {/* ── รายชื่อนักศึกษาฝึกงาน ── */}
            <section id="list" className="scroll-mt-24 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">รายชื่อนักศึกษาฝึกงาน</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                    ตารางรายชื่อนักศึกษาฝึกงานแสดงข้อมูลสำคัญของนักศึกษาแต่ละคน ได้แก่
                </p>
                <ul className="space-y-2 mb-6 ml-2">
                    {[
                        "ชื่อ-นามสกุล",
                        "ตำแหน่งที่ฝึกงาน",
                        "ระยะเวลาฝึกงาน",
                        "สถานะการฝึกงาน",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-gray-600">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
                <p className="text-gray-600 leading-relaxed">
                    Owner สามารถ <span className="font-medium">ค้นหาและกรองข้อมูล</span> ตามชื่อนักศึกษา ตำแหน่ง หรือระยะเวลาได้ เพื่อความสะดวกในการติดตาม
                </p>
            </section>

            {/* Navigation footer */}
            <div className="mt-4 flex justify-between items-center pt-8 border-t border-gray-200">
                <Link href="/guide/owner/post-selection" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    ขั้นตอนหลังการคัดเลือก
                </Link>
                <Link href="/guide/owner" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                    กลับสู่ภาพรวมคู่มือพนักงาน
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
