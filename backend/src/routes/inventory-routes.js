import { Router } from 'express';
import * as inventoryController from '../controllers/inventory-controller.js';
import { validateMiddleware } from '../middlewares/validate-middleware.js';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import { roleMiddleware } from '../middlewares/role-middleware.js';
import { inventoryEntrySchema, inventoryAdjustmentSchema } from '../validators/inventory-schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/stock-bajo', inventoryController.stockBajo);
router.get('/movimientos', inventoryController.listarMovimientos);
router.post(
  '/entradas',
  roleMiddleware('administrador', 'cajero'),
  validateMiddleware(inventoryEntrySchema),
  inventoryController.registrarEntrada
);
router.post(
  '/ajustes',
  roleMiddleware('administrador'),
  validateMiddleware(inventoryAdjustmentSchema),
  inventoryController.registrarAjuste
);

export default router;
