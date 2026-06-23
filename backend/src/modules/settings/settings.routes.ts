import { Router } from 'express';
import * as settingsService from './settings.service';

const router = Router();

router.get('/', async (_req, res) => {
  const settings = await settingsService.getSettings();
  res.json(settings);
});

export default router;
