import axios from 'axios';

const API_BASE_URL = 'http://localhost:5126/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token on any 401 Unauthorized response
      console.log('Unauthorized access, clearing token');
      localStorage.removeItem('token');
      
      // Dispatch a custom event to notify the app about authentication failure
      window.dispatchEvent(new CustomEvent('authError', {
        detail: { message: 'Authentication failed. Please log in again.' }
      }));
    }
    return Promise.reject(error);
  }
);

// Auth API service
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getUserInfo: () => api.get('/auth/me'),
};

// Posts API service
export const postsAPI = {
  getAllPosts: (lastItemId, limit = 10) => api.get(`/post?lastItemId=${lastItemId || ''}&limit=${limit}`),
  getPostById: (id) => api.get(`/post/${id}`),
  createPost: (postData) => api.post('/post', postData),
  updatePost: (id, postData) => api.put(`/post/${id}`, postData),
  deletePost: (id) => api.delete(`/post/${id}`),
  uploadFile: (formData) => api.post('/post/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
};

// Reactions API service
export const reactionsAPI = {
  addReaction: (reactionData) => api.post('/reaction', reactionData),
  getReactionsByPost: (postId) => api.get(`/reaction/post/${postId}`),
  getReactionsByEmployee: (employeeId) => api.get(`/reaction/employee/${employeeId}`),
  getReactionByEmployeeAndPost: (employeeId, postId) => api.get(`/reaction/employee/${employeeId}/post/${postId}`),
  getReactionsSummary: (postId) => api.get(`/reaction/post/${postId}/summary`),
  deleteReaction: (id) => api.delete(`/reaction/${id}`),
};

// User info API service
export const userAPI = {
  getUserInfo: (employeeId) => api.get(`/employee/user-info/${employeeId}`),
  updateProfile: (userId, formData) => api.put(`/employee/${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
};

// User online status API service
export const userStatusAPI = {
  getOnlineUsers: () => api.get('/useronlinestatus/online'),
  getUserStatus: (userId) => api.get(`/useronlinestatus/${userId}/status`),
  getLastSeen: (userId) => api.get(`/useronlinestatus/${userId}/last-seen`),
  updateUserStatus: (userId, isOnline) => api.post(`/useronlinestatus/${userId}/status`, isOnline),
  updateLastActivity: (userId) => api.post(`/useronlinestatus/${userId}/activity`)
};