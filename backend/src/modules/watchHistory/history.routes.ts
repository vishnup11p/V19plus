import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './history.controller';

const router = Router();

router.use(authenticate);

const upsertSchema = Joi.object({
  contentId: Joi.string().uuid().required(),
  episodeId: Joi.string().uuid(),
  progress: Joi.number().min(0).max(100).required(),
  completed: Joi.boolean(),
});

router.get('/', controller.getHistory);
router.get('/:contentId', controller.getProgress);
router.post('/', validate(upsertSchema), controller.upsert);
router.delete('/:contentId', controller.remove);

export default router;
