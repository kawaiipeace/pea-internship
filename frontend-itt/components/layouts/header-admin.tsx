'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { IRootState } from '@/store';
import { toggleSidebar, setAdminRole } from '@/store/themeConfigSlice';
import Dropdown from '@/components/dropdown';
import IconMenu from '@/components/icon/icon-menu';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconBell from '@/components/icon/icon-bell';
import IconUser from '@/components/icon/icon-user';
import IconLogout from '@/components/icon/icon-logout';
import IconSettings from '@/components/icon/icon-settings';
import { usePathname, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import useAuthStore from '@/store/authStore';
import ImageWithAuth from '../ImageWithAuth';

const Header = () => {
    const pathname = usePathname();
    const dispatch = useDispatch();
    const router = useRouter();
    const logout = useAuthStore((state) => state.actionLogout);
    const fetchProfile = useAuthStore((state) => state.actionFetchProfile);
    const user = useAuthStore((state) => state.user);
    const fullName = user ? [user.fname, user.lname].filter(Boolean).join(' ') : 'Guest';
    const email = user?.email || '';

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);


    const handleLogout = async () => {
        try {
            logout().then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'ออกจากระบบสำเร็จ',
                    showConfirmButton: false,
                    timer: 1500,
                    customClass: {
                        popup: 'rounded-[20px]',
                    },
                });
                router.push('/login');
            });

        } catch (error) {
            document.cookie = 'better-auth.session_token=; path=/; max-age=0';
            document.cookie = 'user_role=; path=/; max-age=0';
            document.cookie = 'auth_token=; path=/; max-age=0';
            router.push('/login');

            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ แต่ระบบจะทำการออกจากระบบให้',
                customClass: {
                    popup: 'rounded-[20px]',
                    confirmButton: 'bg-[#9A0D8A] rounded-[10px]',
                },
            });
        }
    };

    useEffect(() => {
        const selector = document.querySelector('ul.horizontal-menu a[href="' + window.location.pathname + '"]');
        if (selector) {
            const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
            for (let i = 0; i < all.length; i++) {
                all[0]?.classList.remove('active');
            }

            let allLinks = document.querySelectorAll('ul.horizontal-menu a.active');
            for (let i = 0; i < allLinks.length; i++) {
                const element = allLinks[i];
                element?.classList.remove('active');
            }
            selector?.classList.add('active');

            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
                if (ele) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele?.classList.add('active');
                    });
                }
            }
        }
    }, [pathname]);

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


    const adminRole = useSelector((state: IRootState) => state.themeConfig.adminRole);
    const isAdmin = adminRole === 'admin';

    return (
        <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
            <div className="shadow-sm">
                <div className="relative flex w-full items-center bg-white px-5 py-2.5 dark:bg-black">
                    <div className={`flex items-center gap-3 ltr:mr-4 rtl:ml-4 ${themeConfig.sidebar ? 'flex' : 'lg:hidden'}`}>
                        <button
                            type="button"
                            className="collapse-icon flex flex-none rounded-full p-2 hover:bg-white-light/90 hover:text-primary dark:text-[#d0d2d6] dark:hover:bg-dark/60 dark:hover:text-primary"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconMenu className="h-5 w-5 text-[#6B7280]" />
                        </button>
                        <Link href="/" className="main-logo flex shrink-0 items-center">
                            <img className="inline w-32 flex-none" src="/assets/images/logo.svg" alt="logo" />
                        </Link>
                    </div>

                    <div className="flex items-center justify-center space-x-1.5 ltr:ml-auto rtl:mr-auto rtl:space-x-reverse dark:text-[#d0d2d6] lg:space-x-4">
                        <button
                            type="button"
                            onClick={() => {
                                const nextRole = isAdmin ? 'mentor' : 'admin';
                                dispatch(setAdminRole(nextRole));
                                router.push(nextRole === 'mentor' ? '/admin/mentor/approve' : '/admin');
                            }}
                            className="flex w-28 items-center gap-2 rounded-xl border-2 border-[#9A0D8A] px-3 py-1.5 text-[#9A0D8A] hover:bg-[#9A0D8A]/5 transition-colors"
                        >
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#9A0D8A"><path d="M287-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM80-160v-112q0-33 17-62t47-44q51-26 115-44t141-18h14q6 0 12 2-8 18-13.5 37.5T404-360h-4q-71 0-127.5 18T180-306q-9 5-14.5 14t-5.5 20v32h252q6 21 16 41.5t22 38.5H80Zm560 40-12-60q-12-5-22.5-10.5T584-204l-58 18-40-68 46-40q-2-14-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T628-460l12-60h80l12 60q12 5 22.5 11t21.5 15l58-20 40 70-46 40q2 12 2 25t-2 25l46 40-40 68-58-18q-11 8-21.5 13.5T732-180l-12 60h-80Zm96.5-143.5Q760-287 760-320t-23.5-56.5Q713-400 680-400t-56.5 23.5Q600-353 600-320t23.5 56.5Q647-240 680-240t56.5-23.5Zm-280-320Q480-607 480-640t-23.5-56.5Q433-720 400-720t-56.5 23.5Q320-673 320-640t23.5 56.5Q367-560 400-560t56.5-23.5ZM400-640Zm12 400Z" /></svg>
                            </div>
                            <span className="text-base font-bold whitespace-nowrap">{isAdmin ? 'แอดมิน' : 'พี่เลี่ยง'}</span>
                        </button>
                        <div className="dropdown shrink-0">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="relative block p-2 rounded-full hover:bg-white-light/90 hover:text-primary dark:text-[#d0d2d6] dark:hover:bg-dark/60 dark:hover:text-primary"
                                button={
                                    <span>
                                        <img src="/admin-icon/notifications_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" alt="notification" className="h-8 w-8" />
                                    </span>
                                }
                            >
                                <ul className="w-[300px] divide-y !py-0 text-dark dark:divide-white/10 dark:text-white-dark sm:w-[350px]">
                                    <li onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between px-4 py-2 font-semibold">
                                            <h4 className="text-lg">Notification</h4>
                                            {notifications.length ? <span className="badge bg-primary/80">{notifications.length}New</span> : ''}
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
                                                                    <ImageWithAuth className="h-12 w-12 rounded-full object-cover" />
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
                                                    <button className="btn btn-primary btn-small block w-full">Read All Notifications</button>
                                                </div>
                                            </li>
                                        </>
                                    ) : (
                                        <li onClick={(e) => e.stopPropagation()}>
                                            <button type="button" className="!grid min-h-[200px] place-content-center text-lg hover:!bg-transparent">
                                                <div className="mx-auto mb-4 rounded-full ring-4 ring-primary/30">
                                                    <IconInfoCircle fill={true} className="h-10 w-10 text-primary" />
                                                </div>
                                                No data available.
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </Dropdown>
                        </div>
                        <div className="dropdown flex shrink-0">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="relative group block p-2 rounded-full hover:bg-white-light/90 dark:hover:bg-dark/60"
                                button={
                                    <span className="flex items-center hover:text-primary">
                                        <img src="/admin-icon/account_circle_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" alt="profile" className="h-8 w-8" />
                                    </span>
                                }
                            >
                                <ul className="w-max min-w-[230px] !py-0 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                                    <li>
                                        <div className="flex flex-col px-4 py-4">
                                            <h4 className="text-base whitespace-nowrap">
                                                {fullName}
                                                <span className="rounded bg-success-light px-1 text-xs text-success ltr:ml-2 rtl:ml-2">แอดมิน</span>
                                            </h4>
                                            <button type="button" className="mt-1 text-left text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white whitespace-nowrap">
                                                {email}
                                            </button>
                                        </div>
                                    </li>
                                    <li>
                                        <Link href="/admin/profile" className="dark:hover:text-white">
                                            <IconUser className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                                            Profile
                                        </Link>
                                    </li>

                                    <li className="border-t border-white-light dark:border-white-light/10">
                                        <button type="button" className="!py-3 text-danger flex w-full items-center px-4 hover:bg-white-light/10" onClick={handleLogout}>
                                            <IconLogout className="h-4.5 w-4.5 shrink-0 rotate-90 ltr:mr-2 rtl:ml-2" />
                                            Sign Out
                                        </button>
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
