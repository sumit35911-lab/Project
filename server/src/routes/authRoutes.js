import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  demoLogin,
  suggestUsername,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/suggest-username', suggestUsername);
router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
