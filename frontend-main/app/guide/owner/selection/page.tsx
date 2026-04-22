import Link from "next/link";

export default function StaffSelectionPage() {
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
        <span className="text-gray-700 font-medium">การคัดเลือกผู้สมัคร</span>
      </div>

      {/* On-page navigation */}
      <div className="flex flex-wrap gap-2 mb-10 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm text-gray-500 mr-1 font-medium">ในหน้านี้:</span>
        {[
          { id: "manage", label: "การจัดการผู้สมัคร" },
          { id: "steps", label: "ขั้นตอนการคัดเลือกผู้สมัคร" },
        ].map((item) => (
          <a key={item.id} href={`#${item.id}`} className="text-sm text-primary-600 hover:underline">
            {item.label}
          </a>
        ))}
      </div>

      {/* ── การจัดการผู้สมัคร ── */}
      <section id="manage" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">การจัดการผู้สมัคร</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          เมื่อมีผู้สมัครเข้ามาในตำแหน่งที่เปิดรับ Owner สามารถตรวจสอบรายชื่อผู้สมัครและข้อมูลต่าง ๆ ได้ผ่านระบบ เช่น
        </p>
        <ul className="space-y-2 ml-2">
          {[
            "ข้อมูลส่วนตัวของผู้สมัคร",
            "เอกสารที่แนบ (เช่น Transcript, Portfolio และ Resume)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-gray-600">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── ขั้นตอนการคัดเลือกผู้สมัคร ── */}
      <section id="steps" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ขั้นตอนการคัดเลือกผู้สมัคร</h2>
        <p className="text-gray-600 leading-relaxed mb-8">
          Owner มีหน้าที่ดำเนินการตามขั้นตอนต่าง ๆ ดังนี้
        </p>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">1</div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-lg font-bold text-gray-900 mb-2">ตรวจสอบเอกสาร <span className="text-base font-normal text-gray-500">(สถานะรอยื่นเอกสาร)</span></h3>
              <p className="text-gray-600 leading-relaxed">
                เมื่อผู้สมัครอัปโหลดเอกสารเข้ามา Owner จะต้องตรวจสอบความถูกต้องและความครบถ้วนของเอกสาร
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">2</div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-lg font-bold text-gray-900 mb-2">นัดสัมภาษณ์ <span className="text-base font-normal text-gray-500">(สถานะรอสัมภาษณ์)</span></h3>
              <p className="text-gray-600 leading-relaxed">
                หากเอกสารผ่านการตรวจสอบ Owner จะทำการติดต่อผู้สมัครเพื่อนัดหมายการสัมภาษณ์
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">3</div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-lg font-bold text-gray-900 mb-2">ยืนยันผลการสัมภาษณ์ <span className="text-base font-normal text-gray-500">(สถานะรอการยืนยัน)</span></h3>
              <p className="text-gray-600 leading-relaxed">
                หลังจากการสัมภาษณ์ Owner สามารถทำการบันทึกผลการสัมภาษณ์ โดยกดยืนยันผู้สมัครที่ได้รับการสัมภาษณ์
                เพื่อเป็นเครื่องหมายและจะเข้าสู่ขบวนการขั้นตอนถัดไป
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">4</div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-lg font-bold text-gray-900 mb-2">พิจารณารับเข้าฝึกงาน</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                ในขั้นตอนนี้ Owner สามารถตัดสินใจได้ว่าจะ
              </p>
              <ul className="space-y-2 ml-2">
                {["รับเข้าฝึกงาน", "ไม่รับเข้าฝึกงาน"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-600">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                ผู้สมัครที่ได้รับการยืนยันจะเข้าสู่ขั้นตอนการยื่นเอกสารขอความอนุเคราะห์ต่อไป
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">5</div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-lg font-bold text-gray-900 mb-2">ส่งต่อให้กองพัฒนาบุคลากร (Admin)</h3>
              <p className="text-gray-600 leading-relaxed">
                เมื่อผู้สมัครเข้าสู่สถานะ <span className="font-medium">รอยื่นเอกสารขอความอนุเคราะห์</span> ระบบจะส่งต่อกระบวนการไปยัง Admin
                โดย Owner จะไม่มีหน้าที่ดำเนินการเพิ่มเติมในขั้นตอนนี้
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation footer */}
      <div className="mt-4 flex justify-between items-center pt-8 border-t border-gray-200">
        <Link href="/guide/owner/howto" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          คู่มืออธิบายการใช้งานระบบของพนักงาน
        </Link>
        <Link href="/guide/owner/post-selection" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
          ขั้นตอนหลังการคัดเลือก
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
