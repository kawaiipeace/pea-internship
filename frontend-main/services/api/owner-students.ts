import { api } from "./client";

export type EndInternshipStatus = "CANCEL" | "COMPLETE";

export const ownerStudentsApi = {
  // Owner/Admin สิ้นสุดการฝึกงาน (CANCEL หรือ COMPLETE)
  updateInternshipStatus: async (
    studentUserId: string,
    status: EndInternshipStatus,
    reason?: string
  ): Promise<unknown> => {
    const body: { status: EndInternshipStatus; reason?: string } = { status };
    if (reason) body.reason = reason;
    const response = await api.put(`/owner/students/${studentUserId}/internship-status`, body);
    return response.data;
  },
};
