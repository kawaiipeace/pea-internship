"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import NavbarPublic from "@/components/ui/NavbarPublic";
import NavbarIntern from "@/components/ui/NavbarIntern";
import OwnerNavbar from "@/components/ui/OwnerNavbar";
import AdminNavbar from "@/components/ui/AdminNavbar";
import VideoLoading from "@/components/ui/VideoLoading";
import { authStorage, userApi } from "@/services/api";

// ─── Navigation tree ───────────────────────────────────────────────
const sections = [
  {
    id: "overview",
    label: "คู่มือแนะนำการใช้งานระบบ\nPEA Internship",
    href: "/guide",
    children: [],
  },
  {
    id: "applicant",
    label: "วิธีการใช้งานระบบ\nPEA Internship ผู้สมัคร",
    href: "/guide/intern",
    children: [
      {
        id: "applicant-basic",
        label: "ระบบเบื้องต้น",
        href: "/guide/intern/basic",
        children: [
          { id: "applicant-basic-login", label: "การเข้าสู่ระบบ", href: "/guide/intern/basic#login" },
          { id: "applicant-basic-profile", label: "ข้อมูลผู้ใช้งาน", href: "/guide/intern/basic#profile" },
          { id: "applicant-basic-logout", label: "การออกจากระบบ", href: "/guide/intern/basic#logout" },
          { id: "applicant-basic-report", label: "แจ้งปัญหาการใช้งาน", href: "/guide/intern/basic#report" },
        ],
      },
      {
        id: "applicant-howto",
        label: "คู่มืออธิบายการใช้งานระบบ\nของผู้สมัครฝึกงาน",
        href: "/guide/intern/howto",
        children: [
          { id: "applicant-howto-jobs", label: "หน้าตำแหน่งฝึกงาน", href: "/guide/intern/howto#jobs" },
          { id: "applicant-howto-form", label: "หน้ากรอกข้อมูลการสมัคร", href: "/guide/intern/howto#form" },
          { id: "applicant-howto-process", label: "ขั้นตอนการประสานงานและดำเนินการสมัคร", href: "/guide/intern/howto#process" },
        ],
      },
      {
        id: "applicant-status",
        label: "การติดตามสถานะการสมัคร",
        href: "/guide/intern/status",
        children: [
          { id: "applicant-status-track", label: "การติดตามสถานะการสมัคร", href: "/guide/intern/status#track" },
          { id: "applicant-status-notify", label: "การแจ้งเตือนสถานะการสมัคร", href: "/guide/intern/status#notify" },
        ],
      },
      {
        id: "applicant-itt",
        label: "ระบบ ITT สำหรับนักศึกษาฝึกงาน",
        href: "/guide/intern/itt",
        children: [
          { id: "applicant-itt-wait", label: "ระหว่างรอก่อนเริ่มฝึกงาน", href: "/guide/intern/itt#wait" },
          { id: "applicant-itt-what", label: "iTT คืออะไร", href: "/guide/intern/itt#what" },
        ],
      },
    ],
  },
  {
    id: "staff",
    label: "วิธีการใช้งานระบบ\nPEA Internship พนักงาน",
    href: "/guide/owner",
    children: [
      {
        id: "staff-basic",
        label: "ระบบเบื้องต้น",
        href: "/guide/owner/basic",
        children: [
          { id: "staff-basic-login", label: "การเข้าสู่ระบบ", href: "/guide/owner/basic#login" },
          { id: "staff-basic-logout", label: "การออกจากระบบ", href: "/guide/owner/basic#logout" },
          { id: "staff-basic-report", label: "แจ้งปัญหาการใช้งาน", href: "/guide/owner/basic#report" },
        ],
      },
      {
        id: "staff-howto",
        label: "คู่มืออธิบายการใช้งานระบบ\nของพนักงาน",
        href: "/guide/owner/howto",
        children: [
          { id: "staff-howto-owner", label: "ระบบสำหรับพนักงาน", href: "/guide/owner/howto#owner" },
          { id: "staff-howto-create", label: "การสร้างประกาศรับสมัคร", href: "/guide/owner/howto#create" },
          { id: "staff-howto-edit", label: "การแก้ไขประกาศรับสมัคร", href: "/guide/owner/howto#edit" },
        ],
      },
      {
        id: "staff-selection",
        label: "การคัดเลือกผู้สมัคร",
        href: "/guide/owner/selection",
        children: [
          { id: "staff-selection-manage", label: "การจัดการผู้สมัคร", href: "/guide/owner/selection#manage" },
          { id: "staff-selection-steps", label: "ขั้นตอนการคัดเลือกผู้สมัคร", href: "/guide/owner/selection#steps" },
        ],
      },
      {
        id: "staff-post-selection",
        label: "ขั้นตอนหลังการคัดเลือก",
        href: "/guide/owner/post-selection",
        children: [
          { id: "staff-post-steps", label: "ขั้นตอนหลังการคัดเลือก", href: "/guide/owner/post-selection#steps" },
          { id: "staff-post-track", label: "การติดตามและจัดการนักศึกษา", href: "/guide/owner/post-selection#track" },
          { id: "staff-post-cancel", label: "การยกเลิกการฝึกงาน", href: "/guide/owner/post-selection#cancel" },
        ],
      },
      {
        id: "staff-dashboard",
        label: "แดชบอร์ดสำหรับพนักงาน",
        href: "/guide/owner/dashboard",
        children: [
          { id: "staff-dashboard-overview", label: "ภาพรวมข้อมูลการรับสมัคร", href: "/guide/owner/dashboard#overview" },
          { id: "staff-dashboard-list", label: "รายชื่อนักศึกษาฝึกงาน", href: "/guide/owner/dashboard#list" },
        ],
      },
    ],
  },
  {
    id: "admin",
    label: "วิธีการใช้งานระบบ\nPEA Internship แอดมิน",
    href: "/guide/admin",
    children: [
      {
        id: "admin-basic",
        label: "ระบบเบื้องต้น",
        href: "/guide/admin/basic",
        children: [
          { id: "admin-basic-login", label: "การเข้าสู่ระบบ", href: "/guide/admin/basic#login" },
          { id: "admin-basic-logout", label: "การออกจากระบบ", href: "/guide/admin/basic#logout" },
          { id: "admin-basic-report", label: "แจ้งปัญหาการใช้งาน", href: "/guide/admin/basic#report" },
        ],
      },
      {
        id: "admin-howto",
        label: "คู่มืออธิบายการใช้งานระบบ\nของแอดมิน",
        href: "/guide/admin/howto",
        children: [
          { id: "admin-howto-overview", label: "ระบบสำหรับแอดมิน", href: "/guide/admin/howto#overview" },
          { id: "admin-howto-duties", label: "หน้าที่ของแอดมิน", href: "/guide/admin/howto#duties" },
          { id: "admin-howto-role", label: "ระบบเปลี่ยน Role", href: "/guide/admin/howto#role" },
        ],
      },
      {
        id: "admin-dashboard",
        label: "แดชบอร์ดสำหรับแอดมิน",
        href: "/guide/admin/dashboard",
        children: [
          { id: "admin-dashboard-overview", label: "ภาพรวมข้อมูลการรับสมัคร", href: "/guide/admin/dashboard#overview" },
          { id: "admin-dashboard-data", label: "ข้อมูลหลักภายในแดชบอร์ด", href: "/guide/admin/dashboard#data" },
        ],
      },
    ],
  },
];

// ─── Types ──────────────────────────────────────────────────────────
type NavLeaf = { id: string; label: string; href: string };
type NavChild = NavLeaf & { children: NavLeaf[] };
type NavSection = NavLeaf & { children: NavChild[] };
type AnyNavItem = NavSection | NavChild | NavLeaf;

// ─── Sidebar item ───────────────────────────────────────────────────
function SidebarItem({
  section,
  level = 0,
  pathname,
}: {
  section: AnyNavItem;
  level?: number;
  pathname: string;
}) {
  // Use exact match for root /guide to avoid marking it active on all sub-pages
  const isActive =
    pathname === section.href ||
    (section.href !== "/guide" && pathname.startsWith(section.href + "/"));
  const hasChildren = "children" in section && section.children.length > 0;
  const [open, setOpen] = useState(isActive);

  const baseClass =
    level === 0
      ? `block w-full text-left px-4 py-3 text-sm font-semibold leading-snug transition-colors ${
          isActive ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:text-primary-600 hover:bg-primary-50"
        }`
      : `block w-full text-left px-4 py-2 text-sm leading-snug transition-colors ${
          isActive ? "text-primary-600 bg-primary-50 font-medium" : "text-gray-600 hover:text-primary-600 hover:bg-primary-50"
        }`;

  if (hasChildren) {
    return (
      <div>
        <div className={`${baseClass} flex items-start justify-between gap-2 pr-2`}>
          <Link
            href={section.href}
            className="flex-1 whitespace-pre-line text-left"
          >
            {section.label}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex-shrink-0 p-1 -mr-1 rounded hover:bg-primary-100 transition-colors"
            aria-label={open ? "ย่อ" : "ขยาย"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {open && (
          <div className={level === 0 ? "border-l-2 border-primary-100 ml-4" : "border-l border-gray-200 ml-4"}>
            {"children" in section &&
              (section.children as AnyNavItem[]).map((child) => (
                <SidebarItem key={child.id} section={child} level={level + 1} pathname={pathname} />
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={section.href}
      className={`${baseClass} whitespace-pre-line`}
      onClick={(e) => {
        // If the href has a hash and we're already on that page, smooth-scroll instead of navigating
        const hashIdx = section.href.indexOf("#");
        if (hashIdx !== -1) {
          const path = section.href.slice(0, hashIdx);
          const hash = section.href.slice(hashIdx + 1);
          if (pathname === path || pathname === path + "/") {
            e.preventDefault();
            document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }}
    >
      {section.label}
    </Link>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────
export default function GuideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      const loggedIn = authStorage.isAuthenticated();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        try {
          const profile = await userApi.getUserProfile();
          setRoleId(profile.roleId);
          authStorage.setUser(profile as never);
        } catch {
          const stored = authStorage.getUser();
          setRoleId(stored?.roleId ?? null);
        }
      }
      setMounted(true);
    };
    loadRole();
  }, []);

  if (!mounted) {
    return <VideoLoading message="กำลังโหลดคู่มือการใช้งาน..." />;
  }

  let Navbar;
  if (!isLoggedIn) {
    Navbar = <NavbarPublic />;
  } else if (roleId === 1 && pathname.startsWith("/guide/admin")) {
    Navbar = <AdminNavbar />;
  } else if (roleId === 1 || roleId === 2) {
    Navbar = <OwnerNavbar />;
  } else {
    Navbar = <NavbarIntern />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {Navbar}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 border-r border-gray-200 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="py-4">
            {(sections as AnyNavItem[]).map((s) => (
              <SidebarItem key={s.id} section={s} level={0} pathname={pathname} />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 py-8 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
