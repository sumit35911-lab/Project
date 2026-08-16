import React, { useState, useEffect } from 'react';
import { X, Users, Check } from 'lucide-react';
import { friendAPI } from '../api/client';
import { useChat } from '../context/ChatContext';
import { Avatar } from './Avatar';
import { User, Conversation } from '../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (group: Conversation) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const { createGroupChat } = useChat();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadFriends = async () => {
      try {
        const res = await friendAPI.getFriends();
        if (res.data.success) {
          setFriends(res.data.friends);
        }
      } catch (err) {
        console.error('Error fetching friends for group creation:', err);
      }
    };

    loadFriends();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedFriends.length === 0) {
      setError('Please select at least 1 friend to invite to the group');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newGroup = await createGroupChat({
        name: name.trim(),
        description: description.trim(),
        groupAvatar: groupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`,
        participantIds: selectedFriends,
      });

      if (onGroupCreated) {
        onGroupCreated(newGroup);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=256&q=80',
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <Users size={18} color="var(--primary)" />
            <span>Create New Group Room</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  marginBottom: '12px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Group Name *
              </label>
              <input
                type="text"
                placeholder="e.g. 🚀 Design & Code Explorers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Topic / Description
              </label>
              <input
                type="text"
                placeholder="What is this group about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Select Friends ({selectedFriends.length} selected)
              </label>
              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                {friends.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                    No friends found yet. Connect with people to invite them!
                  </p>
                ) : (
                  friends.map((friend) => {
                    const isSelected = selectedFriends.includes(friend._id);
                    return (
                      <div
                        key={friend._id}
                        onClick={() => toggleFriend(friend._id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar src={friend.avatar} alt={friend.name} size="sm" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{friend.name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>@{friend.username}</div>
                          </div>
                        </div>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                            backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Group Icon
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {sampleAvatars.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt="Sample icon"
                    onClick={() => setGroupAvatar(url)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: groupAvatar === url ? '3px solid var(--primary)' : '1px solid var(--border-subtle)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating Group...' : 'Launch Group Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
