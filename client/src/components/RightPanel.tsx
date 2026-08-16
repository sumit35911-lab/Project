import React, { useState, useEffect } from 'react';
import { Users, Sparkles, UserPlus, MessageCircle, Check } from 'lucide-react';
import { userAPI, friendAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import { Avatar } from './Avatar';
import { User } from '../types';

interface RightPanelProps {
  onNavigate: (tab: string, param?: any) => void;
  onFilterTag?: (tag: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ onNavigate, onFilterTag }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { openDirectChat } = useChat();

  const [friends, setFriends] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [sentRequestMap, setSentRequestMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [friendsRes, suggRes] = await Promise.all([
          friendAPI.getFriends(),
          userAPI.getSuggestions(),
        ]);
        if (friendsRes.data.success) {
          setFriends(friendsRes.data.friends);
        }
        if (suggRes.data.success) {
          setSuggestions(suggRes.data.suggestions);
        }
      } catch (err) {
        console.error('Error loading right panel data:', err);
      }
    };

    loadData();
  }, [user]);

  const handleSendFriendRequest = async (targetId: string) => {
    try {
      const res = await friendAPI.sendRequest(targetId);
      if (res.data.success) {
        setSentRequestMap((prev) => ({ ...prev, [targetId]: true }));
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleStartChat = async (friendId: string) => {
    await openDirectChat(friendId);
    onNavigate('messages');
  };

  const trendingTags = [
    { tag: 'NexusHub', count: '1.2k' },
    { tag: 'React', count: '890' },
    { tag: 'WebSockets', count: '640' },
    { tag: 'Design', count: '520' },
    { tag: 'Engineering', count: '410' },
  ];

  return (
    <aside className="right-panel">
      {/* Online Friends Widget */}
      <div className="widget-card">
        <div className="widget-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--primary)" />
            <span>Connections</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            {friends.filter((f) => isUserOnline(f._id)).length} Online
          </span>
        </div>

        {friends.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
            No connections yet. Discover people below!
          </p>
        ) : (
          friends.map((friend) => {
            const online = isUserOnline(friend._id);
            return (
              <div key={friend._id} className="online-friend-row">
                <div
                  className="online-friend-info"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('profile', friend._id)}
                >
                  <Avatar
                    src={friend.avatar}
                    alt={friend.name}
                    size="sm"
                    userId={friend._id}
                    showStatus
                  />
                  <div>
                    <div className="online-friend-name">{friend.name}</div>
                    <div className="online-friend-status">
                      {online ? 'Active now' : 'Offline'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartChat(friend._id)}
                  title="Direct Message"
                  style={{
                    color: 'var(--primary)',
                    padding: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageCircle size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Suggested People Widget */}
      <div className="widget-card">
        <div className="widget-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-pink)" />
            <span>Discover People</span>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
            You're connected with everyone nearby!
          </p>
        ) : (
          suggestions.slice(0, 4).map((sugg) => {
            const isSent = sentRequestMap[sugg._id];
            return (
              <div key={sugg._id} className="online-friend-row">
                <div
                  className="online-friend-info"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('profile', sugg._id)}
                >
                  <Avatar src={sugg.avatar} alt={sugg.name} size="sm" userId={sugg._id} showStatus />
                  <div>
                    <div className="online-friend-name">{sugg.name}</div>
                    <div className="online-friend-status">@{sugg.username}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleSendFriendRequest(sugg._id)}
                  disabled={isSent}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: isSent ? 'var(--bg-tertiary)' : 'var(--primary)',
                    color: isSent ? 'var(--text-muted)' : 'white',
                  }}
                >
                  {isSent ? (
                    <>
                      <Check size={12} /> Sent
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} /> Connect
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Trending Tags Widget */}
      <div className="widget-card">
        <div className="widget-title">
          <span>Trending Tags</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trendingTags.map((item) => (
            <div
              key={item.tag}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
              className="chat-item"
              onClick={() => onFilterTag && onFilterTag(item.tag)}
            >
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)' }}>
                #{item.tag}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {item.count} thoughts
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
