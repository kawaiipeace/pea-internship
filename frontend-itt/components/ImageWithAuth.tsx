


'use client';
import { useEffect, useState } from 'react';
import axios from '@/api/axios';

interface ImageProps {
  userId?: string; // เพิ่ม userId เพื่อให้ดึงรูปของใครก็ได้
  imageKey?: string; // เพิ่ม imageKey สำหรับดึงตรงๆ จาก /check-time/file
  className?: string;
  fallbackSrc?: string;
}

export default function ImageWithAuth({
  userId,
  imageKey,
  className = "w-10 h-10 rounded-full object-cover",
  fallbackSrc = "/assets/images/user-profile.jpeg"
}: ImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let currentObjectUrl: string | null = null;

    const fetchImage = async () => {
      if (!userId && !imageKey) {
        setImageUrl(fallbackSrc);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const endpoint = imageKey ? '/check-time/file' : '/user/student/itt/profile';
        const params = imageKey ? { key: imageKey } : { userId };

        const response = await axios.get(endpoint, {
          params,
          responseType: 'blob',
        });

        // สร้าง URL จาก Blob
        currentObjectUrl = URL.createObjectURL(response.data);
        setImageUrl(currentObjectUrl);
      } catch (error) {
        console.error("Error loading image:", error);
        setImageUrl(fallbackSrc);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();

    // Cleanup: ลบ URL ออกจากหน่วยความจำเมื่อ Component Unmount หรือ ID เปลี่ยน
    return () => {
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [userId, imageKey, fallbackSrc]); // เพิ่ม Dependency ให้ครบ

  if (loading) {
    return <div className={`bg-gray-200 animate-pulse ${className}`} />;
  }

  return (
    <img
      src={imageUrl || fallbackSrc}
      alt="Profile"
      className={className}
      onError={() => setImageUrl(fallbackSrc)} // กันเหนียวถ้า URL เจ๊ง
    />
  );
}
