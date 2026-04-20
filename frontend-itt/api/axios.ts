import axios, { AxiosInstance } from 'axios';

const getTokenFromCookie = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
    return match ? match[1] : null;
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const axiosInstance: AxiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getTokenFromCookie();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default axiosInstance;