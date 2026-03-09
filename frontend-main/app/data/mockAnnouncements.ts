// Mock data for Job Announcements (Owner side)

import { JobAnnouncement, AnnouncementApplicant, AnnouncementStats } from '../types/announcement';

// Initial mock announcements
export const initialMockAnnouncements: JobAnnouncement[] = [
  {
    id: '1',
    title: 'นักศึกษาฝึกงาน ฝ่ายเทคโนโลยีสารสนเทศ',
    department: 'กองงานออกแบบและพัฒนาระบบดิจิทัล 1',
    location: 'สำนักงานใหญ่ กรุงเทพฯ ตึก LED ชั้น 7',
    maxApplicants: 2,
    currentApplicants: 9,
    recruitStartDate: '2568-03-01',
    recruitEndDate: '2568-05-31',
    startDate: '2568-06-01',
    endDate: '2569-07-31',
    relatedFields: ['เทคโนโลยีสารสนเทศ', 'วิทยาการคอมพิวเตอร์', 'วิศวกรรมคอมพิวเตอร์'],
    requiredDocuments: ['portfolio'],
    responsibilities: [
      'ออกแบบเว็บไซต์',
      'เรียนรู้และใช้โปรแกรม Figma',
      'ทำงานร่วมกับทีมพัฒนาในการวิเคราะห์และแก้ไขปัญหา',
      'พัฒนาและปรับปรุง Web Application'
    ],
    qualifications: [
      'กำลังศึกษาอยู่ชั้นปริญญาตรี',
      'มีทักษะการสื่อสารทำงานเป็นทีม',
      'สามารถฝึกงานได้เต็มเวลา 5 วันต่อสัปดาห์',
      'มีความสนใจในการเรียนรู้เทคโนโลยีใหม่ ๆ'
    ],
    benefits: 'ไม่มีค่าตอบแทน',
    status: 'open',
    contactName: 'ศักดิ์ชัย มีดี',
    contactEmail: 'sakchai1@gmail.com',
    contactPhone: '02-2000022',
    mentorName: 'ศักดิ์ชัย มีดี',
    mentorEmail: 'sakchai1@gmail.com',
    mentorPhone: '02-2000022',
    createdAt: '2568-01-15',
    updatedAt: '2568-01-20'
  },
  {
    id: '2',
    title: 'นักศึกษาฝึกงาน ฝ่ายเทคโนโลยีสารสนเทศ',
    department: 'กองงานออกแบบและพัฒนาระบบดิจิทัล 1',
    location: 'สำนักงานใหญ่ กรุงเทพฯ ตึก LED ชั้น 7',
    maxApplicants: 2,
    currentApplicants: 9,
    recruitStartDate: '2568-03-01',
    recruitEndDate: '2568-05-31',
    startDate: '2568-06-01',
    endDate: '2569-07-31',
    relatedFields: ['เทคโนโลยีสารสนเทศ', 'วิทยาการคอมพิวเตอร์', 'วิศวกรรมคอมพิวเตอร์'],
    requiredDocuments: ['portfolio'],
    responsibilities: [
      'ออกแบบเว็บไซต์',
      'เรียนรู้และใช้โปรแกรม Figma',
      'ทำงานร่วมกับทีมพัฒนาในการวิเคราะห์และแก้ไขปัญหา',
      'พัฒนาและปรับปรุง Web Application'
    ],
    qualifications: [
      'กำลังศึกษาอยู่ชั้นปริญญาตรี',
      'มีทักษะการสื่อสารทำงานเป็นทีม',
      'สามารถฝึกงานได้เต็มเวลา 5 วันต่อสัปดาห์',
      'มีความสนใจในการเรียนรู้เทคโนโลยีใหม่ ๆ'
    ],
    benefits: 'ไม่มีค่าตอบแทน',
    status: 'open',
    contactName: 'ศักดิ์ชัย มีดี',
    contactEmail: 'sakchai1@gmail.com',
    contactPhone: '02-2000022',
    mentorName: 'ศักดิ์ชัย มีดี',
    mentorEmail: 'sakchai1@gmail.com',
    mentorPhone: '02-2000022',
    createdAt: '2568-01-10',
    updatedAt: '2568-01-15'
  }
];

// Mock applicants for announcements
export const initialMockApplicants: AnnouncementApplicant[] = [
  // Applicants for announcement 1
  { id: 'app1', announcementId: '1', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระนคร', major: 'วิศวการการคอมพิวเตอร์', status: 'pending', documentStatus: 'submitted', appliedAt: '2568-01-20' },
  { id: 'app2', announcementId: '1', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระนครศรีอยุธยา', major: 'เทคโนโลยีสารสนเทศ', status: 'interviewing', documentStatus: 'approved', appliedAt: '2568-01-21' },
  { id: 'app3', announcementId: '1', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระนครศรีอยุธยาสมเด็จ', major: 'เทคโนโลยีสารสนเทศ', status: 'accepted', documentStatus: 'approved', appliedAt: '2568-01-22' },
  { id: 'app4', announcementId: '1', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระรามเหนือ', major: 'เทคโนโลยีสารสนเทศ', status: 'accepted', documentStatus: 'pending', appliedAt: '2568-01-23' },
  { id: 'app5', announcementId: '1', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระรามเหนือ', major: 'เทคโนโลยีสารสนเทศ', status: 'accepted', documentStatus: 'submitted', appliedAt: '2568-01-24' },
  { id: 'app6', announcementId: '1', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระรามเหนือ', major: 'เทคโนโลยีสารสนเทศ', status: 'accepted', documentStatus: 'rejected', appliedAt: '2568-01-25' },
  { id: 'app7', announcementId: '1', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระรามเหนือ', major: 'เทคโนโลยีสารสนเทศ', status: 'rejected', documentStatus: 'approved', appliedAt: '2568-01-26' },
  { id: 'app8', announcementId: '1', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระรามเหนือ', major: 'เทคโนโลยีสารสนเทศ', status: 'accepted', documentStatus: 'approved', appliedAt: '2568-01-27' },
  { id: 'app9', announcementId: '1', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระรามเหนือ', major: 'เทคโนโลยีสารสนเทศ', status: 'rejected', documentStatus: 'approved', appliedAt: '2568-01-28' },
  // Applicants for announcement 2
  { id: 'app10', announcementId: '2', name: 'สมหมาย ใจดี', education: 'มหาวิทยาลัย', institution: 'มหาวิทยาลัยราชภัฏพระนคร', major: 'วิศวการการคอมพิวเตอร์', status: 'pending', documentStatus: 'submitted', appliedAt: '2568-01-20' },
];

// LocalStorage key
const ANNOUNCEMENTS_STORAGE_KEY = 'owner_announcements';
const APPLICANTS_STORAGE_KEY = 'owner_announcement_applicants';

// Helper functions for localStorage
export const getAnnouncementsFromStorage = (): JobAnnouncement[] => {
  if (typeof window === 'undefined') return initialMockAnnouncements;
  
  const stored = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialMockAnnouncements;
    }
  }
  // Initialize with mock data if not exists
  localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(initialMockAnnouncements));
  return initialMockAnnouncements;
};

export const saveAnnouncementsToStorage = (announcements: JobAnnouncement[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
};

export const getApplicantsFromStorage = (): AnnouncementApplicant[] => {
  if (typeof window === 'undefined') return initialMockApplicants;
  
  const stored = localStorage.getItem(APPLICANTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialMockApplicants;
    }
  }
  // Initialize with mock data if not exists
  localStorage.setItem(APPLICANTS_STORAGE_KEY, JSON.stringify(initialMockApplicants));
  return initialMockApplicants;
};

export const saveApplicantsToStorage = (applicants: AnnouncementApplicant[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(APPLICANTS_STORAGE_KEY, JSON.stringify(applicants));
};

// API-ready functions (can be replaced with actual API calls later)
export const announcementService = {
  // Get all announcements
  getAll: async (): Promise<JobAnnouncement[]> => {
    // TODO: Replace with API call
    // const response = await fetch('/api/announcements');
    // return response.json();
    return getAnnouncementsFromStorage();
  },

  // Get single announcement by ID
  getById: async (id: string): Promise<JobAnnouncement | null> => {
    // TODO: Replace with API call
    // const response = await fetch(`/api/announcements/${id}`);
    // return response.json();
    const announcements = getAnnouncementsFromStorage();
    return announcements.find(a => a.id === id) || null;
  },

  // Create new announcement
  create: async (data: Omit<JobAnnouncement, 'id' | 'createdAt' | 'updatedAt' | 'currentApplicants'>): Promise<JobAnnouncement> => {
    // TODO: Replace with API call
    // const response = await fetch('/api/announcements', { method: 'POST', body: JSON.stringify(data) });
    // return response.json();
    const announcements = getAnnouncementsFromStorage();
    const newAnnouncement: JobAnnouncement = {
      ...data,
      id: Date.now().toString(),
      currentApplicants: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    announcements.push(newAnnouncement);
    saveAnnouncementsToStorage(announcements);
    return newAnnouncement;
  },

  // Update announcement
  update: async (id: string, data: Partial<JobAnnouncement>): Promise<JobAnnouncement | null> => {
    // TODO: Replace with API call
    // const response = await fetch(`/api/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    // return response.json();
    const announcements = getAnnouncementsFromStorage();
    const index = announcements.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    announcements[index] = {
      ...announcements[index],
      ...data,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    saveAnnouncementsToStorage(announcements);
    return announcements[index];
  },

  // Delete announcement
  delete: async (id: string): Promise<boolean> => {
    // TODO: Replace with API call
    // const response = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    // return response.ok;
    const announcements = getAnnouncementsFromStorage();
    const filtered = announcements.filter(a => a.id !== id);
    if (filtered.length === announcements.length) return false;
    saveAnnouncementsToStorage(filtered);
    return true;
  },

  // Get statistics
  getStats: async (): Promise<AnnouncementStats> => {
    // TODO: Replace with API call
    const announcements = getAnnouncementsFromStorage();
    const openAnnouncements = announcements.filter(a => a.status === 'open');
    return {
      totalAnnouncements: announcements.length,
      totalOpenPositions: openAnnouncements.reduce((sum, a) => sum + a.maxApplicants, 0),
      totalApplicants: announcements.reduce((sum, a) => sum + a.currentApplicants, 0)
    };
  }
};

export const applicantService = {
  // Get applicants for an announcement
  getByAnnouncementId: async (announcementId: string): Promise<AnnouncementApplicant[]> => {
    // TODO: Replace with API call
    const applicants = getApplicantsFromStorage();
    return applicants.filter(a => a.announcementId === announcementId);
  },

  // Update applicant status
  updateStatus: async (id: string, status: AnnouncementApplicant['status']): Promise<AnnouncementApplicant | null> => {
    // TODO: Replace with API call
    const applicants = getApplicantsFromStorage();
    const index = applicants.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    applicants[index] = { ...applicants[index], status };
    saveApplicantsToStorage(applicants);
    return applicants[index];
  }
};

// Related fields options
export const relatedFieldOptions = [
  // 💻 คอมพิวเตอร์ / IT
  'เทคโนโลยีสารสนเทศ',
  'วิทยาการคอมพิวเตอร์',
  'วิศวกรรมคอมพิวเตอร์',
  'วิศวกรรมซอฟต์แวร์',
  'วิทยาการข้อมูล',
  'ปัญญาประดิษฐ์',
  'ความมั่นคงปลอดภัยไซเบอร์',
  'เทคโนโลยีมัลติมีเดีย',
  'ดิจิทัลมีเดีย',
  'เกมและสื่ออินเทอร์แอคทีฟ',

  // ⚙️ วิศวกรรมศาสตร์
  'วิศวกรรมโยธา',
  'วิศวกรรมเครื่องกล',
  'วิศวกรรมไฟฟ้า',
  'วิศวกรรมอิเล็กทรอนิกส์',
  'วิศวกรรมอุตสาหการ',
  'วิศวกรรมเคมี',
  'วิศวกรรมสิ่งแวดล้อม',
  'วิศวกรรมพลังงาน',
  'วิศวกรรมเมคคาทรอนิกส์',
  'วิศวกรรมโลจิสติกส์',
  'วิศวกรรมวัสดุ',
  'วิศวกรรมยานยนต์',
  'วิศวกรรมการบินและอวกาศ',
  'วิศวกรรมระบบราง',

  // 🔬 วิทยาศาสตร์
  'คณิตศาสตร์',
  'สถิติ',
  'ฟิสิกส์',
  'เคมี',
  'ชีววิทยา',
  'เทคโนโลยีชีวภาพ',
  'จุลชีววิทยา',
  'วิทยาศาสตร์สิ่งแวดล้อม',
  'วิทยาศาสตร์การอาหาร',

  // 💼 บริหารธุรกิจ / เศรษฐศาสตร์
  'บัญชี',
  'การเงิน',
  'บริหารธุรกิจ',
  'การตลาด',
  'การจัดการ',
  'ทรัพยากรบุคคล',
  'เศรษฐศาสตร์',
  'ธุรกิจระหว่างประเทศ',
  'โลจิสติกส์และซัพพลายเชน',
  'การเป็นผู้ประกอบการ',
  'พาณิชยศาสตร์',

  // 🎨 นิเทศ / ออกแบบ
  'นิเทศศาสตร์',
  'วารสารศาสตร์',
  'การประชาสัมพันธ์',
  'โฆษณา',
  'ภาพยนตร์และสื่อดิจิทัล',
  'ออกแบบกราฟิก',
  'ออกแบบผลิตภัณฑ์',
  'แฟชั่นดีไซน์',
  'สถาปัตยกรรมศาสตร์',
  'ภูมิสถาปัตยกรรม',
  'ศิลปะการแสดง',
  'ดนตรี',

  // ⚖️ สังคมศาสตร์ / มนุษยศาสตร์
  'รัฐศาสตร์',
  'รัฐประศาสนศาสตร์',
  'นิติศาสตร์',
  'สังคมวิทยา',
  'มานุษยวิทยา',
  'ประวัติศาสตร์',
  'ภาษาไทย',
  'ภาษาอังกฤษ',
  'ภาษาจีน',
  'ภาษาญี่ปุ่น',
  'จิตวิทยา',
  'ปรัชญา',

  // 👩‍🏫 ครุศาสตร์ / ศึกษาศาสตร์
  'ครุศาสตร์',
  'ศึกษาศาสตร์',
  'การศึกษาปฐมวัย',
  'พลศึกษา',

  // 🏥 สุขภาพ
  'แพทยศาสตร์',
  'ทันตแพทยศาสตร์',
  'เภสัชศาสตร์',
  'พยาบาลศาสตร์',
  'เทคนิคการแพทย์',
  'กายภาพบำบัด',
  'สาธารณสุขศาสตร์',
  'สัตวแพทยศาสตร์',
  'รังสีเทคนิค',
  'โภชนาการ',

  // 🌾 เกษตร
  'เกษตรศาสตร์',
  'พืชศาสตร์',
  'สัตวศาสตร์',
  'ประมง',
  'วนศาสตร์',
  'อุตสาหกรรมเกษตร',

  // ✈️ การบริการ / ท่องเที่ยว
  'การโรงแรม',
  'การท่องเที่ยว',
  'ธุรกิจการบิน',
  'การจัดการการบริการ'
];


// Thai month names for date formatting
export const thaiMonths = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const formatDateThai = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  return `${day} ${thaiMonths[month]} ${year}`;
};
