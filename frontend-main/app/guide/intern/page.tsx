import Link from "next/link";

const cards = [
  {
    href: "/guide/intern/basic",
    title: "ระบบเบื้องต้น",
    desc: "เป็นพื้นฐานที่สำคัญในการใช้งานระบบ PEA Internship",
  },
  {
    href: "/guide/intern/howto",
    title: "คู่มืออธิบายการใช้งานระบบของผู้สมัครฝึกงาน",
    desc: "แนะนำขั้นตอนการใช้งานตั้งแต่สมัครจนถึงกระบวนการฝึกงาน",
  },
  {
    href: "/guide/intern/status",
    title: "การติดตามสถานะการสมัคร",
    desc: "ตรวจสอบสถานะการสมัครและรับแจ้งเตือนผ่านอีเมลและในระบบ",
  },
  {
    href: "/guide/intern/itt",
    title: "ระบบ ITT สำหรับนักศึกษาฝึกงาน",
    desc: "ระบบสำหรับเวลาลงทะเบียน-ออกงาน ใช้งานหลังผ่านการคัดเลือก",
  },
];

export default function ApplicantGuidePage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/guide" className="hover:text-primary-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700">วิธีการใช้งานระบบ PEA Internship ผู้สมัคร</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        วิธีการใช้งานระบบ PEA Internship ผู้สมัคร
      </h1>
      <p className="text-gray-600 mb-10 text-base leading-relaxed max-w-2xl">
        ยินดีต้อนรับสู่คู่มือการใช้งานระบบรับสมัครนักศึกษาฝึกงานของการไฟฟ้าส่วนภูมิภาค (PEA Internship)
        สำหรับผู้สมัครฝึกงาน ระบบนี้ถูกพัฒนาขึ้นเพื่ออำนวยความสะดวกให้กับนักศึกษาในการค้นหาตำแหน่งฝึกงาน
        สมัครงาน ติดตามสถานะ และดำเนินการตามขั้นตอนต่าง ๆ ได้อย่างครบถ้วนภายในระบบเดียว
      </p>

      <h2 className="text-lg font-bold text-gray-900 mb-4">เนื้อหาในคู่มือนี้</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all"
          >
            {/* Document icon */}
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1.5 leading-snug">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
            </div>

            <div className="flex items-center gap-1 text-sm text-primary-600 font-medium group-hover:gap-2 transition-all">
              อ่านคู่มือ
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
