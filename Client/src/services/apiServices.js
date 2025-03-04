import axios from 'axios';

const API_BASE_URL = 'http://localhost:5126/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
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
    // Only handle specific token-related errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Log the full error for debugging
      console.error('Auth error in interceptor:', error.response?.data);
      
      // Only clear token if the error explicitly mentions token issues
      // This is more restrictive to prevent false positives
      const errorMessage = JSON.stringify(error.response?.data || '').toLowerCase();
      const isTokenError = 
        errorMessage.includes('invalid token') || 
        errorMessage.includes('expired token') || 
        errorMessage.includes('malformed token');
      
      if (isTokenError) {
        console.log('Clearing token due to specific token error');
        localStorage.removeItem('token');
        
        // Do NOT automatically redirect - let the components handle navigation
        // This prevents unwanted redirects
      }
    }
    return Promise.reject(error);
  }
);

// Auth API service
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getUserInfo: () => api.get('/auth/me'),
};

// Posts API service
export const postsAPI = {
  getAllPosts: () => api.get('/post'),
  createPost: (postData) => api.post('/post', postData),
  updatePost: (id, postData) => api.put(`/post/${id}`, postData),
  deletePost: (id) => api.delete(`/post/${id}`),
};