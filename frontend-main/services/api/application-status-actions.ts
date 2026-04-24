import { api } from "./client";
import type { AppStatusEnum } from "./application";

export interface ApplicationStatusAction {
  id: number;
  applicationStatusId: number;
  actionBy: string | null;
  oldStatus: AppStatusEnum | null;
  newStatus: AppStatusEnum;
  note: string | null;
  createdAt: string;
  // Joined user data (from backend join)
  actor?: {
    id: string;
    fname: string | null;
    lname: string | null;
    displayUsername: string | null;
    roleId: number | null;
    departmentId: number | null;
  };
  actionByName?: string;
}

export interface GetStatusActionsQuery {
  actionId?: number;
  limit?: number;
  offset?: number;
}

export const applicationStatusActionsApi = {
  // ดูประวัติเปลี่ยนสถานะของใบสมัคร
  getByApplicationStatusId: async (applicationStatusId: number, query?: GetStatusActionsQuery): Promise<ApplicationStatusAction[]> => {
    const params: Record<string, string | number> = {};
    if (query?.actionId) params.actionId = query.actionId;
    if (query?.limit) params.limit = query.limit;
    if (query?.offset !== undefined) params.offset = query.offset;
    const response = await api.get<ApplicationStatusAction[]>(`/application-status-actions/${applicationStatusId}`, { params });
    return response.data;
  },

  // ดูประวัติ actions ของตัวเอง
  getMyActions: async (query?: { limit?: number; offset?: number }): Promise<ApplicationStatusAction[]> => {
    const params: Record<string, string | number> = {};
    if (query?.limit) params.limit = query.limit;
    if (query?.offset !== undefined) params.offset = query.offset;
    const response = await api.get<ApplicationStatusAction[]>("/application-status-actions/me", { params });
    return response.data;
  },
};
