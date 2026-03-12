// Mock Applications Data สำหรับแดชบอร์ด Owner

export type ApplicationStatus = "pending" | "reviewing" | "interview" | "accepted" | "rejected" | "cancelled";

// Extended status for detailed workflow
export type DetailedStatus =
  | "waiting_document"      // ขั้นตอนที่ 1 - รอเอกสารจากผู้สมัคร
  | "waiting_interview"     // ขั้นตอนที่ 2 - สัมภาษณ์ผู้สมัคร
  | "waiting_confirm"       // ขั้นตอนที่ 3 - ยืนยันสถานะการสมัคร
  | "rejected"              // ขั้นตอนที่ 3 - ไม่ผ่าน (ยืนยันสถานะการสมัคร)
  | "waiting_analysis_doc"  // ขั้นตอนที่ 4 - รอเอกสารขอความอนุเคราะห์จากผู้สมัคร
  | "waiting_send_doc"      // (deprecated) เดิมเป็นขั้นตอนที่ 5 - ถูกรวมเข้ากับ doc_sent
  | "doc_rejected"          // ขั้นตอนที่ 5 - เอกสารไม่ผ่าน (รอ HR ตรวจสอบความถูกต้องเอกสาร)
  | "doc_sent"              // ขั้นตอนที่ 5 - ส่งเอกสารแล้ว (รอ HR ตรวจสอบความถูกต้องเอกสาร)
  | "doc_passed"            // ขั้นตอนที่ 6 - เอกสารผ่าน (รับผู้สมัครฝึกงานเรียบร้อยแล้ว)
  | "completed"             // ขั้นตอนที่ 6 - รับผู้สมัครฝึกงานเรียบร้อยแล้ว
  | "cancelled";            // ยกเลิกฝึกงาน

export interface Application {
  id: string;
  internId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  education: string;
  institution: string;
  major: string;
  startDate: string;
  endDate: string;
  trainingHours: number;
  department: string;
  position: string;
  status: ApplicationStatus;
  detailedStatus?: DetailedStatus;
  appliedDate: string;
  gender: "male" | "female";
  expectation: string;
  documents: {
    name: string;
    type: string;
    docFile?: string;
  }[];
  analysisDocuments?: {
    name: string;
    type: string;
    status: "pending" | "approved" | "rejected";
    docFile?: string;
  }[];
  step: number;
  stepDescription: string;
  isNearStart?: boolean;
  daysUntilStart?: number;
  interviewCompleted?: boolean;
  rejectionReason?: string;
  // Cancellation fields
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledDate?: string;
  // Additional education fields
  faculty?: string;
  studentNote?: string;
  // Mentor data from API
  mentors?: {
    fname: string | null;
    lname: string | null;
    email: string | null;
    phone: string | null;
  }[];
  // Skill info
  skill?: string;
  // Action date (updatedAt from API - when the last status change happened)
  actionDate?: string;
  // Student internship status from backend
  studentInternshipStatus?: string | null;
  isActive?: boolean;
}

// Mentor type
export interface Mentor {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Mock mentors data
export const mockMentors: Mentor[] = [
  {
    id: "mentor-001",
    name: "นายมั่นคง ทรงดี",
    email: "songdee@gmail.com",
    phone: "02-2000023",
  },
  {
    id: "mentor-002",
    name: "นางสาวสุดา แสงทอง",
    email: "suda.s@gmail.com",
    phone: "02-2000045",
  },
  {
    id: "mentor-003",
    name: "นายวีระ ชัยชนะ",
    email: "weera.c@gmail.com",
    phone: "02-2000067",
  },
];

// Mock Applications
export const mockApplications: Application[] = [
  // ขั้นตอนที่ 1 - รอเอกสาร
  {
    id: "app-001",
    internId: "intern-001",
    firstName: "สมชาย",
    lastName: "ใจดี",
    email: "Kap@gmail.com",
    phone: "091-2345678",
    education: "university",
    institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    major: "เทคโนโลยีสารสนเทศ",
    startDate: "2568-11-03",
    endDate: "2569-02-27",
    trainingHours: 540,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "pending",
    detailedStatus: "waiting_document",
    appliedDate: "2568-10-15",
    gender: "male",
    expectation: "คาดหวังว่าจะได้เรียนรู้กระบวนการทำงานด้าน UX/UI จากการทำงานจริงได้พัฒนาทักษะได้พัฒนาทักษะการออกแบบและการใช้เครื่องมือออกแบบ พร้อมทั้งเข้าใจผู้ใช้งานมากขึ้นเพื่อนำความรู้และประสบการณ์ไปต่อยอดในการทำงานในอนาคต",
    documents: [],
    step: 1,
    stepDescription: "รอเอกสารจากผู้สมัคร"
  },
  // ขั้นตอนที่ 2 - รอสัมภาษณ์
  {
    id: "app-002",
    internId: "intern-002",
    firstName: "ธนพล",
    lastName: "วงศ์สว่าง",
    email: "Kap@gmail.com",
    phone: "091-2345678",
    education: "university",
    institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    major: "เทคโนโลยีสารสนเทศ",
    startDate: "2568-11-03",
    endDate: "2569-02-27",
    trainingHours: 540,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "interview",
    detailedStatus: "waiting_interview",
    appliedDate: "2568-10-20",
    gender: "male",
    expectation: "คาดหวังว่าจะได้เรียนรู้กระบวนการทำงานด้าน UX/UI จากการทำงานจริงได้พัฒนาทักษะได้พัฒนาทักษะการออกแบบและการใช้เครื่องมือออกแบบ พร้อมทั้งเข้าใจผู้ใช้งานมากขึ้นเพื่อนำความรู้และประสบการณ์ไปต่อยอดในการทำงานในอนาคต",
    documents: [
      { name: "Transcript.PDF", type: "transcript" },
      { name: "Portfolio.PDF", type: "portfolio" }
    ],
    step: 2,
    stepDescription: "สัมภาษณ์ผู้สมัคร",
    interviewCompleted: false
  },
  // ขั้นตอนที่ 3 - รอการยืนยัน
  {
    id: "app-003",
    internId: "intern-003",
    firstName: "ปิยะ",
    lastName: "แสงทอง",
    email: "Kap@gmail.com",
    phone: "091-2345678",
    education: "university",
    institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    major: "เทคโนโลยีสารสนเทศ",
    startDate: "2568-11-03",
    endDate: "2569-02-27",
    trainingHours: 540,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "reviewing",
    detailedStatus: "waiting_confirm",
    appliedDate: "2568-10-18",
    gender: "male",
    expectation: "คาดหวังว่าจะได้เรียนรู้กระบวนการทำงานด้าน UX/UI จากการทำงานจริงได้พัฒนาทักษะได้พัฒนาทักษะการออกแบบและการใช้เครื่องมือออกแบบ พร้อมทั้งเข้าใจผู้ใช้งานมากขึ้นเพื่อนำความรู้และประสบการณ์ไปต่อยอดในการทำงานในอนาคต",
    documents: [
      { name: "Transcript.PDF", type: "transcript" },
      { name: "Portfolio.PDF", type: "portfolio" }
    ],
    step: 3,
    stepDescription: "ยืนยันสถานะการสมัคร",
    interviewCompleted: true
  },
  // ขั้นตอนที่ 3 - ไม่ผ่าน
  {
    id: "app-004",
    internId: "intern-004",
    firstName: "กิตติ",
    lastName: "รุ่งเรือง",
    email: "Kap@gmail.com",
    phone: "091-2345678",
    education: "university",
    institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    major: "เทคโนโลยีสารสนเทศ",
    startDate: "2568-11-03",
    endDate: "2569-02-27",
    trainingHours: 540,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "rejected",
    detailedStatus: "rejected",
    appliedDate: "2568-10-22",
    gender: "male",
    expectation: "คาดหวังว่าจะได้เรียนรู้กระบวนการทำงานด้าน UX/UI จากการทำงานจริงได้พัฒนาทักษะได้พัฒนาทักษะการออกแบบและการใช้เครื่องมือออกแบบ พร้อมทั้งเข้าใจผู้ใช้งานมากขึ้นเพื่อนำความรู้และประสบการณ์ไปต่อยอดในการทำงานในอนาคต",
    documents: [
      { name: "Transcript.PDF", type: "transcript" },
      { name: "Portfolio.PDF", type: "portfolio" }
    ],
    step: 3,
    stepDescription: "ยืนยันสถานะการสมัคร"
  },
  // ขั้นตอนที่ 4 - รอเอกสารขอความอนุเคราะห์
  {
    id: "app-005",
    internId: "intern-005",
    firstName: "นภัส",
    lastName: "พงษ์พิพัฒน์",
    email: "Kap@gmail.com",
    phone: "091-2345678",
    education: "university",
    institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    major: "เทคโนโลยีสารสนเทศ",
    startDate: "2568-11-03",
    endDate: "2569-02-27",
    trainingHours: 540,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "accepted",
    detailedStatus: "waiting_analysis_doc",
    appliedDate: "2568-10-10",
    gender: "male",
    expectation: "คาดหวังว่าจะได้เรียนรู้กระบวนการทำงานด้าน UX/UI จากการทำงานจริงได้พัฒนาทักษะได้พัฒนาทักษะการออกแบบและการใช้เครื่องมือออกแบบ พร้อมทั้งเข้าใจผู้ใช้งานมากขึ้นเพื่อนำความรู้และประสบการณ์ไปต่อยอดในการทำงานในอนาคต",
    documents: [
      { name: "Transcript.PDF", type: "transcript" },
      { name: "Portfolio.PDF", type: "portfolio" }
    ],
    analysisDocuments: [],
    step: 4,
    stepDescription: "รอเอกสารขอความอนุเคราะห์จากผู้สมัคร"
  },
  // ขั้นตอนที่ 5 - รอ HR ตรวจสอบความถูกต้องเอกสาร (ส่งเอกสารแล้ว)
  {
    id: "app-006",
    internId: "intern-006",
    firstName: "พีรพัฒน์",
    lastName: "ศรีสุข",
    email: "Kap@gmail.com",
    phone: "091-2345678",
    education: "university",
    institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    major: "เทคโนโลยีสารสนเทศ",
    startDate: "2568-11-03",
    endDate: "2569-02-27",
    trainingHours: 540,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "accepted",
    detailedStatus: "doc_sent",
    appliedDate: "2568-09-20",
    gender: "male",
    expectation: "คาดหวังว่าจะได้เรียนรู้กระบวนการทำงานด้าน UX/UI จากการทำงานจริงได้พัฒนาทักษะได้พัฒนาทักษะการออกแบบและการใช้เครื่องมือออกแบบ พร้อมทั้งเข้าใจผู้ใช้งานมากขึ้นเพื่อนำความรู้และประสบการณ์ไปต่อยอดในการทำงานในอนาคต",
    documents: [
      { name: "Transcript.PDF", type: "transcript" },
      { name: "Portfolio.PDF", type: "portfolio" }
    ],
    analysisDocuments: [
      { name: "เอกสารขอความอนุเคราะห์.PDF", type: "analysis", status: "pending" }
    ],
    step: 5,
    stepDescription: "รอ HR ตรวจสอบความถูกต้องเอกสาร"
  },
  // ขั้นตอนที่ 6 - เอกสารไม่ผ่าน - ส่งเอกสารแล้ว
  {
    id: "app-007",
    internId: "intern-007",
    firstName: "อนุชา",
    lastName: "มั่นคง",
    email: "Kap@gmail.com",
    phone: "091-2345678",
    education: "university",
    institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    major: "เทคโนโลยีสารสนเทศ",
    startDate: "2568-11-03",
    endDate: "2569-02-27",
    trainingHours: 540,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "accepted",
    detailedStatus: "doc_rejected",
    appliedDate: "2568-10-05",
    gender: "male",
    expectation: "คาดหวังว่าจะได้เรียนรู้กระบวนการทำงานด้าน UX/UI จากการทำงานจริงได้พัฒนาทักษะได้พัฒนาทักษะการออกแบบและการใช้เครื่องมือออกแบบ พร้อมทั้งเข้าใจผู้ใช้งานมากขึ้นเพื่อนำความรู้และประสบการณ์ไปต่อยอดในการทำงานในอนาคต",
    documents: [
      { name: "Transcript.PDF", type: "transcript" },
      { name: "Portfolio.PDF", type: "portfolio" }
    ],
    analysisDocuments: [
      { name: "เอกสารขอความอนุเคราะห์.PDF", type: "analysis", status: "rejected" }
    ],
    step: 5,
    stepDescription: "รอ HR ตรวจสอบความถูกต้องเอกสาร",
    rejectionReason: "ใบขอความอนุเคราะห์แจ้งวันที่ฝึกไม่ตรงกับที่กรอกเข้ามา"
  },

  {
    id: "app-008",
    internId: "intern-008",
    firstName: "ศุภกร",
    lastName: "เจริญผล",
    email: "Kap@gmail.com",
    phone: "091-2345678",
    education: "university",
    institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    major: "เทคโนโลยีสารสนเทศ",
    startDate: "2568-11-03",
    endDate: "2569-02-27",
    trainingHours: 540,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "accepted",
    detailedStatus: "doc_sent",
    appliedDate: "2568-10-05",
    gender: "male",
    expectation: "คาดหวังว่าจะได้เรียนรู้กระบวนการทำงานด้าน UX/UI จากการทำงานจริงได้พัฒนาทักษะได้พัฒนาทักษะการออกแบบและการใช้เครื่องมือออกแบบ พร้อมทั้งเข้าใจผู้ใช้งานมากขึ้นเพื่อนำความรู้และประสบการณ์ไปต่อยอดในการทำงานในอนาคต",
    documents: [
      { name: "Transcript.PDF", type: "transcript" },
      { name: "Portfolio.PDF", type: "portfolio" }
    ],
    analysisDocuments: [
      { name: "เอกสารขอความอนุเคราะห์.PDF", type: "analysis", status: "approved" }
    ],
    step: 5,
    stepDescription: "รอ HR ตรวจสอบความถูกต้องเอกสาร",
  },
  // ขั้นตอนที่ 6 - เอกสารผ่าน / เรียบร้อย
  {
    id: "app-009",
    internId: "intern-009",
    firstName: "ภูมิ",
    lastName: "สุขสมบูรณ์",
    email: "Kap@gmail.com",
    phone: "091-2345678",
    education: "university",
    institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    major: "เทคโนโลยีสารสนเทศ",
    startDate: "2568-11-03",
    endDate: "2569-02-27",
    trainingHours: 540,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "accepted",
    detailedStatus: "doc_passed",
    appliedDate: "2568-10-25",
    gender: "male",
    expectation: "คาดหวังว่าจะได้เรียนรู้กระบวนการทำงานด้าน UX/UI จากการทำงานจริงได้พัฒนาทักษะได้พัฒนาทักษะการออกแบบและการใช้เครื่องมือออกแบบ พร้อมทั้งเข้าใจผู้ใช้งานมากขึ้นเพื่อนำความรู้และประสบการณ์ไปต่อยอดในการทำงานในอนาคต",
    documents: [
      { name: "Transcript.PDF", type: "transcript" },
      { name: "Portfolio.PDF", type: "portfolio" }
    ],
    analysisDocuments: [
      { name: "เอกสารขอความอนุเคราะห์.PDF", type: "analysis", status: "approved" }
    ],
    step: 6,
    stepDescription: "รับผู้สมัครฝึกงานเรียบร้อยแล้ว",
    isNearStart: true,
    daysUntilStart: 3
  },
  // ยกเลิกฝึกงาน - Cancelled
  {
    id: "app-010",
    internId: "intern-010",
    firstName: "วิชัย",
    lastName: "สุขสันต์",
    email: "wichai@gmail.com",
    phone: "089-1234567",
    education: "university",
    institution: "มหาวิทยาลัยเกษตรศาสตร์",
    major: "วิศวกรรมคอมพิวเตอร์",
    startDate: "2568-10-01",
    endDate: "2569-01-31",
    trainingHours: 480,
    department: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    position: "กองออกแบบและพัฒนาระบบดิจิทัล 1",
    status: "cancelled",
    detailedStatus: "cancelled",
    appliedDate: "2568-09-15",
    gender: "male",
    expectation: "ต้องการเรียนรู้การพัฒนาระบบและเทคโนโลยีใหม่ๆ",
    documents: [
      { name: "Transcript.PDF", type: "transcript" },
      { name: "Portfolio.PDF", type: "portfolio" }
    ],
    analysisDocuments: [
      {
        name: "เอกสารขอความอนุเคราะห์.PDF", type: "analysis",
        status: "pending"
      }
    ],
    step: 0,
    stepDescription: "ยกเลิกฝึกงาน",
    cancellationReason: "นักศึกษาแจ้งยกเลิกเนื่องจากได้รับการตอบรับจากที่อื่นก่อน",
    cancelledBy: "นายสมศักดิ์ มั่นคง",
    cancelledDate: "2568-09-20"
  }
];

// Get statistics
export const getApplicationStats = () => {
  const total = mockApplications.length;
  const pending = mockApplications.filter(a => a.status === "pending" || a.status === "reviewing" || a.status === "interview").length;
  const accepted = mockApplications.filter(a => a.status === "accepted").length;
  const rejected = mockApplications.filter(a => a.status === "rejected").length;
  const cancelled = mockApplications.filter(a => a.status === "cancelled").length;

  return { total, pending, accepted, rejected, cancelled };
};

// Get dynamic statistics (reads localStorage for user actions)
export const getDynamicApplicationStats = () => {
  const getFromStorage = (key: string): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const getCancelledFromStorage = (): { id: string; reason: string; cancelledBy: string; cancelledDate: string }[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("pea_cancelled_apps");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const approvedApps = getFromStorage("pea_approved_apps");
  const rejectedStoredApps = getFromStorage("pea_rejected_apps");
  const cancelledStoredApps = getCancelledFromStorage();
  const cancelledIds = cancelledStoredApps.map(c => c.id);

  let pending = 0,
    accepted = 0,
    rejected = 0,
    cancelled = 0;

  mockApplications.forEach((app) => {
    if (app.status === "cancelled" || cancelledIds.includes(app.id)) {
      cancelled++;
    } else if (app.status === "accepted" || approvedApps.includes(app.id)) {
      accepted++;
    } else if (rejectedStoredApps.includes(app.id) || app.status === "rejected") {
      rejected++;
    } else {
      pending++;
    }
  });

  return { total: mockApplications.length, pending, accepted, rejected, cancelled };
};

// Get applications near start date
export const getNearStartApplications = () => {
  return mockApplications.filter(a => a.isNearStart && a.status === "accepted");
};

// Get latest applications
export const getLatestApplications = (limit: number = 5) => {
  return [...mockApplications]
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
    .slice(0, limit);
};

// Get status label in Thai
export const getStatusLabel = (status: ApplicationStatus): string => {
  const labels: Record<ApplicationStatus, string> = {
    pending: "รอยื่นเอกสาร",
    reviewing: "รอการยืนยัน",
    interview: "รอสัมภาษณ์",
    accepted: "รับเข้าฝึกงาน",
    rejected: "ไม่ผ่าน",
    cancelled: "ยกเลิกฝึกงาน"
  };
  return labels[status];
};

// Get detailed status label in Thai
export const getDetailedStatusLabel = (detailedStatus?: DetailedStatus): string => {
  if (!detailedStatus) return "";
  const labels: Record<DetailedStatus, string> = {
    waiting_document: "รอยื่นเอกสาร",
    waiting_interview: "รอสัมภาษณ์",
    waiting_confirm: "รอการยืนยัน",
    rejected: "ไม่ผ่าน",
    waiting_analysis_doc: "รอเอกสารขอความอนุเคราะห์",
    waiting_send_doc: "รอการตรวจสอบ",
    doc_rejected: "เอกสารไม่ผ่าน",
    doc_sent: "ส่งเอกสารแล้ว",
    doc_passed: "เอกสารผ่าน",
    completed: "เรียบร้อย",
    cancelled: "ยกเลิกฝึกงาน"
  };
  return labels[detailedStatus];
};

// Get status color
export const getStatusColor = (status: ApplicationStatus): string => {
  const colors: Record<ApplicationStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    reviewing: "bg-orange-100 text-orange-700",
    interview: "bg-purple-100 text-purple-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700"
  };
  return colors[status];
};

// Get detailed status color
export const getDetailedStatusColor = (detailedStatus?: DetailedStatus): string => {
  if (!detailedStatus) return "bg-gray-100 text-gray-700";
  const colors: Record<DetailedStatus, string> = {
    waiting_document: "bg-yellow-100 text-yellow-700",
    waiting_interview: "bg-purple-100 text-purple-700",
    waiting_confirm: "bg-orange-100 text-orange-700",
    rejected: "bg-red-100 text-red-700",
    waiting_analysis_doc: "bg-yellow-100 text-yellow-700",
    waiting_send_doc: "bg-orange-100 text-orange-700",
    doc_rejected: "bg-red-100 text-red-700",
    doc_sent: "bg-green-100 text-green-700",
    doc_passed: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700"
  };
  return colors[detailedStatus];
};

// Filter applications by tab/status
export type FilterTab = "all" | "waiting_document" | "waiting_interview" | "waiting_confirm" | "accepted" | "rejected" | "cancelled";

export const filterApplicationsByTab = (tab: FilterTab): Application[] => {
  switch (tab) {
    case "all":
      return mockApplications;
    case "waiting_document":
      return mockApplications.filter(a => a.detailedStatus === "waiting_document");
    case "waiting_interview":
      return mockApplications.filter(a => a.detailedStatus === "waiting_interview");
    case "waiting_confirm":
      return mockApplications.filter(a => a.detailedStatus === "waiting_confirm");
    case "accepted":
      return mockApplications.filter(a => a.status === "accepted");
    case "rejected":
      return mockApplications.filter(a => a.status === "rejected");
    default:
      return mockApplications;
  }
};

// Get tab counts
export const getTabCounts = () => {
  return {
    all: mockApplications.length,
    waiting_document: mockApplications.filter(a => a.detailedStatus === "waiting_document").length,
    waiting_interview: mockApplications.filter(a => a.detailedStatus === "waiting_interview").length,
    waiting_confirm: mockApplications.filter(a => a.detailedStatus === "waiting_confirm").length,
    accepted: mockApplications.filter(a => a.status === "accepted").length,
    rejected: mockApplications.filter(a => a.status === "rejected").length,
  };
};
