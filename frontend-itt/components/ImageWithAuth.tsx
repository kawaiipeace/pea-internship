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
    const fetchImage = async () => {
      // ถ้าไม่มีส่ง userId และ imageKey มา ให้แสดงรูปรอและ return เลย
      if (!userId && !imageKey) {
          setImageUrl(fallbackSrc);
          setLoading(false);
          return;
      }
      try {
        let response;
        if (imageKey) {
          response = await axios.get('/check-time/file', {
            params: { key: imageKey },
            responseType: 'blob',
          });
        } else {
          response = await axios.get('/user/student/itt/profile', {
            params: { userId },
            responseType: 'blob',
          });
        }
        const objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      } catch (error) {
        console.error("Error loading image", error);
        setImageUrl(fallbackSrc);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();

    return () => {
      if (imageUrl && imageUrl !== fallbackSrc) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [userId]); // โหลดใหม่ถ้า userId เปลี่ยน

  if (loading) {
    return <div className={`bg-gray-200 animate-pulse ${className}`} />;
  }

  return <img src={imageUrl || fallbackSrc} alt="Profile" className={className} />;
}