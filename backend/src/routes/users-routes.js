import { Router } from 'express';
import * as usersController from '../controllers/users-controller.js';
import { validateMiddleware } from '../middlewares/validate-middleware.js';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import { roleMiddleware } from '../middlewares/role-middleware.js';
import { userSchema, userUpdateSchema } from '../validators/user-schema.js';

const router = Router();

router.use(authMiddleware, roleMiddleware('administrador'));

router.get('/', usersController.listar);
router.post('/', validateMiddleware(userSchema), usersController.crear);
router.put('/:id', validateMiddleware(userUpdateSchema), usersController.actualizar);
router.delete('/:id', usersController.desactivar);

export default router;
