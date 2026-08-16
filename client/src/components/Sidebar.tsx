import React from 'react';
import {
  Compass,
  MessageSquare,
  Users,
  User,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Avatar } from './Avatar';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate }) => {
  const { user, logout, demoLogin } = useAuth();
  const { conversations } = useChat();

  const totalUnreadMessages = conversations.length;

  const navItems = [
    { id: 'feed', label: 'Explore & Feed', icon: Compass },
    { id: 'messages', label: 'Messages & Groups', icon: MessageSquare, badge: totalUnreadMessages > 0 ? totalUnreadMessages : null },
    { id: 'friends', label: 'Friends & Network', icon: Users },
    { id: 'profile', label: 'My Profile', icon: User, param: user?._id },
  ];

  return (
    <aside className="sidebar">
      <div>
        {/* Navigation List */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.id, item.param)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.badge && <span className="sidebar-link-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Demo Switcher Quick Pill */}
        <div
          style={{
            marginTop: '24px',
            padding: '14px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--primary)',
              marginBottom: '8px',
            }}
          >
            <Zap size={14} />
            <span>Test Multi-User Realtime</span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Switch accounts instantly to test real-time chat & posts:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {['alice', 'bob', 'charlie'].map((name) => (
              <button
                key={name}
                onClick={() => demoLogin(name)}
                style={{
                  padding: '6px 4px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor:
                    user?.username === name ? 'var(--primary)' : 'var(--bg-tertiary)',
                  color: user?.username === name ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Info Bottom Card */}
      <div className="sidebar-user-card">
        <Avatar
          src={user?.avatar}
          alt={user?.name}
          size="md"
          userId={user?._id}
          showStatus
          onClick={() => onNavigate('profile', user?._id)}
        />
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => onNavigate('profile', user?._id)}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.name}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            @{user?.username}
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          style={{
            color: 'var(--text-muted)',
            padding: '6px',
            borderRadius: '50%',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
