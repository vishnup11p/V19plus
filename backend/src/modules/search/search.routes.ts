import { Router } from 'express';
import { searchLimiter } from '../../middleware/rateLimiter';
import * as controller from './search.controller';

const router = Router();

router.use(searchLimiter);

router.get('/', controller.search);
router.get('/suggestions', controller.suggestions);
router.get('/trending', controller.trendingSearches);
router.get('/person/:name', controller.personSearch);

export default router;
