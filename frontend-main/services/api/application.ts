import { api } from "./client";

// Backend application status enum
export type AppStatusEnum =
  | "PENDING_DOCUMENT"
  | "PENDING_INTERVIEW"
  | "PENDING_CONFIRMATION"
  | "PENDING_REQUEST"
  | "PENDING_REVIEW"
  | "COMPLETE"
  | "CANCEL"
  | "ABORT"
  | "REJECTED";

// ข้อมูลใบสมัครจาก GET /applications/history/me

export interface CompleteModalResponse {
  shouldShow: boolean;
  applicationStatusId: number | null;
  title: string | null;
  message: string | null;
}

export interface AcknowledgeResponse {
  message: string;
}

export interface MyApplicationData {
  applicationId: number;
  applicationStatus: AppStatusEnum;
  internshipRound: number;
  isActive: boolean;
  statusNote: string | null;
  createdAt: string;
  updatedAt: string;
  positionId: number | null;
  positionName: string | null;
  positionDepartmentId: number | null;
  positionOfficeId: number | null;
  infoEndDate: string | null;
  documents: { docTypeId: number; docFile: string; validationStatus?: string; note?: string | null }[];
}

// Mapping: backend status → frontend step name (Thai)
export const APP_STATUS_TO_STEP: Record<AppStatusEnum, string> = {
  PENDING_DOCUMENT: "รอยื่นเอกสาร",
  PENDING_INTERVIEW: "รอสัมภาษณ์",
  PENDING_CONFIRMATION: "รอการยืนยัน",
  PENDING_REQUEST: "รอยื่นเอกสารขอความอนุเคราะห์",
  PENDING_REVIEW: "รอการตรวจสอบ",
  COMPLETE: "เสร็จสิ้น",
  CANCEL: "ยกเลิกฝึกงาน",
  ABORT: "ยกเลิกการสมัคร",
  REJECTED: "ไม่ผ่าน",
};

// ตรวจสอบว่าสมัครใหม่ได้หรือไม่ (ไม่มี active application)
export function canApplyForNewJob(app: MyApplicationData | null): boolean {
  if (!app) return true;
  // สมัครได้เมื่อ ยกเลิก/ไม่ผ่าน หรือ application ไม่ active แล้ว (ฝึกงานเสร็จสิ้น)
  return app.applicationStatus === "CANCEL" || app.applicationStatus === "ABORT" || app.applicationStatus === "REJECTED" || !app.isActive;
}

// ประเภทข้อมูล Application (ใบสมัคร)
export interface ApplicationData {
  applicationId: number;
  applicationStatus: string;
  internshipRound: number;
  departmentId: number;
  positionId: number;
}

// ประเภทข้อมูลสำหรับส่ง skills & expectations
export interface ApplicationInformationData {
  skill: string;
  expectation: string;
}

// ข้อมูลใบสมัครแยกตามตำแหน่ง (GET /applications/history?positionId=...)
export interface AllStudentsHistoryItem {
  applicationId: number;
  applicationStatus: AppStatusEnum;
  internshipRound: number;
  isActive: boolean;
  statusNote: string | null;
  createdAt: string;
  updatedAt: string;
  studentUserId: string | null;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phoneNumber: string | null;
  gender: string | null;
  studentInternshipStatus: string | null;
  institutionName: string | null;
  institutionType: string | null;
  faculty: string | null;
  major: string | null;
  profileHours: string | null;
  profileStartDate: string | null;
  profileEndDate: string | null;
  studentNote: string | null;
  infoSkill: string | null;
  infoExpectation: string | null;
  infoStartDate: string | null;
  infoEndDate: string | null;
  infoHours: string | null;
  positionId: number | null;
  positionName: string | null;
  departmentId: number | null;
  officeId: number | null;
  documents: {
    docTypeId: number;
    docFile: string;
    validationStatus: string;
    invalidReasons?: string[];
  }[];
  mentors: {
    fname: string | null;
    lname: string | null;
    email: string | null;
    phone: string | null;
  }[];
}

export interface AllStudentsHistoryResponse {
  data: AllStudentsHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface AllStudentsHistoryQuery {
  includeCanceled?: boolean;
  page?: number;
  limit?: number;
  status?: AppStatusEnum;
  positionId?: number;
  q?: string;
}

// Response type from backend document upload
export interface UploadDocResponse {
  key: string;
  filename: string;
  docTypeId: number;
  validationStatus: string;
  applicationStatus: string;
}

const getFilenameFromContentDisposition = (
  contentDisposition?: string,
): string | null => {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] ?? null;
};

// Application API functions
export const applicationApi = {
  // ดึงประวัติการสมัครทั้งหมดของฉัน
  getMyHistory: async (): Promise<MyApplicationData[]> => {
    const response = await api.get<MyApplicationData[]>("/applications/history/me");
    return response.data;
  },

  // ดึงใบสมัครล่าสุดของฉัน (ตัวแรกจาก history — เรียง round DESC แล้วจาก backend)
  getMyLatestApplication: async (): Promise<MyApplicationData | null> => {
    const response = await api.get<MyApplicationData[]>("/applications/history/me");
    const list = response.data;
    return list && list.length > 0 ? list[0] : null;
  },

  getApplicationCompleteModal: async (): Promise<CompleteModalResponse> => {
    const response = await api.get<CompleteModalResponse>(
      "/student/application-complete-modal"
    );
    return response.data;
  },

  // add
  acknowledgeApplicationCompleteModal: async (): Promise<AcknowledgeResponse> => {
    const response = await api.post<AcknowledgeResponse>(
      "/student/application-complete-modal/acknowledge"
    );
    return response.data;
  },

  // สร้างใบสมัครใหม่ (คลิกสมัครตำแหน่งฝึกงาน)
  createApplication: async (positionId: number): Promise<ApplicationData> => {
    const response = await api.post<ApplicationData>("/applications", { positionId });
    return response.data;
  },

  // ส่งข้อมูล skills & expectations → สร้างใบสมัครจริง
  submitInformation: async (positionId: number, data: { skill: string; expectation: string; startDate: string; endDate: string; hours: number }): Promise<{ applicationId: number; applicationStatus: string }> => {
    const response = await api.post<{ applicationId: number; applicationStatus: string }>(`/applications/positions/${positionId}/information`, data);
    return response.data;
  },

  // อัปโหลดเอกสาร Transcript
  uploadTranscript: async (applicationId: number, file: File): Promise<UploadDocResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UploadDocResponse>(`/applications/${applicationId}/documents/transcript`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // อัปโหลดเอกสาร Resume
  uploadResume: async (applicationId: number, file: File): Promise<UploadDocResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UploadDocResponse>(`/applications/${applicationId}/documents/resume`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // อัปโหลดเอกสาร Portfolio
  uploadPortfolio: async (applicationId: number, file: File): Promise<UploadDocResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UploadDocResponse>(`/applications/${applicationId}/documents/portfolio`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ดาวน์โหลด/พรีวิวเอกสารจาก MinIO
  downloadDocument: async (key: string, download: boolean = true): Promise<void> => {
    const response = await api.get(`/application-documents/file`, {
      params: { key, download },
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: typeof response.headers["content-type"] === "string" ? response.headers["content-type"] : "application/octet-stream",
    });
    const url = window.URL.createObjectURL(blob);
    if (download) {
      const filename =
        getFilenameFromContentDisposition(response.headers["content-disposition"]) ||
        key.split("/").pop() ||
        "document";
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.open(url, "_blank");
    }
    window.URL.revokeObjectURL(url);
  },

  // อัปโหลดเอกสาร Request Letter (ขอความอนุเคราะห์)
  uploadRequestLetter: async (applicationId: number, file: File): Promise<UploadDocResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<UploadDocResponse>(`/applications/${applicationId}/documents/request-letter`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ยกเลิกใบสมัคร (Student cancel — เฉพาะ PENDING_DOCUMENT ที่ยังไม่ส่งเอกสาร)
  cancelApplication: async (applicationId: number): Promise<{ applicationStatus: string }> => {
    const response = await api.put<{ applicationStatus: string }>(`/applications/${applicationId}/cancel`);
    return response.data;
  },

  // Owner/Admin ดูใบสมัครทั้งหมด (รองรับ filter positionId, status, search, pagination)
  getAllStudentsHistory: async (query?: AllStudentsHistoryQuery): Promise<AllStudentsHistoryResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query?.includeCanceled !== undefined) params.includeCanceled = query.includeCanceled;
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.status) params.status = query.status;
    if (query?.positionId) params.positionId = query.positionId;
    if (query?.q) params.q = query.q;
    const response = await api.get<AllStudentsHistoryResponse>("/applications/history", { params });
    return response.data;
  },

  // Owner อนุมัติผ่านสัมภาษณ์
  approveInterview: async (applicationId: number): Promise<unknown> => {
    const response = await api.put(`/applications/${applicationId}/interview/approve`);
    return response.data;
  },

  // Owner ยืนยันรับนักศึกษา
  confirmAccept: async (applicationId: number): Promise<unknown> => {
    const response = await api.put(`/applications/${applicationId}/confirm/accept`);
    return response.data;
  },

  // Owner ไม่อนุมัติ (ยกเลิกใบสมัคร)
  rejectApplication: async (applicationId: number, reason: string): Promise<unknown> => {
    const response = await api.put(`/applications/${applicationId}/interview/reject`, { reason });
    return response.data;
  },

  // Admin ตรวจสอบเอกสาร (VERIFIED / INVALID)
  reviewDocument: async (
    applicationId: number,
    docType: "transcript" | "resume" | "portfolio" | "request-letter",
    status: "VERIFIED" | "INVALID",
    note?: string,
    invalidReasons?: string[]
  ): Promise<unknown> => {
    const response = await api.put(`/applications/${applicationId}/documents/${docType}/review`, { status, note, invalidReasons });
    return response.data;
  },

  // Admin/Owner ดูประวัติของนักศึกษาคนเดียว
  getStudentHistory: async (studentUserId: string, includeCanceled?: boolean): Promise<MyApplicationData[]> => {
    const params: Record<string, string | boolean> = {};
    if (includeCanceled !== undefined) params.includeCanceled = includeCanceled;
    const response = await api.get<MyApplicationData[]>(`/applications/history/${studentUserId}`, { params });
    return response.data;
  },

  // นักศึกษาแก้ไข hours / startDate / endDate ของใบสมัคร
  updateApplicationInformation: async (
    applicationId: number,
    data: { hours?: number | null; startDate?: string | null; endDate?: string | null }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put<{ success: boolean; message: string }>(`/applications/${applicationId}/information`, data);
    return response.data;
  },
};
