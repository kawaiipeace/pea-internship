"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavbarIntern } from "../components";
import VideoLoading from "../components/ui/VideoLoading";
import { userApi, authApi, studentProfileApi, institutionApi, applicationApi, positionApi, Position, extractStudentProfile } from "../services/api";

// ข้อมูล default หากไม่มี user login
const defaultInternData = {
  fullName: "นาย สมชาย ใจดี",
  email: "kap@gmail.com",
  phone: "090-123-4567",
  gender: "ชาย",
  education: "มหาวิทยาลัย",
  institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
  faculty: "เทคโนโลยีและการจัดการอุตสาหกรรม",
  major: "เทคโนโลยีสารสนเทศ",
  internshipPeriod: "3 พฤศจิกายน 2568 - 27 กุมภาพันธ์ 2569",
  totalHours: "540 ชั่วโมง",
  department: "กองงานออกแบบและพัฒนาระบบดิจิทัล 1",
  supervisor: "นายศักดิ์ชาย มีดี",
  supervisorEmail: "sakchai1@gmail.com",
  supervisorPhone: "02-2000022",
  mentorName: "นายมั่นคง ทรงดี",
  mentorEmail: "songdee@gmail.com",
  mentorPhone: "02-2000023",
  profileImage: "",
};

// แปลง education value เป็น label
const getEducationLabel = (value: string): string => {
  const educationMap: { [key: string]: string } = {
    high_school: "มัธยมศึกษาตอนปลาย",
    vocational: "ประกาศนียบัตรวิชาชีพ (ปวช.)",
    high_vocational: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
    university: "มหาวิทยาลัย",
    other: "อื่น ๆ",
  };
  return educationMap[value] || value;
};

// แปลง gender value เป็น label (รองรับทั้ง lowercase และ UPPERCASE)
const getGenderLabel = (value: string): string => {
  const genderMap: { [key: string]: string } = {
    male: "ชาย",
    female: "หญิง",
    MALE: "ชาย",
    FEMALE: "หญิง",
  };
  return genderMap[value] || value;
};

// Thai month names
const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

// Format date to Thai format
const formatDateThai = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Convert to Buddhist Era
  return `${day} ${month} ${year}`;
};

// Format phone number
const formatPhone = (phone: string): string => {
  if (!phone || phone.length < 9) return phone;
  // Format: 090-123-4567
  return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
};

function FieldCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-gray-900 font-medium break-words">{value}</div>
      </div>
    </div>
  );
}

const IconUser = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 14V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
      fill="#A80689"
    />
  </svg>
);

const IconMail = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12V13.45C22 14.4333 21.6625 15.2708 20.9875 15.9625C20.3125 16.6542 19.4833 17 18.5 17C17.9167 17 17.3667 16.875 16.85 16.625C16.3333 16.375 15.9 16.0167 15.55 15.55C15.0667 16.0333 14.5208 16.3958 13.9125 16.6375C13.3042 16.8792 12.6667 17 12 17C10.6167 17 9.4375 16.5125 8.4625 15.5375C7.4875 14.5625 7 13.3833 7 12C7 10.6167 7.4875 9.4375 8.4625 8.4625C9.4375 7.4875 10.6167 7 12 7C13.3833 7 14.5625 7.4875 15.5375 8.4625C16.5125 9.4375 17 10.6167 17 12V13.45C17 13.8833 17.1417 14.25 17.425 14.55C17.7083 14.85 18.0667 15 18.5 15C18.9333 15 19.2917 14.85 19.575 14.55C19.8583 14.25 20 13.8833 20 13.45V12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20H16C16.2833 20 16.5208 20.0958 16.7125 20.2875C16.9042 20.4792 17 20.7167 17 21C17 21.2833 16.9042 21.5208 16.7125 21.7125C16.5208 21.9042 16.2833 22 16 22H12ZM12 15C12.8333 15 13.5417 14.7083 14.125 14.125C14.7083 13.5417 15 12.8333 15 12C15 11.1667 14.7083 10.4583 14.125 9.875C13.5417 9.29167 12.8333 9 12 9C11.1667 9 10.4583 9.29167 9.875 9.875C9.29167 10.4583 9 11.1667 9 12C9 12.8333 9.29167 13.5417 9.875 14.125C10.4583 14.7083 11.1667 15 12 15Z"
      fill="#A80689"
    />
  </svg>
);

const IconPhone = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 8H14C13.7167 8 13.4792 7.90417 13.2875 7.7125C13.0958 7.52083 13 7.28333 13 7C13 6.71667 13.0958 6.47917 13.2875 6.2875C13.4792 6.09583 13.7167 6 14 6H16V4C16 3.71667 16.0958 3.47917 16.2875 3.2875C16.4792 3.09583 16.7167 3 17 3C17.2833 3 17.5208 3.09583 17.7125 3.2875C17.9042 3.47917 18 3.71667 18 4V6H20C20.2833 6 20.5208 6.09583 20.7125 6.2875C20.9042 6.47917 21 6.71667 21 7C21 7.28333 20.9042 7.52083 20.7125 7.7125C20.5208 7.90417 20.2833 8 20 8H18V10C18 10.2833 17.9042 10.5208 17.7125 10.7125C17.5208 10.9042 17.2833 11 17 11C16.7167 11 16.4792 10.9042 16.2875 10.7125C16.0958 10.5208 16 10.2833 16 10V8ZM19.95 21C17.8667 21 15.8083 20.5458 13.775 19.6375C11.7417 18.7292 9.89167 17.4417 8.225 15.775C6.55833 14.1083 5.27083 12.2583 4.3625 10.225C3.45417 8.19167 3 6.13333 3 4.05C3 3.75 3.1 3.5 3.3 3.3C3.5 3.1 3.75 3 4.05 3H8.1C8.33333 3 8.54167 3.07917 8.725 3.2375C8.90833 3.39583 9.01667 3.58333 9.05 3.8L9.7 7.3C9.73333 7.56667 9.725 7.79167 9.675 7.975C9.625 8.15833 9.53333 8.31667 9.4 8.45L6.975 10.9C7.30833 11.5167 7.70417 12.1125 8.1625 12.6875C8.62083 13.2625 9.125 13.8167 9.675 14.35C10.1917 14.8667 10.7333 15.3458 11.3 15.7875C11.8667 16.2292 12.4667 16.6333 13.1 17L15.45 14.65C15.6 14.5 15.7958 14.3875 16.0375 14.3125C16.2792 14.2375 16.5167 14.2167 16.75 14.25L20.2 14.95C20.4333 15.0167 20.625 15.1375 20.775 15.3125C20.925 15.4875 21 15.6833 21 15.9V19.95C21 20.25 20.9 20.5 20.7 20.7C20.5 20.9 20.25 21 19.95 21ZM6.025 9L7.675 7.35L7.25 5H5.025C5.10833 5.68333 5.225 6.35833 5.375 7.025C5.525 7.69167 5.74167 8.35 6.025 9ZM14.975 17.95C15.625 18.2333 16.2875 18.4583 16.9625 18.625C17.6375 18.7917 18.3167 18.9 19 18.95V16.75L16.65 16.275L14.975 17.95Z"
      fill="#A80689"
    />
  </svg>
);

const IconGender = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.53393 20.1215H7.75812C7.53831 20.1215 7.35405 20.0472 7.20536 19.8985C7.05666 19.7498 6.98231 19.5655 6.98231 19.3457C6.98231 19.1259 7.05666 18.9416 7.20536 18.7929C7.35405 18.6443 7.53831 18.5699 7.75812 18.5699H8.53393V16.9407C7.51245 16.7597 6.67522 16.2716 6.02225 15.4764C5.36927 14.6812 5.04279 13.7599 5.04279 12.7125C5.04279 11.5359 5.45978 10.537 6.29378 9.71597C7.12777 8.89491 8.13309 8.48438 9.30974 8.48438C10.4864 8.48438 11.4917 8.89491 12.3257 9.71597C13.1597 10.537 13.5767 11.5359 13.5767 12.7125C13.5767 13.7599 13.2502 14.6812 12.5972 15.4764C11.9443 16.2716 11.107 16.7597 10.0855 16.9407V18.5699H10.8614C11.0812 18.5699 11.2654 18.6443 11.4141 18.7929C11.5628 18.9416 11.6372 19.1259 11.6372 19.3457C11.6372 19.5655 11.5628 19.7498 11.4141 19.8985C11.2654 20.0472 11.0812 20.1215 10.8614 20.1215H10.0855V20.8973C10.0855 21.1171 10.0112 21.3014 9.8625 21.4501C9.71381 21.5988 9.52955 21.6731 9.30974 21.6731C9.08993 21.6731 8.90567 21.5988 8.75698 21.4501C8.60828 21.3014 8.53393 21.1171 8.53393 20.8973V20.1215ZM9.30974 15.4667C10.0597 15.4667 10.6997 15.2016 11.2299 14.6715C11.76 14.1413 12.0251 13.5013 12.0251 12.7513C12.0251 12.0014 11.76 11.3613 11.2299 10.8312C10.6997 10.3011 10.0597 10.036 9.30974 10.036C8.55979 10.036 7.91975 10.3011 7.38961 10.8312C6.85947 11.3613 6.59441 12.0014 6.59441 12.7513C6.59441 13.5013 6.85947 14.1413 7.38961 14.6715C7.91975 15.2016 8.55979 15.4667 9.30974 15.4667Z"
      fill="#A80689"
    />
    <path
      d="M20.8967 3.87933V6.98256C20.8967 7.20238 20.8224 7.38663 20.6737 7.53533C20.525 7.68403 20.3407 7.75837 20.1209 7.75837C19.9011 7.75837 19.7168 7.68403 19.5681 7.53533C19.4195 7.38663 19.3451 7.20238 19.3451 6.98256V5.76066L16.2613 8.82511C16.5069 9.18716 16.6944 9.57183 16.8237 9.97913C16.953 10.3864 17.0177 10.8099 17.0177 11.2495C17.0177 12.4391 16.6039 13.4476 15.7764 14.2752C14.9488 15.1027 13.9403 15.5165 12.7507 15.5165C11.5611 15.5165 10.5526 15.1027 9.72506 14.2752C8.89753 13.4476 8.48376 12.4391 8.48376 11.2495C8.48376 10.0599 8.89753 9.05139 9.72506 8.22386C10.5526 7.39633 11.5611 6.98256 12.7507 6.98256C13.1774 6.98256 13.5976 7.04398 14.0114 7.16682C14.4252 7.28966 14.8066 7.48038 15.1557 7.73898L18.2396 4.65514H17.0177C16.7979 4.65514 16.6136 4.58079 16.4649 4.43209C16.3162 4.28339 16.2419 4.09914 16.2419 3.87933C16.2419 3.65951 16.3162 3.47526 16.4649 3.32656C16.6136 3.17786 16.7979 3.10352 17.0177 3.10352H20.1209C20.3407 3.10352 20.525 3.17786 20.6737 3.32656C20.8224 3.47526 20.8967 3.65951 20.8967 3.87933ZM12.7507 8.53418C12.0008 8.53418 11.3607 8.79925 10.8306 9.32939C10.3005 9.85953 10.0354 10.4996 10.0354 11.2495C10.0354 11.9995 10.3005 12.6395 10.8306 13.1696C11.3607 13.6998 12.0008 13.9649 12.7507 13.9649C13.5007 13.9649 14.1407 13.6998 14.6708 13.1696C15.201 12.6395 15.4661 11.9995 15.4661 11.2495C15.4661 10.4996 15.201 9.85953 14.6708 9.32939C14.1407 8.79925 13.5007 8.53418 12.7507 8.53418Z"
      fill="#A80689"
    />
  </svg>
);

const IconGrad = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.05001 17.7754C5.71668 17.5921 5.45835 17.3462 5.27501 17.0379C5.09168 16.7296 5.00001 16.3837 5.00001 16.0004V11.2004L2.60001 9.87539C2.41668 9.77539 2.28335 9.65039 2.20001 9.50039C2.11668 9.35039 2.07501 9.18372 2.07501 9.00039C2.07501 8.81706 2.11668 8.65039 2.20001 8.50039C2.28335 8.35039 2.41668 8.22539 2.60001 8.12539L11.05 3.52539C11.2 3.44206 11.3542 3.37956 11.5125 3.33789C11.6708 3.29622 11.8333 3.27539 12 3.27539C12.1667 3.27539 12.3292 3.29622 12.4875 3.33789C12.6458 3.37956 12.8 3.44206 12.95 3.52539L22.475 8.72539C22.6417 8.80872 22.7708 8.92956 22.8625 9.08789C22.9542 9.24622 23 9.41706 23 9.60039V16.0004C23 16.2837 22.9042 16.5212 22.7125 16.7129C22.5208 16.9046 22.2833 17.0004 22 17.0004C21.7167 17.0004 21.4792 16.9046 21.2875 16.7129C21.0958 16.5212 21 16.2837 21 16.0004V10.1004L19 11.2004V16.0004C19 16.3837 18.9083 16.7296 18.725 17.0379C18.5417 17.3462 18.2833 17.5921 17.95 17.7754L12.95 20.4754C12.8 20.5587 12.6458 20.6212 12.4875 20.6629C12.3292 20.7046 12.1667 20.7254 12 20.7254C11.8333 20.7254 11.6708 20.7046 11.5125 20.6629C11.3542 20.6212 11.2 20.5587 11.05 20.4754L6.05001 17.7754ZM12 12.7004L18.85 9.00039L12 5.30039L5.15001 9.00039L12 12.7004ZM12 18.7254L17 16.0254V12.2504L12.975 14.4754C12.825 14.5587 12.6667 14.6212 12.5 14.6629C12.3333 14.7046 12.1667 14.7254 12 14.7254C11.8333 14.7254 11.6667 14.7046 11.5 14.6629C11.3333 14.6212 11.175 14.5587 11.025 14.4754L7.00001 12.2504V16.0254L12 18.7254Z"
      fill="#A80689"
    />
  </svg>
);

const IconSchool = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.05001 17.7754C5.71668 17.5921 5.45835 17.3462 5.27501 17.0379C5.09168 16.7296 5.00001 16.3837 5.00001 16.0004V11.2004L2.60001 9.87539C2.41668 9.77539 2.28335 9.65039 2.20001 9.50039C2.11668 9.35039 2.07501 9.18372 2.07501 9.00039C2.07501 8.81706 2.11668 8.65039 2.20001 8.50039C2.28335 8.35039 2.41668 8.22539 2.60001 8.12539L11.05 3.52539C11.2 3.44206 11.3542 3.37956 11.5125 3.33789C11.6708 3.29622 11.8333 3.27539 12 3.27539C12.1667 3.27539 12.3292 3.29622 12.4875 3.33789C12.6458 3.37956 12.8 3.44206 12.95 3.52539L22.475 8.72539C22.6417 8.80872 22.7708 8.92956 22.8625 9.08789C22.9542 9.24622 23 9.41706 23 9.60039V16.0004C23 16.2837 22.9042 16.5212 22.7125 16.7129C22.5208 16.9046 22.2833 17.0004 22 17.0004C21.7167 17.0004 21.4792 16.9046 21.2875 16.7129C21.0958 16.5212 21 16.2837 21 16.0004V10.1004L19 11.2004V16.0004C19 16.3837 18.9083 16.7296 18.725 17.0379C18.5417 17.3462 18.2833 17.5921 17.95 17.7754L12.95 20.4754C12.8 20.5587 12.6458 20.6212 12.4875 20.6629C12.3292 20.7046 12.1667 20.7254 12 20.7254C11.8333 20.7254 11.6708 20.7046 11.5125 20.6629C11.3542 20.6212 11.2 20.5587 11.05 20.4754L6.05001 17.7754ZM12 12.7004L18.85 9.00039L12 5.30039L5.15001 9.00039L12 12.7004ZM12 18.7254L17 16.0254V12.2504L12.975 14.4754C12.825 14.5587 12.6667 14.6212 12.5 14.6629C12.3333 14.7046 12.1667 14.7254 12 14.7254C11.8333 14.7254 11.6667 14.7046 11.5 14.6629C11.3333 14.6212 11.175 14.5587 11.025 14.4754L7.00001 12.2504V16.0254L12 18.7254Z"
      fill="#A80689"
    />
  </svg>
);

const IconBook = (
  <svg
    width="16"
    height="20"
    viewBox="0 0 16 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H14C14.55 0 15.0208 0.195833 15.4125 0.5875C15.8042 0.979167 16 1.45 16 2V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM2 18H14V2H12V8.125C12 8.325 11.9167 8.47083 11.75 8.5625C11.5833 8.65417 11.4167 8.65 11.25 8.55L10.025 7.8C9.85833 7.7 9.6875 7.65 9.5125 7.65C9.3375 7.65 9.16667 7.7 9 7.8L7.775 8.55C7.60833 8.65 7.4375 8.65417 7.2625 8.5625C7.0875 8.47083 7 8.325 7 8.125V2H2V18Z"
      fill="#A80689"
    />
  </svg>
);

const IconCalendar = (
  <svg
    width="18"
    height="20"
    viewBox="0 0 18 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V1C3 0.716667 3.09583 0.479167 3.2875 0.2875C3.47917 0.0958333 3.71667 0 4 0C4.28333 0 4.52083 0.0958333 4.7125 0.2875C4.90417 0.479167 5 0.716667 5 1V2H13V1C13 0.716667 13.0958 0.479167 13.2875 0.2875C13.4792 0.0958333 13.7167 0 14 0C14.2833 0 14.5208 0.0958333 14.7125 0.2875C14.9042 0.479167 15 0.716667 15 1V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6ZM9 12C8.71667 12 8.47917 11.9042 8.2875 11.7125C8.09583 11.5208 8 11.2833 8 11C8 10.7167 8.09583 10.4792 8.2875 10.2875C8.47917 10.0958 8.71667 10 9 10C9.28333 10 9.52083 10.0958 9.7125 10.2875C9.90417 10.4792 10 10.7167 10 11C10 11.2833 9.90417 11.5208 9.7125 11.7125C9.52083 11.9042 9.28333 12 9 12ZM5 12C4.71667 12 4.47917 11.9042 4.2875 11.7125C4.09583 11.5208 4 11.2833 4 11C4 10.7167 4.09583 10.4792 4.2875 10.2875C4.47917 10.0958 4.71667 10 5 10C5.28333 10 5.52083 10.0958 5.7125 10.2875C5.90417 10.4792 6 10.7167 6 11C6 11.2833 5.90417 11.5208 5.7125 11.7125C5.52083 11.9042 5.28333 12 5 12ZM13 12C12.7167 12 12.4792 11.9042 12.2875 11.7125C12.0958 11.5208 12 11.2833 12 11C12 10.7167 12.0958 10.4792 12.2875 10.2875C12.4792 10.0958 12.7167 10 13 10C13.2833 10 13.5208 10.0958 13.7125 10.2875C13.9042 10.4792 14 10.7167 14 11C14 11.2833 13.9042 11.5208 13.7125 11.7125C13.5208 11.9042 13.2833 12 13 12ZM9 16C8.71667 16 8.47917 15.9042 8.2875 15.7125C8.09583 15.5208 8 15.2833 8 15C8 14.7167 8.09583 14.4792 8.2875 14.2875C8.47917 14.0958 8.71667 14 9 14C9.28333 14 9.52083 14.0958 9.7125 14.2875C9.90417 14.4792 10 14.7167 10 15C10 15.2833 9.90417 15.5208 9.7125 15.7125C9.52083 15.9042 9.28333 16 9 16ZM5 16C4.71667 16 4.47917 15.9042 4.2875 15.7125C4.09583 15.5208 4 15.2833 4 15C4 14.7167 4.09583 14.4792 4.2875 14.2875C4.47917 14.0958 4.71667 14 5 14C5.28333 14 5.52083 14.0958 5.7125 14.2875C5.90417 14.4792 6 14.7167 6 15C6 15.2833 5.90417 15.5208 5.7125 15.7125C5.52083 15.9042 5.28333 16 5 16ZM13 16C12.7167 16 12.4792 15.9042 12.2875 15.7125C12.0958 15.5208 12 15.2833 12 15C12 14.7167 12.0958 14.4792 12.2875 14.2875C12.4792 14.0958 12.7167 14 13 14C13.2833 14 13.5208 14.0958 13.7125 14.2875C13.9042 14.4792 14 14.7167 14 15C14 15.2833 13.9042 15.5208 13.7125 15.7125C13.5208 15.9042 13.2833 16 13 16Z"
      fill="#A80689"
    />
  </svg>
);

const IconClock = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 11.6V8C13 7.71667 12.9042 7.47917 12.7125 7.2875C12.5208 7.09583 12.2833 7 12 7C11.7167 7 11.4792 7.09583 11.2875 7.2875C11.0958 7.47917 11 7.71667 11 8V11.975C11 12.1083 11.025 12.2375 11.075 12.3625C11.125 12.4875 11.2 12.6 11.3 12.7L14.6 16C14.7833 16.1833 15.0167 16.275 15.3 16.275C15.5833 16.275 15.8167 16.1833 16 16C16.1833 15.8167 16.275 15.5833 16.275 15.3C16.275 15.0167 16.1833 14.7833 16 14.6L13 11.6ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2167 20 16.1042 19.2208 17.6625 17.6625C19.2208 16.1042 20 14.2167 20 12C20 9.78333 19.2208 7.89583 17.6625 6.3375C16.1042 4.77917 14.2167 4 12 4C9.78333 4 7.89583 4.77917 6.3375 6.3375C4.77917 7.89583 4 9.78333 4 12C4 14.2167 4.77917 16.1042 6.3375 17.6625C7.89583 19.2208 9.78333 20 12 20Z"
      fill="#A80689"
    />
  </svg>
);

const IconWork = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M10 4h4v2h-4V4ZM4 8h16v11H4V8Zm16-2h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2Z"
      fill="#A80689"
    />
  </svg>
);

const IconContact = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 8H14C13.7167 8 13.4792 7.90417 13.2875 7.7125C13.0958 7.52083 13 7.28333 13 7C13 6.71667 13.0958 6.47917 13.2875 6.2875C13.4792 6.09583 13.7167 6 14 6H16V4C16 3.71667 16.0958 3.47917 16.2875 3.2875C16.4792 3.09583 16.7167 3 17 3C17.2833 3 17.5208 3.09583 17.7125 3.2875C17.9042 3.47917 18 3.71667 18 4V6H20C20.2833 6 20.5208 6.09583 20.7125 6.2875C20.9042 6.47917 21 6.71667 21 7C21 7.28333 20.9042 7.52083 20.7125 7.7125C20.5208 7.90417 20.2833 8 20 8H18V10C18 10.2833 17.9042 10.5208 17.7125 10.7125C17.5208 10.9042 17.2833 11 17 11C16.7167 11 16.4792 10.9042 16.2875 10.7125C16.0958 10.5208 16 10.2833 16 10V8ZM19.95 21C17.8667 21 15.8083 20.5458 13.775 19.6375C11.7417 18.7292 9.89167 17.4417 8.225 15.775C6.55833 14.1083 5.27083 12.2583 4.3625 10.225C3.45417 8.19167 3 6.13333 3 4.05C3 3.75 3.1 3.5 3.3 3.3C3.5 3.1 3.75 3 4.05 3H8.1C8.33333 3 8.54167 3.07917 8.725 3.2375C8.90833 3.39583 9.01667 3.58333 9.05 3.8L9.7 7.3C9.73333 7.56667 9.725 7.79167 9.675 7.975C9.625 8.15833 9.53333 8.31667 9.4 8.45L6.975 10.9C7.30833 11.5167 7.70417 12.1125 8.1625 12.6875C8.62083 13.2625 9.125 13.8167 9.675 14.35C10.1917 14.8667 10.7333 15.3458 11.3 15.7875C11.8667 16.2292 12.4667 16.6333 13.1 17L15.45 14.65C15.6 14.5 15.7958 14.3875 16.0375 14.3125C16.2792 14.2375 16.5167 14.2167 16.75 14.25L20.2 14.95C20.4333 15.0167 20.625 15.1375 20.775 15.3125C20.925 15.4875 21 15.6833 21 15.9V19.95C21 20.25 20.9 20.5 20.7 20.7C20.5 20.9 20.25 21 19.95 21ZM6.025 9L7.675 7.35L7.25 5H5.025C5.10833 5.68333 5.225 6.35833 5.375 7.025C5.525 7.69167 5.74167 8.35 6.025 9ZM14.975 17.95C15.625 18.2333 16.2875 18.4583 16.9625 18.625C17.6375 18.7917 18.3167 18.9 19 18.95V16.75L16.65 16.275L14.975 17.95Z"
      fill="#A80689"
    />
  </svg>
);

export default function InternProfilePage() {
  const [internData, setInternData] = useState(defaultInternData);
  const [currentStatus, setCurrentStatus] = useState("");
  const [educationType, setEducationType] = useState("university"); // raw education value
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplication, setHasApplication] = useState(false);
  const [applicationPosition, setApplicationPosition] = useState<Position | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // ใช้ API /user/profile เป็นหลัก
        try {
          const profileData = await userApi.getUserProfile();
          if (profileData) {
            const studentProfile = extractStudentProfile(profileData.profile);

            // Format internship period
            let internshipPeriod = "-";
            if (studentProfile?.startDate && studentProfile?.endDate) {
              internshipPeriod = `${formatDateThai(studentProfile.startDate)} - ${formatDateThai(studentProfile.endDate)}`;
            }

            // faculty เป็น string ตรงๆ จาก backend (ไม่ใช่ object)
            let facultyName = studentProfile?.faculty || "-";
            let institutionName = "-";
            let educationLabel = "-";
            let isHighSchool = false;

            // ดึงข้อมูล institution จาก API ตาม institutionId
            if (studentProfile?.institutionId) {
              try {
                const inst = await institutionApi.getInstitutionById(studentProfile.institutionId);
                if (inst) {
                  institutionName = inst.name;
                  // แปลง institutionsType เป็น education label
                  const typeToEducation: { [key: string]: string } = {
                    UNIVERSITY: "university",
                    VOCATIONAL: "vocational",
                    SCHOOL: "high_school",
                    OTHERS: "other",
                  };
                  const eduKey = typeToEducation[inst.institutionsType] || "other";
                  setEducationType(eduKey);
                  educationLabel = getEducationLabel(eduKey);
                  // สำหรับ "อื่น ๆ" — แสดงประเภทการศึกษาจาก studentNote
                  if (eduKey === "other" && studentProfile?.studentNote) {
                    educationLabel = studentProfile.studentNote;
                  }
                  isHighSchool = eduKey === "high_school";
                }
              } catch {
                console.log("Cannot fetch institution data");
              }
            }

            setInternData({
              fullName: `${profileData.fname || ""} ${profileData.lname || ""}`.trim() || "-",
              email: profileData.email || "-",
              phone: formatPhone(profileData.phoneNumber || ""),
              gender: getGenderLabel(profileData.gender || ""),
              education: educationLabel,
              institution: institutionName,
              faculty: facultyName,
              major: isHighSchool
                ? (studentProfile?.studentNote || "-")
                : (studentProfile?.major || "-"),
              internshipPeriod: internshipPeriod,
              totalHours: studentProfile?.hours ? `${studentProfile.hours} ชั่วโมง` : "-",
              department: defaultInternData.department,
              supervisor: defaultInternData.supervisor,
              supervisorEmail: defaultInternData.supervisorEmail,
              supervisorPhone: defaultInternData.supervisorPhone,
              mentorName: defaultInternData.mentorName,
              mentorEmail: defaultInternData.mentorEmail,
              mentorPhone: defaultInternData.mentorPhone,
              profileImage: studentProfile?.image || "",
            });

            // Fetch latest application to determine hasApplication and get position data
            try {
              const latestApp = await applicationApi.getMyLatestApplication();
              if (latestApp && latestApp.applicationStatus !== "CANCEL" && latestApp.applicationStatus !== "ABORT") {
                setHasApplication(true);
                // Fetch position data for owner/mentor info
                if (latestApp.positionId) {
                  try {
                    const pos = await positionApi.getPositionById(latestApp.positionId);
                    if (pos) {
                      setApplicationPosition(pos);
                    }
                  } catch {
                    console.log("Cannot fetch position data for application");
                  }
                }
              }
            } catch {
              console.log("Cannot fetch application data");
            }

            // Status logic based on internshipStatus
            if (studentProfile?.internshipStatus) {
              const statusMap: { [key: string]: string } = {
                "IN_PROGRESS": "อยู่ระหว่างการฝึกงาน",
                "COMPLETED": "ฝึกงานเสร็จสิ้น",
                "CANCELLED": "ยกเลิกฝึกงาน",
              };
              const mappedStatus = statusMap[studentProfile.internshipStatus];
              if (mappedStatus) {
                setCurrentStatus(mappedStatus);
              } else {
                setCurrentStatus(""); // ไม่แสดง badge ถ้าไม่ตรงกับเงื่อนไข
              }
            }
            return; // สำเร็จแล้ว ไม่ต้อง fallback
          }
        } catch (profileError) {
          console.log("User profile API not available, falling back to old API");
        }

        // Fallback: ลองใช้ API เก่า /users/me/profile
        try {
          const profileData = await userApi.getMyProfile();
          if (profileData && profileData.user) {
            const { user, studentProfile, mentor, supervisor, department } = profileData;

            // Format internship period
            let internshipPeriod = "-";
            if (studentProfile?.startDate && studentProfile?.endDate) {
              internshipPeriod = `${formatDateThai(studentProfile.startDate)} - ${formatDateThai(studentProfile.endDate)}`;
            }

            setEducationType("university");

            // faculty เป็น string ตรงๆ
            let fallbackFacultyName = studentProfile?.faculty || "-";
            let fallbackInstitutionName = "-";
            let fallbackEducationLabel = "-";
            let fallbackIsHighSchool = false;

            // ดึงข้อมูล institution จาก API ตาม institutionId
            if (studentProfile?.institutionId) {
              try {
                const inst = await institutionApi.getInstitutionById(studentProfile.institutionId);
                if (inst) {
                  fallbackInstitutionName = inst.name;
                  const typeToEducation: { [key: string]: string } = {
                    UNIVERSITY: "university",
                    VOCATIONAL: "vocational",
                    SCHOOL: "high_school",
                    OTHERS: "other",
                  };
                  const eduKey = typeToEducation[inst.institutionsType] || "other";
                  setEducationType(eduKey);
                  fallbackEducationLabel = getEducationLabel(eduKey);
                  // สำหรับ "อื่น ๆ" — แสดงประเภทการศึกษาจาก studentNote
                  if (eduKey === "other" && studentProfile?.studentNote) {
                    fallbackEducationLabel = studentProfile.studentNote;
                  }
                  fallbackIsHighSchool = eduKey === "high_school";
                }
              } catch {
                console.log("Cannot fetch institution data");
              }
            }

            setInternData({
              fullName: `${user.fname || ""} ${user.lname || ""}`.trim() || "-",
              email: user.email || "-",
              phone: formatPhone(user.phoneNumber || ""),
              gender: getGenderLabel(user.gender || ""),
              education: fallbackEducationLabel,
              institution: fallbackInstitutionName,
              faculty: fallbackFacultyName,
              major: fallbackIsHighSchool
                ? (studentProfile?.studentNote || "-")
                : (studentProfile?.major || "-"),
              internshipPeriod: internshipPeriod,
              totalHours: studentProfile?.hours ? `${studentProfile.hours} ชั่วโมง` : "-",
              department: department?.name || defaultInternData.department,
              supervisor: supervisor?.name || defaultInternData.supervisor,
              supervisorEmail: supervisor?.email || defaultInternData.supervisorEmail,
              supervisorPhone: supervisor?.phone || defaultInternData.supervisorPhone,
              mentorName: mentor?.name || defaultInternData.mentorName,
              mentorEmail: mentor?.email || defaultInternData.mentorEmail,
              mentorPhone: mentor?.phone || defaultInternData.mentorPhone,
              profileImage: studentProfile?.image || "",
            });

            if (studentProfile?.internshipStatus) {
              const statusMap: { [key: string]: string } = {
                "IN_PROGRESS": "อยู่ระหว่างการฝึกงาน",
                "COMPLETED": "ฝึกงานเสร็จสิ้น",
                "CANCELLED": "ยกเลิกฝึกงาน",
              };
              const mappedStatus = statusMap[studentProfile.internshipStatus];
              if (mappedStatus) {
                setCurrentStatus(mappedStatus);
              }
            }
            return; // สำเร็จแล้ว ไม่ต้อง fallback
          }
        } catch (profileError) {
          console.log("Profile API not available, falling back to session data");
        }

        // Fallback: ใช้ข้อมูลจาก Better Auth session + student profile API แยก
        const sessionData = await authApi.getSession();
        if (sessionData && sessionData.user) {
          const user = sessionData.user;
          console.log("Using session data:", user);

          // ลองดึง student profile แยก (ถ้ามี API)
          let studentData = null;
          try {
            studentData = await studentProfileApi.getMyStudentProfileFull();
          } catch {
            console.log("Student profile API not available");
          }

          // Format internship period if student data available
          let internshipPeriod = "-";
          let totalHours = "-";
          let institution = "-";
          let faculty = "-";
          let major = "-";
          let sessionEducationLabel = "-";

          // ลองใช้ข้อมูลจาก API ก่อน
          if (studentData?.studentProfile) {
            const sp = studentData.studentProfile;
            if (sp.startDate && sp.endDate) {
              internshipPeriod = `${formatDateThai(sp.startDate)} - ${formatDateThai(sp.endDate)}`;
            }
            totalHours = sp.hours ? `${sp.hours} ชั่วโมง` : "-";
            institution = studentData.institution?.name || "-";
            faculty = sp.faculty || "-";

            // ดึง education จาก institution type
            let sessionIsHighSchool = false;
            if (studentData.institution?.institutionsType) {
              const typeToEducation: { [key: string]: string } = {
                UNIVERSITY: "university",
                VOCATIONAL: "vocational",
                SCHOOL: "high_school",
                OTHERS: "other",
              };
              const eduKey = typeToEducation[studentData.institution.institutionsType] || "other";
              setEducationType(eduKey);
              sessionEducationLabel = getEducationLabel(eduKey);
              // สำหรับ "อื่น ๆ" — แสดงประเภทการศึกษาจาก studentNote
              if (eduKey === "other" && sp.studentNote) {
                sessionEducationLabel = sp.studentNote;
              }
              sessionIsHighSchool = eduKey === "high_school";
            }

            major = sessionIsHighSchool ? (sp.studentNote || "-") : (sp.major || "-");
          }
          // ถ้าไม่มีจาก API ลองใช้จาก session.user.studentProfile
          else if (user.studentProfile) {
            const sp = user.studentProfile;
            if (sp.startDate && sp.endDate) {
              internshipPeriod = `${formatDateThai(sp.startDate)} - ${formatDateThai(sp.endDate)}`;
            }
            totalHours = sp.hours ? `${sp.hours} ชั่วโมง` : "-";
            faculty = sp.faculty || "-";

            // ดึง institution จาก API
            let sessionIsHighSchool2 = false;
            if (sp.institutionId) {
              try {
                const inst = await institutionApi.getInstitutionById(sp.institutionId);
                if (inst) {
                  institution = inst.name;
                  const typeToEducation: { [key: string]: string } = {
                    UNIVERSITY: "university",
                    VOCATIONAL: "vocational",
                    SCHOOL: "high_school",
                    OTHERS: "other",
                  };
                  const eduKey = typeToEducation[inst.institutionsType] || "other";
                  setEducationType(eduKey);
                  sessionEducationLabel = getEducationLabel(eduKey);
                  // สำหรับ "อื่น ๆ" — แสดงประเภทการศึกษาจาก studentNote
                  if (eduKey === "other" && sp.studentNote) {
                    sessionEducationLabel = sp.studentNote;
                  }
                  sessionIsHighSchool2 = eduKey === "high_school";
                }
              } catch {
                console.log("Cannot fetch institution data");
              }
            }

            major = sessionIsHighSchool2 ? (sp.studentNote || "-") : (sp.major || "-");
          }

          setInternData({
            fullName: `${user.fname || ""} ${user.lname || ""}`.trim() || user.name || "-",
            email: user.email || "-",
            phone: formatPhone(user.phoneNumber || ""),
            gender: getGenderLabel(user.gender || ""),
            education: sessionEducationLabel,
            institution: institution,
            faculty: faculty,
            major: major,
            internshipPeriod: internshipPeriod,
            totalHours: totalHours,
            department: defaultInternData.department,
            supervisor: defaultInternData.supervisor,
            supervisorEmail: defaultInternData.supervisorEmail,
            supervisorPhone: defaultInternData.supervisorPhone,
            mentorName: defaultInternData.mentorName,
            mentorEmail: defaultInternData.mentorEmail,
            mentorPhone: defaultInternData.mentorPhone,
            profileImage: "",
          });
        } else {
          // ไม่มี session - แสดงข้อมูลว่าง
          setInternData({
            ...defaultInternData,
            fullName: "-",
            email: "-",
            phone: "-",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setInternData({
          ...defaultInternData,
          fullName: "-",
          email: "-",
          phone: "-",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarIntern />
        <VideoLoading message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarIntern />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <>
          {/* Top Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            {/* Mobile: Name with edit icon on same row */}
            <div className="flex items-start justify-between gap-2 sm:hidden">
              <h1 className="text-lg font-bold text-gray-900">
                {internData.fullName}
              </h1>
              {/* Edit icon - Mobile only */}
              <Link
                href="/intern-profile/edit"
                className="
                group
                inline-flex items-center justify-center
                bg-gray-200
                hover:bg-primary-600
                transition-colors
                p-2.5
                rounded-xl
                text-gray-600
                hover:text-white
                shrink-0
                active:scale-95
              "
              >
                <svg
                  width="18"
                  height="19"
                  viewBox="0 0 20 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-600 group-hover:text-white transition-colors active:text-primary-600"
                >
                  <path
                    d="M2 20.025C1.45 20.025 0.979167 19.8292 0.5875 19.4375C0.195833 19.0458 0 18.575 0 18.025V4.025C0 3.475 0.195833 3.00417 0.5875 2.6125C0.979167 2.22083 1.45 2.025 2 2.025H8.525C8.85833 2.025 9.10833 2.12917 9.275 2.3375C9.44167 2.54583 9.525 2.775 9.525 3.025C9.525 3.275 9.4375 3.50417 9.2625 3.7125C9.0875 3.92083 8.83333 4.025 8.5 4.025H2V18.025H16V11.5C16 11.1667 16.1042 10.9167 16.3125 10.75C16.5208 10.5833 16.75 10.5 17 10.5C17.25 10.5 17.4792 10.5833 17.6875 10.75C17.8958 10.9167 18 11.1667 18 11.5V18.025C18 18.575 17.8042 19.0458 17.4125 19.4375C17.0208 19.8292 16.55 20.025 16 20.025H2ZM6 13.025V10.6C6 10.3333 6.05 10.0792 6.15 9.8375C6.25 9.59583 6.39167 9.38333 6.575 9.2L15.175 0.6C15.375 0.4 15.6 0.25 15.85 0.15C16.1 0.05 16.35 0 16.6 0C16.8667 0 17.1208 0.05 17.3625 0.15C17.6042 0.25 17.825 0.4 18.025 0.6L19.425 2.025C19.6083 2.225 19.75 2.44583 19.85 2.6875C19.95 2.92917 20 3.175 20 3.425C20 3.675 19.9542 3.92083 19.8625 4.1625C19.7708 4.40417 19.625 4.625 19.425 4.825L10.825 13.425C10.6417 13.6083 10.4292 13.7542 10.1875 13.8625C9.94583 13.9708 9.69167 14.025 9.425 14.025H7C6.71667 14.025 6.47917 13.9292 6.2875 13.7375C6.09583 13.5458 6 13.3083 6 13.025ZM8 12.025H9.4L15.2 6.225L14.5 5.525L13.775 4.825L8 10.6V12.025Z"
                    fill="currentColor"
                  />
                </svg>
              </Link>
            </div>

            {/* Mobile: Status badge - only show if status exists */}
            {currentStatus && (
              <div className="flex items-center gap-2 mt-2 sm:hidden">
                <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full ${currentStatus === "อยู่ระหว่างการฝึกงาน" ? "bg-green-100 border border-green-300" :
                    currentStatus === "ยกเลิกฝึกงาน" ? "bg-red-100 border border-red-300" :
                      currentStatus === "ฝึกงานเสร็จสิ้น" ? "bg-blue-100 border border-blue-300" :
                        "bg-yellow-100 border border-yellow-300"
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${currentStatus === "อยู่ระหว่างการฝึกงาน" ? "bg-green-500" :
                      currentStatus === "ยกเลิกฝึกงาน" ? "bg-red-500" :
                        currentStatus === "ฝึกงานเสร็จสิ้น" ? "bg-blue-500" :
                          "bg-yellow-500"
                    }`}></span>
                  <span className={`text-xs font-medium ${currentStatus === "อยู่ระหว่างการฝึกงาน" ? "text-green-700" :
                      currentStatus === "ยกเลิกฝึกงาน" ? "text-red-700" :
                        currentStatus === "ฝึกงานเสร็จสิ้น" ? "text-blue-700" :
                          "text-yellow-700"
                    }`}>
                    {currentStatus}
                  </span>
                </span>
              </div>
            )}

            {/* Desktop layout */}
            <div className="hidden sm:flex sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {internData.fullName}
                </h1>
                {currentStatus && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${currentStatus === "อยู่ระหว่างการฝึกงาน" ? "bg-green-100 border border-green-300" :
                        currentStatus === "ยกเลิกฝึกงาน" ? "bg-red-100 border border-red-300" :
                          currentStatus === "ฝึกงานเสร็จสิ้น" ? "bg-blue-100 border border-blue-300" :
                            "bg-yellow-100 border border-yellow-300"
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${currentStatus === "อยู่ระหว่างการฝึกงาน" ? "bg-green-500" :
                          currentStatus === "ยกเลิกฝึกงาน" ? "bg-red-500" :
                            currentStatus === "ฝึกงานเสร็จสิ้น" ? "bg-blue-500" :
                              "bg-yellow-500"
                        }`}></span>
                      <span className={`text-sm font-medium ${currentStatus === "อยู่ระหว่างการฝึกงาน" ? "text-green-700" :
                          currentStatus === "ยกเลิกฝึกงาน" ? "text-red-700" :
                            currentStatus === "ฝึกงานเสร็จสิ้น" ? "text-blue-700" :
                              "text-yellow-700"
                        }`}>
                        {currentStatus}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Edit button - Desktop */}
              <Link
                href="/intern-profile/edit"
                className="
                group
                inline-flex items-center justify-center gap-3
                bg-gray-200
                hover:bg-primary-600
                transition-colors
                px-6 py-3
                rounded-xl
                font-medium
                text-gray-600
                hover:text-white
                active:scale-95
              "
              >
                แก้ไขข้อมูลทั้งหมด
                <span className="w-6 h-6 flex items-center justify-center">
                  <svg
                    width="20"
                    height="21"
                    viewBox="0 0 20 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-600 group-hover:text-white transition-colors"
                  >
                    <path
                      d="M2 20.025C1.45 20.025 0.979167 19.8292 0.5875 19.4375C0.195833 19.0458 0 18.575 0 18.025V4.025C0 3.475 0.195833 3.00417 0.5875 2.6125C0.979167 2.22083 1.45 2.025 2 2.025H8.525C8.85833 2.025 9.10833 2.12917 9.275 2.3375C9.44167 2.54583 9.525 2.775 9.525 3.025C9.525 3.275 9.4375 3.50417 9.2625 3.7125C9.0875 3.92083 8.83333 4.025 8.5 4.025H2V18.025H16V11.5C16 11.1667 16.1042 10.9167 16.3125 10.75C16.5208 10.5833 16.75 10.5 17 10.5C17.25 10.5 17.4792 10.5833 17.6875 10.75C17.8958 10.9167 18 11.1667 18 11.5V18.025C18 18.575 17.8042 19.0458 17.4125 19.4375C17.0208 19.8292 16.55 20.025 16 20.025H2ZM6 13.025V10.6C6 10.3333 6.05 10.0792 6.15 9.8375C6.25 9.59583 6.39167 9.38333 6.575 9.2L15.175 0.6C15.375 0.4 15.6 0.25 15.85 0.15C16.1 0.05 16.35 0 16.6 0C16.8667 0 17.1208 0.05 17.3625 0.15C17.6042 0.25 17.825 0.4 18.025 0.6L19.425 2.025C19.6083 2.225 19.75 2.44583 19.85 2.6875C19.95 2.92917 20 3.175 20 3.425C20 3.675 19.9542 3.92083 19.8625 4.1625C19.7708 4.40417 19.625 4.625 19.425 4.825L10.825 13.425C10.6417 13.6083 10.4292 13.7542 10.1875 13.8625C9.94583 13.9708 9.69167 14.025 9.425 14.025H7C6.71667 14.025 6.47917 13.9292 6.2875 13.7375C6.09583 13.5458 6 13.3083 6 13.025ZM8 12.025H9.4L15.2 6.225L14.5 5.525L13.775 4.825L8 10.6V12.025Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Detail Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 sm:mt-6 p-4 sm:p-6">
            {/* Personal Info */}
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              ข้อมูลส่วนตัว
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              <FieldCard icon={IconMail} label="อีเมล" value={internData.email} />
              <FieldCard
                icon={IconPhone}
                label="เบอร์โทร"
                value={internData.phone}
              />
              <FieldCard
                icon={IconGender}
                label="เพศ"
                value={internData.gender}
              />
            </div>

            {/* Education */}
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 sm:mt-8 mb-3 sm:mb-4">
              ข้อมูลการศึกษา
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              <FieldCard
                icon={IconGrad}
                label="การศึกษาปัจจุบัน"
                value={internData.education}
              />
              <FieldCard
                icon={IconSchool}
                label="ชื่อสถาบัน"
                value={internData.institution}
              />
              {/* Show faculty only for university and other */}
              {(educationType === "university" || educationType === "other") && (
                <FieldCard
                  icon={IconSchool}
                  label="คณะ"
                  value={internData.faculty}
                />
              )}
              <FieldCard
                icon={IconBook}
                label={
                  educationType === "high_school" ? "แผนการเรียน" : "สาขาวิชา"
                }
                value={internData.major}
              />
            </div>

            {/* Internship - only show if has application */}
            {hasApplication && (
              <>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 sm:mt-8 mb-3 sm:mb-4">
                  ข้อมูลการฝึกงาน
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                  <FieldCard
                    icon={IconCalendar}
                    label="ระยะเวลาที่ฝึก"
                    value={internData.internshipPeriod}
                  />
                  <FieldCard
                    icon={IconClock}
                    label="ชั่วโมงที่ต้องฝึก"
                    value={internData.totalHours}
                  />
                </div>
              </>
            )}

            {/* Department / Owner Info - only show if has application */}
            {hasApplication && applicationPosition && (
              <>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 sm:mt-8 mb-3 sm:mb-4">
                  ข้อมูลผู้ประกาศรับสมัคร
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                  <FieldCard
                    icon={IconWork}
                    label="ชื่อกองงาน"
                    value={applicationPosition.department?.deptFull || applicationPosition.department?.deptShort || "-"}
                  />
                  <FieldCard
                    icon={IconUser}
                    label="ชื่อผู้ติดต่อ"
                    value={(() => {
                      const ownerData = applicationPosition.owner || (applicationPosition.owners && applicationPosition.owners.length > 0 ? applicationPosition.owners[0] : null);
                      return ownerData ? `${ownerData.fname || ""} ${ownerData.lname || ""}`.trim() || "-" : "-";
                    })()}
                  />
                  <FieldCard
                    icon={IconMail}
                    label="อีเมลผู้ติดต่อ"
                    value={(() => {
                      const ownerData = applicationPosition.owner || (applicationPosition.owners && applicationPosition.owners.length > 0 ? applicationPosition.owners[0] : null);
                      return ownerData?.email || "-";
                    })()}
                  />
                  <FieldCard
                    icon={IconPhone}
                    label="เบอร์โทรกองงาน"
                    value={(() => {
                      const ownerData = applicationPosition.owner || (applicationPosition.owners && applicationPosition.owners.length > 0 ? applicationPosition.owners[0] : null);
                      return ownerData?.phoneNumber || "-";
                    })()}
                  />
                </div>
              </>
            )}

            {/* Mentor Info - only show if has application and mentors exist */}
            {hasApplication && applicationPosition && applicationPosition.mentors && applicationPosition.mentors.length > 0 && (
              <>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 sm:mt-8 mb-3 sm:mb-4">
                  ข้อมูลพี่เลี้ยง
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                  <FieldCard
                    icon={IconUser}
                    label="ชื่อพี่เลี้ยง"
                    value={applicationPosition.mentors[0].name || "-"}
                  />
                  <FieldCard
                    icon={IconMail}
                    label="อีเมลพี่เลี้ยง"
                    value={applicationPosition.mentors[0].email || "-"}
                  />
                  <FieldCard
                    icon={IconPhone}
                    label="เบอร์โทรติดต่อพี่เลี้ยง"
                    value={applicationPosition.mentors[0].phoneNumber || "-"}
                  />
                </div>
              </>
            )}
          </div>
        </>
      </main>
    </div>
  );
}
