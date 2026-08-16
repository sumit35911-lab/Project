import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { User, Post, Comment, Conversation, Message, Notification, FriendRequest } from '../types';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nexushub_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Explicit Typed API Endpoints
export const authAPI = {
  suggestUsername: (name: string = '') =>
    api.get<{ success: boolean; username: string }>(`/auth/suggest-username?name=${encodeURIComponent(name)}`),
  register: (data: { name: string; username: string; email: string; password: string; avatar?: string; bio?: string }) =>
    api.post<{ success: boolean; token: string; user: User; message?: string }>('/auth/register', data),
  login: (data: { emailOrUsername: string; password: string }) =>
    api.post<{ success: boolean; token: string; user: User; message?: string }>('/auth/login', data),
  demoLogin: (username: string) =>
    api.post<{ success: boolean; token: string; user: User; message?: string }>('/auth/demo-login', { username }),
  getMe: () =>
    api.get<{ success: boolean; user: User }>('/auth/me'),
  updateProfile: (data: Partial<User>) =>
    api.put<{ success: boolean; user: User; message?: string }>('/auth/profile', data),
};

export const userAPI = {
  search: (q: string) =>
    api.get<{ success: boolean; users: User[] }>(`/users/search?q=${encodeURIComponent(q)}`),
  getSuggestions: () =>
    api.get<{ success: boolean; suggestions: User[] }>('/users/suggestions'),
  getProfile: (identifier: string) =>
    api.get<{ success: boolean; user: User; postsCount: number; friendshipStatus: string }>(`/users/profile/${identifier}`),
};

export const friendAPI = {
  sendRequest: (targetUserId: string) =>
    api.post<{ success: boolean; message: string; status: string }>('/friends/request', { targetUserId }),
  respondRequest: (requestId: string, action: 'accept' | 'reject') =>
    api.post<{ success: boolean; message: string; friend?: User }>('/friends/respond', { requestId, action }),
  getFriends: () =>
    api.get<{ success: boolean; friends: User[] }>('/friends/list'),
  getPending: () =>
    api.get<{ success: boolean; received: FriendRequest[]; sent: FriendRequest[] }>('/friends/pending'),
  removeFriend: (friendId: string) =>
    api.delete<{ success: boolean; message: string }>(`/friends/${friendId}`),
};

export const postAPI = {
  create: (data: { content: string; image?: string; tags?: string | string[]; mood?: string }) =>
    api.post<{ success: boolean; message: string; post: Post }>('/posts', data),
  getFeed: (filter: string = 'all', tag: string = '') =>
    api.get<{ success: boolean; count: number; posts: Post[] }>(`/posts?filter=${filter}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`),
  likeUnlike: (postId: string) =>
    api.post<{ success: boolean; isLiked: boolean; likesCount: number; likes: (string | User)[] }>(`/posts/${postId}/like`),
  addComment: (postId: string, content: string) =>
    api.post<{ success: boolean; comment: Comment; commentsCount: number }>(`/posts/${postId}/comment`, { content }),
  getComments: (postId: string) =>
    api.get<{ success: boolean; comments: Comment[] }>(`/posts/${postId}/comments`),
  delete: (postId: string) =>
    api.delete<{ success: boolean; message: string }>(`/posts/${postId}`),
  getUserPosts: (userId: string) =>
    api.get<{ success: boolean; posts: Post[] }>(`/posts/user/${userId}`),
};

export const chatAPI = {
  getConversations: () =>
    api.get<{ success: boolean; conversations: Conversation[] }>('/chats'),
  getOrCreateDirect: (recipientId: string) =>
    api.post<{ success: boolean; conversation: Conversation }>('/chats/direct', { recipientId }),
  createGroup: (data: { name: string; description?: string; groupAvatar?: string; participantIds: string[] }) =>
    api.post<{ success: boolean; message?: string; conversation: Conversation }>('/chats/group', data),
  updateMembers: (chatId: string, action: 'add' | 'remove', memberId: string) =>
    api.put<{ success: boolean; message: string; conversation: Conversation }>(`/chats/${chatId}/members`, { action, memberId }),
};

export const messageAPI = {
  getMessages: (chatId: string) =>
    api.get<{ success: boolean; count: number; messages: Message[] }>(`/messages/${chatId}`),
  sendMessage: (chatId: string, data: { text?: string; mediaUrl?: string; messageType?: string }) =>
    api.post<{ success: boolean; message: Message }>(`/messages/${chatId}`, data),
};

export const notificationAPI = {
  getNotifications: () =>
    api.get<{ success: boolean; notifications: Notification[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) =>
    api.put<{ success: boolean; notification: Notification }>(`/notifications/${id}/read`),
  markAllRead: () =>
    api.put<{ success: boolean; message: string }>('/notifications/read-all'),
};

export const systemAPI = {
  seedDatabase: () => api.post<{ success: boolean; message: string }>('/seed'),
};

export default api;
