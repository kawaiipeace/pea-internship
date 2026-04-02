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
}

const authStore: StateCreator<AuthStore> = (set) => ({
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
        document.cookie = `token=; path=/; max-age=0`;
        document.cookie = `user_role=; path=/; max-age=0`;
    },
    actionLogin: async (form: FormLogin) => {
        const res = await axios.post('/auth/sign-in/intern/itt', form);
        const data = res.data as any;
        const token = data.accessToken ?? data.token ?? data.session?.token ?? null;

        set({
            token,
            user: data.user ?? null,
        });

        if (token) {
            document.cookie = `token=${token}; path=/; max-age=86400`;
        }
        
        // Unconditionally set user_role if login succeeds, as it is required by middleware
        if (data.user) {
            document.cookie = `user_role=intern; path=/; max-age=86400`;
        }

        return;
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
            document.cookie = `token=; path=/; max-age=0`;
            document.cookie = `user_role=; path=/; max-age=0`;
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
