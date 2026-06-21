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

// T1-6: Payment history
export async function getPayments(req: AuthRequest, res: Response) {
  const payments = await userService.getPayments(req.user!.userId);
  res.json(payments);
}

// T1-7: Notifications
export async function getNotifications(req: AuthRequest, res: Response) {
  const notifications = await userService.getNotifications(req.user!.userId);
  res.json(notifications);
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  const result = await userService.markNotificationRead(req.user!.userId, req.params.id);
  res.json(result);
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response) {
  const result = await userService.markAllNotificationsRead(req.user!.userId);
  res.json(result);
}

export async function getUnreadNotificationCount(req: AuthRequest, res: Response) {
  const result = await userService.getUnreadNotificationCount(req.user!.userId);
  res.json(result);
}
