import axios from 'axios';

const API_BASE_URL = 'http://localhost:5126/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable sending cookies in cross-origin requests
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
  getUserInfo: () => api.get('/auth/me'),
};

// Posts API service
export const postsAPI = {
  getAllPosts: () => api.get('/post'),
  createPost: (postData) => api.post('/post', postData),
  updatePost: (id, postData) => api.put(`/post/${id}`, postData),
  deletePost: (id) => api.delete(`/post/${id}`),
};