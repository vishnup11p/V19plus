import { Router } from 'express';
import { authenticate, optionalAuth, requireAdmin } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import * as controller from './content.controller';
import { listContentSchema, createContentSchema, updateContentSchema } from './content.schema';

const router = Router();

router.get('/', validateQuery(listContentSchema), controller.list);
router.get('/featured', controller.featured);
router.get('/trending', controller.trending);
router.get('/originals', controller.originals);
router.get('/new-releases', controller.newReleases);
router.get('/continue-watching', authenticate, controller.continueWatching);
router.get('/recommended', authenticate, controller.recommended);
router.get('/because-you-watched', authenticate, controller.becauseYouWatched);
router.get('/match-scores', authenticate, controller.matchScores);
router.get('/id/:id/episodes', controller.getEpisodes);
router.get('/id/:id/similar', controller.similar);
router.get('/:slug', optionalAuth, controller.getBySlug);

router.post('/', authenticate, requireAdmin, validate(createContentSchema), controller.create);
router.put('/:id', authenticate, requireAdmin, validate(updateContentSchema), controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.remove);

export default router;
