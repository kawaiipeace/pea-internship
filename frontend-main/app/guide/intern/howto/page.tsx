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

export default function ApplicantHowtoPage() {
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
        <Link href="/guide/intern" className="hover:text-primary-600 transition-colors">
          วิธีการใช้งานระบบ PEA Internship ผู้สมัคร
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700 font-medium">คู่มืออธิบายการใช้งานระบบ</span>
      </div>

      {/* On-page navigation */}
      <div className="flex flex-wrap gap-2 mb-10 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm text-gray-500 mr-1 font-medium">ในหน้านี้:</span>
        {[
          { id: "jobs", label: "หน้าตำแหน่งฝึกงาน" },
          { id: "form", label: "หน้ากรอกข้อมูลการสมัคร" },
          { id: "process", label: "ขั้นตอนการประสานงาน" },
        ].map((item) => (
          <a key={item.id} href={`#${item.id}`} className="text-sm text-primary-600 hover:underline">
            {item.label}
          </a>
        ))}
      </div>

      {/* ── หน้าตำแหน่งฝึกงาน ── */}
      <section id="jobs" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">หน้าตำแหน่งฝึกงาน (หน้าหลัก)</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          เมื่อผู้สมัครเข้าสู่ระบบสำเร็จแล้ว ระบบจะนำผู้ใช้งานเข้าสู่ <span className="font-medium">หน้าตำแหน่งฝึกงาน</span> ซึ่งเป็นหน้าหลักของระบบ PEA Internship สำหรับผู้สมัครฝึกงาน
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          ในหน้านี้จะแสดง <span className="font-medium">การ์ดตำแหน่งฝึกงาน</span> ที่เปิดรับสมัครอยู่ในปัจจุบัน โดยในแต่ละการ์ดจะแสดงข้อมูลสำคัญเบื้องต้น เช่น ชื่อตำแหน่ง หน่วยงาน จำนวนที่รับ และระยะเวลาฝึกงาน
          เพื่อให้ผู้สมัครสามารถเลือกดูและพิจารณาตำแหน่งที่เหมาะสมได้อย่างสะดวก
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          นอกจากนี้ ระบบยังมีฟังก์ชัน <span className="font-medium">ช่องค้นหา</span> และ <span className="font-medium">กรองข้อมูล</span> เพื่อให้ผู้สมัครสามารถค้นหาตำแหน่งที่ต้องการได้รวดเร็วยิ่งขึ้น เช่น กรองตามสาขาวิชา ประเภทหน่วยงาน หรือช่วงเวลาฝึกงาน
        </p>
        <p className="text-gray-600 leading-relaxed mb-8">
          เมื่อผู้สมัครสนใจตำแหน่งใด สามารถกดปุ่ม <span className="font-medium">"สมัคร"</span> ที่อยู่บนการ์ดตำแหน่งนั้น เพื่อเข้าสู่หน้ากรอกข้อมูลการสมัครในขั้นตอนถัดไป
        </p>

        <div className="grid grid-cols-2 place-items-center gap-4 mb-8">
          <ZoomImage src="/images/คู่มือ/ปุ่มสมัคร.png" alt="หน้ากรอกข้อมูลการสมัคร" />
        </div>

      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── หน้ากรอกข้อมูลการสมัคร ── */}
      <section id="form" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">หน้ากรอกข้อมูลการสมัคร</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          เมื่อผู้สมัครกดปุ่ม <span className="font-medium">"สมัคร"</span> ในหน้าตำแหน่งฝึกงาน ระบบจะนำผู้สมัครเข้าสู่หน้าแบบฟอร์มกรอกข้อมูลการสมัคร
          ในหน้านี้ผู้สมัครจำเป็นต้องกรอกข้อมูลให้ครบถ้วน ได้แก่
        </p>
        <ul className="space-y-2 mb-6">
          {[
            "ระยะเวลาฝึกงาน",
            "จำนวนชั่วโมงฝึกงาน",
            "ทักษะและความสามารถของผู้สมัคร",
            "สิ่งที่คาดหวังจากการฝึกงาน",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-gray-600">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-600 mt-2" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-gray-600 leading-relaxed mb-8">
          เมื่อกรอกข้อมูลครบถ้วนแล้ว ผู้สมัครสามารถกดปุ่ม <span className="font-medium">"ยืนยัน"</span> เพื่อส่งใบสมัคร หรือกดปุ่ม <span className="font-medium">"ยกเลิก"</span> เพื่อยกเลิกการสมัครและกลับไปยังหน้าตำแหน่งฝึกงาน
        </p>

        <div className="grid grid-cols-2 place-items-center gap-4 mb-8">
          <ZoomImage src="/images/คู่มือ/กรอกข้อมูล.png" alt="หน้ากรอกข้อมูลการสมัคร" />
        </div>
      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── ขั้นตอนการประสานงาน ── */}
      <section id="process" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ขั้นตอนการประสานงานและดำเนินการสมัคร</h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          หลังจากที่ผู้สมัครส่งใบสมัครเรียบร้อยแล้ว ขั้นตอนต่อไปคือการประสานงานและดำเนินการสมัคร
          ซึ่งผู้สมัครจะต้องติดตามและดำเนินการตามสถานะที่เปลี่ยนแปลงไปในแต่ละขั้นตอน โดยในขั้นตอนนี้จะมีลำดับสถานะต่างๆ ดังนี้
        </p>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">สถานะ: รอยื่นเอกสาร</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                หลังจากที่ผู้สมัครกรอกข้อมูลใบสมัครครบถ้วน และส่งใบสมัครเรียบร้อยแล้ว สถานะจะเปลี่ยนเป็น "รอยื่นเอกสาร" ผู้สมัครจะต้องดำเนินการอัปโหลดเอกสารที่เกี่ยวข้องในระบบ
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">สถานะ: รอสัมภาษณ์</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                เมื่อเจ้าหน้าที่ตรวจสอบใบสมัครและเอกสารของผู้สมัครเรียบร้อยแล้ว สถานะจะเปลี่ยนเป็น "รอสัมภาษณ์" ผู้สมัครจะต้องติดต่อหน่วยงานเพื่อนัดหมายสัมภาษณ์
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">สถานะ: รอการยืนยัน</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                หลังจากที่ผู้สมัครผ่านการสัมภาษณ์แล้ว สถานะจะเปลี่ยนเป็น "รอการยืนยัน" ซึ่งหน่วยงานจะดำเนินการยืนยันผลการรับสมัคร และแจ้งผลให้ผู้สมัครทราบผ่านระบบ
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">4</div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">สถานะ: รอยื่นเอกสารขอความอนุเคราะห์</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                เมื่อหน่วยงานยืนยันการรับผู้สมัครแล้ว สถานะจะเปลี่ยนเป็น "รอยื่นเอกสารขอความอนุเคราะห์" ผู้สมัครจะต้องอัปโหลดเอกสารขอความอนุเคราะห์จากสถาบันการศึกษาในระบบ
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">5</div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">เสร็จสิ้นกระบวนการสมัคร</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                เมื่อผู้สมัครผ่านทุกขั้นตอนและเอกสารได้รับการอนุมัติครบถ้วนแล้ว กระบวนการสมัครจะเสร็จสิ้น ระบบจะแจ้งผลผ่านการแจ้งเตือน และผู้สมัครจะอยู่ในสถานะเตรียมพร้อมสำหรับการฝึกงาน
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation footer */}
      <div className="mt-4 flex justify-between items-center pt-8 border-t border-gray-200">
        <Link href="/guide/intern/basic" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ระบบเบื้องต้น
        </Link>
        <Link href="/guide/intern/status" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
          การติดตามสถานะ
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
