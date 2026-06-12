import { Router } from 'express';
import * as categoriesService from './categories.service';

const router = Router();

router.get('/', async (_req, res) => {
  const categories = await categoriesService.listPublic();
  res.json(categories);
});

export default router;
