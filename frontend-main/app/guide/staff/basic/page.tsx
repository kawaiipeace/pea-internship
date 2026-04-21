import Link from "next/link";

export default function StaffBasicPage() {
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
        <span className="text-gray-700 font-medium">ระบบเบื้องต้น</span>
      </div>

      {/* On-page navigation */}
      <div className="flex flex-wrap gap-2 mb-10 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm text-gray-500 mr-1 font-medium">ในหน้านี้:</span>
        {[
          { id: "login", label: "การเข้าสู่ระบบ" },
          { id: "logout", label: "การออกจากระบบ" },
          { id: "report", label: "แจ้งปัญหาการใช้งาน" },
        ].map((item) => (
          <a key={item.id} href={`#${item.id}`} className="text-sm text-primary-600 hover:underline">
            {item.label}
          </a>
        ))}
      </div>

      {/* ── การเข้าสู่ระบบ ── */}
      <section id="login" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">การเข้าสู่ระบบ</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          การเข้าสู่ระบบ เป็นขั้นตอนในการยืนยันตัวตนเพื่อเข้าใช้งานระบบ PEA Internship เพื่อยืนยันตัวตนและสิทธิ์ในการเข้าถึงข้อมูลของผู้ใช้งาน
          โดยระบบถูกออกแบบมาให้มีความปลอดภัยและใช้งานง่าย เพื่อให้ผู้ใช้สามารถเริ่มต้นสร้างหรือจัดการแบบฟอร์มได้อย่างรวดเร็วผ่านบัญชีผู้ใช้งานที่ได้รับอนุมัติ
        </p>

        <p className="text-sm font-semibold text-gray-800 mb-2">วิธีการเข้าสู่ระบบ</p>
        <p className="text-gray-600 leading-relaxed mb-3">
          เมื่อผู้ใช้เข้าสู่เว็บไซต์ PEA Internship ในหน้าแรกของเว็บไซต์มี 2 ช่องทางในการเลือกเข้าระบบ ดังนี้
        </p>
        <ol className="space-y-2 mb-8">
          <li className="flex gap-3 text-gray-600">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">1</span>
            <span className="leading-relaxed">ถ้าผู้ใช้เป็นพนักงานการไฟฟ้าของ PEA ให้ผู้ใช้กดที่ปุ่ม <span className="font-medium">เข้าสู่ระบบพนักงาน PEA</span> เพื่อไปในหน้าเข้าสู่ระบบเว็บไซต์ของ PEA SSO</span>
          </li>
          <li className="flex gap-3 text-gray-600">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">2</span>
            <span className="leading-relaxed">ถ้าผู้ใช้เป็นผู้สมัครฝึกงาน ให้ผู้ใช้กดที่ปุ่ม <span className="font-medium">เข้าสู่ระบบผู้สมัคร</span> เพื่อไปในหน้าเข้าสู่ระบบเว็บไซต์ของ PEA Internship ที่เป็นการเข้าสู่ระบบของผู้สมัครฝึกงานโดยเฉพาะ</span>
          </li>
        </ol>

        <h3 className="text-lg font-bold text-gray-900 mb-3">หน้าเข้าสู่ระบบของพนักงาน PEA</h3>
        <p className="text-gray-600 leading-relaxed mb-8">
          ถ้าผู้ใช้เป็นพนักงานการไฟฟ้าของ PEA หลังจากที่กดปุ่ม เข้าสู่ระบบแล้วจะเจอกับหน้าการเข้าสู่ระบบของพนักงาน PEA
          ผู้ใช้สามารถลงชื่อเข้าใช้งานด้วยบัญชี PEA ได้โดยการกรอกข้อมูลที่ช่อง <span className="font-medium">รหัสพนักงาน (Username)</span> หรือ{" "}
          <span className="font-medium">อีเมล (Email)</span> และช่อง <span className="font-medium">รหัสผ่าน (Password)</span>{" "}
          จากนั้นเมื่อกรอกครบและตรวจสอบว่าถูกต้องแล้ว ให้กดปุ่ม <span className="font-medium">เข้าสู่ระบบ (Sign in)</span> เพื่อเข้าใช้งานเว็บไซต์ PEA Internship
        </p>

        <h3 className="text-lg font-bold text-gray-900 mb-3">หน้าเข้าสู่ระบบของผู้สมัครฝึกงาน</h3>
        <p className="text-gray-600 leading-relaxed">
          ถ้าผู้ใช้เป็นผู้สมัครฝึกงาน หลังจากที่กดปุ่ม เข้าสู่ระบบผู้สมัคร ผู้ใช้จำเป็นต้องสร้างบัญชีขึ้นมาก่อน
          โดยสามารถกดได้ตรงปุ่ม <span className="font-medium">ลงทะเบียน</span> หลังกรอกข้อมูลและสมัครเรียบร้อย ผู้สมัครสามารถนำเบอร์โทรศัพท์
          รหัสผ่านที่สมัครนำมากรอก เมื่อกรอกครบและตรวจสอบว่าถูกต้องแล้ว ให้กดปุ่ม <span className="font-medium">เข้าสู่ระบบ</span> เพื่อเข้าใช้งานเว็บไซต์ PEA Internship
        </p>
      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── การออกจากระบบ ── */}
      <section id="logout" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">การออกจากระบบ</h2>
        <p className="text-gray-600 leading-relaxed">
          การออกจากระบบ เป็นขั้นตอนสำคัญในการรักษาความปลอดภัยของบัญชีผู้ใช้งานและข้อมูลส่วนบุคคล
          เนื่องจากสิ้นการปฏิบัติงานในระบบ PEA Internship ผู้ใช้ควรดำเนินการออกจากระบบทุกครั้ง เพื่อป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต
          โดยเฉพาะอย่างยิ่งเมื่อมีการใช้งานผ่านอุปกรณ์สาธารณะ หรืออุปกรณ์ที่ใช้งานร่วมกับผู้อื่น
          ผู้ใช้สามารถไปที่รูปโปรไฟล์ที่มุมบนสุดด้านขวาของเว็บไซต์ กดเลือกไปที่{" "}
          <span className="font-medium">"ออกจากระบบ"</span> เพื่อออกกลับไปหน้าแรกของเว็บไซต์
        </p>
      </section>

      <hr className="border-gray-200 mb-12" />

      {/* ── แจ้งปัญหาการใช้งาน ── */}
      <section id="report" className="scroll-mt-24 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">แจ้งปัญหาการใช้งาน</h2>
        <p className="text-gray-600 leading-relaxed">
          หากผู้ใช้พบปัญหาหรือต้องการที่จะเสนอความคิดเห็นเพิ่มเติม สามารถแจ้งปัญหาการใช้งาน
          โดยกดไปที่รูปโปรไฟล์ที่มุมบนสุดด้านขวาของเว็บไซต์ กดเลือกไปที่{" "}
          <span className="font-medium">"แจ้งปัญหาการใช้งาน"</span>{" "}
          หลังจากนั้น จะเด้งไปหน้ากรอกฟอร์ม doc ผู้ใช้สามารถกรอกตามปัญหาที่พบได้เลย
          เพื่อที่ผู้พัฒนาสามารถแก้ปัญหาได้อย่างถูกจุด
        </p>
      </section>

      {/* Navigation footer */}
      <div className="mt-4 flex justify-between items-center pt-8 border-t border-gray-200">
        <Link href="/guide/staff" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          พนักงาน PEA
        </Link>
        <Link href="/guide/staff/howto" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
          คู่มืออธิบายการใช้งานระบบของพนักงาน
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
