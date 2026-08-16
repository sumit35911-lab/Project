import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mail, Lock, User, AtSign, ArrowRight, Zap, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';

export const AuthPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [isGeneratingUsername, setIsGeneratingUsername] = useState<boolean>(false);
  const [usernameSuggested, setUsernameSuggested] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-generate username as user types their name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData((prev) => ({ ...prev, name: newName }));

    if (!isLogin && newName.trim().length >= 2) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          setIsGeneratingUsername(true);
          const res = await authAPI.suggestUsername(newName);
          if (res.data.success && res.data.username) {
            setFormData((prev) => ({ ...prev, username: res.data.username }));
            setUsernameSuggested(true);
          }
        } catch {
          // Client-side fallback unique generation
          const slug = newName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
          const randomNum = Math.floor(100 + Math.random() * 900);
          setFormData((prev) => ({ ...prev, username: `${slug}_${randomNum}` }));
          setUsernameSuggested(true);
        } finally {
          setIsGeneratingUsername(false);
        }
      }, 400);
    }
  };

  const handleGenerateFreshUsername = async () => {
    try {
      setIsGeneratingUsername(true);
      const res = await authAPI.suggestUsername(formData.name || 'nexus_star');
      if (res.data.success && res.data.username) {
        setFormData((prev) => ({ ...prev, username: res.data.username }));
        setUsernameSuggested(true);
      }
    } catch {
      const prefixes = ['nexus', 'cyber', 'star', 'pixel', 'vibe', 'nova', 'echo'];
      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomNum = Math.floor(100 + Math.random() * 900);
      setFormData((prev) => ({ ...prev, username: `${randomPrefix}_${randomNum}` }));
      setUsernameSuggested(true);
    } finally {
      setIsGeneratingUsername(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email || formData.username, formData.password);
      } else {
        await register(formData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (username: string) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(username);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            className="nav-brand-icon"
            style={{ margin: '0 auto 12px', width: '48px', height: '48px', borderRadius: '14px' }}
          >
            <Sparkles size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>NexusHub</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Real-time social conversations & instant messaging
          </p>
        </div>

        {/* Auth Toggle Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.88rem',
              backgroundColor: isLogin ? 'var(--bg-card)' : 'transparent',
              color: isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: isLogin ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.88rem',
              backgroundColor: !isLogin ? 'var(--bg-card)' : 'transparent',
              color: !isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              {/* Full Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Alice Vance"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Automatic Unique Username */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    Username (Auto-Generated & Unique)
                  </label>
                  {usernameSuggested && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={12} />
                      <span>Available</span>
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <AtSign
                    size={16}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    name="username"
                    placeholder="e.g. alice_482"
                    value={formData.username}
                    onChange={handleChange}
                    required
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
                    title="Generate another unique username"
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Generated uniquely for you. Tap the refresh icon to roll another idea.
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
              {isLogin ? 'Email or Username' : 'Email Address'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type={isLogin ? 'text' : 'email'}
                name="email"
                placeholder={isLogin ? 'alice@nexushub.dev or alice' : 'alice@nexushub.dev'}
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)' }}
          >
            <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In to NexusHub' : 'Create Account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Demo Accounts Quick Switcher */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-divider)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--primary)',
              marginBottom: '10px',
            }}
          >
            <Zap size={14} />
            <span>Instant Demo Accounts (No password needed)</span>
          </div>

          <div className="auth-demo-grid">
            {[
              { name: 'Alice', desc: 'Designer & Lead' },
              { name: 'Bob', desc: 'Systems Engineer' },
              { name: 'Charlie', desc: 'Creative Coder' },
            ].map((acc) => (
              <button
                key={acc.name}
                type="button"
                className="demo-account-btn"
                onClick={() => handleDemo(acc.name.toLowerCase())}
                disabled={loading}
              >
                <span>{acc.name}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{acc.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
