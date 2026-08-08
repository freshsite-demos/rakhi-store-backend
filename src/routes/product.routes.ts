import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { adminAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.post('/', adminAuth as any, upload.single('image'), createProduct);
router.put('/:id', adminAuth as any, upload.single('image'), updateProduct);
router.delete('/:id', adminAuth as any, deleteProduct);

export default router;
