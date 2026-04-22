import Link from "next/link";

export default function StaffHowtoPage() {
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
        <Link href="/guide/staff" className="hover:text-primary-600 transition-colors">
          วิธีการใช้งานระบบ PEA Internship พนักงาน
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700 font-medium">คู่มืออธิบายการใช้งานระบบของพนักงาน</span>
      </div>

      {/* On-page navigation */}
      <div className="flex flex-wrap gap-2 mb-10 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm text-gray-500 mr-1 font-medium">ในหน้านี้:</span>
        {[
          { id: "owner", label: "ระบบสำหรับพนักงาน" },
          { id: "create", label: "การสร้างประกาศรับสมัคร" },
          { id: "edit", label: "การแก้ไขประกาศรับสมัคร" },
        ].map((item) => (
          <a key={item.id} href={`#${item.id}`} className="text-sm text-primary-600 hover:underline">
            {item.label}
          </a>
        ))}
      </div>

      {/* ── ระบบสำหรับพนักงาน ── */}
      <section id="owner" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ระบบสำหรับพนักงาน</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          ในระบบ PEA Internship นอกจากผู้สมัครแล้ว ยังมีผู้ใช้งานอีกประเภทหนึ่งคือ <span className="font-medium">Owner</span> ซึ่งเป็น
          เจ้าหน้าที่หรือพนักงานที่รับผิดชอบในการเปิดรับสมัครและดูแลนักศึกษาฝึกงานในแต่ละตำแหน่ง
        </p>
        <p className="text-gray-600 leading-relaxed">
          โดยหน้าที่หลักของ Owner คือ การสร้างประกาศรับสมัคร คัดเลือกผู้สมัคร และติดตามกระบวนการฝึกงานของนักศึกษา
        </p>
      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── การสร้างประกาศรับสมัคร ── */}
      <section id="create" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">การสร้างประกาศรับสมัคร</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Owner สามารถสร้างตำแหน่งฝึกงาน (Job Card) เพื่อเปิดรับสมัครนักศึกษาได้ โดยต้องกรอกรายละเอียดให้ครบถ้วนตามที่ระบบกำหนด เช่น
        </p>
        <ul className="space-y-2 mb-6 ml-2">
          {[
            "ชื่อตำแหน่งฝึกงาน",
            "สถานที่ปฏิบัติงาน",
            "จำนวนที่เปิดรับ",
            "คุณสมบัติผู้สมัคร",
            "รายละเอียดงาน",
            "ระยะเวลาเปิดรับสมัคร",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-gray-600">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-gray-600 leading-relaxed">
          เมื่อกรอกข้อมูลครบถ้วนแล้ว Owner สามารถกด <span className="font-medium">เผยแพร่ประกาศ</span> เพื่อให้ผู้สมัครที่สนใจเข้ามาสมัครได้
        </p>
      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── การแก้ไขประกาศรับสมัคร ── */}
      <section id="edit" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">การแก้ไขประกาศรับสมัคร</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Owner สามารถแก้ไขรายละเอียดของประกาศได้ โดยสามารถปรับข้อมูลต่าง ๆ เช่น
        </p>
        <ul className="space-y-2 mb-6 ml-2">
          {[
            "ชื่อตำแหน่ง",
            "จำนวนที่เปิดรับ",
            "ระยะเวลาเปิดรับสมัคร",
            "คุณสมบัติและรายละเอียดงาน",
            "สาขาวิชาที่เกี่ยวข้อง",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-gray-600">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-gray-600 leading-relaxed mb-3">
          รวมถึงสามารถเปลี่ยน <span className="font-medium">สถานะของประกาศ</span> ได้ เช่น
        </p>
        <ul className="space-y-2 mb-6 ml-2">
          {["เปิดรับสมัคร", "ปิดรับสมัคร"].map((item) => (
            <li key={item} className="flex items-start gap-2 text-gray-600">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-gray-600 leading-relaxed">
          การแก้ไขข้อมูลจะมีผลทันทีต่อผู้สมัครที่เข้ามาดูประกาศ
        </p>
      </section>

      {/* Navigation footer */}
      <div className="mt-4 flex justify-between items-center pt-8 border-t border-gray-200">
        <Link href="/guide/staff/basic" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ระบบเบื้องต้น
        </Link>
        <Link href="/guide/staff/selection" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
          การคัดเลือกผู้สมัคร
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
