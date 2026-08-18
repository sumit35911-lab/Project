import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Notification } from '../types';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  isUserOnline: (userId?: string | null) => boolean;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  unreadNotificationCount: number;
  setUnreadNotificationCount: React.Dispatch<React.SetStateAction<number>>;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setOnlineUsers(new Set());
      return;
    }

    // Determine target WebSocket server URL
    let socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (window.location.origin.includes(':5173') ? 'http://localhost:5000' : window.location.origin);

    // Remove any trailing slash to prevent malformed socket paths
    socketUrl = socketUrl.replace(/\/+$/, '');

    // Initialize Socket.io with polling-first handshake and automatic upgrade
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Connected to NexusHub Realtime Server:', socketUrl);
      socket.emit('user:online', user._id);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Realtime connection attempt:', error.message);
    });

    // Listen for online users roster
    socket.on('users:online_list', (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on('user:status_change', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    // Live Notification
    socket.on('notification:new', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadNotificationCount((prev) => prev + 1);

      // Show transient toast
      setToastMessage(notification.message);
      setTimeout(() => setToastMessage(null), 4000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id]);

  const isUserOnline = (userId?: string | null): boolean => {
    if (!userId) return false;
    return onlineUsers.has(userId.toString());
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers,
        isUserOnline,
        notifications,
        setNotifications,
        unreadNotificationCount,
        setUnreadNotificationCount,
        toastMessage,
        setToastMessage,
      }}
    >
      {children}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '0.9rem',
            animation: 'modalScale 0.25s ease-out',
          }}
        >
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
