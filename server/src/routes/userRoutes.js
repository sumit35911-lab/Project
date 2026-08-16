import express from 'express';
import {
  searchUsers,
  getUserProfile,
  getSuggestions,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getSuggestions);
router.get('/profile/:identifier', protect, getUserProfile);

export default router;
