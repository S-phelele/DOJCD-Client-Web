// services/api.js
import axios from 'axios';
//import { API_URL } from '@env';

// Get base URL from environment variables (Vite or CRA)
const getBaseURL = () => {
    // For Vite: import.meta.env.VITE_API_URL
    // if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    //     return import.meta.env.VITE_API_URL;
    // }

    // In development (npm start), use relative URL so the proxy works
    if (process.env.NODE_ENV === 'development') {
        return '/api';
    }

    // For Create React App: process.env.REACT_APP_API_URL
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    // Fallback
    return 'https://api.malcam.co.za/api';
};

const BASE_URL = getBaseURL();

console.log('🌐 Using API URL:', BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor (optional logging)
api.interceptors.request.use(
    (config) => {
        console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Request setup error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor – preserves response object for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('❌ API Error:', error.message);

        if (error.response) {
            const customError = new Error(
                error.response.data?.message || `Server error: ${error.response.status}`
            );
            Object.defineProperty(customError, 'response', {
                value: error.response,
                enumerable: true,
                configurable: true,
            });
            throw customError;
        } else if (error.request) {
            const customError = new Error(
                `Cannot connect to server at ${BASE_URL}. Check if backend is running.`
            );
            Object.defineProperty(customError, 'request', {
                value: error.request,
                enumerable: true,
                configurable: true,
            });
            throw customError;
        } else {
            throw new Error('Request configuration error: ' + error.message);
        }
    }
);

// Helper to convert file objects (web uses File, not uri)
const prepareFileForUpload = (file) => {
    if (!file) return undefined;
    // If it's a File object (web), return as is
    if (file instanceof File) return file;
    // If it has a uri (React Native legacy) – you can remove this if not needed
    if (file.uri) {
        console.warn('⚠️ Received React Native file object – convert to File before calling');
        return file;
    }
    return file;
};

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
    registerClient: async (userData) => {
        try {
            // Remove profile completion fields (they belong to step 2)
            const {
                network_provider,
                contract_duration_months,
                contract_end_date,
                invoice_file,
                id_document,
                payslip_document,
                residence_document,
                ...basicUserData
            } = userData;

            const response = await api.post('/auth/register', basicUserData);
            return response.data;
        } catch (error) {
            console.error('🔴 Registration error:', error);
            throw error;
        }
    },

    completeProfile: async (clientUserId, profileData) => {
        try {
            console.log('📤 Starting profile completion for user:', clientUserId);

            const formData = new FormData();

            // Add text fields
            formData.append('network_provider', profileData.network_provider);
            formData.append('contract_duration_months', profileData.contract_duration_months.toString());
            formData.append('contract_end_date', profileData.contract_end_date);

            // Append files (web expects File objects)
            if (profileData.invoice_file && profileData.invoice_file instanceof File) {
                formData.append('invoice_file', profileData.invoice_file);
            }
            if (profileData.id_document && profileData.id_document instanceof File) {
                formData.append('id_document', profileData.id_document);
            }
            if (profileData.payslip_document && profileData.payslip_document instanceof File) {
                formData.append('payslip_document', profileData.payslip_document);
            }
            if (profileData.residence_document && profileData.residence_document instanceof File) {
                formData.append('residence_document', profileData.residence_document);
            }

            // Use a separate axios instance to avoid default JSON Content-Type
            const formDataAxios = axios.create({
                baseURL: BASE_URL,
                timeout: 60000,
            });

            const response = await formDataAxios.post(
                `/auth/complete-profile/${clientUserId}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            console.log('✅ Profile completed:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Complete profile error:', error);
            throw error;
        }
    },

    registerOperational: (userData) => api.post('/auth/register-operational', userData),

    login: async (loginData) => {
        try {
            console.log('🔵 Login request for:', loginData.email);
            const response = await api.post('/auth/login', loginData);
            console.log('✅ Login successful');
            return response.data;
        } catch (error) {
            console.error('🔴 Login error:', error);
            throw error;
        }
    },

    testConnection: () => api.get('/test'),
};

// ─── Admin API ──────────────────────────────────────────────────────────────
export const adminAPI = {
    getAllUsers: () => api.get('/admin/all-users'),
    getAllClientUsers: () => api.get('/admin/client-users'),
    getClientUserById: (id) => api.get(`/admin/client-users/${id}`),
    updateClientUserStatus: (id, data) => api.patch(`/admin/client-users/${id}/status`, data),
    getAllOperationalUsers: () => api.get('/admin/operational-users'),
    getOperationalUserById: (id) => api.get(`/admin/operational-users/${id}`),
    getUserStatistics: () => api.get('/admin/statistics'),
    getDashboardData: () => api.get('/admin/dashboard'),
    getRecentRegistrations: () => api.get('/admin/recent-registrations'),
    searchUsers: (query) => api.get(`/admin/search?query=${query}`),
    loginAdmin: (loginData) => api.post('/auth/login-operational', loginData),
};

// ─── Device API ─────────────────────────────────────────────────────────────
export const deviceAPI = {
    getAvailableDevices: () => api.get('/applications/devices'),
    getDeviceDetails: (deviceId) => api.get(`/applications/devices/${deviceId}`),
    submitApplication: (clientUserId, deviceId) =>
        api.post('/applications/applications', {
            client_user_id: clientUserId,
            device_id: deviceId,
        }),
    getUserApplications: (clientUserId) =>
        api.get(`/applications/users/${clientUserId}/applications`),
    getApplicationDetails: (clientUserId, applicationId) =>
        api.get(`/applications/users/${clientUserId}/applications/${applicationId}`),
    cancelApplication: (clientUserId, applicationId) =>
        api.put(`/applications/users/${clientUserId}/applications/${applicationId}/cancel`),
    getApplicationSummary: (clientUserId) =>
        api.get(`/applications/users/${clientUserId}/applications/summary`),
    checkEligibility: (clientUserId) =>
        api.get(`/applications/users/${clientUserId}/eligibility`),
};

// ─── Notification API ───────────────────────────────────────────────────────
export const notificationAPI = {
    getUserNotifications: (userId, userType) =>
        api.get(`/notifications/user?user_id=${userId}&user_type=${userType}`),
    getUnreadCount: (userId, userType) =>
        api.get(`/notifications/unread-count?user_id=${userId}&user_type=${userType}`),
    markAsRead: (notificationId, userId, userType) =>
        api.patch(`/notifications/${notificationId}/read`, {
            user_id: userId,
            user_type: userType,
        }),
    markAllAsRead: (userId, userType) =>
        api.patch('/notifications/mark-all-read', {
            user_id: userId,
            user_type: userType,
        }),
    deleteNotification: (notificationId, userId, userType) =>
        api.delete(`/notifications/${notificationId}`, {
            data: { user_id: userId, user_type: userType },
        }),
};

export default api;