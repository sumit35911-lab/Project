import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Notification } from '../models/Notification.js';

// @desc    Create a new post / thought
// @route   POST /api/posts
export const createPost = async (req, res, next) => {
  try {
    const { content, image, tags, mood } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    // Process tags array if passed as string or array
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags;
    } else if (typeof tags === 'string' && tags.trim().length > 0) {
      processedTags = tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);
    }

    const post = await Post.create({
      author: req.user._id,
      content,
      image: image || '',
      tags: processedTags,
      mood: mood || '💡 Thought',
      likes: [],
      commentsCount: 0,
    });

    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'name username avatar isOnline'
    );

    res.status(201).json({
      success: true,
      message: 'Thought shared successfully!',
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts feed (all or filtered)
// @route   GET /api/posts?filter=all|friends|media&tag=tagName
export const getFeed = async (req, res, next) => {
  try {
    const { filter, tag } = req.query;
    let query = {};

    if (filter === 'friends') {
      const userFriends = req.user.friends || [];
      query.author = { $in: [...userFriends, req.user._id] };
    } else if (filter === 'media') {
      query.image = { $ne: '' };
    }

    if (tag) {
      query.tags = tag;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatar isOnline')
      .limit(50);

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a post
// @route   POST /api/posts/:id/like
export const likeUnlikePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isLiked = post.likes.some((likeId) => likeId.toString() === userId.toString());

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((likeId) => likeId.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);

      // Create notification if liking someone else's post
      if (post.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: 'post_like',
          message: `${req.user.name} liked your thought`,
          referenceId: post._id,
        });
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: id,
      author: req.user._id,
      content: content.trim(),
    });

    post.commentsCount += 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name username avatar'
    );

    // Notify post author if different
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'post_comment',
        message: `${req.user.name} commented on your post: "${content.substring(0, 30)}..."`,
        referenceId: post._id,
      });
    }

    res.status(201).json({
      success: true,
      comment: populatedComment,
      commentsCount: post.commentsCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all comments for a post
// @route   GET /api/posts/:id/comments
export const getPostComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ post: id })
      .sort({ createdAt: 1 })
      .populate('author', 'name username avatar');

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(id);
    await Comment.deleteMany({ post: id });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by user ID
// @route   GET /api/posts/user/:userId
export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatar isOnline');

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
};
