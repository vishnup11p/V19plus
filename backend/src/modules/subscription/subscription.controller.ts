import { Response, Request } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as subscriptionService from './subscription.service';

export function getPlans(_req: AuthRequest, res: Response) {
  res.json(subscriptionService.getPlans());
}

export async function getCurrent(req: AuthRequest, res: Response) {
  const subscription = await subscriptionService.getCurrentSubscription(req.user!.userId);
  res.json(subscription);
}

export async function checkout(req: AuthRequest, res: Response) {
  const result = await subscriptionService.createCheckoutSession(req.user!.userId, req.body.plan);
  res.json(result);
}

export async function cancel(req: AuthRequest, res: Response) {
  const result = await subscriptionService.cancelSubscription(req.user!.userId);
  res.json(result);
}

export async function webhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;
  const result = await subscriptionService.handleWebhook(req.body, signature);
  res.json(result);
}
