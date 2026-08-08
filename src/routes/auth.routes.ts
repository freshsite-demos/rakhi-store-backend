import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { adminAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', adminAuth as any, getMe as any);

export default router;
