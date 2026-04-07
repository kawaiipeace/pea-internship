import React from 'react'

const SetProfile = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-lg shadow-xl w-[400px]">
            <h2 className="text-xl font-bold mb-4">ตั้งค่าโปรไฟล์</h2>
            <p>กรุณาอัปโหลดรูปโปรไฟล์เพื่อใช้งานระบบต่อ</p>
        </div>
    </div>
  )
}

export default SetProfile