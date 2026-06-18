import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './subscription.controller';

const router = Router();

const checkoutSchema = Joi.object({
  plan: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM').required(),
});

router.get('/plans', controller.getPlans);
router.post('/webhook', controller.webhook);
router.get('/current', authenticate, controller.getCurrent);
router.post('/checkout', authenticate, validate(checkoutSchema), controller.checkout);
router.post('/cancel', authenticate, controller.cancel);

export default router;
