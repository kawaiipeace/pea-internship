// Types for Job Announcements (Owner side)

export interface JobAnnouncement {
  id: string;
  title: string;
  department: string;
  location: string;
  maxApplicants: number;
  currentApplicants: number;
  recruitStartDate: string;
  recruitEndDate: string;
  startDate: string;
  endDate: string;
  relatedFields: string[];
  requiredDocuments: ('portfolio' | 'resume')[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string;
  status: 'draft' | 'open' | 'closed' | 'expired';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  mentorName: string;
  mentorEmail: string;
  mentorPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementApplicant {
  id: string;
  announcementId: string;
  name: string;
  education: string;
  institution: string;
  major: string;
  status: 'pending' | 'interviewing' | 'accepted' | 'rejected';
  documentStatus: 'pending' | 'submitted' | 'approved' | 'rejected';
  appliedAt: string;
}

export interface AnnouncementStats {
  totalAnnouncements: number;
  totalOpenPositions: number;
  totalApplicants: number;
}

// Form data type for creating/editing announcements
export interface AnnouncementFormData {
  title: string;
  department: string;
  location: string;
  maxApplicants: number;
  recruitStartDate: string;
  recruitEndDate: string;
  startDate: string;
  endDate: string;
  relatedFields: string[];
  requiredDocuments: ('portfolio' | 'resume')[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string;
  status: 'draft' | 'open' | 'closed';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  mentorName: string;
  mentorEmail: string;
  mentorPhone: string;
}

// Validation errors type
export interface AnnouncementFormErrors {
  title?: string;
  department?: string;
  location?: string;
  maxApplicants?: string;
  recruitStartDate?: string;
  recruitEndDate?: string;
  startDate?: string;
  endDate?: string;
  relatedFields?: string;
  responsibilities?: string;
  qualifications?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  mentorName?: string;
  mentorEmail?: string;
  mentorPhone?: string;
}
