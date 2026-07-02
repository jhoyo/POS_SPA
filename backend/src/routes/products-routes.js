import { Router } from 'express';
import * as productsController from '../controllers/products-controller.js';
import { validateMiddleware } from '../middlewares/validate-middleware.js';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import { roleMiddleware } from '../middlewares/role-middleware.js';
import { productSchema, productUpdateSchema, productDeactivateSchema } from '../validators/product-schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/stock-bajo', productsController.stockBajo);
router.get('/', productsController.buscar);
router.post('/', roleMiddleware('administrador'), validateMiddleware(productSchema), productsController.crear);
router.put('/:id', roleMiddleware('administrador'), validateMiddleware(productUpdateSchema), productsController.actualizar);
router.delete('/:id', roleMiddleware('administrador'), validateMiddleware(productDeactivateSchema), productsController.desactivar);

export default router;
