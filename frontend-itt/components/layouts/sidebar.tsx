'use client';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { toggleSidebar } from '@/store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '@/store';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
    const dispatch = useDispatch();
    const pathname = usePathname();
    const [currentMenu, setCurrentMenu] = useState<string>('attendance');
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);

    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        setActiveRoute();
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [pathname]);

    const setActiveRoute = () => {
        let allLinks = document.querySelectorAll('.sidebar ul a.active');
        for (let i = 0; i < allLinks.length; i++) {
            const element = allLinks[i];
            element?.classList.remove('active');
        }
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        selector?.classList.add('active');
    };

    const isActive = (path: string) => pathname === path;

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="flex h-full flex-col bg-white dark:bg-black">
                    {/* ===== Header: Hamburger + PEATT Logo ===== */}
                    <div className="flex items-center gap-3 px-4 pb-3.5 pt-[18px]">
                        {/* Hamburger Icon */}
                        <button
                            type="button"
                            onClick={() => dispatch(toggleSidebar())}
                            className="flex flex-col justify-center gap-[5px] border-none bg-transparent p-1 cursor-pointer"
                        >
                            <span className="block h-[2.5px] w-6 rounded-sm bg-gray-500" />
                            <span className="block h-[2.5px] w-6 rounded-sm bg-gray-500" />
                            <span className="block h-[2.5px] w-6 rounded-sm bg-gray-500" />
                        </button>

                        {/* PEATT Logo */}
                        <Link href="/" className="no-underline">
                            <span className="text-[28px] font-extrabold tracking-wide text-[#510E49]">
                                PEAiTT
                            </span>
                        </Link>
                    </div>

                    {/* ===== Role Label Bar ===== */}
                    <div className="mb-2 bg-[#F8F9FB] px-5 py-4">
                        <span className="text-[15.5px] font-bold text-[#222]">ผู้สมัครฝึกงาน</span>
                    </div>

                    {/* ===== Scrollable Menu ===== */}
                    <PerfectScrollbar className="relative flex-1">
                        <ul className="m-0 list-none p-0 pb-5">
                            {/* ========== การลงเวลาปฏิบัติงาน ========== */}
                            <li>
                                <button
                                    type="button"
                                    onClick={() => toggleMenu('attendance')}
                                    className="flex w-full cursor-pointer items-center gap-3.5 border-none bg-transparent px-5 py-3.5"
                                >
                                    {/* Clock Icon */}
                                    <svg
                                        className={`h-[26px] w-[26px] shrink-0 transition-colors duration-200 ${currentMenu === 'attendance' ? 'text-[#A80689]' : 'text-[#555]'}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span className={`flex-1 whitespace-nowrap text-left text-[15.5px] font-semibold transition-colors duration-200 ${currentMenu === 'attendance' ? 'text-[#A80689]' : 'text-[#333]'}`}>
                                        การลงเวลาปฏิบัติงาน
                                    </span>
                                    {/* Chevron */}
                                    <svg
                                        className={`h-5 w-5 shrink-0 transition-all duration-200 ${currentMenu === 'attendance' ? 'rotate-0 text-[#A80689]' : '-rotate-90 text-[#666]'}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'attendance' ? 'auto' : 0}>
                                    <ul className="m-0 list-none p-0">
                                        <li>
                                            <Link
                                                href="/student/check-in"
                                                className={`block py-3.5 pl-[62px] pr-5 no-underline transition-colors duration-200 ${isActive('/student/check-in')
                                                    ? 'bg-[#FEEBFB] text-[15px] font-medium text-[#A80689]'
                                                    : 'text-[15px] font-medium text-[#555] hover:bg-[#FEEBFB] hover:text-[#A80689]'
                                                    }`}
                                            >
                                                ลงเวลาเข้า-ออก
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/student/attendance-history"
                                                className={`block py-3.5 pl-[62px] pr-5 no-underline transition-colors duration-200 ${isActive('/student/attendance-history')
                                                    ? 'bg-[#FEEBFB] text-[15px] font-medium text-[#A80689]'
                                                    : 'text-[15px] font-medium text-[#555] hover:bg-[#FEEBFB] hover:text-[#A80689]'
                                                    }`}
                                            >
                                                ประวัติการลงเวลา
                                            </Link>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {/* ========== การลาปฏิบัติงาน ========== */}
                            <li>
                                <button
                                    type="button"
                                    onClick={() => toggleMenu('leave')}
                                    className="flex w-full cursor-pointer items-center gap-3.5 border-none bg-transparent px-5 py-3.5"
                                >
                                    {/* Calendar Icon */}
                                    <svg
                                        className={`h-[26px] w-[26px] shrink-0 transition-colors duration-200 ${currentMenu === 'leave' ? 'text-[#A80689]' : 'text-[#555]'}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span className={`flex-1 text-left text-[15.5px] font-semibold transition-colors duration-200 ${currentMenu === 'leave' ? 'text-[#A80689]' : 'text-[#333]'}`}>
                                        การลาปฏิบัติงาน
                                    </span>
                                    {/* Chevron */}
                                    <svg
                                        className={`h-5 w-5 shrink-0 transition-all duration-200 ${currentMenu === 'leave' ? 'rotate-0 text-[#A80689]' : '-rotate-90 text-[#666]'}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'leave' ? 'auto' : 0}>
                                    <ul className="m-0 list-none p-0">
                                        <li>
                                            <Link
                                                href="/student/leave-history"
                                                className={`block py-3.5 pl-[62px] pr-5 no-underline transition-colors duration-200 ${isActive('/student/leave-history')
                                                    ? 'bg-[#FEEBFB] text-[15px] font-medium text-[#A80689]'
                                                    : 'text-[15px] font-medium text-[#555] hover:bg-[#FEEBFB] hover:text-[#A80689]'
                                                    }`}
                                            >
                                                ประวัติการลา
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/student/leave-request"
                                                className={`block py-3.5 pl-[62px] pr-5 no-underline transition-colors duration-200 ${isActive('/student/leave-request')
                                                    ? 'bg-[#FEEBFB] text-[15px] font-medium text-[#A80689]'
                                                    : 'text-[15px] font-medium text-[#555] hover:bg-[#FEEBFB] hover:text-[#A80689]'
                                                    }`}
                                            >
                                                ส่งคำขอการลา
                                            </Link>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
