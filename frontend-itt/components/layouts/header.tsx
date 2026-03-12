'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { IRootState } from '@/store';
import { toggleSidebar } from '@/store/themeConfigSlice';
import Dropdown from '@/components/dropdown';
import IconMenu from '@/components/icon/icon-menu';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconBellBing from '@/components/icon/icon-bell-bing';
import IconUser from '@/components/icon/icon-user';
import IconLogout from '@/components/icon/icon-logout';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import { usePathname } from 'next/navigation';

const Header = () => {
    const pathname = usePathname();
    const dispatch = useDispatch();

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            profile: 'user-profile.jpeg',
            message: '<strong class="text-sm mr-1">John Doe</strong>invite you to <strong>Prototyping</strong>',
            time: '45 min ago',
        },
        {
            id: 2,
            profile: 'profile-34.jpeg',
            message: '<strong class="text-sm mr-1">Adam Nolan</strong>mentioned you to <strong>UX Basics</strong>',
            time: '9h Ago',
        },
        {
            id: 3,
            profile: 'profile-16.jpeg',
            message: '<strong class="text-sm mr-1">Anna Morgan</strong>Upload a file',
            time: '9h Ago',
        },
    ]);

    const removeNotification = (value: number) => {
        setNotifications(notifications.filter((user) => user.id !== value));
    };

    return (
        <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
            <div className="shadow-sm">
                <div className="relative flex w-full items-center bg-white px-5 py-2.5 dark:bg-black">
                    {/* Mobile Logo + Burger */}
                    <div className="horizontal-logo flex items-center justify-between ltr:mr-2 rtl:ml-2 lg:hidden">
                        <Link href="/" className="main-logo flex shrink-0 items-center">
                            <img className="inline w-32 ltr:-ml-1 rtl:-mr-1" src="/assets/images/LogoiTT.svg" alt="logo" />
                    
                        </Link>
                        <button
                            type="button"
                            className="collapse-icon flex flex-none rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary ltr:ml-2 rtl:mr-2 dark:bg-dark/40 dark:text-[#d0d2d6] dark:hover:bg-dark/60 dark:hover:text-primary lg:hidden"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconMenu className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center space-x-1.5 ltr:ml-auto rtl:mr-auto rtl:space-x-reverse dark:text-[#d0d2d6] lg:space-x-2">
                        {/* Notification Bell */}
                        <div className="dropdown shrink-0">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="relative block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                                button={
                                    <span>
                                        <IconBellBing />
                                        <span className="absolute top-0 flex h-3 w-3 ltr:right-0 rtl:left-0">
                                            <span className="absolute -top-[3px] inline-flex h-full w-full animate-ping rounded-full bg-success/50 opacity-75 ltr:-left-[3px] rtl:-right-[3px]"></span>
                                            <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-success"></span>
                                        </span>
                                    </span>
                                }
                            >
                                <ul className="w-[300px] divide-y !py-0 text-dark dark:divide-white/10 dark:text-white-dark sm:w-[350px]">
                                    <li onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between px-4 py-2 font-semibold">
                                            <h4 className="text-lg">การแจ้งเตือน</h4>
                                            {notifications.length ? <span className="badge bg-primary/80">{notifications.length} ใหม่</span> : ''}
                                        </div>
                                    </li>
                                    {notifications.length > 0 ? (
                                        <>
                                            {notifications.map((notification) => {
                                                return (
                                                    <li key={notification.id} className="dark:text-white-light/90" onClick={(e) => e.stopPropagation()}>
                                                        <div className="group flex items-center px-4 py-2">
                                                            <div className="grid place-content-center rounded">
                                                                <div className="relative h-12 w-12">
                                                                    <img className="h-12 w-12 rounded-full object-cover" alt="profile" src={`/assets/images/${notification.profile}`} />
                                                                    <span className="absolute bottom-0 right-[6px] block h-2 w-2 rounded-full bg-success"></span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-auto ltr:pl-3 rtl:pr-3">
                                                                <div className="ltr:pr-3 rtl:pl-3">
                                                                    <h6
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: notification.message,
                                                                        }}
                                                                    ></h6>
                                                                    <span className="block text-xs font-normal dark:text-gray-500">{notification.time}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="text-neutral-300 opacity-0 hover:text-danger group-hover:opacity-100 ltr:ml-auto rtl:mr-auto"
                                                                    onClick={() => removeNotification(notification.id)}
                                                                >
                                                                    <IconXCircle />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                            <li>
                                                <div className="p-4">
                                                    <button className="btn btn-primary btn-small block w-full">ดูการแจ้งเตือนทั้งหมด</button>
                                                </div>
                                            </li>
                                        </>
                                    ) : (
                                        <li onClick={(e) => e.stopPropagation()}>
                                            <button type="button" className="!grid min-h-[200px] place-content-center text-lg hover:!bg-transparent">
                                                <div className="mx-auto mb-4 rounded-full ring-4 ring-primary/30">
                                                    <IconInfoCircle fill={true} className="h-10 w-10 text-primary" />
                                                </div>
                                                ไม่มีการแจ้งเตือน
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </Dropdown>
                        </div>

                        {/* Profile Icon */}
                        <div className="dropdown flex shrink-0">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="relative group block"
                                button={<img className="h-9 w-9 rounded-full object-cover saturate-50 group-hover:saturate-100" src="/assets/images/user-profile.jpeg" alt="userProfile" />}
                            >
                                <ul className="w-[230px] !py-0 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                                    <li>
                                        <div className="flex items-center px-4 py-4">
                                            <img className="h-10 w-10 rounded-md object-cover" src="/assets/images/user-profile.jpeg" alt="userProfile" />
                                            <div className="truncate ltr:pl-4 rtl:pr-4">
                                                <h4 className="text-base">
                                                    สมใจ ใฝ่ฝัน
                                                </h4>
                                                <button type="button" className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white">
                                                    นักศึกษาฝึกงาน
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <Link href="/student/profile" className="dark:hover:text-white">
                                            <IconUser className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                            โปรไฟล์
                                        </Link>
                                    </li>
                                    <li className="border-t border-white-light dark:border-white-light/10">
                                        <Link href="/auth/boxed-signin" className="!py-3 text-danger">
                                            <IconLogout className="h-4.5 w-4.5 shrink-0 rotate-90 ltr:mr-2 rtl:ml-2" />
                                            ออกจากระบบ
                                        </Link>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
