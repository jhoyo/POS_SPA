import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandlerMiddleware } from './middlewares/error-handler-middleware.js';
import { montarSwagger } from './docs/swagger.js';

import authRoutes from './routes/auth-routes.js';
import usersRoutes from './routes/users-routes.js';
import categoriesRoutes from './routes/categories-routes.js';
import productsRoutes from './routes/products-routes.js';
import salesRoutes from './routes/sales-routes.js';
import inventoryRoutes from './routes/inventory-routes.js';
import cashRegisterRoutes from './routes/cash-register-routes.js';
import auditRoutes from './routes/audit-routes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Documentación interactiva de la API (OpenAPI 3.0): monta /api-docs y /api-docs.json.
// El spec vive en src/docs/openapi.js, como objeto plano, para que quede fielmente
// alineado con las rutas y validadores reales.
montarSwagger(app);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usersRoutes);
app.use('/api/v1/categorias', categoriesRoutes);
app.use('/api/v1/productos', productsRoutes);
app.use('/api/v1/ventas', salesRoutes);
app.use('/api/v1/inventario', inventoryRoutes);
app.use('/api/v1/caja', cashRegisterRoutes);
app.use('/api/v1/auditoria', auditRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Recurso no encontrado' });
});

// El middleware de errores SIEMPRE va al final, después de registrar todas las rutas
app.use(errorHandlerMiddleware);

export default app;
