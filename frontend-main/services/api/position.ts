import { api } from "./client";
import type { StaffUser } from "./user";

const mentorCacheStore: Record<string, { name: string; email: string; phone: string }> = {};

// Helper functions for mentor data cache (in-memory)
export const mentorCache = {
  save: (positionId: number | string, mentorData: { name: string; email: string; phone: string }) => {
    mentorCacheStore[positionId.toString()] = mentorData;
  },

  get: (positionId: number | string): { name: string; email: string; phone: string } | null => {
    return mentorCacheStore[positionId.toString()] || null;
  },

  getAll: (): Record<string, { name: string; email: string; phone: string }> => {
    return { ...mentorCacheStore };
  },

  remove: (positionId: number | string) => {
    delete mentorCacheStore[positionId.toString()];
  },
};

// ประเภทข้อมูล Position Owner (ผู้ประกาศรับสมัคร)
export interface PositionOwner {
  id?: string;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phoneNumber: string | null;
}

// ประเภทข้อมูล Position Department
export interface PositionDepartment {
  id: number;
  deptSap: number;
  deptShort: string | null;
  deptFull: string | null;
  location: string | null;
  officeId: number;
}

// ประเภทข้อมูลพี่เลี้ยง (Mentor) - จาก backend internshipPositionMentors join
export interface PositionMentor {
  staffId: number;
  name: string;
  email: string;
  phoneNumber: string | null;
}

// ประเภทข้อมูล Position (ตำแหน่งฝึกงาน)
export interface Position {
  id: number;
  name: string;
  officeId?: number;
  departmentId: number;
  location: string;
  positionCount: number | null;
  major: string;
  recruitStart: string | null;
  recruitEnd: string | null;
  jobDetails: string;
  requirement: string;
  benefits: string;
  resumeRq: boolean;
  portfolioRq: boolean;
  recruitmentStatus: "OPEN" | "CLOSE";
  createdAt: string;
  updatedAt: string;
  // ข้อมูลผู้ประกาศ (positionOwner) ที่ backend ส่งมาจาก FK internship_positions.position_owner
  positionOwner?: PositionOwner | null;
  // ข้อมูลพี่เลี้ยง (mentors) array จาก internshipPositionMentors table
  mentors?: PositionMentor[];
  // ข้อมูล department ที่ join มาจาก backend
  department?: PositionDepartment | null;
  // จำนวนนักศึกษาที่ได้รับการตอบรับแล้ว จาก backend (accepted_count)
  acceptedCount?: number;
  // จำนวนผู้สมัครจริง (ไม่รวม CANCEL) จาก backend
  applicantCount?: number;
}

// Helper function to format date to Thai format
const formatDateToThai = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const thaiMonths = [
    "ม.ค", "ก.พ", "มี.ค", "เม.ย", "พ.ค", "มิ.ย",
    "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค"
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Convert to Buddhist year
  return `${day} ${month} ${year}`;
};

// Helper: แปลง Job.id ("api-1") เป็น positionId (1)
export const jobIdToPositionId = (jobId: string): number | null => {
  if (jobId.startsWith("api-")) {
    const num = parseInt(jobId.replace("api-", ""), 10);
    return isNaN(num) ? null : num;
  }
  return null;
};

// Helper: แปลง positionId (1) เป็น Job.id ("api-1")
export const positionIdToJobId = (positionId: number): string => {
  return `api-${positionId}`;
};

// Helper function to convert Position to Job format for JobCard component
export const positionToJob = (position: Position): {
  id: string;
  title: string;
  location: string;
  department: string;
  currentApplicants: number;
  maxApplicants: number;
  tags: string[];
  startDate: string;
  endDate: string;
  recruitStartDate: string;
  recruitEndDate: string;
  requiredDocuments: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  supervisorPhone?: string;
  mentorName?: string;
  mentorEmail?: string;
  mentorPhone?: string;
} => {
  // ใช้ข้อมูล department ที่ join มาจาก backend
  const departmentName = position.department?.deptFull || position.department?.deptShort || `กองงาน ${position.departmentId || "-"}`;

  // ใช้ข้อมูล positionOwner ที่ backend ส่งมาจาก FK internship_positions.position_owner
  const ownerData = position.positionOwner || null;
  const ownerName = ownerData
    ? `${ownerData.fname || ""} ${ownerData.lname || ""}`.trim()
    : undefined;
  const ownerEmail = ownerData?.email || undefined;
  const ownerPhone = ownerData?.phoneNumber || undefined;

  // ใช้ข้อมูล mentor จาก mentors array ที่ backend ส่งมา
  // Backend ส่งกลับมาเป็น array จาก internshipPositionMentors table
  const firstMentor = position.mentors?.[0];
  const mentorName = firstMentor?.name || undefined;
  const mentorEmail = firstMentor?.email || undefined;
  const mentorPhone = firstMentor?.phoneNumber || undefined;

  // สร้าง required documents list (Transcript เป็น default เสมอ)
  const requiredDocs: string[] = ["Transcript"];
  if (position.resumeRq) requiredDocs.push("Resume");
  if (position.portfolioRq) requiredDocs.push("Portfolio");

  return {
    id: `api-${position.id}`, // Prefix with 'api-' to avoid duplicate keys with mockJobs
    title: position.name,
    location: position.location || position.department?.location || "-",
    department: departmentName,
    currentApplicants: position.applicantCount ?? position.acceptedCount ?? 0,
    maxApplicants: position.positionCount ?? 0,
    tags: position.major ? position.major.split(",").map(m => m.trim()).filter(m => m) : [],
    startDate: formatDateToThai(position.recruitStart || ""),
    endDate: formatDateToThai(position.recruitEnd || ""),
    recruitStartDate: formatDateToThai(position.recruitStart || ""),
    recruitEndDate: formatDateToThai(position.recruitEnd || ""),
    requiredDocuments: requiredDocs,
    responsibilities: position.jobDetails ? position.jobDetails.split(/\r?\n/).filter(d => d.trim()) : [],
    qualifications: position.requirement ? position.requirement.split(/\r?\n/).filter(r => r.trim()) : [],
    benefits: position.benefits || "ไม่มีค่าตอบแทน",
    // ใช้ข้อมูล owner จาก API
    supervisorName: ownerName || undefined,
    supervisorEmail: ownerEmail || undefined,
    supervisorPhone: ownerPhone || undefined,
    // ใช้ข้อมูล mentor จาก API
    mentorName: mentorName || undefined,
    mentorEmail: mentorEmail || undefined,
    mentorPhone: mentorPhone || undefined,
  };
};

// Helper function to convert Position to Job format with owner mapping
// ใช้ข้อมูล owner จาก API โดยตรง (ไม่ต้อง staff list แยก)
export const positionToJobWithOwnerMapping = (position: Position): ReturnType<typeof positionToJob> => {
  // เรียกใช้ positionToJob ซึ่งใช้ข้อมูล owner จาก API อยู่แล้ว
  return positionToJob(position);
};

// Enhanced helper function that includes staff data
// ยังคงเก็บไว้สำหรับ backward compatibility แต่จะใช้ข้อมูล owner จาก API ก่อน
export const positionToJobWithStaff = (
  position: Position,
  staffList: StaffUser[]
): ReturnType<typeof positionToJob> => {
  const baseJob = positionToJob(position);

  // ถ้ามี positionOwner จาก API แล้ว ใช้เลย
  if (position.positionOwner) {
    return baseJob;
  }

  // Fallback: ถ้าไม่มี owner จาก API ให้ใช้ staffList แทน
  const departmentStaff = staffList.filter(
    staff => staff.departmentId === position.departmentId
  );

  const supervisor = departmentStaff[0];
  const mentor = departmentStaff[1] || departmentStaff[0];

  return {
    ...baseJob,
    supervisorName: supervisor ? `${supervisor.fname} ${supervisor.lname}` : baseJob.supervisorName,
    supervisorEmail: supervisor?.email || baseJob.supervisorEmail,
    supervisorPhone: supervisor?.phoneNumber || baseJob.supervisorPhone,
    mentorName: mentor ? `${mentor.fname} ${mentor.lname}` : baseJob.mentorName,
    mentorEmail: mentor?.email || baseJob.mentorEmail,
    mentorPhone: mentor?.phoneNumber || baseJob.mentorPhone,
  };
};

// Helper function to convert Position to JobAnnouncement format (for Owner pages)
// currentUser: ถ้าส่งมา จะใช้เป็นข้อมูลผู้ประกาศแทน positionOwner จาก API
export const positionToAnnouncement = (position: Position, currentUser?: { fname?: string; lname?: string; email?: string; phoneNumber?: string } | null): {
  id: string;
  title: string;
  department: string;
  location: string;
  maxApplicants: number;
  currentApplicants: number;
  recruitStartDate: string;
  recruitEndDate: string;
  startDate: string;
  endDate: string;
  relatedFields: string[];
  requiredDocuments: ('portfolio' | 'resume')[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string;
  status: 'draft' | 'open' | 'closed' | 'expired';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  mentorName: string;
  mentorEmail: string;
  mentorPhone: string;
  createdAt: string;
  updatedAt: string;
} => {
  const departmentName = position.department?.deptFull || position.department?.deptShort || `กองงาน ${position.departmentId || "-"}`;
  const departmentLocation = position.department?.location || "";

  // Owner info: ถ้ามี currentUser ให้ใช้ก่อน (ผู้ที่ login อยู่คือผู้ประกาศ)
  // fallback: positionOwner ที่ backend ส่งมาจาก FK internship_positions.position_owner
  const ownerData = currentUser || position.positionOwner || null;
  const ownerName = ownerData
    ? `${ownerData.fname || ""} ${ownerData.lname || ""}`.trim()
    : "";
  const ownerEmail = ownerData?.email || "";
  const ownerPhone = ownerData?.phoneNumber || "";

  // Mentor info from mentors array
  const firstMentor = position.mentors?.[0];
  const mentorName = firstMentor?.name || "";
  const mentorEmail = firstMentor?.email || "";
  const mentorPhone = firstMentor?.phoneNumber || "";

  // Determine status
  let status: 'draft' | 'open' | 'closed' | 'expired' = 'open';
  if (position.recruitmentStatus === 'CLOSE') {
    status = 'closed';
  } else if (position.recruitEnd) {
    const endDate = new Date(position.recruitEnd);
    if (endDate < new Date()) {
      status = 'expired';
    }
  }

  return {
    id: position.id.toString(),
    title: position.name,
    department: departmentName,
    location: position.location || departmentLocation || "-",
    maxApplicants: position.positionCount ?? 0,
    currentApplicants: position.applicantCount ?? position.acceptedCount ?? 0,
    recruitStartDate: position.recruitStart || "",
    recruitEndDate: position.recruitEnd || "",
    startDate: position.recruitStart || "",
    endDate: position.recruitEnd || "",
    relatedFields: position.major ? position.major.split(",").map(m => m.trim()).filter(m => m) : [],
    requiredDocuments: [
      ...(position.resumeRq ? ['resume' as const] : []),
      ...(position.portfolioRq ? ['portfolio' as const] : []),
    ],
    responsibilities: position.jobDetails ? position.jobDetails.split(/\r?\n/).filter(d => d.trim()) : [],
    qualifications: position.requirement ? position.requirement.split(/\r?\n/).filter(r => r.trim()) : [],
    benefits: position.benefits || "ไม่มีค่าตอบแทน",
    status,
    contactName: ownerName,
    contactEmail: ownerEmail,
    contactPhone: ownerPhone,
    mentorName,
    mentorEmail,
    mentorPhone,
    createdAt: position.createdAt || "",
    updatedAt: position.updatedAt || "",
  };
};

// ข้อมูลสำหรับสร้าง Position
export interface CreatePositionData {
  name: string;
  location?: string;
  positionCount?: number | null;
  major?: string;
  recruitStart?: string | null;
  recruitEnd?: string | null;
  jobDetails?: string;
  requirement?: string;
  benefits?: string;
  resumeRq?: boolean;
  portfolioRq?: boolean;
  recruitmentStatus: "OPEN" | "CLOSE";
  // Array ของ staffProfileId สำหรับพี่เลี้ยง (backend ต้องการ array)
  mentorStaffIds: number[];
  // userId ของผู้ประกาศรับสมัคร (optional — backend แก้ได้เฉพาะเมื่อส่งมา)
  positionOwner?: string;
}

// ข้อมูลสำหรับอัพเดท Position
export type UpdatePositionData = Partial<CreatePositionData>;

// Response เมื่อดึงรายการ Position
export interface PositionsResponse {
  data: Position[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// Query params สำหรับดึงรายการ Position
export interface GetPositionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  department?: number;
  office?: number;
}

// Position API functions
export const positionApi = {
  // ดึงรายการตำแหน่งทั้งหมด (พร้อม pagination และ filter)
  getPositions: async (query?: GetPositionsQuery): Promise<PositionsResponse> => {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.search) params.append("search", query.search);
    if (query?.department) params.append("department", query.department.toString());
    if (query?.office) params.append("office", query.office.toString());

    const response = await api.get<PositionsResponse>(`/position?${params.toString()}`);
    return response.data;
  },

  // ดึงข้อมูลตำแหน่งตาม ID (ใช้ getPositions แล้ว filter เพราะ backend ไม่มี endpoint GET /position/:id)
  getPositionById: async (id: number): Promise<Position | null> => {
    try {
      // ดึง positions ทั้งหมด แล้ว filter หาตาม id
      const response = await positionApi.getPositions({ limit: 1000 });
      const position = response.data.find(p => p.id === id);
      return position || null;
    } catch {
      return null;
    }
  },

  // สร้างประกาศตำแหน่งฝึกงานใหม่
  createPosition: async (data: CreatePositionData): Promise<Position> => {
    const response = await api.post<Position>("/position", data);
    return response.data;
  },

  // อัพเดทประกาศตำแหน่งฝึกงาน
  updatePosition: async (id: number, data: UpdatePositionData): Promise<Position> => {
    const response = await api.put<Position>(`/position/${id}`, data);
    return response.data;
  },

  // ลบประกาศตำแหน่งฝึกงาน
  deletePosition: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/position/${id}`);
    return response.data;
  },
};
