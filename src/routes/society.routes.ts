import { Router } from 'express';
import {
  getAllSocieties,
  createSociety,
  updateSociety,
  deleteSociety,
} from '../controllers/society.controller';
import { adminAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllSocieties);
router.post('/', adminAuth as any, createSociety);
router.put('/:id', adminAuth as any, updateSociety);
router.delete('/:id', adminAuth as any, deleteSociety);

export default router;
