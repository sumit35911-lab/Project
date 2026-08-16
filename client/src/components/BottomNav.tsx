import React from 'react';
import { Compass, MessageSquare, Users, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string, param?: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onNavigate }) => {
  const { user } = useAuth();
  const { conversations } = useChat();

  const items = [
    { id: 'feed', label: 'Feed', icon: Compass },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: conversations.length || null },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'profile', label: 'Profile', icon: User, param: user?._id },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onNavigate(item.id, item.param)}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={22} />
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
