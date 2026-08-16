import { User } from '../models/User.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { Notification } from '../models/Notification.js';

// @desc    Send a friend request
// @route   POST /api/friends/request
export const sendFriendRequest = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const senderId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required' });
    }

    if (senderId.toString() === targetUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a friend request to yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    // Check if already friends
    if (targetUser.friends.includes(senderId)) {
      return res.status(400).json({ success: false, message: 'You are already friends with this user' });
    }

    // Check if existing request exists
    let existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: targetUserId },
        { sender: targetUserId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        if (existingRequest.sender.toString() === senderId.toString()) {
          return res.status(400).json({ success: false, message: 'Friend request already sent' });
        } else {
          // If the other user already sent a request, auto-accept it!
          existingRequest.status = 'accepted';
          await existingRequest.save();

          await User.findByIdAndUpdate(senderId, { $addToSet: { friends: targetUserId } });
          await User.findByIdAndUpdate(targetUserId, { $addToSet: { friends: senderId } });

          await Notification.create({
            recipient: targetUserId,
            sender: senderId,
            type: 'friend_accept',
            message: `${req.user.name} accepted your friend request`,
          });

          return res.status(200).json({
            success: true,
            message: 'Mutual friend request matched! You are now friends.',
            status: 'accepted',
          });
        }
      } else if (existingRequest.status === 'rejected') {
        // Reset to pending if re-requested
        existingRequest.sender = senderId;
        existingRequest.receiver = targetUserId;
        existingRequest.status = 'pending';
        await existingRequest.save();
      }
    } else {
      await FriendRequest.create({
        sender: senderId,
        receiver: targetUserId,
        status: 'pending',
      });
    }

    // Create notification for target user
    await Notification.create({
      recipient: targetUserId,
      sender: senderId,
      type: 'friend_request',
      message: `${req.user.name} sent you a friend request`,
    });

    res.status(200).json({
      success: true,
      message: 'Friend request sent successfully',
      status: 'pending_sent',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept or reject a friend request
// @route   POST /api/friends/respond
export const respondFriendRequest = async (req, res, next) => {
  try {
    const { requestId, action } = req.body; // action: 'accept' | 'reject'
    const userId = req.user._id;

    if (!requestId || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid request or action' });
    }

    const request = await FriendRequest.findById(requestId).populate('sender', 'name username avatar');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    if (request.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this request' });
    }

    if (action === 'accept') {
      request.status = 'accepted';
      await request.save();

      // Add to friends lists
      await User.findByIdAndUpdate(userId, { $addToSet: { friends: request.sender._id } });
      await User.findByIdAndUpdate(request.sender._id, { $addToSet: { friends: userId } });

      // Notify the sender that request was accepted
      await Notification.create({
        recipient: request.sender._id,
        sender: userId,
        type: 'friend_accept',
        message: `${req.user.name} accepted your friend request`,
      });

      return res.status(200).json({
        success: true,
        message: `Accepted friend request from ${request.sender.name}`,
        friend: request.sender,
      });
    } else {
      request.status = 'rejected';
      await request.save();

      return res.status(200).json({
        success: true,
        message: 'Friend request declined',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user friends list
// @route   GET /api/friends/list
export const getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'friends',
      select: 'name username avatar bio location isOnline lastSeen statusMessage',
    });

    res.status(200).json({
      success: true,
      friends: user.friends || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending received and sent friend requests
// @route   GET /api/friends/pending
export const getPendingRequests = async (req, res, next) => {
  try {
    const received = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending',
    }).populate('sender', 'name username avatar bio location isOnline');

    const sent = await FriendRequest.find({
      sender: req.user._id,
      status: 'pending',
    }).populate('receiver', 'name username avatar bio location isOnline');

    res.status(200).json({
      success: true,
      received,
      sent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a friend
// @route   DELETE /api/friends/:friendId
export const removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    // Clean up request status
    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Friend removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
