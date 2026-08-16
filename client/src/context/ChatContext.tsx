import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { chatAPI, messageAPI } from '../api/client';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { Conversation, Message, User } from '../types';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  typingUsers: Map<string, Map<string, string>>;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation | null) => Promise<void>;
  openDirectChat: (recipientId: string) => Promise<Conversation | undefined>;
  createGroupChat: (groupData: { name: string; description?: string; participantIds: string[]; groupAvatar?: string }) => Promise<Conversation>;
  sendMessage: (text: string, mediaUrl?: string) => Promise<Message | undefined>;
  emitTyping: (isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, Map<string, string>>>(new Map());

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
      const res = await chatAPI.getConversations();
      if (res.data.success) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when active conversation changes
  const selectConversation = async (conversation: Conversation | null) => {
    if (!conversation) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    if (activeConversation?._id && socket) {
      socket.emit('chat:leave', activeConversation._id);
    }

    setActiveConversation(conversation);
    setLoadingMessages(true);

    try {
      if (socket) {
        socket.emit('chat:join', conversation._id);
      }
      const res = await messageAPI.getMessages(conversation._id);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Start or open a 1-on-1 direct chat
  const openDirectChat = async (recipientId: string): Promise<Conversation | undefined> => {
    try {
      const res = await chatAPI.getOrCreateDirect(recipientId);
      if (res.data.success) {
        const conv = res.data.conversation;
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === conv._id);
          if (exists) {
            return prev.map((c) => (c._id === conv._id ? conv : c));
          }
          return [conv, ...prev];
        });
        await selectConversation(conv);
        return conv;
      }
    } catch (err) {
      console.error('Error opening direct chat:', err);
    }
  };

  // Create a new group chat
  const createGroupChat = async (groupData: {
    name: string;
    description?: string;
    participantIds: string[];
    groupAvatar?: string;
  }): Promise<Conversation> => {
    try {
      const res = await chatAPI.createGroup(groupData);
      if (res.data.success) {
        const newGroup = res.data.conversation;
        setConversations((prev) => [newGroup, ...prev]);
        await selectConversation(newGroup);
        return newGroup;
      }
      throw new Error(res.data.message || 'Failed to create group');
    } catch (err) {
      console.error('Error creating group chat:', err);
      throw err;
    }
  };

  // Send message
  const sendMessage = async (text: string, mediaUrl: string = ''): Promise<Message | undefined> => {
    if (!activeConversation?._id || (!text.trim() && !mediaUrl)) return;

    try {
      const res = await messageAPI.sendMessage(activeConversation._id, {
        text: text.trim(),
        mediaUrl,
      });

      if (res.data.success) {
        const newMsg = res.data.message;
        setMessages((prev) => [...prev, newMsg]);

        // Update conversation lastMessage
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? {
                  ...c,
                  lastMessage: {
                    text: newMsg.text || 'Photo attachment',
                    sender: user || undefined,
                    createdAt: new Date(),
                  },
                }
              : c
          )
        );

        // Emit Socket event to other members
        if (socket) {
          const recipientIds = activeConversation.participants
            .map((p) => (typeof p === 'object' ? p._id : p))
            .filter((id) => id.toString() !== user?._id?.toString());

          socket.emit('message:send', {
            chatId: activeConversation._id,
            message: newMsg,
            recipientIds,
          });
        }

        return newMsg;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  // Typing indicators
  const emitTyping = (isTyping: boolean) => {
    if (!socket || !activeConversation?._id || !user) return;
    const eventName = isTyping ? 'typing:start' : 'typing:stop';
    socket.emit(eventName, {
      chatId: activeConversation._id,
      user: { _id: user._id, name: user.name, username: user.username },
    });
  };

  // Socket event listeners for incoming messages & typing
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = ({ chatId, message }: { chatId: string; message: Message }) => {
      if (activeConversation?._id === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }

      setConversations((prev) =>
        prev.map((c) =>
          c._id === chatId
            ? {
                ...c,
                lastMessage: {
                  text: message.text || 'Photo attachment',
                  sender: message.sender,
                  createdAt: message.createdAt || new Date(),
                },
              }
            : c
        )
      );
    };

    const handleTypingStatus = ({
      chatId,
      user: typingUser,
      isTyping,
    }: {
      chatId: string;
      user: { _id: string; name: string; username: string };
      isTyping: boolean;
    }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const chatMap = next.get(chatId) ? new Map(next.get(chatId)!) : new Map<string, string>();
        if (isTyping) {
          chatMap.set(typingUser._id, typingUser.name);
        } else {
          chatMap.delete(typingUser._id);
        }
        next.set(chatId, chatMap);
        return next;
      });
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('typing:status', handleTypingStatus);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('typing:status', handleTypingStatus);
    };
  }, [socket, activeConversation?._id]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        typingUsers,
        fetchConversations,
        selectConversation,
        openDirectChat,
        createGroupChat,
        sendMessage,
        emitTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
