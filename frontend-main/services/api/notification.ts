import { api } from "./client";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export const notificationApi = {
  // ดึง notifications ของตัวเอง
  getMyNotifications: async (query?: { unreadOnly?: boolean; limit?: number; offset?: number }): Promise<NotificationItem[]> => {
    const params: Record<string, string | number | boolean> = {};
    if (query?.unreadOnly !== undefined) params.unreadOnly = query.unreadOnly;
    if (query?.limit) params.limit = query.limit;
    if (query?.offset !== undefined) params.offset = query.offset;
    const response = await api.get<NotificationItem[]>("/notifications", { params });
    return response.data;
  },

  // อ่าน/ยังไม่อ่าน notification
  markAsRead: async (id: number, isRead: boolean): Promise<{ id: number; isRead: boolean }> => {
    const response = await api.put<{ id: number; isRead: boolean }>(`/notifications/${id}/read`, { isRead });
    return response.data;
  },

  // อ่านทั้งหมด
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await api.put<{ success: boolean }>("/notifications/read-all");
    return response.data;
  },

  // ลบ notification ของตัวเอง
  deleteNotification: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete<{ success: boolean; message?: string }>(`/notifications/delete/${id}`);
    return response.data;
  },
};
