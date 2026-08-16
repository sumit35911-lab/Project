import express from 'express';
import {
  sendFriendRequest,
  respondFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend,
} from '../controllers/friendController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/request', sendFriendRequest);
router.post('/respond', respondFriendRequest);
router.get('/list', getFriends);
router.get('/pending', getPendingRequests);
router.delete('/:friendId', removeFriend);

export default router;
