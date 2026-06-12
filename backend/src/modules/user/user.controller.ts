import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as userService from './user.service';

export async function getProfile(req: AuthRequest, res: Response) {
  const profile = await userService.getProfile(req.user!.userId);
  res.json(profile);
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const profile = await userService.updateProfile(req.user!.userId, req.body);
  res.json(profile);
}

export async function listProfiles(req: AuthRequest, res: Response) {
  const profiles = await userService.listProfiles(req.user!.userId);
  res.json(profiles);
}

export async function createProfile(req: AuthRequest, res: Response) {
  const profile = await userService.createProfile(req.user!.userId, req.body);
  res.status(201).json(profile);
}

export async function deleteProfile(req: AuthRequest, res: Response) {
  const result = await userService.deleteProfile(req.user!.userId, req.params.id);
  res.json(result);
}
