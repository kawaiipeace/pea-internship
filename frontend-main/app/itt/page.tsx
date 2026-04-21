"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { NavbarIntern } from "@/components";
import { userApi, extractStudentProfile } from "@/services/api";

const ITT_URL =
    process.env.NEXT_PUBLIC_ITT_URL || "http://localhost:2701";

export default function IttPage() {
    const router = useRouter();
    const [allowed, setAllowed] = useState<boolean | null>(null);
    const revealContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const profile = await userApi.getUserProfile();
                const sp = extractStudentProfile(profile.profile);
                const status = sp?.internshipStatus ?? "IDLE";
                setAllowed(status === "AWAITING" || status === "ACTIVE");
            } catch {
                setAllowed(false);
            }
        };
        checkStatus();
    }, []);

    // Setup scroll-reveal AFTER content is shown (allowed === true)
    useEffect(() => {
        if (!allowed) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("itt-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        // Small timeout to ensure DOM is fully painted
        const timer = setTimeout(() => {
            if (!revealContainerRef.current) return;
            const els = revealContainerRef.current.querySelectorAll(".itt-reveal");
            els.forEach((el) => observer.observe(el));
        }, 50);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [allowed]);

    const handleGoToItt = () => {
        window.location.href = `${ITT_URL}/intern`;
    };

    useEffect(() => {
        if (allowed === false) {
            router.replace("/intern-home");
        }
    }, [allowed, router]);

    if (allowed === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <style>{`
        .itt-reveal {
          opacity: 0;
          transform: translateY(2rem);
          transition: opacity 0.65s ease-out, transform 0.65s ease-out;
        }
        .itt-reveal.itt-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .itt-reveal-d1 { transition-delay: 0.1s; }
        .itt-reveal-d2 { transition-delay: 0.22s; }
        .itt-reveal-d3 { transition-delay: 0.36s; }
        .itt-reveal-d4 { transition-delay: 0.5s; }
      `}</style>

            <NavbarIntern />

            <div ref={revealContainerRef}>
                {/* ───────────── HERO ───────────── */}
                <section
                    className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden"
                    style={{
                        background:
                            "linear-gradient(135deg, #9A0D8A 0%, #bf3aab 35%, #d96ec4 60%, #edb8e0 82%, #f7e6f5 100%)",
                    }}
                >
                    {/* Decorative blobs */}
                    <div className="pointer-events-none absolute top-[-3rem] right-[8%] w-80 h-80 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-[-2rem] left-[4%] w-64 h-64 rounded-full bg-white/10 blur-3xl" />

                    <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Left – text */}
                        <div>
                            <h1 className="itt-reveal text-white font-bold text-5xl lg:text-6xl leading-tight mb-6">
                                จัดการเวลาฝึกงาน
                                <br />
                                ง่ายๆ ในที่เดียว
                            </h1>

                            <p className="itt-reveal itt-reveal-d1 text-white/90 text-xl leading-relaxed mb-10 max-w-lg">
                                เช็คชื่อเข้า-ออก ลงเวลาทำงาน และติดตามชั่วโมงฝึกงาน
                                <br className="hidden sm:block" />
                                ได้แบบเรียลไทม์ ผ่านระบบ iTT
                            </p>

                            <div className="itt-reveal itt-reveal-d2">
                                <button
                                    onClick={handleGoToItt}
                                    className="cursor-pointer inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 text-white"
                                    style={{ backgroundColor: "#9A0D8A", border: "2px solid rgba(255,255,255,0.3)" }}
                                >
                                    เริ่มใช้งาน
                                </button>
                            </div>
                        </div>

                        {/* Right – phone mockup (larger, slight overflow) */}
                        <div className="itt-reveal itt-reveal-d2 flex justify-center lg:justify-end lg:absolute lg:right-0 lg:bottom-0 lg:top-0 lg:w-[55%] lg:items-center">
                            <Image
                                src="/images/phoneitt.png"
                                alt="PEA iTT App Preview"
                                width={800}
                                height={700}
                                className="w-full max-w-lg lg:max-w-none lg:w-[90%] object-contain drop-shadow-2xl"
                                priority
                            />
                        </div>
                    </div>
                </section>

                {/* ───────────── 3 STEPS ───────────── */}
                <section
                    className="py-20"
                    style={{
                        background:
                            "linear-gradient(180deg, #f7e6f5 0%, #fdf2fa 45%, #ffffff 100%)",
                    }}
                >
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <h2
                            className="itt-reveal text-center text-3xl lg:text-4xl font-bold mb-14"
                            style={{ color: "#9A0D8A" }}
                        >
                            เริ่มต้นใช้งานง่ายๆ ใน 3 ขั้นตอน
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Step 1 */}
                            <div
                                className="itt-reveal itt-reveal-d1 rounded-2xl p-8 text-center shadow-sm"
                                style={{ background: "rgba(154,13,138,0.07)" }}
                            >
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                                    style={{ background: "rgba(154,13,138,0.14)" }}
                                >
                                    <svg className="w-7 h-7" style={{ color: "#9A0D8A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-xl mb-3 text-gray-800">1. เข้าสู่ระบบ</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    ล็อคอินเข้าสู่ระบบผ่านบัญชี PEA Internship
                                    <br />
                                    หรือ สร้างบัญชีใหม่ผ่านเว็บ iTT
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div
                                className="itt-reveal itt-reveal-d2 rounded-2xl p-8 text-center shadow-sm"
                                style={{ background: "rgba(154,13,138,0.11)" }}
                            >
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                                    style={{ background: "rgba(154,13,138,0.18)" }}
                                >
                                    <svg className="w-7 h-7" style={{ color: "#9A0D8A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-xl mb-3 text-gray-800">2. กดเช็คชื่อเข้า-ออก</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    ระบบจะสามารถเช็คชื่อเข้า-ออกได้
                                    <br />
                                    เมื่อถึงสถานที่ทำงานแล้วเท่านั้น
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div
                                className="itt-reveal itt-reveal-d3 rounded-2xl p-8 text-center shadow-sm"
                                style={{ background: "rgba(154,13,138,0.07)" }}
                            >
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                                    style={{ background: "rgba(154,13,138,0.14)" }}
                                >
                                    <svg className="w-7 h-7" style={{ color: "#9A0D8A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-xl mb-3 text-gray-800">3. ติดตามสถานะ</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    สามารถติดตามสถานะและ
                                    <br />
                                    ชั่วโมงฝึกงานได้แบบเรียลไทม์
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ───────────── BOTTOM CTA ───────────── */}
                <section
                    className="py-20"
                    style={{
                        background:
                            "linear-gradient(135deg, #9A0D8A 0%, #bf3aab 45%, #dda0d5 100%)",
                    }}
                >
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="itt-reveal">
                            <h2 className="text-white font-bold text-2xl lg:text-5xl mb-2">
                                จัดการเวลาฝึกงานได้ง่ายกว่าเดิม
                            </h2>
                            <p className="text-white/80 text-lg">
                                เช็คชื่อ เข้า-ออก และดูความคืบหน้าได้แบบเรียลไทม์
                            </p>
                        </div>
                            <div className="itt-reveal itt-reveal-d2">
                                <button
                                    onClick={handleGoToItt}
                                    className="cursor-pointer inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 text-white"
                                    style={{ backgroundColor: "#9A0D8A", border: "2px solid rgba(255,255,255,0.3)" }}
                                >
                                    เริ่มใช้งาน
                                </button>
                            </div>
                    </div>
                </section>
            </div>
        </>
    );
}

