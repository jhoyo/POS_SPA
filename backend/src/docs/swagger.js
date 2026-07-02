import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi.js';

// Monta la documentación interactiva de la API (OpenAPI 3.0) en /api-docs,
// más el spec crudo en /api-docs.json para herramientas externas (Postman, Insomnia, etc.).
function montarSwagger(app) {
  app.get('/api-docs.json', (req, res) => {
    res.status(200).json(openApiSpec);
  });

  app.use(
    '/api-docs',
    // El helmet() global (montado antes en app.js) ya fijó una CSP restrictiva que
    // bloquea los <script>/<style> inline que usa la UI de Swagger; hay que quitarla
    // explícitamente aquí, ya que un helmet() anidado con contentSecurityPolicy:false
    // no la elimina, solo evita fijarla de nuevo.
    (req, res, next) => {
      res.removeHeader('Content-Security-Policy');
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { customSiteTitle: 'POS Spa Facial — API Docs' })
  );
}

export { montarSwagger };
