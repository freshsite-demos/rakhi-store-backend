import { Router } from 'express';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from '../controllers/coupon.controller';
import { adminAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', adminAuth as any, getAllCoupons);
router.post('/validate', validateCoupon);

router.post('/', adminAuth as any, createCoupon);
router.put('/:id', adminAuth as any, updateCoupon);
router.delete('/:id', adminAuth as any, deleteCoupon);

export default router;
