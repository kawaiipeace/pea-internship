'use client';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { toggleSidebar } from '@/store/themeConfigSlice';
import { IRootState } from '@/store';
import { useState, useEffect } from 'react';
import IconMenu from '@/components/icon/icon-menu';
import { usePathname } from 'next/navigation';
import { getTranslation } from '@/i18n';
import AnimateHeight from 'react-animate-height';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconSquareCheck from '@/components/icon/icon-square-check';
import IconUser from '@/components/icon/icon-user';
import IconClipboardText from '@/components/icon/icon-clipboard-text';

const Sidebar = () => {
    const dispatch = useDispatch();
    const { t } = getTranslation();
    const pathname = usePathname();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const adminRole = useSelector((state: IRootState) => state.themeConfig.adminRole);
    const isAdmin = adminRole === 'admin';

    const [currentMenu, setCurrentMenu] = useState<string>('');
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

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="h-full bg-white dark:bg-black">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <button
                            type="button"
                            className="collapse-icon flex h-8 w-8 items-center justify-center rounded-full transition duration-300 hover:bg-gray-500/10 dark:text-white-light dark:hover:bg-dark-light/10"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconMenu className="h-5 w-5 text-[#6B7280]" />
                        </button>
                        <Link href="/" className="main-logo flex shrink-0 items-center">
                            <img className="ml-[5px] w-32 flex-none" src="/assets/images/logo.svg" alt="logo" />
                        </Link>
                    </div>
                    <PerfectScrollbar className="relative h-[calc(100vh-80px)]">
                        <ul className="relative font-semibold">
                            {isAdmin ? (
                                <>
                                    <h2 className="flex items-center px-7 py-2 bg-gray-100 font-extrabold uppercase text-black dark:text-white-dark mt-0">
                                        <span>{t('แอดมิน')}</span>
                                    </h2>

                                    <li className="menu nav-item">
                                        <Link
                                            href="/admin"
                                            className={`${pathname === '/admin' ? '!bg-[#FDF2FD] !text-[#9A0D8A]' : 'text-black'} nav-link group w-full h-12 flex items-center p-2 hover:!bg-[#FDF2FD] hover:!text-[#9A0D8A] !rounded-none transition-colors`}
                                        >
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={pathname === '/admin' ? '#9A0D8A' : '#f3f4f6'} className="group-hover:!fill-[#9A0D8A] uppercase"><path d="M120-120v-240h320v240H120Zm400 0v-240h320v240H520Zm-320-80h160v-80H200v80Zm400 0h160v-80H600v80ZM120-440v-400h720v400H120Zm160 200Zm400 0Z" /></svg>
                                                <span className="ltr:pl-3 rtl:pr-3 font-bold group-hover:!text-[#9A0D8A]">{t('แดชบอร์ดนักศึกษา')}</span>
                                            </div>
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <h2 className="flex items-center px-7 py-2 bg-gray-100 font-extrabold uppercase text-black dark:text-white-dark mt-0">
                                        <span>{t('พี่เลี้ยง')}</span>
                                    </h2>

                                    <li className="menu nav-item">
                                        <button
                                            type="button"
                                            className={`${currentMenu === 'approval' ? 'active !bg-[#FDF2FD] !text-[#9A0D8A]' : 'text-black'} nav-link group w-full h-12 flex items-center p-2 hover:!bg-[#FDF2FD] hover:!text-[#9A0D8A] !rounded-none transition-colors`}
                                            onClick={() => toggleMenu('approval')}
                                        >
                                            <div className="flex items-center w-full">
                                                <IconSquareCheck className={`h-6 w-6 shrink-0 ${currentMenu === 'approval' ? 'text-[#9A0D8A]' : 'text-[#6B7280] group-hover:text-[#9A0D8A]'}`} />
                                                <span className="ltr:pl-3 rtl:pr-3 font-bold flex-1 text-left group-hover:!text-[#9A0D8A]">{t('การอนุมัติ')}</span>
                                                <IconCaretDown className={`h-4 w-4 transition-transform ${currentMenu === 'approval' ? 'rotate-180 text-[#9A0D8A]' : 'group-hover:text-[#9A0D8A]'}`} />
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'approval' ? 'auto' : 0}>
                                            <ul className="sub-menu text-[#6B7280] space-y-1 mt-1">

                                                <Link
                                                    href="/admin/mentor/approve"
                                                    className={`${pathname === '/admin/mentor/approve' ? '!bg-[#FDF2FD] !text-[#9A0D8A]' : 'hover:!text-[#9A0D8A]'} flex items-center w-full h-10 px-9 transition-colors !rounded-none !before:content-none`}
                                                >
                                                    <div className={`w-2 h-[2px] mr-3 rounded-full ${pathname === '/admin/mentor/approve' ? 'bg-[#9A0D8A]' : 'bg-gray-300'}`}></div>
                                                    <span className={pathname === '/admin/mentor/approve' ? 'font-bold' : ''}>{t('อนุมัติการลาและแก้ไขเวลา')}</span>
                                                </Link>

                                                <Link
                                                    href="/admin/mentor/approve/history"
                                                    className={`${pathname === '/admin/mentor/approve/history' ? '!bg-[#FDF2FD] !text-[#9A0D8A]' : 'hover:!text-[#9A0D8A]'} flex items-center w-full h-10 px-9 transition-colors !rounded-none !before:content-none`}
                                                >
                                                    <div className={`w-2 h-[2px] mr-3 rounded-full ${pathname === '/admin/mentor/approve/history' ? 'bg-[#9A0D8A]' : 'bg-gray-300'}`}></div>
                                                    <span className={pathname === '/admin/mentor/approve/history' ? 'font-bold' : ''}>{t('ประวัติการอนุมัติ')}</span>
                                                </Link>
                                            </ul>
                                        </AnimateHeight>
                                    </li>

                                    <li className="menu nav-item">
                                        <Link
                                            href="/admin/mentor/students"
                                            className={`${pathname === '/admin/mentor/students' ? '!bg-[#FDF2FD] !text-[#9A0D8A]' : 'text-black'} nav-link group w-full h-12 flex items-center p-2 hover:!bg-[#FDF2FD] hover:!text-[#9A0D8A] !rounded-none transition-colors`}
                                        >
                                            <div className="flex items-center">
                                                <IconUser className={`h-6 w-6 shrink-0 ${pathname === '/admin/mentor/students' ? 'text-[#9A0D8A]' : 'text-[#6B7280] group-hover:text-[#9A0D8A]'}`} />
                                                <span className="ltr:pl-3 rtl:pr-3 font-bold group-hover:!text-[#9A0D8A]">{t('นักศึกษาในดูแล')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="menu nav-item">
                                        <Link
                                            href="/admin/mentor/remote-work"
                                            className={`${pathname === '/admin/mentor/remote-work' ? '!bg-[#FDF2FD] !text-[#9A0D8A]' : 'text-black'} nav-link group w-full h-12 flex items-center p-2 hover:!bg-[#FDF2FD] hover:!text-[#9A0D8A] !rounded-none transition-colors`}
                                        >
                                            <div className="flex items-center">
                                                <IconClipboardText className={`h-6 w-6 shrink-0 ${pathname === '/admin/mentor/remote-work' ? 'text-[#9A0D8A]' : 'text-[#6B7280] group-hover:text-[#9A0D8A]'}`} />
                                                <span className="ltr:pl-3 rtl:pr-3 font-bold group-hover:!text-[#9A0D8A]">{t('ปฏิบัติงานนอกสถานที่')}</span>
                                            </div>
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
