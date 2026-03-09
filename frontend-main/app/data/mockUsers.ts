// Mock Users Data สำหรับทดสอบระบบ Login
// สามารถเพิ่ม/แก้ไข user ได้ที่นี่

export interface MockUser {
  id: string;
  email: string;
  phone: string;
  employeeId?: string; // รหัสพนักงาน สำหรับ admin และ owner
  password: string;
  firstName: string;
  lastName: string;
  role: "intern" | "admin" | "owner";
}

// Extended interface สำหรับข้อมูลผู้สมัครที่ลงทะเบียน
export interface RegisteredIntern extends MockUser {
  gender: string;
  education: string;
  institution: string;
  faculty?: string; // คณะ (สำหรับมหาวิทยาลัยและอื่นๆ)
  major: string;
  startDate: string;
  endDate: string;
  trainingHours: string;
  profileImage?: string; // Base64 string
}

// localStorage key
const REGISTERED_USERS_KEY = 'registered_interns';
const CURRENT_USER_KEY = 'current_user';

// ฟังก์ชันจัดการ localStorage
export const getRegisteredInterns = (): RegisteredIntern[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(REGISTERED_USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRegisteredIntern = (intern: RegisteredIntern): void => {
  if (typeof window === 'undefined') return;
  const interns = getRegisteredInterns();
  // Check if phone already exists
  const existingIndex = interns.findIndex(i => i.phone === intern.phone);
  if (existingIndex >= 0) {
    interns[existingIndex] = intern;
  } else {
    interns.push(intern);
  }
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(interns));
};

export const getCurrentUser = (): RegisteredIntern | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: RegisteredIntern | MockUser): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const clearCurrentUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
};

// ข้อมูลผู้สมัคร (Intern)
export const mockInterns: MockUser[] = [
  {
    id: "intern-001",
    email: "patpatkittaphat@gmail.com",
    phone: "0928146947",
    password: "123456",
    firstName: "กฤตภาส",
    lastName: "วิริยภาพไพบูลย์",
    role: "intern",
  },
  // เพิ่ม intern อื่นๆ ได้ที่นี่
];

// ข้อมูล Admin
export const mockAdmins: MockUser[] = [
  {
    id: "admin-001",
    email: "admin@pea.co.th",
    phone: "0812345678",
    employeeId: "ADM001",
    password: "admin123",
    firstName: "แอดมิน",
    lastName: "ระบบ",
    role: "admin",
  },
  // เพิ่ม admin อื่นๆ ได้ที่นี่
];

// ข้อมูล Owner (พนักงาน/เจ้าของหน่วยงาน)
export const mockOwners: MockUser[] = [
  {
    id: "owner-001",
    email: "owner@pea.co.th",
    phone: "0899999999",
    employeeId: "EMP001",
    password: "owner123",
    firstName: "เจ้าของ",
    lastName: "หน่วยงาน",
    role: "owner",
  },
  // เพิ่ม owner อื่นๆ ได้ที่นี่
];

// รวม users ทั้งหมด
export const allMockUsers: MockUser[] = [
  ...mockInterns,
  ...mockAdmins,
  ...mockOwners,
];

// ฟังก์ชันสำหรับตรวจสอบ login
export const validateLogin = (
  phone: string,
  password: string,
  role?: "intern" | "admin" | "owner"
): MockUser | RegisteredIntern | null => {
  // สำหรับ intern ให้ตรวจสอบ localStorage ก่อน
  if (role === "intern" || !role) {
    const registeredInterns = getRegisteredInterns();
    const registeredUser = registeredInterns.find(
      (u) => u.phone === phone && u.password === password
    );
    if (registeredUser) {
      return registeredUser;
    }
  }
  
  let users: MockUser[];
  
  if (role) {
    // ถ้าระบุ role ให้ค้นหาเฉพาะ role นั้น
    switch (role) {
      case "intern":
        users = mockInterns;
        break;
      case "admin":
        users = mockAdmins;
        break;
      case "owner":
        users = mockOwners;
        break;
      default:
        users = allMockUsers;
    }
  } else {
    // ถ้าไม่ระบุ role ให้ค้นหาทั้งหมด
    users = allMockUsers;
  }
  
  const user = users.find(
    (u) => u.phone === phone && u.password === password
  );
  
  return user || null;
};

// ฟังก์ชันสำหรับตรวจสอบ login ด้วย email
export const validateLoginByEmail = (
  email: string,
  password: string,
  role?: "intern" | "admin" | "owner"
): MockUser | null => {
  let users: MockUser[];
  
  if (role) {
    switch (role) {
      case "intern":
        users = mockInterns;
        break;
      case "admin":
        users = mockAdmins;
        break;
      case "owner":
        users = mockOwners;
        break;
      default:
        users = allMockUsers;
    }
  } else {
    users = allMockUsers;
  }
  
  const user = users.find(
    (u) => u.email === email && u.password === password
  );
  
  return user || null;
};

// ฟังก์ชันสำหรับตรวจสอบ login ด้วยรหัสพนักงาน (สำหรับ admin และ owner)
export const validateLoginByEmployeeId = (
  employeeId: string,
  password: string,
  role?: "admin" | "owner"
): MockUser | null => {
  let users: MockUser[];
  
  if (role) {
    switch (role) {
      case "admin":
        users = mockAdmins;
        break;
      case "owner":
        users = mockOwners;
        break;
      default:
        users = [...mockAdmins, ...mockOwners];
    }
  } else {
    users = [...mockAdmins, ...mockOwners];
  }
  
  const user = users.find(
    (u) => u.employeeId === employeeId && u.password === password
  );
  
  return user || null;
};
