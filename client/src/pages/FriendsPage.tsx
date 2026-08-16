import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Check,
  X,
  MessageCircle,
  Search,
  MapPin,
} from 'lucide-react';
import { friendAPI, userAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import { Avatar } from '../components/Avatar';
import { User, FriendRequest } from '../types';

interface FriendsPageProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { openDirectChat } = useChat();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'discover'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<User[]>([]);
  const [searchDiscover, setSearchDiscover] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, suggRes] = await Promise.all([
        friendAPI.getFriends(),
        friendAPI.getPending(),
        userAPI.getSuggestions(),
      ]);

      if (friendsRes.data.success) {
        setFriends(friendsRes.data.friends);
      }
      if (requestsRes.data.success) {
        setReceivedRequests(requestsRes.data.received);
        setSentRequests(requestsRes.data.sent);
      }
      if (suggRes.data.success) {
        setDiscoverUsers(suggRes.data.suggestions);
      }
    } catch (err) {
      console.error('Error loading friends page data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRespondRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const res = await friendAPI.respondRequest(requestId, action);
      if (res.data.success) {
        setActionSuccess(res.data.message || 'Request updated');
        setTimeout(() => setActionSuccess(''), 3500);
        await loadData();
      }
    } catch (err) {
      console.error('Error responding to friend request:', err);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    try {
      const res = await friendAPI.sendRequest(targetId);
      if (res.data.success) {
        setActionSuccess('Friend request sent!');
        setTimeout(() => setActionSuccess(''), 3500);
        setDiscoverUsers((prev) => prev.filter((u) => u._id !== targetId));
        await loadData();
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm('Remove this user from your friends?')) return;
    try {
      const res = await friendAPI.removeFriend(friendId);
      if (res.data.success) {
        setFriends((prev) => prev.filter((f) => f._id !== friendId));
      }
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  const handleStartMessage = async (friendId: string) => {
    await openDirectChat(friendId);
    onNavigate('messages');
  };

  const filteredDiscover = discoverUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchDiscover.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchDiscover.toLowerCase())
  );

  return (
    <div className="main-content">
      {/* Page Title & Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Network & Connections</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Manage your friendships, respond to incoming requests, and discover creators.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="feed-tabs">
          <button
            className={`feed-tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <Users size={16} />
            <span>My Friends ({friends.length})</span>
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <UserCheck size={16} />
            <span>
              Requests {receivedRequests.length > 0 && `(${receivedRequests.length})`}
            </span>
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <UserPlus size={16} />
            <span>Discover</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: My Friends Grid */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Users size={36} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No friends yet!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Head to the Discover tab or search above to find people and grow your network.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('discover')}>
                Discover People
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {friends.map((friend) => {
                const online = isUserOnline(friend._id);
                return (
                  <div
                    key={friend._id}
                    className="widget-card"
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar
                        src={friend.avatar}
                        alt={friend.name}
                        size="lg"
                        userId={friend._id}
                        showStatus
                        onClick={() => onNavigate('profile', friend._id)}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          onClick={() => onNavigate('profile', friend._id)}
                        >
                          {friend.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          @{friend.username}
                        </div>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            color: online ? 'var(--accent-emerald)' : 'var(--text-muted)',
                            fontWeight: 600,
                            marginTop: '2px',
                          }}
                        >
                          {online ? '🟢 Online' : 'Offline'}
                        </div>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        minHeight: '34px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {friend.bio || 'Exploring the NexusHub universe.'}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                      <button
                        className="btn-primary"
                        style={{ flex: 1, padding: '6px 12px', fontSize: '0.82rem' }}
                        onClick={() => handleStartMessage(friend._id)}
                      >
                        <MessageCircle size={14} />
                        <span>Chat</span>
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.82rem', color: 'var(--danger)' }}
                        onClick={() => handleRemoveFriend(friend._id)}
                        title="Remove Friend"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Requests */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>
              Received Friend Requests ({receivedRequests.length})
            </h2>
            {receivedRequests.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No pending requests. You're all caught up!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {receivedRequests.map((req) => (
                  <div
                    key={req._id}
                    className="widget-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar
                        src={req.sender?.avatar}
                        alt={req.sender?.name}
                        size="md"
                        userId={req.sender?._id}
                        showStatus
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{req.sender?.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          @{req.sender?.username} • Wants to connect
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        onClick={() => handleRespondRequest(req._id, 'accept')}
                      >
                        <Check size={14} />
                        <span>Accept</span>
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        onClick={() => handleRespondRequest(req._id, 'reject')}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>
              Sent Requests ({sentRequests.length})
            </h2>
            {sentRequests.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No active sent requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sentRequests.map((req) => (
                  <div
                    key={req._id}
                    className="widget-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar src={req.receiver?.avatar} alt={req.receiver?.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{req.receiver?.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          @{req.receiver?.username}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Pending Response
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Discover */}
      {activeTab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search people to connect with..."
              value={searchDiscover}
              onChange={(e) => setSearchDiscover(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredDiscover.map((discUser) => (
              <div
                key={discUser._id}
                className="widget-card"
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar
                    src={discUser.avatar}
                    alt={discUser.name}
                    size="lg"
                    userId={discUser._id}
                    showStatus
                    onClick={() => onNavigate('profile', discUser._id)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      onClick={() => onNavigate('profile', discUser._id)}
                    >
                      {discUser.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      @{discUser.username}
                    </div>
                    {discUser.location && (
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '2px',
                        }}
                      >
                        <MapPin size={12} />
                        <span>{discUser.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    minHeight: '34px',
                  }}
                >
                  {discUser.bio || 'Looking forward to meeting new friends on NexusHub.'}
                </p>

                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                  onClick={() => handleSendRequest(discUser._id)}
                >
                  <UserPlus size={15} />
                  <span>Send Friend Request</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
