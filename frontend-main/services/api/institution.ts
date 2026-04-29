import { api } from "./client";

// ประเภทข้อมูล Institution (สถานศึกษา)
export interface Institution {
  id: number;
  institutionsType: "UNIVERSITY" | "VOCATIONAL" | "SCHOOL" | "OTHERS";
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInstitutionPayload {
  institutionsType: "UNIVERSITY" | "VOCATIONAL" | "SCHOOL" | "OTHERS";
  name: string;
}

// ประเภทข้อมูล Faculty (คณะ)
export interface Faculty {
  id: number;
  name: string;
  institutionId?: number;
}

// Paginated response จาก institution API
export interface InstitutionsResponse {
  data: Institution[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// Institution/Faculty API functions
export const institutionApi = {
  // ค้นหาสถานศึกษาตาม type + search keyword (ใช้ pagination จาก backend)
  getInstitutions: async (type?: "UNIVERSITY" | "VOCATIONAL" | "SCHOOL" | "OTHERS", search?: string, limit: number = 20): Promise<Institution[]> => {
    try {
      const params = new URLSearchParams();
      params.append("limit", String(limit));
      params.append("page", "1");
      if (type) params.append("type", type);
      if (search && search.trim()) params.append("search", search.trim());
      const response = await api.get<InstitutionsResponse>(`/institution?${params.toString()}`);
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  // ค้นหาสถานศึกษาจากหลาย type รวมกัน (ใช้ parallel search)
  getInstitutionsByTypes: async (types: ("UNIVERSITY" | "VOCATIONAL" | "SCHOOL" | "OTHERS")[], search?: string, limit: number = 20): Promise<Institution[]> => {
    try {
      const results = await Promise.all(types.map(type => institutionApi.getInstitutions(type, search, limit)));
      // รวมผลลัพธ์และกรอง duplicate ตาม id
      const merged = results.flat();
      const unique = merged.filter((inst, index, self) => self.findIndex(i => i.id === inst.id) === index);
      return unique.slice(0, limit);
    } catch {
      return [];
    }
  },

  // ดึงข้อมูลสถานศึกษาตาม ID ผ่าน institution_ticket endpoint (direct lookup)
  getInstitutionById: async (id: number): Promise<Institution | null> => {
    try {
      const response = await api.get<Institution>(`/institution_ticket/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  // สร้างสถานศึกษาใหม่
  createInstitution: async (payload: CreateInstitutionPayload): Promise<Institution> => {
    const response = await api.post<Institution>("/institution", payload);
    return response.data;
  },

  // ดึงรายการคณะทั้งหมด
  getFaculties: async (): Promise<Faculty[]> => {
    try {
      const response = await api.get<Faculty[]>("/faculty");
      return response.data;
    } catch {
      return [];
    }
  },

  // ดึงข้อมูลคณะตาม ID
  getFacultyById: async (id: number): Promise<Faculty | null> => {
    try {
      const response = await api.get<Faculty>(`/faculty/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  // ดึงรายการคณะตาม institutionId
  getFacultiesByInstitution: async (institutionId: number): Promise<Faculty[]> => {
    try {
      const response = await api.get<Faculty[]>(`/faculty?institutionId=${institutionId}`);
      return response.data;
    } catch {
      return [];
    }
  },
};

// ==================== Institution Ticket API ====================

export interface InstitutionTicket {
  id: number;
  institutionId: number;
  // ข้อมูลเพิ่มเติมจาก backend (shape ขึ้นอยู่กับ service)
  [key: string]: unknown;
}

export const institutionTicketApi = {
  // ดึงข้อมูล ticket ตาม ID (public, cached 5 นาที)
  getById: async (id: number): Promise<InstitutionTicket> => {
    const response = await api.get<InstitutionTicket>(`/institution_ticket/${id}`);
    return response.data;
  },
};
