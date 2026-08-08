import { Router } from 'express';
import {
  createReview,
  getProductReviews,
  getOrderReviews,
  getAdminReviews,
  toggleReviewApproval,
  deleteReview,
} from '../controllers/review.controller';
import { adminAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/', createReview);
router.get('/product/:productId', getProductReviews);
router.get('/order/:orderNumber', getOrderReviews);

// Protected Admin routes
router.get('/admin/all', adminAuth, getAdminReviews);
router.patch('/admin/:id/toggle', adminAuth, toggleReviewApproval);
router.delete('/admin/:id', adminAuth, deleteReview);

export default router;
