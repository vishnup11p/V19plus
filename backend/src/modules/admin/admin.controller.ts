import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as adminService from './admin.service';

export async function dashboard(_req: AuthRequest, res: Response) {
  res.json(await adminService.getDashboard());
}

export async function getSettings(_req: AuthRequest, res: Response) {
  res.json(await adminService.getSettings());
}

export async function updateSettings(req: AuthRequest, res: Response) {
  res.json(await adminService.updateSettings(req.body));
}

export async function listCategories(_req: AuthRequest, res: Response) {
  res.json(await adminService.listCategories());
}

export async function createCategory(req: AuthRequest, res: Response) {
  res.status(201).json(await adminService.createCategory(req.body));
}

export async function updateCategory(req: AuthRequest, res: Response) {
  res.json(await adminService.updateCategory(req.params.id, req.body));
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  res.json(await adminService.removeCategory(req.params.id));
}

export async function listUsers(_req: AuthRequest, res: Response) {
  res.json(await adminService.listUsers());
}

export async function updateUserRole(req: AuthRequest, res: Response) {
  res.json(await adminService.updateUserRole(req.params.id, req.body.role));
}

export async function listContent(_req: AuthRequest, res: Response) {
  res.json(await adminService.listContent());
}

export async function createContent(req: AuthRequest, res: Response) {
  res.status(201).json(await adminService.createContent(req.body));
}

export async function updateContent(req: AuthRequest, res: Response) {
  res.json(await adminService.updateContent(req.params.id, req.body));
}

export async function deleteContent(req: AuthRequest, res: Response) {
  res.json(await adminService.deleteContent(req.params.id));
}
