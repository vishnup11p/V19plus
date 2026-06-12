import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiter';
import * as controller from './admin.auth.controller';

const router = Router();

router.post('/login', authLimiter, controller.login);

export default router;
