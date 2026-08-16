import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { RightPanel } from './components/RightPanel';
import { CreatePostModal } from './components/CreatePostModal';

import { AuthPage } from './pages/AuthPage';
import { FeedPage } from './pages/FeedPage';
import { MessagesPage } from './pages/MessagesPage';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';

import './styles/index.css';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('feed');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--primary)',
          fontWeight: 700,
          fontSize: '1.1rem',
        }}
      >
        Initializing NexusHub...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleNavigate = (tab: string, param: any = null) => {
    if (tab === 'feed-tag') {
      setCurrentTab('feed');
      setFilterTag(param);
      return;
    }

    if (tab === 'profile') {
      setSelectedProfileId(param || user?._id || null);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Top Header Navbar */}
      <Navbar
        onOpenCreatePost={() => setIsCreatePostOpen(true)}
        onNavigate={handleNavigate}
        currentTab={currentTab}
      />

      {/* Main Responsive Grid Layout */}
      <div className="main-layout">
        {/* Left Sidebar */}
        <Sidebar currentTab={currentTab} onNavigate={handleNavigate} />

        {/* Center Main Dynamic View */}
        <main style={{ minWidth: 0 }}>
          {currentTab === 'feed' && (
            <FeedPage
              onNavigate={handleNavigate}
              filterTag={filterTag}
              onClearFilterTag={() => setFilterTag('')}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
            />
          )}

          {currentTab === 'messages' && <MessagesPage onNavigate={handleNavigate} />}

          {currentTab === 'friends' && <FriendsPage onNavigate={handleNavigate} />}

          {currentTab === 'profile' && (
            <ProfilePage
              profileId={selectedProfileId}
              onNavigate={handleNavigate}
            />
          )}
        </main>

        {/* Right Panel Widgets */}
        {currentTab !== 'messages' && (
          <RightPanel
            onNavigate={handleNavigate}
            onFilterTag={(tag) => handleNavigate('feed-tag', tag)}
          />
        )}
      </div>

      {/* Mobile Floating Bottom Bar */}
      <BottomNav currentTab={currentTab} onNavigate={handleNavigate} />

      {/* Global Share Thought Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={() => {
          if (currentTab !== 'feed') {
            setCurrentTab('feed');
          }
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <MainApp />
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
