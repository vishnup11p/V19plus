import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './watchlist.controller';

const router = Router();

router.use(authenticate);

const addSchema = Joi.object({
  contentId: Joi.string().uuid().required(),
});

router.get('/', controller.getWatchlist);
router.post('/', validate(addSchema), controller.add);
router.delete('/:contentId', controller.remove);

export default router;
