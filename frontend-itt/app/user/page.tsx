import ProfileSetup from '@/components/profile/profile-setup';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ตั้งค่าโปรไฟล์ | PEA iTT',
    description: 'หน้าตั้งค่าโปรไฟล์สำหรับผู้ใช้งานใหม่',
};

export default function UserPage() {
    return <ProfileSetup />;
}
