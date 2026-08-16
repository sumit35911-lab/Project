import React, { useState } from 'react';
import { X, Image, Tag, Smile, Sparkles } from 'lucide-react';
import { postAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Avatar } from './Avatar';
import { Post } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [mood, setMood] = useState('💡 Thought');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const moods = [
    '💡 Thought',
    '🚀 Building',
    '🎉 Excited',
    '☕ Chill',
    '⚡ Performance',
    '🎨 Design',
    '📚 Learning',
  ];

  const sampleImages = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write something in your thought!');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await postAPI.create({
        content: content.trim(),
        image: imageUrl.trim(),
        tags: tagsInput,
        mood,
      });

      if (res.data.success) {
        if (socket) {
          socket.emit('post:created', res.data.post);
        }
        if (onPostCreated) {
          onPostCreated(res.data.post);
        }
        setContent('');
        setImageUrl('');
        setTagsInput('');
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to share thought. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <Sparkles size={18} color="var(--primary)" />
            <span>Share Your Thought</span>
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

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <Avatar src={user?.avatar} alt={user?.name} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{user?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="composer-mood-select"
                  >
                    {moods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <textarea
              className="composer-textarea"
              placeholder="What's happening in your universe? Share an idea, question, or project update..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              autoFocus
            />

            {/* Image Preview if provided */}
            {imageUrl && (
              <div className="composer-image-preview">
                <img src={imageUrl} alt="Post attachment preview" />
                <button
                  type="button"
                  className="composer-remove-img"
                  onClick={() => setImageUrl('')}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Optional Image URL Input */}
            {showImageInput && (
              <div style={{ marginTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Paste image URL (or pick a sample below)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {sampleImages.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Sample"
                      onClick={() => setImageUrl(src)}
                      style={{
                        width: '44px',
                        height: '36px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: imageUrl === src ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tags Input */}
            <div style={{ marginTop: '14px' }}>
              <input
                type="text"
                placeholder="Add tags separated by commas (e.g. React, Design, NexusHub)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="composer-tool-btn"
              onClick={() => setShowImageInput((prev) => !prev)}
            >
              <Image size={16} />
              <span>{imageUrl ? 'Change Image' : 'Attach Image'}</span>
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Sharing...' : 'Publish Thought'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
