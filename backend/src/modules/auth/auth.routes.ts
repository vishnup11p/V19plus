import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import * as controller from './auth.controller';
import { googleAuthSchema } from './auth.schema';

const router = Router();

router.get('/google/status', controller.googleStatus);
router.get('/google/url', controller.googleAuthUrl);
router.get('/google/callback', controller.googleCallback);
router.post('/google', authLimiter, validate(googleAuthSchema), controller.googleAuth);
router.post('/logout', controller.logout);
router.post('/refresh', controller.refresh);
router.get('/me', authenticate, controller.getMe);

export default router;
