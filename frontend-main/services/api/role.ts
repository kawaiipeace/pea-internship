import { api } from "./client";

export interface Role {
  id: number;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const roleApi = {
  // ดึงรายการ roles ทั้งหมด
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>("/role");
    return response.data;
  },

  // สร้าง role ใหม่
  createRole: async (data: { name: string; description?: string }): Promise<Role> => {
    const response = await api.post<Role>("/role", data);
    return response.data;
  },

  // อัปเดต role
  updateRole: async (id: number, data: { name?: string; description?: string }): Promise<Role> => {
    const response = await api.put<Role>(`/role/${id}`, data);
    return response.data;
  },

  // ลบ role
  deleteRole: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/role/${id}`);
    return response.data;
  },
};
