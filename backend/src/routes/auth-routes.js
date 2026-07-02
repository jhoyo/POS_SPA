import { Router } from 'express';
import * as authController from '../controllers/auth-controller.js';
import { validateMiddleware } from '../middlewares/validate-middleware.js';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import { loginSchema } from '../validators/user-schema.js';

const router = Router();

router.post('/login', validateMiddleware(loginSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);

export default router;
