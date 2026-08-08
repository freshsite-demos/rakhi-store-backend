import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/order.controller';
import { adminAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/', createOrder);

router.get('/', adminAuth as any, getAllOrders);
router.get('/:id', adminAuth as any, getOrderById);
router.patch('/:id/status', adminAuth as any, updateOrderStatus);

export default router;
