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

export default function StaffPostSelectionPage() {
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
        <span className="text-gray-700 font-medium">ขั้นตอนหลังการคัดเลือก</span>
      </div>

      {/* On-page navigation */}
      <div className="flex flex-wrap gap-2 mb-10 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm text-gray-500 mr-1 font-medium">ในหน้านี้:</span>
        {[
          { id: "steps", label: "ขั้นตอนหลังการคัดเลือก" },
          { id: "track", label: "การติดตามและจัดการนักศึกษา" },
          { id: "cancel", label: "การยกเลิกการฝึกงาน" },
        ].map((item) => (
          <a key={item.id} href={`#${item.id}`} className="text-sm text-primary-600 hover:underline">
            {item.label}
          </a>
        ))}
      </div>

      {/* ── ขั้นตอนหลังการคัดเลือก ── */}
      <section id="steps" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ขั้นตอนหลังการคัดเลือก</h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          หลังจากที่ผู้สมัครผ่านการคัดเลือกและเอกสารขอความอนุเคราะห์ได้รับการอนุมัติเรียบร้อยแล้ว Owner
          จะมีหน้าที่สำคัญในขั้นตอนสุดท้าย คือ
        </p>
        <ul className="space-y-3 ml-2">
          {[
            "ดำเนินการส่งเอกสารรับนักศึกษาฝึกงานผ่านระบบ DDOC",
            "ส่งเอกสารไปยังหน่วยงานที่กองพัฒนาบุคลากร (กพค.)",
            "ดำเนินการให้เสร็จสิ้น ก่อนวันเริ่มฝึกงานอย่างน้อย 15 วัน",
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-gray-600">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── การติดตามและจัดการนักศึกษา ── */}
      <section id="track" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">การติดตามและจัดการนักศึกษา</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Owner สามารถติดตามสถานะของผู้สมัครแต่ละคนได้ตลอดกระบวนการผ่านระบบ เช่น
        </p>
        <ul className="space-y-2 ml-2">
          {[
            "ตรวจสอบสถานะปัจจุบัน",
            "ดูประวัติการดำเนินการ",
            "ตรวจสอบจำนวนผู้สมัครและจำนวนที่รับ",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-gray-600">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── การยกเลิกการฝึกงาน ── */}
      <section id="cancel" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">การยกเลิกการฝึกงาน</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          ในกรณีที่นักศึกษามีพฤติกรรมไม่เหมาะสม หรือไม่เป็นไปตามเงื่อนไข Owner สามารถดำเนินการ
          <span className="font-medium"> ยกเลิกการฝึกงาน</span> ผ่านระบบได้
        </p>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-800 leading-relaxed">
              การดำเนินการดังกล่าวควรพิจารณาอย่างรอบคอบ และเป็นไปตามระเบียบของหน่วยงาน
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 place-items-center gap-4 mb-8">
          <ZoomImage src="/images/guideline/postselection.png" alt="การยกเลิกการฝึกงานOwner" />
        </div>
      </section>

      {/* Navigation footer */}
      <div className="mt-4 flex justify-between items-center pt-8 border-t border-gray-200">
        <Link href="/guide/owner/selection" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          การคัดเลือกผู้สมัคร
        </Link>
        <Link href="/guide/owner/dashboard" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
          แดชบอร์ดสำหรับพนักงาน
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
