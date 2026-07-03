import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as historyService from './history.service';

export async function getHistory(req: AuthRequest, res: Response) {
  const history = await historyService.getHistory(req.user!.userId);
  res.json(history);
}

export async function upsert(req: AuthRequest, res: Response) {
  const result = await historyService.upsert(req.user!.userId, req.body);
  res.json(result);
}

export async function getProgress(req: AuthRequest, res: Response) {
  const episodeId = req.query.episodeId as string | undefined;
  const progress = await historyService.getProgress(req.user!.userId, req.params.contentId, episodeId);
  res.json(progress);
}

export async function remove(req: AuthRequest, res: Response) {
  const result = await historyService.removeFromHistory(req.user!.userId, req.params.contentId);
  res.json(result);
}
