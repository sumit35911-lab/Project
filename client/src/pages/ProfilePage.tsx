import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  Edit3,
  UserPlus,
  MessageCircle,
  Check,
  Heart,
  MessageSquare,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { userAPI, postAPI, friendAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import { Avatar } from '../components/Avatar';
import { EditProfileModal } from '../components/EditProfileModal';
import { User, Post } from '../types';

interface ProfilePageProps {
  profileId: string | null;
  onNavigate: (tab: string, param?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profileId, onNavigate }) => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const { openDirectChat } = useChat();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [friendshipStatus, setFriendshipStatus] = useState<string>('none');
  const [loading, setLoading] = useState<boolean>(true);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editModalTab, setEditModalTab] = useState<'info' | 'avatar' | 'cover'>('info');

  const targetId = profileId || currentUser?._id;

  const loadProfile = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        userAPI.getProfile(targetId),
        postAPI.getUserPosts(targetId),
      ]);

      if (profileRes.data.success) {
        setProfileUser(profileRes.data.user);
        setPostsCount(profileRes.data.postsCount);
        setFriendshipStatus(profileRes.data.friendshipStatus);
      }
      if (postsRes.data.success) {
        setPosts(postsRes.data.posts);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSendFriendRequest = async () => {
    if (!profileUser) return;
    try {
      const res = await friendAPI.sendRequest(profileUser._id);
      if (res.data.success) {
        setFriendshipStatus('pending_sent');
      }
    } catch (err) {
      console.error('Error sending request:', err);
    }
  };

  const handleStartMessage = async () => {
    if (!profileUser) return;
    await openDirectChat(profileUser._id);
    onNavigate('messages');
  };

  const openEditModalWithTab = (tab: 'info' | 'avatar' | 'cover') => {
    setEditModalTab(tab);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="main-content" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading profile...
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="main-content" style={{ padding: '60px', textAlign: 'center' }}>
        <h3>User not found</h3>
      </div>
    );
  }

  const isOwnProfile = profileUser._id === currentUser?._id;
  const isOnline = isUserOnline(profileUser._id);

  return (
    <div className="main-content">
      {/* Profile Header Banner */}
      <div
        className="widget-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Cover Image Banner */}
        <div
          style={{
            height: '200px',
            backgroundImage: `url(${profileUser.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          {isOwnProfile && (
            <button
              onClick={() => openEditModalWithTab('cover')}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: 'white',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backdropFilter: 'blur(6px)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <ImageIcon size={14} />
              <span>Change Cover</span>
            </button>
          )}
        </div>

        {/* Profile Info Row */}
        <div style={{ padding: '0 24px 20px', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginTop: '-50px',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Avatar with Camera Trigger */}
            <div style={{ position: 'relative', border: '4px solid var(--bg-card)', borderRadius: '50%' }}>
              <Avatar
                src={profileUser.avatar}
                alt={profileUser.name}
                size="xl"
                userId={profileUser._id}
                showStatus
              />
              {isOwnProfile && (
                <button
                  onClick={() => openEditModalWithTab('avatar')}
                  title="Update Avatar"
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: '2px solid var(--bg-card)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <Camera size={15} />
                </button>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {isOwnProfile ? (
                <button
                  className="btn-secondary"
                  onClick={() => openEditModalWithTab('info')}
                  style={{ fontSize: '0.86rem' }}
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  {friendshipStatus === 'friends' && (
                    <button
                      className="btn-primary"
                      onClick={handleStartMessage}
                      style={{ fontSize: '0.86rem' }}
                    >
                      <MessageCircle size={15} />
                      <span>Message</span>
                    </button>
                  )}
                  {friendshipStatus === 'none' && (
                    <button
                      className="btn-primary"
                      onClick={handleSendFriendRequest}
                      style={{ fontSize: '0.86rem' }}
                    >
                      <UserPlus size={15} />
                      <span>Add Friend</span>
                    </button>
                  )}
                  {friendshipStatus === 'pending_sent' && (
                    <button
                      className="btn-secondary"
                      disabled
                      style={{ fontSize: '0.86rem', opacity: 0.7 }}
                    >
                      <Check size={15} />
                      <span>Request Sent</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{profileUser.name}</h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)',
                }}
              >
                {isOnline ? '🟢 Online' : 'Offline'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              @{profileUser.username}
            </div>

            {profileUser.statusMessage && (
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-text)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '12px',
                }}
              >
                {profileUser.statusMessage}
              </div>
            )}

            <p style={{ fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '14px' }}>
              {profileUser.bio || 'No bio yet.'}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '16px',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                flexWrap: 'wrap',
              }}
            >
              {profileUser.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} />
                  <span>{profileUser.location}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                <span>
                  Joined{' '}
                  {profileUser.createdAt
                    ? new Date(profileUser.createdAt).toLocaleDateString([], {
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '18px',
              paddingTop: '14px',
            }}
          >
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {postsCount}
              </span>{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Thoughts</span>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {profileUser.friends?.length || 0}
              </span>{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Friends</span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Thoughts Timeline */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '8px' }}>
        Thoughts & Publications
      </h2>

      {posts.length === 0 ? (
        <div
          style={{
            padding: '30px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          No thoughts shared yet by @{profileUser.username}.
        </div>
      ) : (
        posts.map((post) => (
          <article key={post._id} className="post-card">
            <div className="post-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar src={profileUser.avatar} alt={profileUser.name} size="sm" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{profileUser.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
              {post.mood && <span className="post-mood-badge">{post.mood}</span>}
            </div>

            <div className="post-body">{post.content}</div>

            {post.image && (
              <div className="post-media">
                <img src={post.image} alt="Thought media" />
              </div>
            )}

            <div className="post-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-pink)', fontSize: '0.85rem', fontWeight: 600 }}>
                <Heart size={16} fill="var(--accent-pink)" />
                <span>{post.likes?.length || 0} Likes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <MessageSquare size={16} />
                <span>{post.commentsCount || 0} Comments</span>
              </div>
            </div>
          </article>
        ))
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        initialTab={editModalTab}
        onClose={() => setShowEditModal(false)}
        onProfileUpdated={(updated) => {
          setProfileUser(updated);
        }}
      />
    </div>
  );
};
