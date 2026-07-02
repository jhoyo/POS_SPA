import { Router } from 'express';
import * as salesController from '../controllers/sales-controller.js';
import { validateMiddleware } from '../middlewares/validate-middleware.js';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import { roleMiddleware } from '../middlewares/role-middleware.js';
import { saleSchema, cancelSaleSchema } from '../validators/sale-schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', salesController.listar);
router.post('/', roleMiddleware('cajero', 'administrador'), validateMiddleware(saleSchema), salesController.crear);
router.get('/:id', salesController.obtenerTicket);
router.post('/:id/reimprimir', salesController.reimprimir);
router.post(
  '/:id/cancelar',
  roleMiddleware('cajero', 'administrador'),
  validateMiddleware(cancelSaleSchema),
  salesController.cancelar
);

export default router;
