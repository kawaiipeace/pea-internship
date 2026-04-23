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

  getDepartmentByDeptSap: async (
    id: number | string
  ): Promise<Department | null> => {
    try {
      const targetId = Number(id);
      let page = 1;
      let hasNextPage = true;
      const limit = 100;

      while (hasNextPage) {
        const response = await departmentApi.getDepartments(page, limit);

        const found =
          response.data.find((d) => {
            const deptSap = Number(d.deptSap);
            const deptId = Number(d.id);
            return deptSap === targetId || deptId === targetId;
          }) || null;

        if (found) return found;

        hasNextPage = response.meta?.hasNextPage ?? false;
        page++;
      }

      return null;
    } catch (error) {
      console.log("getDepartmentByDeptSap error:", error);
      return null;
    }
  },
};
