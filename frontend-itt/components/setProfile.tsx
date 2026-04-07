import React, { useState } from 'react';
import axios from '../api/axios'; // อิงตาม import ของคุณ
import useAuthStore from '@/store/authStore'; // ปรับ path ให้ตรงกับที่เก็บ store ของคุณ

const SetProfile = () => {
  // ดึง user ปัจจุบัน และ action สำหรับอัปเดตจาก Zustand
  const { user, actionSetUser } = useAuthStore();

  const [nickname, setNickname] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // จัดการเมื่อเลือกไฟล์รูปภาพ
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      // สร้าง URL จำลองเพื่อทำรูปพรีวิวให้ User ดู
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. เช็ค User ก่อนเลย ถ้าไม่มีให้เตือนและหยุดทำงาน
    if (!user) {
      alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาล็อกอินใหม่");
      return;
    }

    // 2. เช็คว่ากรอกข้อมูลครบไหม
    if (!nickname || !image) {
      alert("กรุณากรอกชื่อเล่นและอัปโหลดรูปโปรไฟล์");
      return;
    }

    setLoading(true);

    try {
      // ต้องใช้ FormData เพราะมีการส่งไฟล์ภาพ
      const formData = new FormData();
      formData.append('nickname', nickname);
      formData.append('image', image);

      const res = await axios.put('/user/student/itt/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // อิงจาก Response ของ Backend 
      // data: { nickname: "...", imageUrl: "..." }
      const updatedData = res.data.data;

      // 3. เอาข้อมูลใหม่ไปทับข้อมูล user เดิม (จัดการ Type ให้ผ่านชัวร์ๆ)
      const updatedUser = {
        ...user,
        displayUsername: updatedData.nickname,
        profile: {
          ...(user.profile || {}), // ถ้า profile เดิมเป็น null ให้มองเป็น object เปล่าๆ ไปก่อน
          image: updatedData.imageUrl, 
        }
      } as any; // ใส่ as any เพื่อบังคับข้าม TypeScript Error ตอนเซ็ต State

      // อัปเดตลง Zustand Store (พอรูปไม่เป็น null แล้ว Layout จะซ่อนหน้านี้อัตโนมัติ)
      actionSetUser(updatedUser);

    } catch (error) {
      console.error("อัปเดตโปรไฟล์ไม่สำเร็จ:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-[400px]">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">ตั้งค่าโปรไฟล์</h2>
          <p className="text-sm text-gray-500 mt-1">กรุณาตั้งค่าโปรไฟล์ของคุณเพื่อเริ่มต้นใช้งาน</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ส่วนอัปโหลดรูป */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 text-center">อัปโหลด<br />รูปภาพ</span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-400">คลิกที่วงกลมเพื่อเลือกรูป (PNG, JPG)</p>
          </div>

          {/* ส่วนกรอกชื่อเล่น */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อเล่น <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="กรอกชื่อเล่นของคุณ"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          {/* ปุ่มบันทึก */}
          <button
            type="submit"
            disabled={loading || !nickname || !image}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                กำลังบันทึก...
              </span>
            ) : (
              'บันทึกและเข้าสู่ระบบ'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetProfile;