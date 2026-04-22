import Link from "next/link";

export default function ApplicantIttPage() {
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
        <span className="text-gray-700 font-medium">ระบบ iTT</span>
      </div>

      {/* On-page navigation */}
      <div className="flex flex-wrap gap-2 mb-10 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm text-gray-500 mr-1 font-medium">ในหน้านี้:</span>
        {[
          { id: "wait", label: "ระหว่างรอก่อนเริ่มฝึกงาน" },
          { id: "what", label: "iTT คืออะไร" },
        ].map((item) => (
          <a key={item.id} href={`#${item.id}`} className="text-sm text-primary-600 hover:underline">
            {item.label}
          </a>
        ))}
      </div>

      {/* ── ระหว่างรอก่อนเริ่มฝึกงาน ── */}
      <section id="wait" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ระหว่างรอก่อนเริ่มฝึกงาน</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          เมื่อผู้สมัครดำเนินการสมัครครบทุกขั้นตอน และได้รับการอนุมัติเรียบร้อยแล้ว (สถานะผ่านทั้งหมด)
          ระบบจะถือว่าผู้สมัครอยู่ในช่วง <span className="font-medium">รอเริ่มฝึกงาน</span>
        </p>
        <p className="text-gray-600 leading-relaxed">
          ในขั้นตอนนี้ ภายในระบบ PEA Internship จะมีการแสดงเมนูเพิ่มเติมสำหรับนักศึกษา คือ <span className="font-medium">"ระบบ iTT"</span> บริเวณแถบนำทางด้านบนของเว็บไซต์
          ซึ่งจะแสดงในทุกหน้าของผู้ใช้งานฝั่งนักศึกษา*
        </p>
      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── iTT คืออะไร ── */}
      <section id="what" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">iTT คืออะไร</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          <span className="font-medium">ITT (Internship Time Tracking)</span> คือระบบสำหรับบันทึกเวลาเข้า-ออกงานของนักศึกษาฝึกงาน
          เปรียบเสมือนการลงเวลาปฏิบัติงาน (Time Attendance) โดยนักศึกษาจะต้องใช้ระบบนี้ในการ
        </p>
        <ul className="space-y-2 mb-6">
          {[
            "เช็คชื่อเข้า-ออกงาน",
            "บันทึกเวลาการปฏิบัติงานในแต่ละวัน",
            "ติดตามประวัติการลงเวลา",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-gray-600">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-600 mt-2" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-gray-600 leading-relaxed mb-6">
          ระบบ ITT ถือเป็นส่วนสำคัญของการฝึกงาน เนื่องจากใช้ในการติดตามวินัยและระยะเวลาการปฏิบัติงานของนักศึกษา
          ทางหน่วยงานและผู้ดูแลระบบจะสามารถตรวจสอบข้อมูลการลงเวลาได้ ดังนั้นนักศึกษาจึงต้องดำเนินการลงเวลาอย่างสม่ำเสมอและตรงต่อเวลา
        </p>
        <p className="text-xs text-gray-400 italic">
          *เมนู iTT จะปรากฏเฉพาะผู้ที่ผ่านการคัดเลือกและอยู่ในสถานะเตรียมฝึกงานเท่านั้น
        </p>
      </section>

      {/* Navigation footer */}
      <div className="mt-4 flex justify-between items-center pt-8 border-t border-gray-200">
        <Link href="/guide/applicant/status" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          การติดตามสถานะ
        </Link>
        <Link href="/guide" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
          กลับหน้าหลักคู่มือ
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
