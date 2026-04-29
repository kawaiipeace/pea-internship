import { api, API_BASE_URL } from "./client";

export type ValidationStatus = "PENDING" | "INVALID" | "VERIFIED";
export type DocTypeName = "transcript" | "resume" | "portfolio" | "request-letter";

export interface ApplicationDocumentItem {
  id: number;
  applicationStatusId: number;
  docTypeId: number;
  docFile: string;
  validationStatus: ValidationStatus;
  createdAt: string;
  updatedAt: string;
  // Joined data
  docTypeName?: string;
  studentUserId?: string;
  studentFname?: string;
  studentLname?: string;
}

export interface ApplicationDocumentsResponse {
  data: ApplicationDocumentItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface GetApplicationDocumentsQuery {
  applicationStatusId?: number;
  departmentId?: number;
  userId?: string;
  docTypeId?: number;
  validationStatus?: ValidationStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export const applicationDocumentsApi = {
  // Admin ดึงรายการเอกสารทั้งหมด (พร้อม filter)
  getDocuments: async (query?: GetApplicationDocumentsQuery): Promise<ApplicationDocumentsResponse> => {
    const params: Record<string, string | number> = {};
    if (query?.applicationStatusId) params.applicationStatusId = query.applicationStatusId;
    if (query?.departmentId) params.departmentId = query.departmentId;
    if (query?.userId) params.userId = query.userId;
    if (query?.docTypeId) params.docTypeId = query.docTypeId;
    if (query?.validationStatus) params.validationStatus = query.validationStatus;
    if (query?.q) params.q = query.q;
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    const response = await api.get<ApplicationDocumentsResponse>("/application-documents", { params });
    return response.data;
  },

  // ดาวน์โหลด/พรีวิวเอกสาร (stream จาก MinIO)
  getFileUrl: (key: string, disposition: "inline" | "attachment" = "inline"): string => {
    return `${API_BASE_URL}/application-documents/file?key=${encodeURIComponent(key)}&disposition=${disposition}`;
  },

  // ดาวน์โหลดเอกสารเป็น blob
  downloadFile: async (key: string): Promise<Blob> => {
    const response = await api.get("/application-documents/file", {
      params: { key, disposition: "attachment" },
      responseType: "blob",
    });
    return response.data;
  },
};
