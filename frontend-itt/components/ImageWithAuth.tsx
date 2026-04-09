'use client';
import { useEffect, useState } from 'react';
import axios from '@/api/axios';

interface ImageProps {
  userId?: string; // เพิ่ม userId เพื่อให้ดึงรูปของใครก็ได้
  className?: string;
  fallbackSrc?: string;
}

export default function ImageWithAuth({ 
  userId,
  className = "w-10 h-10 rounded-full object-cover", 
  fallbackSrc = "/assets/images/user-profile.jpeg" 
}: ImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await axios.get('/user/student/itt/profile/img', {
          params: { userId }, // ส่ง userId ไปที่ Backend
          responseType: 'blob',
        });
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