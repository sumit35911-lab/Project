import React, { useState, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Camera,
  Image as ImageIcon,
  Upload,
  Dices,
  Check,
  AtSign,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import { Avatar } from './Avatar';
import { User } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (user: User) => void;
  initialTab?: 'info' | 'avatar' | 'cover';
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  initialTab = 'info',
}) => {
  const { user, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'avatar' | 'cover'>(initialTab);
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [coverImage, setCoverImage] = useState(
    user?.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Curated Avatar Presets
  const sampleAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    'https://api.dicebear.com/7.x/bottts/svg?seed=NexusCyber',
    'https://api.dicebear.com/7.x/bottts/svg?seed=StarVibe',
  ];

  // Curated Cover Image Presets
  const sampleCovers = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  ];

  // Auto-generate fresh unique username
  const handleGenerateFreshUsername = async () => {
    try {
      setIsGeneratingUsername(true);
      const res = await authAPI.suggestUsername(name || user?.name || 'nexus_star');
      if (res.data.success && res.data.username) {
        setUsername(res.data.username);
      }
    } catch {
      const prefixes = ['nexus', 'cyber', 'pixel', 'vibe', 'nova', 'echo'];
      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomNum = Math.floor(100 + Math.random() * 900);
      setUsername(`${randomPrefix}_${randomNum}`);
    } finally {
      setIsGeneratingUsername(false);
    }
  };

  // Handle Local File Upload to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image size exceeds 8MB. Please choose a smaller image.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'avatar') {
        setAvatar(base64);
      } else {
        setCoverImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate Random Fun Avatar
  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const styles = ['bottts', 'adventurer', 'avataaars', 'identicon'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    setAvatar(`https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updatedUser = await updateUserProfile({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        location: location.trim(),
        statusMessage: statusMessage.trim(),
        avatar: avatar.trim(),
        coverImage: coverImage.trim(),
      });

      if (updatedUser && onProfileUpdated) {
        onProfileUpdated(updatedUser);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <UserIcon size={18} color="var(--primary)" />
            <span>Customize Profile & Visuals</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '0 20px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            style={{
              padding: '12px 16px',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: activeTab === 'info' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'info' ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            style={{
              padding: '12px 16px',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: activeTab === 'avatar' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'avatar' ? '3px solid var(--primary)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Camera size={14} />
            <span>Avatar Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cover')}
            style={{
              padding: '12px 16px',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: activeTab === 'cover' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'cover' ? '3px solid var(--primary)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <ImageIcon size={14} />
            <span>Cover Banner</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={avatarFileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, 'avatar')}
            />
            <input
              type="file"
              ref={coverFileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, 'cover')}
            />

            {/* TAB 1: BASIC INFO */}
            {activeTab === 'info' && (
              <div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
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

                {/* Unique Username Field with Generate Helper */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Username (Unique Handle)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <AtSign
                      size={16}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 36px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateFreshUsername}
                      title="Auto-generate a fresh unique username"
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '6px',
                        color: isGeneratingUsername ? 'var(--primary)' : 'var(--text-muted)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <RefreshCw
                        size={15}
                        style={{
                          animation: isGeneratingUsername ? 'spin 1s linear infinite' : 'none',
                        }}
                      />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Status Message
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exploring ideas & coding late beats ⚡"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
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
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about what you do and what you're interested in..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      resize: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
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
              </div>
            )}

            {/* TAB 2: AVATAR CUSTOMIZATION */}
            {activeTab === 'avatar' && (
              <div>
                {/* Live Preview Card */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '20px',
                    border: '1px dashed var(--border-subtle)',
                  }}
                >
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <Avatar src={avatar} alt={name} size="xl" />
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      title="Upload Avatar Image"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '50%',
                        boxShadow: 'var(--shadow-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Avatar Live Preview</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Upload from your device, choose a preset, or generate randomly
                  </div>
                </div>

                {/* Upload & Generator Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => avatarFileInputRef.current?.click()}
                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                  >
                    <Upload size={16} />
                    <span>Upload from Device</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={generateRandomAvatar}
                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem', color: 'var(--primary)' }}
                  >
                    <Dices size={16} />
                    <span>Random Avatar</span>
                  </button>
                </div>

                {/* Direct URL Input */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Or Paste Custom Avatar URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
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

                {/* Presets Grid */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                    Popular Avatar Presets
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {sampleAvatars.map((url, i) => {
                      const isSelected = avatar === url;
                      return (
                        <div
                          key={i}
                          onClick={() => setAvatar(url)}
                          style={{
                            position: 'relative',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: isSelected ? '3px solid var(--primary)' : '2px solid var(--border-subtle)',
                            padding: '4px',
                            backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                        >
                          <img
                            src={url}
                            alt="Preset"
                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={10} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COVER BANNER CUSTOMIZATION */}
            {activeTab === 'cover' && (
              <div>
                {/* Live Preview Banner */}
                <div
                  style={{
                    position: 'relative',
                    height: '140px',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    backgroundImage: `url(${coverImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    marginBottom: '18px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    style={{
                      position: 'relative',
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Upload size={15} />
                    <span>Upload Banner Image</span>
                  </button>
                </div>

                {/* Direct Cover URL Input */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Or Paste Custom Banner URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
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

                {/* Cover Presets */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                    Select from Curated Header Themes
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {sampleCovers.map((url, i) => {
                      const isSelected = coverImage === url;
                      return (
                        <div
                          key={i}
                          onClick={() => setCoverImage(url)}
                          style={{
                            height: '70px',
                            borderRadius: 'var(--radius-md)',
                            backgroundImage: `url(${url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            border: isSelected ? '3px solid var(--primary)' : '1px solid var(--border-subtle)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 6,
                                right: 6,
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={12} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Profile...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
