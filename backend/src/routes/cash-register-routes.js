import { Router } from 'express';
import * as cashRegisterController from '../controllers/cash-register-controller.js';
import { validateMiddleware } from '../middlewares/validate-middleware.js';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import { roleMiddleware } from '../middlewares/role-middleware.js';
import { cashOpenSchema, cashCloseZSchema } from '../validators/cash-register-schema.js';

const router = Router();

router.use(authMiddleware, roleMiddleware('cajero', 'administrador'));

router.post('/apertura', validateMiddleware(cashOpenSchema), cashRegisterController.abrir);
router.get('/apertura/actual', cashRegisterController.aperturaActual);
router.get('/corte-x', cashRegisterController.corteX);
router.post('/corte-z', validateMiddleware(cashCloseZSchema), cashRegisterController.corteZ);

export default router;
