import Link from "next/link";

const cards = [
  {
    href: "/guide/applicant",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    iconBg: "bg-pink-100 text-primary-600",
    title: "สำหรับผู้สมัครฝึกงาน",
    desc: "แนะนำขั้นตอนการสมัคร ค้นหาตำแหน่งฝึกงาน การยื่นเอกสาร และการดำเนินการตามขั้นตอนต่าง ๆ ได้อย่างครบถ้วนภายในระบบเดียว",
  },
  {
    href: "/guide/staff",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    iconBg: "bg-sky-100 text-sky-600",
    title: "สำหรับพนักงาน PEA",
    desc: "แนะนำการสร้างประกาศรับสมัคร การจัดการผู้สมัคร การคัดเลือก และการติดตามนักศึกษา",
  },
  {
    href: "/guide/admin",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    iconBg: "bg-pink-100 text-primary-600",
    title: "สำหรับผู้ดูแลระบบ",
    desc: "แนะนำการบริหารจัดการระบบ การกำหนดสิทธิ์ผู้ใช้งาน และการดูแลข้อมูลในภาพรวม",
  },
];

export default function GuidePage() {
  return (
    <div>
      {/* Breadcrumb */}
      <p className="text-sm text-primary-600 font-medium mb-4">
        คู่มือแนะนำการใช้งานระบบ PEA Internship
      </p>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        คู่มือแนะนำการใช้งานระบบ PEA Internship
      </h1>

      <p className="text-gray-700 leading-relaxed mb-2">
        ยินดีต้อนรับสู่คู่มือการใช้งานระบบรับสมัครนักศึกษาฝึกงานของการไฟฟ้าส่วนภูมิภาค (PEA Internship)
        ระบบนี้ถูกพัฒนาขึ้นเพื่ออำนวยความสะดวกให้กับผู้ใช้งานทุกฝ่าย
        ไม่ว่าจะเป็นผู้สมัครฝึกงาน เจ้าหน้าที่ผู้รับผิดชอบ (Owner) และผู้ดูแลระบบ (Admin)
        ให้สามารถดำเนินการสมัคร คัดเลือก และบริหารจัดการข้อมูลการฝึกงานได้อย่างมีประสิทธิภาพ
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">เลือกคู่มือตามบทบาทของคุณ</h2>
      <p className="text-gray-600 text-sm mb-6">
        เพื่อให้การใช้งานเป็นไปอย่างถูกต้องและเหมาะสมกับสิทธิ์ของผู้ใช้งาน
        กรุณาเลือกคู่มือให้ตรงกับบทบาทของคุณ ดังนี้
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-3 ${card.iconBg}`}>
              {card.icon}
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
            <span className="inline-block mt-3 text-primary-600 text-sm font-medium">
              อ่านคู่มือ →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
