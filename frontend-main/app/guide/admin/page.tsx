import Link from "next/link";

const cards = [
    {
        href: "/guide/admin/basic",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: "ระบบเบื้องต้น",
        desc: "แนะนำการเข้าสู่ระบบ การออกจากระบบ และการแจ้งปัญหาการใช้งาน",
    },
    {
        href: "/guide/admin/howto",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        title: "คู่มืออธิบายการใช้งานระบบของแอดมิน",
        desc: "แนะนำการใช้งานในส่วนของพนักงาน เช่น การตรวจเอกสาร และการกำหนดข้อมูลที่เกี่ยวข้อง",
    },
    {
        href: "/guide/admin/dashboard",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        title: "แดชบอร์ดสำหรับแอดมิน",
        desc: "แสดงข้อมูลสถิติภาพรวมของระบบ เช่น จำนวนผู้สมัคร จำนวนนักศึกษา หน่วยงาน และสาขาที่สมัครมากที่สุด",
    },
];

export default function AdminGuidePage() {
    return (
        <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/guide" className="hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-700">วิธีการใช้งานระบบ PEA Internship แอดมิน</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                วิธีการใช้งานระบบ PEA Internship แอดมิน
            </h1>

            <p className="text-gray-700 leading-relaxed mb-8">
                คู่มือนี้จัดทำขึ้นเพื่อแนะนำการใช้งานระบบสำหรับผู้ดูแลระบบ (Admin)
                ในการตรวจสอบเอกสาร จัดการผู้สมัคร ติดตามสถานะการสมัคร และดูข้อมูลภาพรวมในระบบ
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-2">เนื้อหาในคู่มือนี้</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {cards.map((card) => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className="group block border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all"
                    >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-3">{card.desc}</p>
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
