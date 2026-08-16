import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image,
  Users,
  Search,
  Plus,
  ArrowLeft,
  Smile,
  Shield,
  MessageCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { Avatar } from '../components/Avatar';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { Conversation, Message, User } from '../types';

interface MessagesPageProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const {
    conversations,
    activeConversation,
    messages,
    loadingMessages,
    typingUsers,
    selectConversation,
    sendMessage,
    emitTyping,
  } = useChat();

  const [filterType, setFilterType] = useState<'all' | 'direct' | 'group'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showImageInput, setShowImageInput] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);
  const [showGroupInfo, setShowGroupInfo] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => {
    if (activeConversation) {
      setShowMobileChat(true);
    }
  }, [activeConversation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    emitTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1200);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageUrl.trim()) return;

    const textToSend = inputText;
    const imgToSend = imageUrl;
    setInputText('');
    setImageUrl('');
    setShowImageInput(false);
    emitTyping(false);

    try {
      await sendMessage(textToSend, imgToSend);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const getDirectChatPartner = (conv: Conversation | null): User | null => {
    if (!conv || conv.isGroup) return null;
    const partner = conv.participants?.find(
      (p) => (typeof p === 'object' ? p._id : p).toString() !== user?._id?.toString()
    );
    return typeof partner === 'object' ? partner : null;
  };

  const filteredConversations = conversations.filter((c) => {
    if (filterType === 'direct' && c.isGroup) return false;
    if (filterType === 'group' && !c.isGroup) return false;

    if (!searchQuery.trim()) return true;

    if (c.isGroup) {
      return c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      const partner = getDirectChatPartner(c);
      return (
        partner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  });

  const emojis = ['👍', '❤️', '🔥', '🚀', '🎉', '😂', '✨', '🙌', '💯', '☕'];

  const activeChatTyping = activeConversation?._id
    ? Array.from(typingUsers.get(activeConversation._id)?.values() || []).filter(
        (name) => name !== user?.name
      )
    : [];

  return (
    <div style={{ padding: '20px 0', width: '100%' }}>
      <div className="chat-container">
        {/* Left Conversation List Sidebar */}
        <div
          className="chat-sidebar"
          style={{
            display: showMobileChat && window.innerWidth <= 768 ? 'none' : 'flex',
          }}
        >
          {/* Header */}
          <div className="chat-sidebar-header">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Messages</h2>
            <button
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setShowGroupModal(true)}
            >
              <Plus size={14} />
              <span>New Group</span>
            </button>
          </div>

          {/* Search */}
          <div className="chat-search">
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  fontSize: '0.82rem',
                }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="chat-filter-pills">
            <button
              className={`chat-filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`chat-filter-pill ${filterType === 'direct' ? 'active' : ''}`}
              onClick={() => setFilterType('direct')}
            >
              Direct
            </button>
            <button
              className={`chat-filter-pill ${filterType === 'group' ? 'active' : ''}`}
              onClick={() => setFilterType('group')}
            >
              Groups
            </button>
          </div>

          {/* List */}
          <div className="chat-list">
            {filteredConversations.length === 0 ? (
              <div
                style={{
                  padding: '30px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No conversations found. Start a new chat or create a group room!
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isGroup = conv.isGroup;
                const partner = !isGroup ? getDirectChatPartner(conv) : null;
                const isSelected = activeConversation?._id === conv._id;

                const displayName = isGroup ? conv.name : partner?.name || 'User';
                const avatarSrc = isGroup ? conv.groupAvatar : partner?.avatar;

                return (
                  <div
                    key={conv._id}
                    className={`chat-item ${isSelected ? 'active' : ''}`}
                    onClick={() => selectConversation(conv)}
                  >
                    <Avatar
                      src={avatarSrc}
                      alt={displayName}
                      size="md"
                      userId={!isGroup ? partner?._id : null}
                      showStatus={!isGroup}
                    />
                    <div className="chat-item-info">
                      <div className="chat-item-header">
                        <span className="chat-item-title">{displayName}</span>
                        {conv.lastMessage?.createdAt && (
                          <span className="chat-item-time">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="chat-item-preview">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Message Window */}
        <div
          className="chat-window"
          style={{
            display: !showMobileChat && window.innerWidth <= 768 ? 'none' : 'flex',
          }}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-window-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Mobile Back button */}
                  <button
                    onClick={() => setShowMobileChat(false)}
                    style={{
                      display: window.innerWidth <= 768 ? 'block' : 'none',
                      color: 'var(--text-secondary)',
                      padding: '4px',
                    }}
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="chat-window-user">
                    {activeConversation.isGroup ? (
                      <Avatar
                        src={activeConversation.groupAvatar}
                        alt={activeConversation.name}
                        size="md"
                      />
                    ) : (
                      <Avatar
                        src={getDirectChatPartner(activeConversation)?.avatar}
                        alt={getDirectChatPartner(activeConversation)?.name}
                        size="md"
                        userId={getDirectChatPartner(activeConversation)?._id}
                        showStatus
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {activeConversation.isGroup
                          ? activeConversation.name
                          : getDirectChatPartner(activeConversation)?.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {activeConversation.isGroup
                          ? `${activeConversation.participants?.length || 0} members`
                          : isUserOnline(getDirectChatPartner(activeConversation)?._id)
                          ? '🟢 Active now'
                          : 'Offline'}
                      </div>
                    </div>
                  </div>
                </div>

                {activeConversation.isGroup && (
                  <button
                    onClick={() => setShowGroupInfo((prev) => !prev)}
                    className="nav-btn-icon"
                    title="Group Details"
                  >
                    <Users size={18} />
                  </button>
                )}
              </div>

              {/* Group Info Drawer */}
              {showGroupInfo && activeConversation.isGroup && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: '12px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.84rem',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>About Group:</div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {activeConversation.description || 'No description provided.'}
                  </p>
                  <div style={{ fontWeight: 700, marginTop: '4px' }}>Members:</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {activeConversation.participants?.map((p) => {
                      const member: User =
                        typeof p === 'object' && p !== null
                          ? (p as User)
                          : {
                              _id: String(p),
                              name: 'Member',
                              username: 'member',
                              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=member',
                            };
                      const isAdmin = activeConversation.admin?._id === member._id;
                      return (
                        <div
                          key={member._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: 'var(--bg-tertiary)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem',
                          }}
                        >
                          <Avatar src={member.avatar} alt={member.name} size="sm" />
                          <span>{member.name}</span>
                          {isAdmin && <Shield size={12} color="var(--primary)" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Messages Stream */}
              <div className="chat-messages-stream">
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <MessageCircle size={36} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontWeight: 600 }}>This is the beginning of your conversation.</p>
                    <p style={{ fontSize: '0.8rem' }}>Send a message below to start chatting!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine =
                      (typeof msg.sender === 'object' ? msg.sender?._id : msg.sender)?.toString() ===
                      user?._id?.toString();

                    if (msg.messageType === 'system') {
                      return (
                        <div key={msg._id} className="message-bubble system">
                          {msg.text}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg._id}
                        className={`message-bubble-wrapper ${isMine ? 'outgoing' : 'incoming'}`}
                      >
                        {!isMine && (
                          <Avatar
                            src={msg.sender?.avatar}
                            alt={msg.sender?.name}
                            size="sm"
                            userId={msg.sender?._id}
                          />
                        )}
                        <div className={`message-bubble ${isMine ? 'outgoing' : 'incoming'}`}>
                          {activeConversation.isGroup && !isMine && (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                marginBottom: '2px',
                              }}
                            >
                              {msg.sender?.name}
                            </div>
                          )}
                          {msg.text && <div>{msg.text}</div>}
                          {msg.mediaUrl && (
                            <img
                              src={msg.mediaUrl}
                              alt="attachment"
                              className="message-media-img"
                            />
                          )}
                          <div className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Live Typing Indicator */}
                {activeChatTyping.length > 0 && (
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <span style={{ marginLeft: '4px' }}>
                      {activeChatTyping.join(', ')} is typing...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="chat-input-area">
                {/* Emoji Trigger */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="nav-btn-icon"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    title="Insert Emoji"
                  >
                    <Smile size={18} />
                  </button>

                  {showEmojiPicker && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        marginBottom: '8px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '8px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '6px',
                        zIndex: 20,
                      }}
                    >
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setInputText((prev) => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          style={{
                            fontSize: '1.2rem',
                            padding: '4px',
                            borderRadius: '4px',
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Attachment Trigger */}
                <button
                  type="button"
                  className="nav-btn-icon"
                  onClick={() => setShowImageInput((prev) => !prev)}
                  title="Attach Photo"
                >
                  <Image size={18} />
                </button>

                {/* Input Field */}
                <input
                  type="text"
                  className="chat-input-field"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={handleInputChange}
                  autoFocus
                />

                {/* Send Button */}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!inputText.trim() && !imageUrl.trim()}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', padding: 0 }}
                >
                  <Send size={16} />
                </button>
              </form>

              {/* Optional Photo Attachment URL bar */}
              {showImageInput && (
                <div
                  style={{
                    padding: '8px 20px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px dashed var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter image URL to attach..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      fontSize: '0.84rem',
                    }}
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                gap: '12px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                Your Messages & Groups
              </h3>
              <p style={{ maxWidth: '340px', fontSize: '0.88rem' }}>
                Select a conversation on the left or create a new group room to chat in real-time.
              </p>
              <button
                className="btn-primary"
                onClick={() => setShowGroupModal(true)}
                style={{ marginTop: '8px' }}
              >
                <Users size={16} />
                <span>Create Group Room</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={() => {
          setShowMobileChat(true);
        }}
      />
    </div>
  );
};
