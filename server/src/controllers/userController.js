import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { FriendRequest } from '../models/FriendRequest.js';

// @desc    Search users by name or username
// @route   GET /api/users/search?q=query
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(200).json({ success: true, users: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ name: regex }, { username: regex }],
    })
      .select('name username avatar bio isOnline lastSeen')
      .limit(15);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile by ID or username
// @route   GET /api/users/profile/:identifier
export const getUserProfile = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let user;

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier).populate('friends', 'name username avatar isOnline lastSeen');
    } else {
      user = await User.findOne({ username: identifier.toLowerCase() }).populate('friends', 'name username avatar isOnline lastSeen');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const postsCount = await Post.countDocuments({ author: user._id });
    
    // Check friend request status between logged-in user and this profile
    let friendshipStatus = 'none'; // 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'self'
    
    if (req.user._id.toString() === user._id.toString()) {
      friendshipStatus = 'self';
    } else if (user.friends.some((f) => f._id.toString() === req.user._id.toString())) {
      friendshipStatus = 'friends';
    } else {
      const sentRequest = await FriendRequest.findOne({
        sender: req.user._id,
        receiver: user._id,
        status: 'pending',
      });
      if (sentRequest) {
        friendshipStatus = 'pending_sent';
      } else {
        const receivedRequest = await FriendRequest.findOne({
          sender: user._id,
          receiver: req.user._id,
          status: 'pending',
        });
        if (receivedRequest) {
          friendshipStatus = 'pending_received';
        }
      }
    }

    res.status(200).json({
      success: true,
      user,
      postsCount,
      friendshipStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested users to connect with
// @route   GET /api/users/suggestions
export const getSuggestions = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const excludedIds = [req.user._id, ...(currentUser.friends || [])];

    // Find pending requests sent or received
    const pendingRequests = await FriendRequest.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      status: 'pending',
    });

    pendingRequests.forEach((reqItem) => {
      excludedIds.push(reqItem.sender);
      excludedIds.push(reqItem.receiver);
    });

    const suggestions = await User.find({
      _id: { $nin: excludedIds },
    })
      .select('name username avatar bio location isOnline')
      .limit(6);

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};
