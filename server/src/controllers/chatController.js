import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

// @desc    Get all conversations (direct & group) for current user
// @route   GET /api/chats
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name username avatar isOnline lastSeen')
      .populate('admin', 'name username avatar')
      .populate('lastMessage.sender', 'name username');

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create 1-on-1 direct chat with a user
// @route   POST /api/chats/direct
export const getOrCreateDirectChat = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    if (recipientId.toString() === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create a chat with yourself' });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [currentUserId, recipientId], $size: 2 },
    })
      .populate('participants', 'name username avatar isOnline lastSeen')
      .populate('lastMessage.sender', 'name username');

    if (!conversation) {
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ success: false, message: 'Recipient user not found' });
      }

      conversation = await Conversation.create({
        isGroup: false,
        participants: [currentUserId, recipientId],
        lastMessage: {
          text: 'Conversation started',
          sender: currentUserId,
          createdAt: new Date(),
        },
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'name username avatar isOnline lastSeen'
      );
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new group chat
// @route   POST /api/chats/group
export const createGroupChat = async (req, res, next) => {
  try {
    const { name, description, participantIds, groupAvatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    let members = Array.isArray(participantIds) ? participantIds : [];
    // Ensure current user is in the group
    if (!members.includes(req.user._id.toString())) {
      members.push(req.user._id.toString());
    }

    if (members.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A group must have at least 2 members including you',
      });
    }

    const defaultGroupAvatar =
      groupAvatar ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`;

    const group = await Conversation.create({
      isGroup: true,
      name: name.trim(),
      description: description || 'Welcome to our group chat!',
      groupAvatar: defaultGroupAvatar,
      admin: req.user._id,
      participants: members,
      lastMessage: {
        text: `${req.user.name} created group "${name.trim()}"`,
        sender: req.user._id,
        createdAt: new Date(),
      },
    });

    // Create initial system message in group
    await Message.create({
      conversation: group._id,
      sender: req.user._id,
      text: `🎉 ${req.user.name} created the group "${name.trim()}"`,
      messageType: 'system',
    });

    const populatedGroup = await Conversation.findById(group._id)
      .populate('participants', 'name username avatar isOnline lastSeen')
      .populate('admin', 'name username avatar');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      conversation: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or Remove members from group chat
// @route   PUT /api/chats/:id/members
export const updateGroupMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, memberId } = req.body; // action: 'add' | 'remove'

    if (!['add', 'remove'].includes(action) || !memberId) {
      return res.status(400).json({ success: false, message: 'Invalid action or member ID' });
    }

    const group = await Conversation.findById(id);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: 'Group conversation not found' });
    }

    // Only admin or members can modify
    const isMember = group.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' });
    }

    const targetUser = await User.findById(memberId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    if (action === 'add') {
      if (group.participants.includes(memberId)) {
        return res.status(400).json({ success: false, message: 'User is already in this group' });
      }
      group.participants.push(memberId);
      await Message.create({
        conversation: group._id,
        sender: req.user._id,
        text: `👋 ${req.user.name} added ${targetUser.name} to the group`,
        messageType: 'system',
      });
    } else if (action === 'remove') {
      group.participants = group.participants.filter(
        (p) => p.toString() !== memberId.toString()
      );
      await Message.create({
        conversation: group._id,
        sender: req.user._id,
        text: `👋 ${targetUser.name} left or was removed from the group`,
        messageType: 'system',
      });
    }

    await group.save();

    const updatedGroup = await Conversation.findById(id)
      .populate('participants', 'name username avatar isOnline lastSeen')
      .populate('admin', 'name username avatar');

    res.status(200).json({
      success: true,
      message: action === 'add' ? 'Member added' : 'Member removed',
      conversation: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};
