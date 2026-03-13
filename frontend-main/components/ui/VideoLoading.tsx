"use client";

import Image from "next/image";

interface VideoLoadingProps {
  message?: string;
  /** เต็มจอ (fullscreen overlay) หรือ inline */
  fullScreen?: boolean;
}

export default function VideoLoading({
  message = "กำลังโหลดข้อมูล...",
  fullScreen = false,
}: VideoLoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* รูป + วงแหวนหมุนสีม่วง */}
      <div className="relative w-36 h-36">
        {/* วงแหวนหมุนชั้นนอก */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: "4px solid transparent",
            borderTopColor: "#A80689",
            borderRightColor: "#A80689",
            animationDuration: "1s",
          }}
        />
        {/* รูปตรงกลาง */}
        <div className="absolute inset-3.5 rounded-full overflow-hidden bg-white shadow-sm">
          <Image
            src="/images/01_Sawasdee.jpg"
            alt="Loading"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
      {message && (
        <p className="text-gray-500 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 5rem)' }}>
      {content}
    </div>
  );
}
