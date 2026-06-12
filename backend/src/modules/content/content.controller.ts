import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as contentService from './content.service';

export async function list(req: AuthRequest, res: Response) {
  const result = await contentService.listContent({
    type: req.query.type as any,
    genre: req.query.genre as string,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  });
  res.json(result);
}

export async function featured(_req: AuthRequest, res: Response) {
  const items = await contentService.getFeatured();
  res.json(items);
}

export async function trending(_req: AuthRequest, res: Response) {
  const items = await contentService.getTrending();
  res.json(items);
}

export async function originals(_req: AuthRequest, res: Response) {
  const items = await contentService.getOriginals();
  res.json(items);
}

export async function continueWatching(req: AuthRequest, res: Response) {
  const items = await contentService.getContinueWatching(req.user!.userId);
  res.json(items);
}

export async function recommended(req: AuthRequest, res: Response) {
  const items = await contentService.getRecommended(req.user!.userId);
  res.json(items);
}

export async function getBySlug(req: AuthRequest, res: Response) {
  const content = await contentService.getBySlug(req.params.slug, req.user?.userId);
  res.json(content);
}

export async function getEpisodes(req: AuthRequest, res: Response) {
  const episodes = await contentService.getEpisodes(req.params.id);
  res.json(episodes);
}

export async function create(req: AuthRequest, res: Response) {
  const content = await contentService.createContent(req.body);
  res.status(201).json(content);
}

export async function update(req: AuthRequest, res: Response) {
  const content = await contentService.updateContent(req.params.id, req.body);
  res.json(content);
}

export async function remove(req: AuthRequest, res: Response) {
  const result = await contentService.deleteContent(req.params.id);
  res.json(result);
}
