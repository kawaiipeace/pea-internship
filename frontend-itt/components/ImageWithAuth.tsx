'use client';
import { useEffect, useState } from 'react';
import axios from '@/api/axios';

interface ImageProps {
  className?: string;
  fallbackSrc?: string;
}

export default function ImageWithAuth({ 
  className = "w-10 h-10 rounded-full object-cover", 
  fallbackSrc = "/assets/images/user-profile.jpeg" 
}: ImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await axios.get('/user/student/itt/profile/img', {
          responseType: 'blob', // สำคัญมาก ต้องบอก Axios ว่านี่คือไฟล์
        });
        const objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      } catch (error) {
        console.error("Error loading image", error);
        setImageUrl(fallbackSrc); // ถ้า Error ให้ใช้รูป Default
      } finally {
        setLoading(false);
      }
    };

    fetchImage();

    // ล้าง URL ออกจาก Memory เมื่อ Component ถูกถอดออก (ป้องกัน Memory Leak)
    return () => {
      if (imageUrl && imageUrl !== fallbackSrc) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, []); // ลบ dependencies อื่นๆ ออก โหลดแค่ครั้งแรกพอ

  if (loading) {
    return <div className={`bg-gray-200 animate-pulse ${className}`} />;
  }

  return <img src={imageUrl || fallbackSrc} alt="Profile" className={className} />;
}