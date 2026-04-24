import { api } from "./client";

export interface StaffLog {
  id: number;
  userId: string;
  username?: string;
  action: string;
  createdAt: string;
  // Joined user data
  fname?: string;
  lname?: string;
}

export interface StaffLogsResponse {
  data: StaffLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface GetStaffLogsQuery {
  page?: number;
  limit?: number;
  userId?: string;
}

export const staffLogsApi = {
  // สร้าง staff log entry
  createLog: async (action: string): Promise<StaffLog> => {
    const response = await api.post<StaffLog>("/staff-logs", { action });
    return response.data;
  },

  // ดึงรายการ staff logs
  getLogs: async (query?: GetStaffLogsQuery): Promise<StaffLogsResponse> => {
    const params: Record<string, string | number> = {};
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.userId) params.userId = query.userId;
    const response = await api.get<StaffLogsResponse>("/staff-logs", { params });
    return response.data;
  },
};
