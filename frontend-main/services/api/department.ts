import { api } from "./client";

export interface Department {
  id: number;
  deptSap: number;
  deptShort: string | null;
  deptFull: string | null;
  location: string | null;
  officeId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentsResponse {
  data: Department[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// Response shape จาก department_ticket endpoint
export interface DepartmentTicketResponse {
  deptSap: number;
  deptShort: string | null;
  deptFull: string | null;
  location: string | null;
  officeId: number;
}

export const departmentApi = {
  getDepartments: async (
    page: number = 1,
    limit: number = 100
  ): Promise<DepartmentsResponse> => {
    const response = await api.get<DepartmentsResponse>(
      `/dept?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * ค้นหา department ด้วย deptSap ผ่าน department_ticket endpoint (direct lookup)
   * เร็วกว่าการ paginate ทุกหน้าเพื่อหา department มาก
   * Backend cache ข้อมูลไว้ 5 นาที
   */
  getDepartmentByDeptSap: async (
    id: number | string
  ): Promise<Department | null> => {
    try {
      const targetId = Number(id);
      const response = await api.get<DepartmentTicketResponse>(
        `/department_ticket/${targetId}`
      );
      const data = response.data;
      // แปลง DepartmentTicketResponse ให้เป็น Department shape
      return {
        id: 0, // ticket endpoint ไม่คืน id ของ row
        deptSap: data.deptSap,
        deptShort: data.deptShort,
        deptFull: data.deptFull,
        location: data.location,
        officeId: data.officeId,
      };
    } catch(error) {
          if (process.env.NODE_ENV === "development") {
            console.error(error);
        }
      
      return null;
    }
  },
};
