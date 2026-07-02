import { Router } from 'express';
import * as categoriesController from '../controllers/categories-controller.js';
import { validateMiddleware } from '../middlewares/validate-middleware.js';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import { roleMiddleware } from '../middlewares/role-middleware.js';
import { categorySchema } from '../validators/category-schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', categoriesController.listar);
router.post('/', roleMiddleware('administrador'), validateMiddleware(categorySchema), categoriesController.crear);

export default router;
