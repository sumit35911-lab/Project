import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';

// @desc    Get messages for a conversation
// @route   GET /api/messages/:chatId
export const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view messages in this conversation',
      });
    }

    const messages = await Message.find({ conversation: chatId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name username avatar');

    // Mark unread messages as read
    await Message.updateMany(
      { conversation: chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a conversation
// @route   POST /api/messages/:chatId
export const sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { text, mediaUrl, messageType } = req.body;

    if (!text && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Message content or attachment is required' });
    }

    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation',
      });
    }

    const message = await Message.create({
      conversation: chatId,
      sender: req.user._id,
      text: text || '',
      mediaUrl: mediaUrl || '',
      messageType: messageType || (mediaUrl ? 'image' : 'text'),
      readBy: [req.user._id],
    });

    // Update conversation lastMessage
    conversation.lastMessage = {
      text: text || (mediaUrl ? '📷 Photo attachment' : 'Message'),
      sender: req.user._id,
      createdAt: new Date(),
    };
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate(
      'sender',
      'name username avatar'
    );

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};
