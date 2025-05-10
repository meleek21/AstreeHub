import axios from 'axios';

const API_BASE_URL = 'http://localhost:5126/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Export the api instance
export { api };

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
  register: (formData) => api.post('/auth/register', formData),
  logout: () => api.post('/auth/logout'),
  getUserInfo: () => api.get('/auth/me'),
};

// Posts API service
export const conversationsAPI = {
  createConversation: (conversationData) => api.post('/conversations', conversationData),
  getConversation: (id) => api.get(`/conversations/${id}`),
};

export const postsAPI = {
  getAllPosts: (lastItemId, limit = 10) => api.get(`/post?lastItemId=${lastItemId || ''}&limit=${limit}`),
  getChannelPosts: (channelId, lastItemId, limit = 10) => api.get(`/post/channel/${channelId}?lastItemId=${lastItemId || ''}&limit=${limit}`),
  getPostById: (id) => api.get(`/post/${id}`),
  createPost: (postData) => api.post('/post', postData),
  updatePost: (id, postData) => api.put(`/post/${id}`, postData),
  deletePost: (id) => api.delete(`/post/${id}`),
  uploadFile: (formData) => api.post('/post/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  // Channel-specific post endpoints
  createChannelPost: (channelId, postData) => api.post(`/post/channel/${channelId}`, postData),
  updateChannelPost: (channelId, postId, postData) => api.put(`/post/channel/${channelId}/post/${postId}`, postData),
  deleteChannelPost: (channelId, postId) => api.delete(`/post/channel/${channelId}/${postId}`),
  getPostsByAuthor: (authorId, lastItemId, limit = 10) => api.get(`/post/author/${authorId}?lastItemId=${lastItemId || ''}&limit=${limit}`),
};

// Reactions API service
export const reactionsAPI = {
  addReaction: (reactionData) => api.post('/reaction', reactionData),
  getReactionsByPost: (postId) => api.get(`/reaction/post/${postId}`),
  getReactionsByEmployee: (employeeId) => api.get(`/reaction/employee/${employeeId}`),
  getReactionByEmployeeAndPost: (employeeId, postId) => api.get(`/reaction/employee/${employeeId}/post/${postId}`),
  getReactionsSummary: (postId) => api.get(`/reaction/post/${postId}/summary`),
  deleteReaction: (id) => api.delete(`/reaction/${id}`)
};

// User info API service
export const userAPI = {
  getUserInfo: (employeeId) => api.get(`/employee/user-info/${employeeId}`),
  updateProfile: (userId, formData) => api.put(`/employee/${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  getAllEmployees: () => api.get('/employee'),
};

// User online status API service - Updated with correct casing
export const userOnlineStatusAPI = {
  getOnlineUsers: () => api.get('/UserOnlineStatus/online'),
  getUserStatus: (userId) => api.get(`/UserOnlineStatus/${userId}/status`),
  getLastSeen: (userId) => api.get(`/UserOnlineStatus/${userId}/last-seen`),
  updateUserStatus: (userId, isOnline) => api.post(`/UserOnlineStatus/${userId}/status`, isOnline),
  updateLastActivity: (userId) => api.post(`/UserOnlineStatus/${userId}/activity`)
};

// Channels API service
export const channelsAPI = {
  getAllChannels: () => api.get('/Channel'),
  getUserChannels: (departmentId) => api.get(`/Channel/user${departmentId ? `?departmentId=${departmentId}` : ''}`),
  getChannelById: (id) => api.get(`/Channel/${id}`),
  createChannel: (channelData) => api.post('/Channel', channelData),
  updateChannel: (id, channelData) => api.put(`/Channel/${id}`, channelData),
  deleteChannel: (id) => api.delete(`/Channel/${id}`)
};

// Messages API service
export const messagesAPI = {
  // Conversation endpoints
  getUserConversations: (userId) => api.get(`/message/users/${userId}/conversations`),
  getConversation: (conversationId, userId) => api.get(`/message/conversations/${conversationId}?userId=${userId}`).then(res => ({ ...res.data, creatorId: res.data.creatorId })),
  getConversationMessages: (conversationId, userId, skip = 0, limit = 50) => 
    api.get(`/message/conversations/${conversationId}/messages`, { 
      params: { 
        userId,
        skip,
        limit
      }
    }),
  
  // Message endpoints
  sendMessage: (messageData) => api.post('/message/messages', messageData),
  markMessageAsRead: (messageId, statusDto) => api.put(`/message/messages/${messageId}/read-status`, statusDto),
  deleteMessage: (messageId) => api.delete(`/message/messages/${messageId}`),
  // Message endpoints
  editMessage: (messageId, messageData) => api.put(`/message/messages/${messageId}/edit`, messageData, {
  headers: {
    'Content-Type': 'application/json'
  }
}),

unsendMessage: (messageId, userId) => api.delete(`/message/messages/${messageId}/unsend`, {
  headers: {
    'Content-Type': 'application/json'
  },
  data: JSON.stringify(userId)
}),

softDeleteMessage: (messageId, userId) => api.put(`/message/messages/${messageId}/soft-delete`, JSON.stringify(userId), {
  headers: {
    'Content-Type': 'application/json'
  }
}),
  softDeleteConversation: (conversationId, userId) => api.put(`/message/conversations/${conversationId}/soft-delete`, JSON.stringify(userId), {
    headers: {
      'Content-Type': 'application/json'
    }
  }),

  createConversation: (conversationData) => api.post('/message/conversations', conversationData),
  
  // Unread messages
  getUnreadMessagesCount: (userId) => api.get(`/message/users/${userId}/unread-messages/count`),

  // Attachment upload endpoint
  uploadMessageAttachment: (formData) => api.post('/message/upload-message-attachment', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),

  // Group management endpoints
  permanentlyDeleteGroup: (conversationId, userId) => api.delete(`/message/conversations/${conversationId}/permanent`, {
    params: { userId }
  }),
  addParticipant: (conversationId, userId, newParticipantId) => api.post(`/message/conversations/${conversationId}/participants?userId=${userId}&newParticipantId=${newParticipantId}`),
  leaveGroup: (conversationId, userId) => api.post(`/message/conversations/${conversationId}/leave?userId=${userId}`),
  getParticipants: (conversationId) => api.get(`/message/conversations/${conversationId}/participants`)
};

// Comments API service
export const commentsAPI = {
  getPostComments: (postId) => api.get(`/comment/post/${postId}`),
  createComment: (commentData) => api.post('/comment', commentData),
  addReply: (commentId, replyData) => api.post(`/comment/${commentId}/reply`, replyData),
  updateComment: (commentId, content) => api.put(`/comment/${commentId}`, { content }),
  deleteComment: (commentId) => api.delete(`/comment/${commentId}`),
  updateReply: (commentId, replyId, content) => api.put(`/comment/${commentId}/reply/${replyId}`, { content }),
  deleteReply: (commentId, replyId) => api.delete(`/comment/${commentId}/reply/${replyId}`)
};

// Events API service
export const eventsAPI = {
  getAllEvents: () => api.get('/event/all'),
  getEventById: (id) => api.get(`/event/get/${id}`),
  createEvent: (eventData) => api.post('/event/create', eventData),
  updateEvent: (id, eventData) => api.put(`/event/update/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/event/delete/${id}`),
  addAttendee: (eventId, attendeeData) => api.post(`/event/${eventId}/attendee`, attendeeData),
  removeAttendee: (eventId, attendeeId) => api.delete(`/event/remove-attendee/${eventId}/${attendeeId}`),
  updateAttendanceStatus: (eventId, attendeeId, status) => api.put(`/event/${eventId}/attendee/${attendeeId}/status`, { status }),
  getUserAttendanceStatus: (eventId, userId) => api.get(`/event/${eventId}/user/${userId}/attendance-status`),
  
  // Employee search and invitation endpoints

  getDepartmentEmployees: (departmentId) => api.get(`/department/${departmentId}`),
  getAllDepartments: () => api.get('/department'),

  
  // Bulk invitation endpoints
  inviteAll: (eventId) => api.post(`/event/${eventId}/invite-all`),
  inviteDepartment: (eventId, departmentId) => api.post(`/event/invite-department/${eventId}/${departmentId}`),
  inviteMultiple: (eventId, employeeIds) => api.post(`/event/${eventId}/invite-multiple`, employeeIds),
  inviteSelected: (eventId, employeeIds) => {
    console.log('inviteSelected payload:', employeeIds);
    return api.post(`/event/${eventId}/invite-multiple`, employeeIds);
  },

  getAttendanceStatusCounts: (eventId) => api.get(`/event/${eventId}/attendance-counts`),
  getUpcomingEvents: () => api.get('/event/upcoming'),
  getEventsByOrganizer: (organizerId) => api.get(`/event/by-organizer/${organizerId}`),
  getEventsByCategory: (category) => api.get(`/event/by-category/${category}`),
  getOpenEvents: () => api.get('/event/open-events'),
  getEventsByAttendee: (employeeId) => api.get(`/event/by-attendee/${employeeId}`),
  updateEventStatus: (eventId, status) => api.put(`/event/update-status/${eventId}`, status),
  GetTodaysBirthdays: () => api.get('/event/birthdays/today'),
  GetClosestBirthdays: () => api.get('/event/birthdays/closest'),
  GetBirthdaysByMonth: (month) => api.get(`/event/birthdays/month/${month}`),
};


export const departmentAPI = {
  getEmployeesInDepartment: (departmentId) => api.get(`/Department/${departmentId}/employees`)
};

// Notifications API service
export const notificationAPI = {
  // Get all notifications for a user
  getNotifications: (userId) => api.get(`/notification?userId=${userId}`),

  // Get only unread notifications for a user
  getUnreadNotifications: (userId) => api.get(`/notification/unread?userId=${userId}`),

  // Get count of unread notifications
  getUnreadCount: (userId) => api.get(`/notification/count?userId=${userId}`),

  // Mark a notification as read
  markAsRead: (notificationId, userId) => api.put(`/notification/${notificationId}/read?userId=${userId}`),

  // Mark all notifications as read
  markAllAsRead: (userId) => api.put(`/notification/mark-all-read?userId=${userId}`),

  // Delete a notification
  deleteNotification: (notificationId, userId) => api.delete(`/notification/${notificationId}?userId=${userId}`),
};

