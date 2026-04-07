import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from "../api/axios"

interface UserProfile {
    id: number;
    userId: string;
    image: string | null;
    institutionId: number;
    faculty: string;
    major: string;
    isActive: boolean;
    studentNote: string | null;
    internshipStatus: string;
    statusNote: string | null;
    hours: string;
    startDate: string;
    endDate: string;
}

interface UserSchema {
    id: string;
    roleId: number;
    departmentId: number | null;
    fname: string;
    lname: string;
    username: string;
    displayUsername: string;
    phoneNumber: string;
    email: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    profile?: UserProfile | null;
}

interface FormLogin {
    phoneNumber: string;
    password: string;
}

interface AuthStore {
    user: UserSchema | null;
    token: string | null;
    actionSetUser: (user: UserSchema | null) => void;
    actionSetToken: (token: string | null) => void;
    actionClearAuth: () => void;
    actionLogin: (form: FormLogin) => Promise<void>;
    actionLogout: () => Promise<void>;
    actionFetchProfile: () => Promise<void>;
}

const authStore: StateCreator<AuthStore> = (set, get) => ({
    user: null,
    token: null,
    actionSetUser: (user) => {
        set({ user });
    },
    actionSetToken: (token) => {
        set({ token });
    },
    actionClearAuth: () => {
        set({ user: null, token: null });
        useAuthStore.persist.clearStorage();
        document.cookie = `token=; path=/; max-age=0; SameSite=Lax`;
        document.cookie = `user_role=; path=/; max-age=0; SameSite=Lax`;
    },
    actionFetchProfile: async () => {
        try {
            const res = await axios.get('/user/profile');
            const userData = (res.data.data || res.data) as UserSchema;
            console.log('Fetched User Data:', userData);
            set({ user: userData });
        } catch (error) {
            console.error("Fetch profile failed:", error);
        }
    },
    actionLogin: async (form: FormLogin) => {
        const res = await axios.post('/auth/sign-in/intern/itt', form);
        const result = res.data as any;
        const loginData = result.data || result;

        const token = loginData.accessToken ?? loginData.token ?? loginData.sessionToken ?? loginData.session?.token ?? loginData.session?.sessionToken ?? loginData.session?.id ?? null;

        if (!token) {
            throw new Error("ไม่ได้รับ Token จากการ Login");
        }

        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;

        try {
            const profileRes = await axios.get('/user/profile', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const userData = (profileRes.data.data || profileRes.data) as UserSchema;

            set({
                token,
                user: userData,
            });

            if (userData) {
                const roleMap: Record<number, string> = {
                    1: 'admin',
                    2: 'owner',
                    3: 'intern',
                    4: 'owner',
                };
                const role = roleMap[userData.roleId] ?? 'intern';
                document.cookie = `user_role=${role}; path=/; max-age=86400; SameSite=Lax`;
            }

            return;

        } catch (error) {
            console.error("ดึงข้อมูล Profile ไม่สำเร็จ:", error);
            throw error;
        }
    },

    actionLogout: async () => {
        try {
            await axios.post('/auth/sign-out');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            set({
                user: null,
                token: null,
            });
            useAuthStore.persist.clearStorage();
            // Clear all auth cookies
            document.cookie = `token=; path=/; max-age=0; SameSite=Lax`;
            document.cookie = `user_role=; path=/; max-age=0; SameSite=Lax`;
        }
        return;
    },
});

const usePersist = {
    name: 'auth',
    getStorage: () => createJSONStorage(() => localStorage),
};

const useAuthStore = create(persist(authStore, usePersist));

export default useAuthStore;
