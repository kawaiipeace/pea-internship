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

export default function AdminHowtoPage() {
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
                <Link href="/guide/admin" className="hover:text-primary-600 transition-colors">
                    วิธีการใช้งานระบบ PEA Internship แอดมิน
                </Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-700 font-medium">คู่มืออธิบายการใช้งานระบบของแอดมิน</span>
            </div>

            {/* On-page navigation */}
            <div className="flex flex-wrap gap-2 mb-10 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-500 mr-1 font-medium">ในหน้านี้:</span>
                {[
                    { id: "overview", label: "ระบบสำหรับแอดมิน" },
                    { id: "duties", label: "หน้าที่ของแอดมิน" },
                    { id: "role", label: "ระบบเปลี่ยน Role" },
                ].map((item) => (
                    <a key={item.id} href={`#${item.id}`} className="text-sm text-primary-600 hover:underline">
                        {item.label}
                    </a>
                ))}
            </div>

            {/* ── ระบบสำหรับแอดมิน ── */}
            <section id="overview" className="scroll-mt-24 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">ระบบสำหรับแอดมิน</h2>
                <p className="text-gray-600 leading-relaxed mb-8">
                    PEA Internship เป็นเว็บไซต์สำหรับให้นักศึกษาที่สนใจเข้าฝึกงานกับการไฟฟ้าส่วนภูมิภาค
                    สมัครฝึกงานผ่านระบบออนไลน์ โดยผู้ดูแลระบบ (Admin)
                    จะมีหน้าที่ตรวจสอบเอกสารและอนุมัติผู้สมัครเข้าสู่ขั้นตอนการฝึกงาน
                </p>

                <div className="grid grid-cols-2 place-items-center gap-4 mb-8">
                    <ZoomImage src="/images/คู่มือ/howtoadmin.png" alt="ระบบสำหรับแอดมิน" />
                </div>
            </section>

            <hr className="border-gray-200 mb-12" />

            {/* ── หน้าที่ของแอดมิน ── */}
            <section id="duties" className="scroll-mt-24 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">หน้าที่ของแอดมิน</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                    Admin มีหน้าที่หลักในการตรวจสอบเอกสารขอความอนุเคราะห์ของนักศึกษา
                    และจัดการสถานะของผู้สมัครในระบบ
                </p>

                {/* 1. ตรวจสอบเอกสาร */}
                <h3 className="text-lg font-bold text-gray-900 mb-3">1. ตรวจสอบเอกสาร</h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                    เมื่อผู้สมัครอยู่ในสถานะ <span className="font-medium">รอตรวจเอกสาร</span>{" "}
                    Admin สามารถกดดูรายละเอียดได้ เช่น
                </p>
                <ul className="space-y-2 mb-8 ml-2">
                    {[
                        "เอกสารที่แนบมา",
                        "ความถูกต้องของเอกสาร",
                        "ประวัติการสมัครย้อนหลัง",
                        "เคยสมัครกี่แผนก / กี่ตำแหน่ง",
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-gray-600">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>

                {/* 2. อนุมัติผลเอกสาร */}
                <h3 className="text-lg font-bold text-gray-900 mb-3">2. อนุมัติผลเอกสาร</h3>
                <p className="text-gray-600 leading-relaxed mb-4">Admin สามารถเลือกได้ 2 แบบ</p>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                        <p className="font-semibold text-green-800 mb-2">เอกสารถูกต้อง</p>
                        <ul className="space-y-1">
                            <li className="flex items-start gap-2 text-green-700 text-sm">
                                <span className="font-bold">→</span>
                                <span>ผู้สมัครจะย้ายไปสถานะ "เอกสารผ่าน"</span>
                            </li>
                            <li className="flex items-start gap-2 text-green-700 text-sm">
                                <span className="font-bold">→</span>
                                <span>พร้อมเข้าสู่ขั้นตอนรอเริ่มฝึกงาน</span>
                            </li>
                        </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                        <p className="font-semibold text-red-800 mb-2">เอกสารไม่ถูกต้อง</p>
                        <ul className="space-y-1">
                            <li className="flex items-start gap-2 text-red-700 text-sm">
                                <span className="font-bold">→</span>
                                <span>ผู้สมัครจะย้ายไปสถานะ "เอกสารไม่ผ่าน"</span>
                            </li>
                            <li className="flex items-start gap-2 text-red-700 text-sm">
                                <span className="font-bold">→</span>
                                <span>ผู้สมัครต้องแนบเอกสารมาใหม่</span>
                            </li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 place-items-center gap-4 mb-8">
                        <ZoomImage src="/images/คู่มือ/howtoadmin2.png" alt="ระบบสำหรับแอดมิน" />
                        <ZoomImage src="/images/คู่มือ/howtoadmin3.png" alt="ระบบสำหรับแอดมิน" />
                    </div>
                </div>
            </section>

            <hr className="border-gray-200 mb-12" />

            {/* ── ระบบเปลี่ยน Role ── */}
            <section id="role" className="scroll-mt-24 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">ระบบเปลี่ยน Role</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                    บริเวณเมนูด้านบน ปุ่ม <span className="font-medium">Admin</span> สามารถใช้สลับบทบาทการใช้งานได้
                </p>

                <h3 className="text-base font-bold text-gray-800 mb-3">Role ภายในระบบ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                        <p className="font-bold text-gray-900 mb-3">Admin</p>
                        <ul className="space-y-2">
                            {["ตรวจสอบเอกสาร", "อนุมัติผู้สมัคร", "จัดการสถานะเอกสาร"].map((item) => (
                                <li key={item} className="flex items-start gap-2 text-gray-600 text-sm">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                        <p className="font-bold text-gray-900 mb-3">Owner</p>
                        <ul className="space-y-2">
                            {["สร้างประกาศรับสมัครฝึกงาน", "เปิดรับนักศึกษาเข้าสู่แผนกของตนเอง"].map((item) => (
                                <li key={item} className="flex items-start gap-2 text-gray-600 text-sm">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-2 place-items-center gap-4 mb-8">
                    <ZoomImage src="/images/คู่มือ/howtoadmin4.png" alt="ระบบสำหรับแอดมิน" />
                    <ZoomImage src="/images/คู่มือ/howtoadmin5.png" alt="ระบบสำหรับแอดมิน" />
                </div>
            </section>

            {/* Navigation footer */}
            <div className="mt-4 flex justify-between items-center pt-8 border-t border-gray-200">
                <Link href="/guide/admin/basic" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    ระบบเบื้องต้น
                </Link>
                <Link href="/guide/admin/dashboard" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
                    แดชบอร์ดสำหรับแอดมิน
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
