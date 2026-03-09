// Mock Applications Data สำหรับ Admin (ตรวจเอกสาร)

export type AdminDocumentStatus = "pending" | "approved" | "rejected";

export interface AdminApplication {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  institution: string;
  education?: string;
  faculty?: string;
  major?: string;
  studentNote?: string;
  trainingHours: number;
  appliedDate: string; // วันที่ยื่น
  trainingStartDate: string; // วันที่เริ่มฝึก
  trainingEndDate: string; // วันที่สิ้นสุดฝึก
  documentStatus: AdminDocumentStatus; // สถานะเอกสาร
  documents: {
    name: string;
    type: string;
    url?: string;
  }[];
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// Mock Admin Applications
export const mockAdminApplications: AdminApplication[] = [
  {
    id: "admin-app-001",
    firstName: "นายกาญจพงศ์",
    lastName: "ตั้งเจริญนาม",
    phone: "091-1234566",
    email: "Kapco@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "10/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "pending",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ]
  },
  {
    id: "admin-app-002",
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "rejected",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ],
    rejectionReason: "เอกสารไม่ครบถ้วน"
  },
  {
    id: "admin-app-003",
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "approved",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ],
    reviewedAt: "มกราคม 8, 2026, 12:23:12 น.",
    reviewedBy: "admin"
  },
  {
    id: "admin-app-004",
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "approved",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ],
    reviewedAt: "มกราคม 8, 2026, 12:22:12 น.",
    reviewedBy: "admin"
  },
  {
    id: "admin-app-005",
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "pending",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ]
  },
  {
    id: "admin-app-006",
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "approved",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ],
    reviewedAt: "มกราคม 8, 2026, 12:20:12 น.",
    reviewedBy: "admin"
  },
  {
    id: "admin-app-007",
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "approved",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ],
    reviewedAt: "มกราคม 8, 2026, 12:18:12 น.",
    reviewedBy: "admin"
  },
  {
    id: "admin-app-008",
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "approved",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ],
    reviewedAt: "มกราคม 8, 2026, 12:17:12 น.",
    reviewedBy: "admin"
  },
  {
    id: "admin-app-009",
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "approved",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ],
    reviewedAt: "มกราคม 7, 2026, 14:32:18 น.",
    reviewedBy: "admin"
  },
  {
    id: "admin-app-010",
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: "approved",
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ],
    reviewedAt: "มกราคม 7, 2026, 13:20:18 น.",
    reviewedBy: "admin"
  },
  // เพิ่มข้อมูลเพิ่มเติมเพื่อให้ครบ 28 รายการ
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `admin-app-${String(i + 11).padStart(3, '0')}`,
    firstName: "นางสาวภพร",
    lastName: "ชุนนะ",
    phone: "091-1234567",
    email: "Kap@gmail.com",
    institution: "มหาวิทยาลัยราชภัฏพระนคร",
    trainingHours: 450,
    appliedDate: "27/9/2568",
    trainingStartDate: "3/11/2568",
    trainingEndDate: "27/2/2569",
    documentStatus: (i % 3 === 0 ? "pending" : i % 3 === 1 ? "approved" : "rejected") as AdminDocumentStatus,
    documents: [
      { name: "Transcript", type: "transcript" },
      { name: "หนังสือขอความอนุเคราะห์", type: "request_letter" }
    ],
    reviewedAt: i % 3 === 1 ? `มกราคม 7, 2026, 12:52:18 น.` : undefined,
    reviewedBy: i % 3 === 1 ? "admin" : undefined
  }))
];

// Get application stats for admin
export const getAdminApplicationStats = () => {
  const total = mockAdminApplications.length;
  const pending = mockAdminApplications.filter(a => a.documentStatus === "pending").length;
  const approved = mockAdminApplications.filter(a => a.documentStatus === "approved").length;
  const rejected = mockAdminApplications.filter(a => a.documentStatus === "rejected").length;

  return {
    total,
    pending,
    approved,
    rejected,
    pendingPercentage: ((pending / total) * 100).toFixed(2),
    approvedPercentage: ((approved / total) * 100).toFixed(2),
    rejectedPercentage: ((rejected / total) * 100).toFixed(2)
  };
};

// Get recent review history
export const getRecentReviews = () => {
  return mockAdminApplications
    .filter(a => a.reviewedAt)
    .sort((a, b) => {
      // Sort by reviewedAt descending
      return (b.reviewedAt || "").localeCompare(a.reviewedAt || "");
    })
    .slice(0, 8);
};

// Get applications waiting for review
export const getPendingApplications = () => {
  return mockAdminApplications.filter(a => a.documentStatus === "pending");
};

// Get status label in Thai
export const getStatusLabel = (status: AdminDocumentStatus): string => {
  const labels: Record<AdminDocumentStatus, string> = {
    pending: "รอตรวจเอกสาร",
    approved: "ตรวจผ่านแล้ว",
    rejected: "เอกสารไม่ผ่าน"
  };
  return labels[status];
};

// Get status color
export const getStatusColor = (status: AdminDocumentStatus): string => {
  const colors: Record<AdminDocumentStatus, string> = {
    pending: "text-yellow-600",
    approved: "text-green-600",
    rejected: "text-red-600"
  };
  return colors[status];
};

// Get status badge color
export const getStatusBadgeColor = (status: AdminDocumentStatus): string => {
  const colors: Record<AdminDocumentStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700"
  };
  return colors[status];
};
