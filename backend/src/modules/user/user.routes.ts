import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './user.controller';

const router = Router();

router.use(authenticate);

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  avatarUrl: Joi.string().uri().allow(null, ''),
});

const createProfileSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  avatarColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  isKids: Joi.boolean(),
  pin: Joi.string().length(4).pattern(/^\d+$/),
});

router.get('/profile', controller.getProfile);
router.put('/profile', validate(updateProfileSchema), controller.updateProfile);
router.get('/profiles', controller.listProfiles);
router.post('/profiles', validate(createProfileSchema), controller.createProfile);
router.delete('/profiles/:id', controller.deleteProfile);

export default router;
