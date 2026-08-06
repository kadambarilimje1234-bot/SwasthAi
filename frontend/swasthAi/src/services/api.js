import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔗 API URL:', API_URL);

// ============================================
// TOKEN MANAGEMENT
// ============================================
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const tokenService = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  setAccessToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// ============================================
// AXIOS INSTANCE
// ============================================
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();
    console.log('📤 Request:', config.method.toUpperCase(), config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Access token attached');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR - FIXED
// ============================================
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error);
    
    // Don't redirect on 401 for login/register/signup
    const isAuthPage = error.config?.url?.includes('/login') || 
                       error.config?.url?.includes('/register') ||
                       window.location.pathname.includes('/login') ||
                       window.location.pathname.includes('/signup');
    
    if (error.response?.status === 401 && !isAuthPage) {
      tokenService.clear();
      window.location.href = '/staff-login';
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (credentials) => {
    console.log('🔐 Login API call:', credentials.email);
    return api.post('/auth/login', credentials);
  },
  register: (userData) => {
    console.log('📝 Register API call:', userData.email);
    return api.post('/auth/register', userData);
  },
  logout: () => {
    console.log('🚪 Logout API call');
    return api.post('/auth/logout');
  },
  refreshToken: (refreshToken) => {
    console.log('🔄 Refresh token API call');
    return api.post('/auth/refresh-token', { refreshToken });
  },
  getMe: () => {
    console.log('👤 Get me API call');
    return api.get('/auth/me');
  },
};

// ============================================
// PATIENT API
// ============================================
export const patientAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  getHighRisk: () => api.get('/patients/high-risk'),
  getByWard: (ward) => api.get(`/patients/ward/${ward}`),
  getFullDetails: (id) => api.get(`/patients/${id}/full-details`),
};

// ============================================
// VITALS API
// ============================================
export const vitalsAPI = {
  add: (data) => api.post('/vitals', data),
  getHistory: (patientId, params) => api.get(`/vitals/patient/${patientId}`, { params }),
  getLatest: (patientId) => api.get(`/vitals/patient/${patientId}/latest`),
  getById: (id) => api.get(`/vitals/${id}`),
  delete: (id) => api.delete(`/vitals/${id}`),
  getQuality: (patientId) => api.get(`/vitals/patient/${patientId}/quality`),
  getTrend: (patientId, hours) => api.get(`/vitals/patient/${patientId}/trend?hours=${hours}`),
  getAbnormal: (patientId) => api.get(`/vitals/patient/${patientId}/abnormal`),
};

// ============================================
// PREDICTION API
// ============================================
export const predictionAPI = {
  getPatientPredictions: (patientId, params) => api.get(`/predict/patient/${patientId}`, { params }),
  getLatest: (patientId) => api.get(`/predict/patient/${patientId}/latest`),
  getSummary: (patientId) => api.get(`/predict/patient/${patientId}/summary`),
  getHighRisk: (params) => api.get('/predict/high-risk', { params }),
};

export default api;