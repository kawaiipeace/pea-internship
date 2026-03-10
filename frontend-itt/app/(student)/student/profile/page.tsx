'use client';
import React, { useState, useEffect } from 'react';
import IconEdit from '@/components/icon/icon-edit';

// ============================================================
// Hooks
// ============================================================

const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < breakpoint);
        check();
        setIsReady(true);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [breakpoint]);

    return { isMobile, isReady };
};

// ============================================================
// Mock Data (replace with API call later)
// ============================================================

const mockStudent = {
    fullName: 'สมใจ ใฝ่ฝัน',
    nickname: 'ใจฝัน',
    gender: 'หญิง',
    email: 'somjai@gmail.com',
    phone: '0901110011',
    education: 'มหาวิทยาลัย',
    institution: 'มหาวิทยาลัยแม่ฟ้าหลวง',
    internshipStart: '5 มกราคม 2569',
    internshipEnd: '24 เมษายน 2569',
    requiredHours: 560,
    completedHours: 420,
    department: 'กองออกแบบและพัฒนาระบบดิจิทัล 1',
    position: 'ออกแบบ UX/UI สำหรับweb application',
    profileImage: '/assets/images/profile-placeholder.png',
    mentors: [
        {
            name: 'ชญานนท์ ภาคฐิน (ไทย)',
            phone: '02-2000024',
            email: 'songdee@gmail.com',
        },
        {
            name: 'วันพิชิต นิมิตภาคภูมิ ',
            phone: '02-2000024',
            email: 'songdee@gmail.com',
        },
    ],
};

// ============================================================
// Profile Page Component
// ============================================================

const StudentProfilePage = () => {
    const [student] = useState(mockStudent);
    const [nickname, setNickname] = useState(student.nickname);
    const [email, setEmail] = useState(student.email);
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const { isMobile, isReady } = useIsMobile();

    const progress = (student.completedHours / student.requiredHours) * 100;

    const handleSaveNickname = () => {
        setIsEditingNickname(false);
        // TODO: call API to save nickname
    };

    const handleSaveEmail = () => {
        setIsEditingEmail(false);
        // TODO: call API to save email
    };

    if (!isReady) return null;

    // Helper: Profile Image with edit button
    const ProfileImage = ({ rounded }: { rounded: 'full' | 'xl' }) => (
        <div className="relative shrink-0">
            <div className={`h-[120px] w-[120px] overflow-hidden shadow-md ${rounded === 'full' ? 'rounded-full' : 'rounded-xl'}`}>
                <img
                    src={student.profileImage}
                    alt={student.fullName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src =
                            'https://ui-avatars.com/api/?name=' +
                            encodeURIComponent(student.fullName) +
                            '&size=120&background=A80689&color=fff&font-size=0.4';
                    }}
                />
            </div>
            <button
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#A80689] text-white shadow-sm transition-colors hover:bg-[#8e0574]"
                title="เปลี่ยนรูปโปรไฟล์"
            >
                <IconEdit className="h-3.5 w-3.5" />
            </button>
        </div>
    );

    return (
        <div className="p-6">
            {/* ============================================================ */}
            {/* Profile Header Section */}
            {/* ============================================================ */}

            {isMobile ? (
                /* ---- MOBILE / PWA: centered, progress on top ---- */
                <>
                    <div className="mb-6 flex flex-col items-center">
                        <p className="mb-2 text-base font-semibold text-dark dark:text-white-dark">
                            ความคืบหน้าในการฝึกงาน
                        </p>
                        <div className="relative h-[28px] w-full max-w-[450px] overflow-hidden rounded-full bg-pink-100 dark:bg-gray-700">
                            <div
                                className="absolute left-0 top-0 flex h-full items-center justify-center rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #E991C7 0%, #C2185B 100%)',
                                }}
                            >
                                <span className="text-[12px] font-bold text-white">
                                    {student.completedHours} / {student.requiredHours} ชั่วโมง
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mb-8 flex flex-col items-center gap-4">
                        <ProfileImage rounded="full" />
                        <h1 className="text-2xl font-bold text-dark dark:text-white-dark">
                            {student.fullName}
                        </h1>
                    </div>
                </>
            ) : (
                /* ---- DESKTOP / WEB: horizontal, original design ---- */
                <div className="mb-8 flex flex-row items-start gap-6">
                    <ProfileImage rounded="xl" />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-dark dark:text-white-dark">
                            {student.fullName}
                        </h1>
                        <div className="mt-3">
                            <p className="mb-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                                ความคืบหน้าในการฝึกงาน
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="relative h-[24px] w-full max-w-[400px] overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className="absolute left-0 top-0 flex h-full items-center justify-end rounded-full pr-3 transition-all duration-700 ease-out"
                                        style={{
                                            width: `${progress}%`,
                                            background: 'linear-gradient(90deg, #A80689 0%, #C2185B 100%)',
                                        }}
                                    >
                                        <span className="text-[11px] font-bold text-white">
                                            {student.completedHours} ชั่วโมง
                                        </span>
                                    </div>
                                </div>
                                <div className="flex h-[24px] items-center justify-center rounded-full bg-[#9C27B0] px-3">
                                    <span className="text-[11px] font-bold text-white">
                                        {student.requiredHours} ชั่วโมง
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ข้อมูลส่วนตัว (Personal Information) */}
            {/* ============================================================ */}
            <div className="panel mb-6">
                <h2 className="mb-4 text-lg font-bold text-dark dark:text-white-dark">
                    ข้อมูลส่วนตัว
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* ชื่อจริง - นามสกุล */}
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            ชื่อจริง - นามสกุล
                        </label>
                        <input
                            type="text"
                            className="form-input bg-gray-50 dark:bg-gray-900"
                            value={student.fullName}
                            readOnly
                        />
                    </div>

                    {/* ชื่อเล่น */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            ชื่อเล่น
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className="form-input pr-10"
                                value={nickname}
                                readOnly={!isEditingNickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onBlur={handleSaveNickname}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                            />
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#A80689]"
                                onClick={() => setIsEditingNickname(!isEditingNickname)}
                                title="แก้ไขชื่อเล่น"
                            >
                                <IconEdit className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* อีเมล */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            อีเมล
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                className="form-input pr-10"
                                value={email}
                                readOnly={!isEditingEmail}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={handleSaveEmail}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}
                            />
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#A80689]"
                                onClick={() => setIsEditingEmail(!isEditingEmail)}
                                title="แก้ไขอีเมล"
                            >
                                <IconEdit className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* เบอร์โทร */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            เบอร์โทร
                        </label>
                        <input
                            type="text"
                            className="form-input bg-gray-50 dark:bg-gray-900"
                            value={student.phone}
                            readOnly
                        />
                    </div>

                    {/* เพศ */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            เพศ
                        </label>
                        <input
                            type="text"
                            className="form-input bg-gray-50 dark:bg-gray-900"
                            value={student.gender}
                            readOnly
                        />
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* ข้อมูลการศึกษา (Education Information) */}
            {/* ============================================================ */}
            <div className="panel mb-6">
                <h2 className="mb-4 text-lg font-bold text-dark dark:text-white-dark">
                    ข้อมูลการศึกษา
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* การศึกษาปัจจุบัน */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            การศึกษาปัจจุบัน
                        </label>
                        <input
                            type="text"
                            className="form-input bg-gray-50 dark:bg-gray-900"
                            value={student.education}
                            readOnly
                        />
                    </div>

                    {/* ชื่อสถาบัน */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            ชื่อสถาบัน
                        </label>
                        <input
                            type="text"
                            className="form-input bg-gray-50 dark:bg-gray-900"
                            value={student.institution}
                            readOnly
                        />
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* ข้อมูลการฝึกงาน (Internship Information) */}
            {/* ============================================================ */}
            <div className="panel mb-6">
                <h2 className="mb-4 text-lg font-bold text-dark dark:text-white-dark">
                    ข้อมูลการฝึกงาน
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* ตำแหน่ง */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            ตำแหน่ง
                        </label>
                        <input
                            type="text"
                            className="form-input bg-gray-50 dark:bg-gray-900"
                            value={student.position}
                            readOnly
                        />
                    </div>

                    {/* ชื่อกองงาน */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            ชื่อกองงาน
                        </label>
                        <input
                            type="text"
                            className="form-input bg-gray-50 dark:bg-gray-900"
                            value={student.department}
                            readOnly
                        />
                    </div>

                    {/* ระยะเวลาที่ฝึก */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            ระยะเวลาที่ฝึก
                        </label>
                        <input
                            type="text"
                            className="form-input bg-gray-50 dark:bg-gray-900"
                            value={`${student.internshipStart} - ${student.internshipEnd}`}
                            readOnly
                        />
                    </div>

                    {/* ชั่วโมงที่ต้องฝึก */}
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            ชั่วโมงที่ต้องฝึก
                        </label>
                        <input
                            type="text"
                            className="form-input bg-gray-50 dark:bg-gray-900"
                            value={`${student.requiredHours} ชั่วโมง`}
                            readOnly
                        />
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* ข้อมูลพี่เลี้ยง (Mentor Information) */}
            {/* ============================================================ */}
            <div className="panel mb-6">
                <h2 className="mb-4 text-lg font-bold text-dark dark:text-white-dark">
                    ข้อมูลพี่เลี้ยง
                </h2>
                <div className="space-y-6">
                    {student.mentors.map((mentor, index) => (
                        <div key={index}>
                            <h3 className="mb-2 text-sm font-bold text-dark dark:text-white-dark">
                                พี่เลี้ยง {index + 1}
                            </h3>
                            <div className="space-y-1 pl-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {mentor.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {mentor.phone}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {mentor.email}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentProfilePage;
