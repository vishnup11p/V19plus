import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import * as controller from './admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', controller.dashboard);
router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);
router.get('/categories', controller.listCategories);
router.post('/categories', controller.createCategory);
router.put('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);
router.get('/users', controller.listUsers);
router.put('/users/:id/role', controller.updateUserRole);
router.get('/content', controller.listContent);
router.post('/content', controller.createContent);
router.put('/content/:id', controller.updateContent);
router.delete('/content/:id', controller.deleteContent);

export default router;
