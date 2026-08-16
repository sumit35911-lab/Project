import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Send,
  Sparkles,
  Compass,
  Users,
  Film,
  X,
} from 'lucide-react';
import { postAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Avatar } from '../components/Avatar';
import { Post, Comment } from '../types';

interface FeedPageProps {
  onNavigate: (tab: string, param?: any) => void;
  filterTag?: string;
  onClearFilterTag?: () => void;
  onOpenCreatePost: () => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({
  onNavigate,
  filterTag,
  onClearFilterTag,
  onOpenCreatePost,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'friends' | 'media'>('all');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Fetch Feed Posts
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postAPI.getFeed(filter, filterTag);
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, filterTag]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Socket.IO Real-time feed events
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost: Post) => {
      setPosts((prev) => {
        if (prev.some((p) => p._id === newPost._id)) return prev;
        return [newPost, ...prev];
      });
    };

    const handleLikeUpdate = ({
      postId,
      likesCount,
      userId,
      isLiked,
    }: {
      postId: string;
      likesCount: number;
      userId: string;
      isLiked: boolean;
    }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId) {
            let updatedLikes = [...p.likes];
            if (isLiked) {
              if (!updatedLikes.some((id) => (typeof id === 'object' ? id._id : id) === userId)) {
                updatedLikes.push(userId);
              }
            } else {
              updatedLikes = updatedLikes.filter(
                (id) => (typeof id === 'object' ? id._id : id) !== userId
              );
            }
            return { ...p, likes: updatedLikes };
          }
          return p;
        })
      );
    };

    const handleCommentNew = ({
      postId,
      comment,
      commentsCount,
    }: {
      postId: string;
      comment: Comment;
      commentsCount: number;
    }) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, commentsCount } : p))
      );

      setCommentsMap((prev) => {
        const existing = prev[postId] || [];
        if (existing.some((c) => c._id === comment._id)) return prev;
        return { ...prev, [postId]: [...existing, comment] };
      });
    };

    socket.on('feed:post_new', handleNewPost);
    socket.on('feed:post_like_update', handleLikeUpdate);
    socket.on('feed:post_comment_new', handleCommentNew);

    return () => {
      socket.off('feed:post_new', handleNewPost);
      socket.off('feed:post_like_update', handleLikeUpdate);
      socket.off('feed:post_comment_new', handleCommentNew);
    };
  }, [socket]);

  // Handle Like
  const handleToggleLike = async (postId: string) => {
    try {
      const res = await postAPI.likeUnlike(postId);
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, likes: res.data.likes } : p))
        );

        if (socket && user) {
          socket.emit('post:liked', {
            postId,
            likesCount: res.data.likesCount,
            userId: user._id,
            isLiked: res.data.isLiked,
          });
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Toggle Comments View
  const handleToggleComments = async (postId: string) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsMap[postId]) {
      try {
        const res = await postAPI.getComments(postId);
        if (res.data.success) {
          setCommentsMap((prev) => ({ ...prev, [postId]: res.data.comments }));
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    }
  };

  // Submit Comment
  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const commentText = (commentInputMap[postId] || '').trim();
    if (!commentText) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await postAPI.addComment(postId, commentText);
      if (res.data.success) {
        setCommentInputMap((prev) => ({ ...prev, [postId]: '' }));
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res.data.comment],
        }));
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, commentsCount: res.data.commentsCount } : p))
        );

        if (socket) {
          socket.emit('post:commented', {
            postId,
            comment: res.data.comment,
            commentsCount: res.data.commentsCount,
          });
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this thought?')) return;
    try {
      const res = await postAPI.delete(postId);
      if (res.data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="main-content">
      {/* Quick Share Composer Card */}
      <div className="composer-card" onClick={onOpenCreatePost} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar src={user?.avatar} alt={user?.name} size="md" userId={user?._id} showStatus />
          <div
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-tertiary)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-muted)',
              fontSize: '0.92rem',
            }}
          >
            What are you thinking, {user?.name?.split(' ')[0]}? Share your thoughts...
          </div>
          <button className="btn-primary" style={{ padding: '8px 16px' }}>
            <Sparkles size={16} />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* Feed Filters Bar */}
      <div className="feed-tabs">
        <button
          className={`feed-tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <Compass size={16} />
          <span>All Thoughts</span>
        </button>
        <button
          className={`feed-tab-btn ${filter === 'friends' ? 'active' : ''}`}
          onClick={() => setFilter('friends')}
        >
          <Users size={16} />
          <span>Friends</span>
        </button>
        <button
          className={`feed-tab-btn ${filter === 'media' ? 'active' : ''}`}
          onClick={() => setFilter('media')}
        >
          <Film size={16} />
          <span>Media Only</span>
        </button>
      </div>

      {/* Tag Filter Chip if active */}
      {filterTag && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary-text)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 600,
            width: 'fit-content',
          }}
        >
          <span>Filtering by #{filterTag}</span>
          <button onClick={onClearFilterTag} style={{ color: 'var(--primary-text)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Posts Stream */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading community thoughts...
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Sparkles size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No thoughts here yet!</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Be the first to share an idea or project with the network.
          </p>
          <button className="btn-primary" onClick={onOpenCreatePost}>
            Share First Thought
          </button>
        </div>
      ) : (
        posts.map((post) => {
          const isLiked = post.likes?.some(
            (likeId) => (typeof likeId === 'object' ? likeId._id : likeId).toString() === user?._id?.toString()
          );
          const isAuthor = post.author?._id?.toString() === user?._id?.toString();
          const comments = commentsMap[post._id] || [];
          const isCommentsOpen = expandedComments[post._id];

          return (
            <article key={post._id} className="post-card">
              {/* Post Header */}
              <div className="post-header">
                <div
                  className="post-author-info"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('profile', post.author?._id)}
                >
                  <Avatar
                    src={post.author?.avatar}
                    alt={post.author?.name}
                    size="md"
                    userId={post.author?._id}
                    showStatus
                  />
                  <div>
                    <div className="post-author-name">
                      <span>{post.author?.name}</span>
                      <span className="post-author-username">@{post.author?.username}</span>
                    </div>
                    <div className="post-time">{formatTime(post.createdAt)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {post.mood && <span className="post-mood-badge">{post.mood}</span>}
                  {isAuthor && (
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      title="Delete Post"
                      style={{ color: 'var(--text-muted)', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Post Body Content */}
              <div className="post-body">{post.content}</div>

              {/* Post Image Attachment */}
              {post.image && (
                <div className="post-media">
                  <img src={post.image} alt="Thought media" loading="lazy" />
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="post-tag"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onNavigate('feed-tag', tag)}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions Bar */}
              <div className="post-actions">
                <button
                  className={`post-action-btn ${isLiked ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(post._id)}
                >
                  <Heart size={18} />
                  <span>{post.likes?.length || 0}</span>
                </button>

                <button
                  className="post-action-btn"
                  onClick={() => handleToggleComments(post._id)}
                >
                  <MessageCircle size={18} />
                  <span>{post.commentsCount || 0} Comments</span>
                </button>

                <button
                  className="post-action-btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Post link copied to clipboard!');
                  }}
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>

              {/* Comments Accordion */}
              {isCommentsOpen && (
                <div className="comments-section">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment._id} className="comment-item">
                        <Avatar
                          src={comment.author?.avatar}
                          alt={comment.author?.name}
                          size="sm"
                          userId={comment.author?._id}
                        />
                        <div className="comment-bubble">
                          <div className="comment-author">{comment.author?.name}</div>
                          <div className="comment-text">{comment.content}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      No comments yet. Start the conversation!
                    </p>
                  )}

                  {/* Comment Input */}
                  <form
                    onSubmit={(e) => handleAddComment(e, post._id)}
                    className="comment-input-row"
                  >
                    <input
                      type="text"
                      className="comment-input"
                      placeholder="Write a comment..."
                      value={commentInputMap[post._id] || ''}
                      onChange={(e) =>
                        setCommentInputMap({
                          ...commentInputMap,
                          [post._id]: e.target.value,
                        })
                      }
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={
                        submittingComment[post._id] || !(commentInputMap[post._id] || '').trim()
                      }
                      style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)' }}
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
};
