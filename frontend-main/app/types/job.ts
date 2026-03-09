// Types for Job related data
export interface Job {
  id: string;
  title: string;
  location: string;
  department: string;
  currentApplicants: number;
  maxApplicants: number;
  tags: string[];
  startDate: string;
  endDate: string;
  supervisorName?: string;
  supervisorEmail?: string;
  supervisorPhone?: string;
  mentorName?: string;
  mentorEmail?: string;
  mentorPhone?: string;
}

export interface JobFilters {
  keyword: string;
  jobType: string;
  province: string;
  office?: number;
}

// Backend enum types (re-exported for convenience)
export type RecruitmentStatus = "NOT_OPEN_YET" | "OPEN" | "CLOSE" | "EXPIRED";
export type InternshipStatus = "IDLE" | "PENDING" | "INTERVIEW" | "REVIEW" | "ACCEPT" | "ACTIVE" | "COMPLETE" | "CANCEL";
export type GenderEnum = "MALE" | "FEMALE" | "OTHER";
export type LeaveRequestType = "ABSENCE" | "SICK";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
