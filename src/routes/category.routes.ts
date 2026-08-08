import { Router } from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { adminAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllCategories);
router.post('/', adminAuth as any, createCategory);
router.put('/:id', adminAuth as any, updateCategory);
router.delete('/:id', adminAuth as any, deleteCategory);

export default router;
