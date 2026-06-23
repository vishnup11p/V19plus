import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as watchlistService from './watchlist.service';

export async function getWatchlist(req: AuthRequest, res: Response) {
  const items = await watchlistService.getWatchlist(req.user!.userId);
  res.json(items);
}

export async function add(req: AuthRequest, res: Response) {
  const item = await watchlistService.addToWatchlist(req.user!.userId, req.body.contentId);
  res.status(201).json(item);
}

export async function remove(req: AuthRequest, res: Response) {
  const result = await watchlistService.removeFromWatchlist(req.user!.userId, req.params.contentId);
  res.json(result);
}
