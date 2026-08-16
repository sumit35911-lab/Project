export interface User {
  _id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  statusMessage?: string;
  isOnline?: boolean;
  lastSeen?: string | Date;
  friends?: (string | User)[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  _id: string;
  author: User;
  content: string;
  image?: string;
  tags?: string[];
  mood?: string;
  likes: (string | User)[];
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  _id: string;
  post: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  isGroup: boolean;
  name?: string;
  description?: string;
  groupAvatar?: string;
  admin?: User;
  participants: User[];
  lastMessage?: {
    text: string;
    sender?: User;
    createdAt?: string | Date;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  text?: string;
  mediaUrl?: string;
  messageType: 'text' | 'image' | 'system';
  readBy?: (string | User)[];
  createdAt: string;
}

export interface FriendRequest {
  _id: string;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'friend_request' | 'friend_accept' | 'post_like' | 'post_comment' | 'group_add' | 'message';
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}
