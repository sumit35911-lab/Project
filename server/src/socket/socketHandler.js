import { User } from '../models/User.js';

// Map of userId -> Set of socketIds (to handle multiple tabs)
const onlineUsers = new Map();

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    let currentUserId = null;

    // User authenticates/connects their socket
    socket.on('user:online', async (userId) => {
      if (!userId) return;
      currentUserId = userId.toString();

      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, new Set());
      }
      onlineUsers.get(currentUserId).add(socket.id);

      try {
        await User.findByIdAndUpdate(currentUserId, {
          isOnline: true,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error('Error updating user online state:', err);
      }

      // Broadcast list of currently online user IDs
      const onlineUserIds = Array.from(onlineUsers.keys());
      io.emit('users:online_list', onlineUserIds);
      io.emit('user:status_change', { userId: currentUserId, isOnline: true });
    });

    // Join conversation room
    socket.on('chat:join', (chatId) => {
      if (chatId) {
        socket.join(chatId.toString());
      }
    });

    // Leave conversation room
    socket.on('chat:leave', (chatId) => {
      if (chatId) {
        socket.leave(chatId.toString());
      }
    });

    // Send Real-time message
    socket.on('message:send', (data) => {
      // data: { chatId, message, recipientIds }
      if (!data || !data.chatId || !data.message) return;

      // Broadcast to room
      socket.to(data.chatId.toString()).emit('message:received', {
        chatId: data.chatId,
        message: data.message,
      });

      // Also notify individual recipient sockets (for unread count badges outside chat room)
      if (Array.isArray(data.recipientIds)) {
        data.recipientIds.forEach((recipientId) => {
          const userSockets = onlineUsers.get(recipientId.toString());
          if (userSockets) {
            userSockets.forEach((socketId) => {
              io.to(socketId).emit('chat:unread_update', {
                chatId: data.chatId,
                message: data.message,
              });
            });
          }
        });
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ chatId, user }) => {
      if (chatId) {
        socket.to(chatId.toString()).emit('typing:status', {
          chatId,
          user,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', ({ chatId, user }) => {
      if (chatId) {
        socket.to(chatId.toString()).emit('typing:status', {
          chatId,
          user,
          isTyping: false,
        });
      }
    });

    // Social Feed Live Events
    socket.on('post:created', (post) => {
      socket.broadcast.emit('feed:post_new', post);
    });

    socket.on('post:liked', ({ postId, likesCount, userId, isLiked }) => {
      socket.broadcast.emit('feed:post_like_update', { postId, likesCount, userId, isLiked });
    });

    socket.on('post:commented', ({ postId, comment, commentsCount }) => {
      socket.broadcast.emit('feed:post_comment_new', { postId, comment, commentsCount });
    });

    // Live Notification Dispatch
    socket.on('notification:send', ({ recipientId, notification }) => {
      if (!recipientId) return;
      const userSockets = onlineUsers.get(recipientId.toString());
      if (userSockets) {
        userSockets.forEach((socketId) => {
          io.to(socketId).emit('notification:new', notification);
        });
      }
    });

    // Friend Request Live Update
    socket.on('friend:update', ({ targetUserId, type, data }) => {
      if (!targetUserId) return;
      const userSockets = onlineUsers.get(targetUserId.toString());
      if (userSockets) {
        userSockets.forEach((socketId) => {
          io.to(socketId).emit('friend:event', { type, data });
        });
      }
    });

    // Handle Disconnect
    socket.on('disconnect', async () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSockets = onlineUsers.get(currentUserId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(currentUserId);
          try {
            await User.findByIdAndUpdate(currentUserId, {
              isOnline: false,
              lastSeen: new Date(),
            });
          } catch (err) {
            console.error('Error updating user offline state:', err);
          }

          io.emit('user:status_change', {
            userId: currentUserId,
            isOnline: false,
            lastSeen: new Date(),
          });
          io.emit('users:online_list', Array.from(onlineUsers.keys()));
        }
      }
    });
  });
};
