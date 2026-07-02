import { Router } from 'express';
import * as auditController from '../controllers/audit-controller.js';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import { roleMiddleware } from '../middlewares/role-middleware.js';

const router = Router();

router.use(authMiddleware, roleMiddleware('administrador'));

router.get('/', auditController.listar);

export default router;
