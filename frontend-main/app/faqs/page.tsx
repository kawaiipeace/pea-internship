"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavbarIntern } from "../components";
import Navbar from "../components/ui/Navbar";
import { authStorage } from "../services/api";

// Image Viewer Modal Component
interface ImageViewerProps {
    src: string;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
}

function ImageViewer({ src, alt, isOpen, onClose }: ImageViewerProps) {
    if (!isOpen) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'PEA-Internship-Steps.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={onClose}
        >
            {/* Buttons container - higher z-index */}
            <div className="absolute top-4 right-4 flex gap-3 z-10">
                {/* Download button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDownload();
                    }}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    title="ดาวน์โหลด"
                >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>

                {/* Close button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    title="ปิด"
                >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Image */}
            <div 
                className="flex items-center justify-center p-8 pt-20"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={src}
                    alt={alt}
                    width={2400}
                    height={1350}
                    className="w-auto h-auto max-w-[96vw] max-h-[90vh] object-contain"
                    priority
                />
            </div>
        </div>
    );
}

// Infographic with Zoom/Download buttons
interface InfographicImageProps {
    src: string;
    alt: string;
}

function InfographicImage({ src, alt }: InfographicImageProps) {
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'PEA-Internship-Steps.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <>
            <div className="relative w-full rounded-lg overflow-hidden border border-gray-100 group">
                <Image
                    src={src}
                    alt={alt}
                    width={800}
                    height={400}
                    className="w-full h-auto"
                />
                
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
                    {/* Zoom button */}
                    <button
                        onClick={() => setIsViewerOpen(true)}
                        className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-all"
                        title="ขยาย"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                    </button>

                    {/* Download button */}
                    <button
                        onClick={handleDownload}
                        className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-all"
                        title="ดาวน์โหลด"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Image Viewer Modal */}
            <ImageViewer
                src={src}
                alt={alt}
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
            />
        </>
    );
}

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
            {/* เส้นบนให้ยาวชนขอบ card */}
            <div className="-mx-4 md:-mx-6 border-t border-gray-200" />

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 text-left"
            >
                <span className="font-semibold text-gray-900 text-xs md:text-base">
                    {question}
                </span>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : ""
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
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="pb-4 text-gray-600 text-sm">{children}</div>
            </div>
        </div>
    );
}


// FAQ Section Component
interface FAQSectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

function FAQSection({ icon, title, children }: FAQSectionProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[#F8EDF5] px-4 md:px-6 py-3 md:py-4 flex items-center gap-3">
                {icon}
                <h2 className="font-semibold text-gray-900 text-lg md:text-xl">{title}</h2>
            </div>
            {/* Content */}
            <div className="px-4 md:px-6">{children}</div>
        </div>
    );
}

// Icons
const DocumentIcon = () => (
    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#F0DBEC] flex items-center justify-center">
        <svg
            className="w-4 h-4 md:w-5 md:h-5 text-primary-600"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M9 18H15C15.2833 18 15.5208 17.9042 15.7125 17.7125C15.9042 17.5208 16 17.2833 16 17C16 16.7167 15.9042 16.4792 15.7125 16.2875C15.5208 16.0958 15.2833 16 15 16H9C8.71667 16 8.47917 16.0958 8.2875 16.2875C8.09583 16.4792 8 16.7167 8 17C8 17.2833 8.09583 17.5208 8.2875 17.7125C8.47917 17.9042 8.71667 18 9 18ZM9 14H15C15.2833 14 15.5208 13.9042 15.7125 13.7125C15.9042 13.5208 16 13.2833 16 13C16 12.7167 15.9042 12.4792 15.7125 12.2875C15.5208 12.0958 15.2833 12 15 12H9C8.71667 12 8.47917 12.0958 8.2875 12.2875C8.09583 12.4792 8 12.7167 8 13C8 13.2833 8.09583 13.5208 8.2875 13.7125C8.47917 13.9042 8.71667 14 9 14ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H13.175C13.4417 2 13.6958 2.05 13.9375 2.15C14.1792 2.25 14.3917 2.39167 14.575 2.575L19.425 7.425C19.6083 7.60833 19.75 7.82083 19.85 8.0625C19.95 8.30417 20 8.55833 20 8.825V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 8V4H6V20H18V9H14C13.7167 9 13.4792 8.90417 13.2875 8.7125C13.0958 8.52083 13 8.28333 13 8Z" />
        </svg>
    </div>
);

const GraduationCapIcon = () => (
    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#F0DBEC] flex items-center justify-center">
        <svg
            className="w-4 h-4 md:w-5 md:h-5 text-primary-600"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z" />
        </svg>
    </div>
);

export default function FAQsPage() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        // ใช้ authStorage เพื่อเช็ค login state จาก API session
        const checkAuth = () => {
            const isAuth = authStorage.isAuthenticated();
            setIsLoggedIn(isAuth);
        };
        checkAuth();
    }, []);

    // แสดง loading ขณะเช็ค auth เพื่อป้องกันการกระพริบ
    if (isLoggedIn === null) {
        return (
            <div className="min-h-screen bg-white">
                <div className="h-16 bg-white border-b border-gray-100" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {isLoggedIn ? <NavbarIntern /> : <Navbar />}

            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                {/* Header */}
                <div className="text-center mb-8 md:mb-10">
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
                        คำถามที่พบบ่อย
                    </h1>
                    <p className="text-gray-500 text-base md:text-lg">
                        รวมคำถามและคำตอบที่พบบ่อยเกี่ยวกับการสมัครฝึกงาน
                    </p>
                </div>

                {/* FAQ Sections */}
                <div className="flex flex-col gap-8 md:gap-10">
                    {/* Application & Documents */}
                    <FAQSection icon={<DocumentIcon />} title="การสมัครและเอกสาร">
                        <FAQItem question="ขั้นตอนการสมัครงาน?">
                            <div className="w-full flex justify-center">
                                <InfographicImage
                                    src="/images/Infographic step.png"
                                    alt="ขั้นตอนการสมัคร PEA Internship"
                                />
                            </div>
                        </FAQItem>
                        <FAQItem question="เอกสารที่ต้องใช้?">
                            <div className="space-y-2">
                                <p>เอกสารที่ต้องเตรียมสำหรับการสมัครฝึกงาน:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Transcript (ใบแสดงผลการเรียน)</li>
                                    <li>เอกสารขอความอนุเคราะห์จากสถาบันการศึกษา</li>
                                    <li>Portfolio (หากกองงานต้องการ)</li>
                                    <li>Resume (หากกองงานต้องการ)</li>
                                </ul>
                            </div>
                        </FAQItem>
                    </FAQSection>

                    {/* Qualifications */}
                    <FAQSection icon={<GraduationCapIcon />} title="คุณสมบัติผู้สมัคร">
                        <FAQItem question="นักศึกษาสาขาใดบ้างที่สามารถสมัครได้?">
                            <p>
                                สาขาที่เปิดรับ ได้แก่ วิศวกรรมไฟฟ้า, วิศวกรรมคอมพิวเตอร์,
                                เทคโนโลยีสารสนเทศ, บัญชี, การเงิน, บริหารธุรกิจ, นิติศาสตร์,
                                และสาขาอื่นๆ ที่เกี่ยวข้อง
                                ขึ้นอยู่กับตำแหน่งที่เปิดรับในแต่ละปี
                            </p>
                        </FAQItem>
                        <FAQItem question="ต้องมีเกรดเฉลี่ยขั้นต่ำเท่าไหร่?">
                            <p>
                                เกรดเฉลี่ยสะสมขั้นต่ำ 2.50 ขึ้นไป อย่างไรก็ตาม
                                บางตำแหน่งอาจมีเกณฑ์ที่สูงกว่านี้
                                กรุณาตรวจสอบรายละเอียดในประกาศรับสมัครแต่ละรอบ
                            </p>
                        </FAQItem>
                        <FAQItem question="รับนักศึกษาชั้นปีไหนบ้าง?">
                            <p>
                                รับนักศึกษาชั้นปีที่ 3 และปีที่ 4
                                ที่กำลังศึกษาอยู่ในระดับปริญญาตรี
                                และมีหน่วยกิตสะสมไม่ต่ำกว่าที่มหาวิทยาลัยกำหนด
                            </p>
                        </FAQItem>
                    </FAQSection>
                </div>
            </main>
        </div>
    );
}
