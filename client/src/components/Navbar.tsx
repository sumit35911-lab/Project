import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Search,
  Bell,
  Moon,
  Sun,
  PlusCircle,
  LogOut,
  User as UserIcon,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { userAPI, notificationAPI } from '../api/client';
import { Avatar } from './Avatar';
import { User, Notification } from '../types';

interface NavbarProps {
  onOpenCreatePost: () => void;
  onNavigate: (tab: string, param?: any) => void;
  currentTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreatePost, onNavigate, currentTab }) => {
  const { user, logout, demoLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadNotificationCount, setUnreadNotificationCount } = useSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await userAPI.search(searchQuery.trim());
        if (res.data.success) {
          setSearchResults(res.data.users);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleNotifications = async () => {
    if (!showNotifications) {
      try {
        const res = await notificationAPI.getNotifications();
        if (res.data.success) {
          setNotificationsList(res.data.notifications);
        }
        await notificationAPI.markAllRead();
        setUnreadNotificationCount(0);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    }
    setShowNotifications((prev) => !prev);
  };

  return (
    <header className="navbar">
      {/* Brand */}
      <div
        className="nav-brand"
        style={{ cursor: 'pointer' }}
        onClick={() => onNavigate('feed')}
      >
        <div className="nav-brand-icon">
          <Sparkles size={20} />
        </div>
        <span>NexusHub</span>
      </div>

      {/* Global Search */}
      <div className="nav-search" ref={searchRef}>
        <Search size={16} className="nav-search-icon" />
        <input
          type="text"
          placeholder="Search people, @usernames..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) setShowSearchDropdown(true);
          }}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowSearchDropdown(false);
            }}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          >
            <X size={14} />
          </button>
        )}

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '320px',
              overflowY: 'auto',
              zIndex: 60,
              padding: '8px',
            }}
          >
            {isSearching ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Searching connections...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No users found for "{searchQuery}"
              </div>
            ) : (
              searchResults.map((u) => (
                <div
                  key={u._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                  }}
                  className="chat-item"
                  onClick={() => {
                    setShowSearchDropdown(false);
                    setSearchQuery('');
                    onNavigate('profile', u._id);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar src={u.avatar} alt={u.name} size="sm" userId={u._id} showStatus />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                    View Profile
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="nav-actions">
        <button
          className="btn-primary"
          onClick={onOpenCreatePost}
          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
        >
          <PlusCircle size={16} />
          <span>Share Thought</span>
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="nav-btn-icon"
            onClick={handleToggleNotifications}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadNotificationCount > 0 && (
              <span className="nav-badge">{unreadNotificationCount}</span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                width: '320px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 60,
                padding: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                <span>Activity & Alerts</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live</span>
              </div>
              {notificationsList.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No new notifications yet!
                </div>
              ) : (
                notificationsList.map((n) => (
                  <div
                    key={n._id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: n.isRead ? 'transparent' : 'var(--primary-light)',
                      marginBottom: '6px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <Avatar src={n.sender?.avatar} alt={n.sender?.name} size="sm" />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'var(--text-primary)', lineHeight: 1.3 }}>{n.message}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button className="nav-btn-icon" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Avatar Menu */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <Avatar
            src={user?.avatar}
            alt={user?.name}
            size="sm"
            userId={user?._id}
            showStatus
            className="user-nav-avatar"
            onClick={() => setShowUserMenu((prev) => !prev)}
          />

          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                width: '220px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 60,
                padding: '8px',
              }}
            >
              <div
                style={{
                  padding: '10px',
                  borderBottom: '1px solid var(--border-divider)',
                  marginBottom: '6px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{user?.username}</div>
              </div>

              <div
                className="chat-item"
                style={{ borderRadius: 'var(--radius-md)', padding: '8px 10px' }}
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('profile', user?._id);
                }}
              >
                <UserIcon size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>My Profile</span>
              </div>

              <div
                className="chat-item"
                style={{ borderRadius: 'var(--radius-md)', padding: '8px 10px' }}
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('messages');
                }}
              >
                <MessageSquare size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Messages</span>
              </div>

              <div
                className="chat-item"
                style={{ borderRadius: 'var(--radius-md)', padding: '8px 10px' }}
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('friends');
                }}
              >
                <Users size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Network & Friends</span>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-divider)',
                  marginTop: '6px',
                  paddingTop: '6px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    padding: '4px 10px',
                    fontWeight: 600,
                  }}
                >
                  Quick Demo Switch
                </div>
                <div style={{ display: 'flex', gap: '4px', padding: '0 8px 6px' }}>
                  {['alice', 'bob', 'charlie'].map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        demoLogin(u);
                        setShowUserMenu(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: user?.username === u ? 'var(--primary)' : 'var(--bg-tertiary)',
                        color: user?.username === u ? 'white' : 'var(--text-secondary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>

                <div
                  className="chat-item"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 10px',
                    color: 'var(--danger)',
                  }}
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                >
                  <LogOut size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sign Out</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
