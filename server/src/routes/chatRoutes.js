import express from 'express';
import {
  getConversations,
  getOrCreateDirectChat,
  createGroupChat,
  updateGroupMembers,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.post('/direct', getOrCreateDirectChat);
router.post('/group', createGroupChat);
router.put('/:id/members', updateGroupMembers);

export default router;
