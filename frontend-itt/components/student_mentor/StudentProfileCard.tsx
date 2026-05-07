import React from 'react';
import ImageWithAuth from '@/components/ImageWithAuth';

interface StudentProfileCardProps {
    profile: any;
    studentId: string;
    progress: any;
}

const StudentProfileCard: React.FC<StudentProfileCardProps> = ({ profile, studentId, progress }) => {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const rawName = profile.fullName || '';
    const parts = rawName.split(' (');
    const mainName = parts[0];
    const extractedNick = parts[1] ? parts[1].replace(')', '') : '';
    const nick = profile.nickname || extractedNick;

    return (
        <div className="lg:col-span-2 panel border-[#CECFD2] border-[1px] shadow-sm rounded-xl p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <ImageWithAuth
                    userId={studentId}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                    fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random`}
                />
                <div className="flex flex-col items-center sm:items-start w-full">
                    <div className={`px-3 py-1 rounded-full border text-[12px] font-bold flex items-center justify-center gap-2 w-max mb-3 sm:mb-5 ${profile.internshipStatus === 'COMPLETE'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-[#FEF7EB] border-[#FDB022] text-[#944900]'
                        }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${profile.internshipStatus === 'COMPLETE' ? 'bg-green-500' : 'bg-[#FDB022]'}`}></div>
                        {profile.internshipStatus === 'COMPLETE' ? 'สิ้นสุดการฝึกงาน' : 'อยู่ระหว่างฝึกงาน'}
                    </div>
                    <h1 className="text-[20px] sm:text-[24px] font-medium text-[#111827] leading-tight">
                        {mainName}
                        {nick && (
                            <span className="text-[#000000] font-bold ml-2">({nick})</span>
                        )}
                    </h1>
                    <p className="text-[#61646C] text-[14px] font-medium mt-1">{profile.position || 'นักศึกษาฝึกงาน'}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 mt-6 sm:mt-8 w-full">
                        <div>
                            <p className="text-[#98A2B3] text-[14px] mb-0.5">ชื่อสถานบัน</p>
                            <p className="text-[#111827] text-[16px] font-normal leading-tight break-words max-w-[200px]">{profile.institution || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[#98A2B3] text-[14px] mb-0.5">ระยะเวลาการฝึกงาน</p>
                            <p className="text-[#111827] text-[16px] font-normal leading-tight">
                                {formatDate(profile.period?.startDate)} - {formatDate(progress?.extendedEndDate || profile.period?.endDate)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[#98A2B3] text-[14px] mb-0.5">อีเมล</p>
                            <p className="text-[#111827] text-[16px] font-normal leading-tight break-all max-w-[200px]">{profile.email || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[#98A2B3] text-[14px] mb-0.5">เบอร์โทร</p>
                            <p className="text-[#111827] text-[16px] font-normal leading-tight">{profile.phone || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfileCard;
