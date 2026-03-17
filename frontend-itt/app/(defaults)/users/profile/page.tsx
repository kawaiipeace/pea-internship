import IconEdit from '@/components/icon/icon-edit';
import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
    title: 'Profile',
};

const Profile = () => {
    // Mock data (จะเปลี่ยนเป็น fetch จาก API ภายหลัง)
    const profile = {
        fullName: 'สมใจ ใฝ่ฝัน',
        nickname: 'ใจฝัน',
        gender: 'หญิง',
        email: 'somjai@gmail.com',
        phone: '0901110011',
        educationLevel: 'มหาวิทยาลัย',
        institution: 'มหาวิทยาลัยแม่ฟ้าหลวง',
        internshipPeriod: '5 มกราคม 2569 - 24 เมษายน 2569',
        requiredHours: 560,
        completedHours: 420,
        department: 'กองออกแบบและพัฒนาระบบดิจิทัล 1',
        position: 'ออกแบบ UX/UI สำหรับweb application',
        profileImage: '/assets/images/profile-34.jpeg',
        mentors: [
            {
                name: 'มั่นคง ทรงดี (ไมเคิล)',
                phone: '02-2000024',
                email: 'songdee@gmail.com',
            },
            {
                name: 'มั่นคง ทรงดี (ไมเคิล)',
                phone: '02-2000024',
                email: 'songdee@gmail.com',
            },
        ],
    };

    const progressPercent = Math.round((profile.completedHours / profile.requiredHours) * 100);

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="#" className="text-primary hover:underline">
                        Users
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Profile</span>
                </li>
            </ul>

            <div className="pt-5">
                {/* ===== Header Section: Profile + Progress ===== */}
                <div className="panel mb-5">
                    <div className="flex flex-col items-center gap-5 sm:flex-row">
                        {/* Profile Image + Edit Button */}
                        <div className="relative">
                            <img
                                src={profile.profileImage}
                                alt="profile"
                                className="h-36 w-32  rounded-3xl object-cover shadow-md"
                            />
                            <Link
                                href="/users/user-account-settings"
                                className="btn bg-white absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full p-0"
                            >
                                <IconEdit className="h-5 w-5 text-purple-600" />
                            </Link>
                        </div>

                        {/* Name + Progress */}
                        <div className="flex-1 text-center sm:text-left">
                            <h4 className="text-4xl font-bold text-black dark:text-white-light">
                                {profile.fullName}
                            </h4>
                            <p className="mt-3 text-base text-gray-700">ความคืบหน้าในการฝึกงาน</p>

                            {/* Progress Bar */}
                            <div className="mt-0 flex items-center gap-3">
                                <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#ebedf2] dark:bg-dark/40">
                                    <div
                                        className="flex h-full items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#c084fc] text-[10px] font-bold text-white"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-gradient-to-r from-[#7c3aed] to-[#c084fc] px-3 py-1 text-xs font-semibold text-white">
                                        {profile.completedHours} ชั่วโมง
                                    </span>
                                    <span className="rounded-md bg-danger px-3 py-1 text-xs font-semibold text-white">
                                        {profile.requiredHours} ชั่วโมง
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== ข้อมูลส่วนตัว Section ===== */}
                <div className="panel mb-5">
                    <h5 className="mb-5 text-lg font-semibold dark:text-white-light">ข้อมูลส่วนตัว</h5>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {/* ชื่อเล่น */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">ชื่อเล่น</label>
                            <div className="flex items-center rounded-md border border-[#e0e6ed] bg-white px-4 py-2.5  shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                                <span className="flex-1 text-dark dark:text-white-light">{profile.nickname}</span>
                                <button type="button" className="text-primary hover:text-primary/80">
                                    <IconEdit className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* เพศ */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">เพศ</label>
                            <div className="rounded-md border border-[#e0e6ed] bg-gray-200 px-4 py-2.5  shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] text-dark dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-light">
                                {profile.gender}
                            </div>
                        </div>

                        {/* อีเมล */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">อีเมล</label>
                            <div className="flex items-center rounded-md border border-[#e0e6ed] bg-white px-4 py-2.5  shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                                <span className="flex-1 text-dark dark:text-white-light">{profile.email}</span>
                                <button type="button" className="text-primary hover:text-primary/80">
                                    <IconEdit className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* เบอร์โทร */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">เบอร์โทร</label>
                            <div className="rounded-md border border-[#e0e6ed] bg-gray-200 px-4 py-2.5  shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] text-dark dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-light">
                                {profile.phone}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== ข้อมูลการศึกษา Section ===== */}
                <div className="panel mb-5">
                    <h5 className="mb-5 text-lg font-semibold dark:text-white-light">ข้อมูลการศึกษา</h5>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {/* การศึกษาปัจจุบัน */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">การศึกษาปัจจุบัน</label>
                            <div className="rounded-md border border-[#e0e6ed] bg-gray-200 px-4 py-2.5  shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] text-dark dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-light">
                                {profile.educationLevel}
                            </div>
                        </div>

                        {/* ชื่อสถาบัน */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">ชื่อสถาบัน</label>
                            <div className="rounded-md border border-[#e0e6ed] bg-gray-200 px-4 py-2.5  shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] text-dark dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-light">
                                {profile.institution}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== ข้อมูลการฝึกงาน Section ===== */}
                <div className="panel mb-5">
                    <h5 className="mb-5 text-lg font-semibold dark:text-white-light">ข้อมูลการฝึกงาน</h5>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {/* ระยะเวลาที่ฝึก */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">ระยะเวลาที่ฝึก</label>
                            <div className="rounded-md border border-[#e0e6ed] bg-gray-200 px-4 py-2.5  shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] text-dark dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-light">
                                {profile.internshipPeriod}
                            </div>
                        </div>

                        {/* ชั่วโมงที่ต้องฝึก */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">ชั่วโมงที่ต้องฝึก</label>
                            <div className="rounded-md border border-[#e0e6ed] bg-gray-200 px-4 py-2.5  shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] text-dark dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-light">
                                {profile.requiredHours} ชั่วโมง
                            </div>
                        </div>

                        {/* ชื่อกองงาน */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">ชื่อกองงาน</label>
                            <div className="rounded-md border border-[#e0e6ed] bg-gray-200 px-4 py-2.5  shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] text-dark dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-light">
                                {profile.department}
                            </div>
                        </div>

                        {/* ตำแหน่ง */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">ตำแหน่ง</label>
                            <div className="rounded-md border border-[#e0e6ed] bg-gray-200 px-4 py-2.5 shadow-[0_4px_10px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.06)] text-dark dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-light">
                                {profile.position}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== ข้อมูลพี่เลี้ยง Section ===== */}
                <div className="panel mb-5">
                    <h5 className="mb-5 text-lg font-semibold dark:text-white-light">ข้อมูลพี่เลี้ยง</h5>
                    <div className="space-y-5">
                        {profile.mentors.map((mentor, index) => (
                            <div key={index}>
                                <h6 className="mb-2 font-bold text-dark dark:text-white-light">พี่เลี้ยง {index + 1}</h6>
                                <ul className="space-y-1 text-dark dark:text-white-light">
                                    <li>{mentor.name}</li>
                                    <li>{mentor.phone}</li>
                                    <li>{mentor.email}</li>
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
