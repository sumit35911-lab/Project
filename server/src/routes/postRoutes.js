import express from 'express';
import {
  createPost,
  getFeed,
  likeUnlikePost,
  addComment,
  getPostComments,
  deletePost,
  getUserPosts,
} from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createPost);
router.get('/', getFeed);
router.post('/:id/like', likeUnlikePost);
router.post('/:id/comment', addComment);
router.get('/:id/comments', getPostComments);
router.delete('/:id', deletePost);
router.get('/user/:userId', getUserPosts);

export default router;
