// Especificación OpenAPI 3.0 de la API del POS Spa Facial.
// Se mantiene como objeto plano (no JSDoc-en-rutas) para que quede 100% alineada
// con las rutas, validadores Zod y controladores reales, sin depender de que los
// comentarios en el código se mantengan sincronizados con la implementación.

const ErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: { type: 'string', example: 'Mensaje descriptivo del error' }
  }
};

function errorResponse(descripcion, ejemploMensaje) {
  return {
    description: descripcion,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: { success: false, error: ejemploMensaje }
      }
    }
  };
}

function exito(descripcion, ejemploData, statusSchema) {
  return {
    description: descripcion,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: statusSchema || {}
          }
        },
        example: { success: true, data: ejemploData }
      }
    }
  };
}

const respuestasComunes = {
  ValidationError: errorResponse(
    'Payload inválido (esquema Zod). El mensaje detalla el campo y la regla que falló.',
    'Datos inválidos: precio_venta: El precio de venta debe ser mayor a 0'
  ),
  Unauthorized: errorResponse(
    'No se proporcionó token, el token es inválido/expiró, o la sesión ya no es válida.',
    'Token inválido o expirado'
  ),
  Forbidden: errorResponse(
    'El rol del usuario autenticado no tiene permiso para esta acción.',
    'No tiene permisos para realizar esta acción'
  ),
  NotFound: errorResponse('El recurso solicitado no existe.', 'El producto no existe'),
  Conflict: errorResponse(
    'La operación entra en conflicto con el estado actual de los datos (duplicado, stock, caja, etc.).',
    'El código de producto ya existe'
  ),
  ServerError: errorResponse(
    'Error no controlado. El backend nunca expone el detalle técnico interno al cliente (ver skill-ith-backend.md).',
    'Ocurrió un error interno en el servidor'
  )
};

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'POS Spa Facial — API',
    version: '1.0.0',
    description: `API REST del sistema de punto de venta para spa facial (Node.js + Express + Supabase/Postgres).

### Contrato de respuesta
Todas las respuestas siguen el mismo sobre, sin excepción (ver \`skill-ith-backend.md\`):
- Éxito: \`{ "success": true, "data": ... }\`
- Error: \`{ "success": false, "error": "mensaje en español, sin detalles técnicos" }\`

### Autenticación
La mayoría de las rutas requieren un JWT obtenido en \`POST /api/v1/auth/login\`, enviado como
\`Authorization: Bearer <token>\`. El token expira por inactividad (HU-02); una sesión inactiva
responde \`401 "Sesión expirada"\` en la siguiente petición.

### Roles
\`administrador\`, \`cajero\`, \`esteticista\`. Cada ruta protegida por rol responde \`403\` si el rol
del usuario autenticado no está en la lista permitida (ver \`role-middleware.js\`).`,
    contact: { name: 'POS Spa Facial' }
  },
  servers: [{ url: '/', description: 'Servidor actual (rutas ya incluyen el prefijo /api/v1)' }],
  tags: [
    { name: 'Sistema', description: 'Endpoints fuera de /api/v1' },
    { name: 'Auth', description: 'Inicio/cierre de sesión con usuario + PIN (HU-01, HU-02)' },
    { name: 'Usuarios', description: 'Gestión de usuarios del sistema (solo administrador)' },
    { name: 'Categorías', description: 'Categorías del catálogo de productos' },
    { name: 'Productos', description: 'Catálogo de productos (HU-03, HU-04, HU-05)' },
    { name: 'Ventas', description: 'Punto de venta: carrito, cobro, cancelación, ticket (HU-06 a HU-09)' },
    { name: 'Inventario', description: 'Entradas, ajustes y alertas de stock (HU-10, HU-11, HU-12)' },
    { name: 'Caja', description: 'Apertura, corte X y corte Z (HU-13, HU-14, HU-15)' },
    { name: 'Auditoría', description: 'Log de acciones críticas, inmutable (sección 5.3 del spec)' }
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtenido en POST /api/v1/auth/login'
      }
    },
    schemas: {
      Error: ErrorSchema,
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 3 },
          nombre: { type: 'string', example: 'María López' },
          usuario: { type: 'string', example: 'mlopez' },
          rol: { type: 'string', enum: ['administrador', 'cajero', 'esteticista'], example: 'cajero' },
          activo: { type: 'boolean', example: true },
          creado_en: { type: 'string', format: 'date-time' }
        }
      },
      Categoria: {
        type: 'object',
        properties: {
          id_categoria: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Mascarillas faciales' }
        }
      },
      Producto: {
        type: 'object',
        properties: {
          id_producto: { type: 'integer', example: 10 },
          sku: { type: 'string', example: '001' },
          codigo_barras: { type: 'string', nullable: true, example: '7501234567890' },
          nombre: { type: 'string', example: 'Mascarilla de papaya' },
          descripcion: { type: 'string', nullable: true },
          id_categoria: { type: 'integer', nullable: true, example: 1 },
          precio_venta: { type: 'number', format: 'float', example: 200, description: 'Precio con IVA incluido (RN-01)' },
          costo_unitario: { type: 'number', format: 'float', example: 100 },
          unidad_medida: { type: 'string', example: 'pza' },
          stock_actual: { type: 'integer', example: 8 },
          stock_minimo: { type: 'integer', example: 5 },
          activo: { type: 'boolean', example: true },
          creado_en: { type: 'string', format: 'date-time' },
          actualizado_en: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      MovimientoInventario: {
        type: 'object',
        properties: {
          fecha_hora: { type: 'string', format: 'date-time' },
          cantidad: { type: 'integer', example: 10 },
          motivo: { type: 'string', nullable: true, example: 'Reposición de proveedor' },
          tipo: { type: 'string', enum: ['entrada', 'venta', 'ajuste_positivo', 'ajuste_negativo'] },
          id_producto: { type: 'integer', example: 10 },
          nombre_usuario: { type: 'string', nullable: true, example: 'Administrador' }
        }
      },
      AperturaCaja: {
        type: 'object',
        properties: {
          id_apertura: { type: 'integer', example: 1 },
          id_usuario: { type: 'integer', example: 3 },
          id_usuario_autorizo: { type: 'integer', nullable: true },
          fondo_inicial: { type: 'number', format: 'float', example: 1000 },
          fecha_apertura: { type: 'string', format: 'date-time' },
          estado: { type: 'string', enum: ['abierta', 'cerrada'] },
          observaciones: { type: 'string', nullable: true }
        }
      },
      ResumenCorteX: {
        type: 'object',
        properties: {
          id_apertura_caja: { type: 'integer', example: 1 },
          fondo_inicial: { type: 'number', format: 'float', example: 1000 },
          fecha_apertura: { type: 'string', format: 'date-time' },
          total_ventas: { type: 'number', format: 'float', example: 360 },
          num_transacciones: { type: 'integer', example: 1 },
          desglose_por_forma_pago: {
            type: 'object',
            additionalProperties: { type: 'number' },
            example: { efectivo: 360 }
          }
        }
      },
      CorteZ: {
        type: 'object',
        properties: {
          id_corte: { type: 'integer', example: 5 },
          id_apertura: { type: 'integer', example: 1 },
          id_usuario: { type: 'integer', example: 3 },
          tipo: { type: 'string', enum: ['X', 'Z'], example: 'Z' },
          fecha_hora: { type: 'string', format: 'date-time' },
          total_efectivo: { type: 'number', format: 'float', example: 360 },
          total_tarjeta: { type: 'number', format: 'float', example: 0 },
          total_transferencia: { type: 'number', format: 'float', example: 0 },
          total_ventas: { type: 'number', format: 'float', example: 360 },
          num_transacciones: { type: 'integer', example: 1 },
          num_cancelaciones: { type: 'integer', example: 0 },
          fondo_inicial: { type: 'number', format: 'float', example: 1000 },
          efectivo_esperado: { type: 'number', format: 'float', example: 1360 },
          efectivo_declarado: { type: 'number', format: 'float', example: 1360 },
          diferencia: { type: 'number', format: 'float', example: 0, description: 'declarado - esperado; negativo = faltante' },
          observaciones: { type: 'string', nullable: true }
        }
      },
      VentaCreada: {
        type: 'object',
        description: 'Respuesta de POST /ventas. No incluye el detalle línea por línea: para el ticket completo usar GET /ventas/{id}.',
        properties: {
          id: { type: 'integer', example: 12 },
          folio: { type: 'integer', example: 1024 },
          subtotal: { type: 'number', format: 'float', example: 200 },
          iva: { type: 'number', format: 'float', example: 32 },
          descuento: { type: 'number', format: 'float', example: 0 },
          total: { type: 'number', format: 'float', example: 232 },
          cambio: { type: 'number', format: 'float', example: 0 },
          pagos: {
            type: 'array',
            items: {
              type: 'object',
              properties: { forma_pago: { type: 'string', example: 'efectivo' }, monto: { type: 'number', example: 232 } }
            }
          }
        }
      },
      TicketLinea: {
        type: 'object',
        description: 'Una fila por producto de la venta (vista v_ticket); todas las filas repiten los datos de cabecera.',
        properties: {
          id_venta: { type: 'integer', example: 12 },
          folio: { type: 'integer', example: 1024 },
          fecha_hora: { type: 'string', format: 'date-time' },
          cajero: { type: 'string', example: 'Administrador' },
          id_detalle: { type: 'integer', example: 20 },
          nombre_producto: { type: 'string', example: 'Mascarilla de papaya' },
          cantidad: { type: 'integer', example: 2 },
          precio_unitario: { type: 'number', format: 'float', example: 116 },
          descuento_pct: { type: 'number', format: 'float', example: 0 },
          descuento_monto: { type: 'number', format: 'float', example: 0 },
          subtotal_linea: { type: 'number', format: 'float', example: 200 },
          iva_linea: { type: 'number', format: 'float', example: 32 },
          subtotal_venta: { type: 'number', format: 'float', example: 200 },
          iva_venta: { type: 'number', format: 'float', example: 32 },
          descuento_total: { type: 'number', format: 'float', example: 0 },
          total: { type: 'number', format: 'float', example: 232 },
          cambio: { type: 'number', format: 'float', example: 0 },
          estado: { type: 'string', enum: ['completada', 'cancelada'] },
          ticket_impreso: { type: 'boolean', example: true }
        }
      },
      LogAuditoria: {
        type: 'object',
        properties: {
          id_log: { type: 'integer', example: 41 },
          id_usuario: { type: 'integer', nullable: true, example: 3 },
          accion: { type: 'string', example: 'CANCELACION_VENTA' },
          descripcion: { type: 'string', example: 'Venta 12 cancelada por autorización de admin: cliente se arrepintió' },
          tabla_afectada: { type: 'string', nullable: true, example: 'ventas' },
          id_registro: { type: 'integer', nullable: true, example: 12 },
          fecha_hora: { type: 'string', format: 'date-time' },
          usuarios: {
            type: 'object',
            nullable: true,
            properties: { nombre: { type: 'string', example: 'Administrador' } }
          }
        }
      }
    },
    responses: {
      ValidationError: respuestasComunes.ValidationError,
      Unauthorized: respuestasComunes.Unauthorized,
      Forbidden: respuestasComunes.Forbidden,
      NotFound: respuestasComunes.NotFound,
      Conflict: respuestasComunes.Conflict,
      ServerError: respuestasComunes.ServerError
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Verifica que el servidor está en línea',
        description: 'No requiere autenticación. Usado para checks de disponibilidad (load balancer, monitoreo).',
        security: [],
        responses: {
          200: {
            description: 'El servidor responde correctamente.',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } }
          }
        }
      }
    },

    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Inicia sesión con usuario y PIN',
        description:
          'HU-01. No revela si el usuario existe ante credenciales inválidas (siempre responde el mismo mensaje 401). ' +
          'Al tercer PIN incorrecto consecutivo, la cuenta se bloquea temporalmente (403) según `bloqueo_minutos` de configuración.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['usuario', 'pin'],
                properties: { usuario: { type: 'string', example: 'admin' }, pin: { type: 'string', example: '0000' } }
              }
            }
          }
        },
        responses: {
          200: exito('Login exitoso.', {
            token: 'eyJhbGciOiJIUzI1NiIs...',
            usuario: { id: 1, nombre: 'Administrador', rol: 'administrador' }
          }),
          400: respuestasComunes.ValidationError,
          401: errorResponse('Usuario o PIN incorrectos.', 'Usuario o PIN incorrectos'),
          403: errorResponse('Cuenta bloqueada tras 3 intentos fallidos consecutivos.', 'Cuenta bloqueada temporalmente')
        }
      }
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Cierra la sesión actual',
        description: 'Invalida la sesión asociada al token enviado; una petición posterior con el mismo token responde 401.',
        responses: {
          200: exito('Sesión cerrada.', { mensaje: 'Sesión cerrada correctamente' }),
          401: respuestasComunes.Unauthorized
        }
      }
    },

    '/api/v1/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Lista todos los usuarios',
        description: 'Solo administrador. Nunca incluye `pin_hash`.',
        responses: {
          200: exito('Lista de usuarios.', [{ id: 1, nombre: 'Administrador', usuario: 'admin', rol: 'administrador', activo: true }], {
            type: 'array',
            items: { $ref: '#/components/schemas/Usuario' }
          }),
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden
        }
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crea un nuevo usuario',
        description: 'Solo administrador. El PIN se hashea con bcrypt antes de guardarse (sección 5.3 del spec).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'usuario', 'pin', 'rol'],
                properties: {
                  nombre: { type: 'string', example: 'María López' },
                  usuario: { type: 'string', minLength: 3, example: 'mlopez' },
                  pin: { type: 'string', pattern: '^\\d{4,6}$', example: '1234', description: '4 a 6 dígitos numéricos' },
                  rol: { type: 'string', enum: ['administrador', 'cajero', 'esteticista'], example: 'cajero' }
                }
              }
            }
          }
        },
        responses: {
          201: exito('Usuario creado.', { id: 3, nombre: 'María López', usuario: 'mlopez', rol: 'cajero', activo: true }, {
            $ref: '#/components/schemas/Usuario'
          }),
          400: respuestasComunes.ValidationError,
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden,
          409: errorResponse('Ya existe un usuario con ese nombre de usuario.', 'Ya existe un usuario con ese nombre de usuario')
        }
      }
    },
    '/api/v1/usuarios/{id}': {
      put: {
        tags: ['Usuarios'],
        summary: 'Actualiza un usuario existente',
        description: 'Solo administrador. Todos los campos son opcionales (actualización parcial). Si se envía `pin`, se re-hashea.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 3 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  usuario: { type: 'string', minLength: 3 },
                  pin: { type: 'string', pattern: '^\\d{4,6}$' },
                  rol: { type: 'string', enum: ['administrador', 'cajero', 'esteticista'] }
                }
              }
            }
          }
        },
        responses: {
          200: exito('Usuario actualizado.', { id: 3, nombre: 'María López G.', usuario: 'mlopez', rol: 'cajero', activo: true }, {
            $ref: '#/components/schemas/Usuario'
          }),
          400: respuestasComunes.ValidationError,
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden,
          404: errorResponse('El usuario no existe.', 'El usuario no existe')
        }
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Desactiva un usuario',
        description: 'Solo administrador. Baja lógica (`activo = false`); no elimina el registro ni su historial.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 3 }],
        responses: {
          200: exito('Usuario desactivado.', { id: 3, nombre: 'María López', usuario: 'mlopez', rol: 'cajero', activo: false }, {
            $ref: '#/components/schemas/Usuario'
          }),
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden,
          404: errorResponse('El usuario no existe.', 'El usuario no existe')
        }
      }
    },

    '/api/v1/categorias': {
      get: {
        tags: ['Categorías'],
        summary: 'Lista todas las categorías',
        responses: {
          200: exito('Lista de categorías.', [{ id_categoria: 1, nombre: 'Mascarillas faciales' }], {
            type: 'array',
            items: { $ref: '#/components/schemas/Categoria' }
          }),
          401: respuestasComunes.Unauthorized
        }
      },
      post: {
        tags: ['Categorías'],
        summary: 'Crea una nueva categoría',
        description: 'Solo administrador. El nombre es `CITEXT` en base de datos: la comparación de duplicados no distingue mayúsculas.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['nombre'], properties: { nombre: { type: 'string', example: 'Exfoliantes' } } }
            }
          }
        },
        responses: {
          201: exito('Categoría creada.', { id_categoria: 4, nombre: 'Exfoliantes' }, { $ref: '#/components/schemas/Categoria' }),
          400: respuestasComunes.ValidationError,
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden,
          409: errorResponse('Ya existe una categoría con ese nombre.', 'Ya existe una categoría con ese nombre')
        }
      }
    },

    '/api/v1/productos': {
      get: {
        tags: ['Productos'],
        summary: 'Busca o lista productos',
        description:
          'HU-05. Sin parámetros, lista todos los productos activos. Con `codigo_barras`, retorna exactamente un producto ' +
          '(pensado para el lector de código de barras HID) o 404 si no existe. Con `q`, filtra por nombre (contiene, sin distinguir mayúsculas).',
        parameters: [
          { name: 'q', in: 'query', required: false, schema: { type: 'string' }, example: 'mascarilla', description: 'Búsqueda parcial por nombre' },
          { name: 'codigo_barras', in: 'query', required: false, schema: { type: 'string' }, example: '7501234567890' }
        ],
        responses: {
          200: exito('Lista de productos, o un único producto envuelto en arreglo si se buscó por código de barras.', [
            { id_producto: 10, sku: '001', nombre: 'Mascarilla de papaya', precio_venta: 200, stock_actual: 8 }
          ], { type: 'array', items: { $ref: '#/components/schemas/Producto' } }),
          401: respuestasComunes.Unauthorized,
          404: errorResponse('No se encontró ningún producto con ese código de barras.', 'No se encontró ningún producto con ese código de barras')
        }
      },
      post: {
        tags: ['Productos'],
        summary: 'Registra un nuevo producto',
        description: 'HU-03. Solo administrador.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'sku', 'unidad_medida', 'precio_venta', 'stock_minimo'],
                properties: {
                  nombre: { type: 'string', example: 'Mascarilla de aguacate' },
                  sku: { type: 'string', example: '002' },
                  codigo_barras: { type: 'string', nullable: true, example: null, description: "Enviar null si no aplica; nunca ''" },
                  id_categoria: { type: 'integer', nullable: true, example: 1 },
                  unidad_medida: { type: 'string', example: 'pza' },
                  precio_venta: { type: 'number', format: 'float', example: 210, description: 'Debe ser mayor a 0; incluye IVA (RN-01)' },
                  costo_unitario: { type: 'number', format: 'float', example: 100, default: 0 },
                  stock_actual: { type: 'integer', example: 0, default: 0 },
                  stock_minimo: { type: 'integer', example: 5, description: 'Entero, mínimo 1' }
                }
              }
            }
          }
        },
        responses: {
          201: exito('Producto creado.', { id_producto: 11, sku: '002', nombre: 'Mascarilla de aguacate', precio_venta: 210, stock_actual: 0 }, {
            $ref: '#/components/schemas/Producto'
          }),
          400: respuestasComunes.ValidationError,
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden,
          409: errorResponse(
            'El SKU o el código de barras ya existe en otro producto (HU-03).',
            'El código de producto ya existe'
          )
        }
      }
    },
    '/api/v1/productos/stock-bajo': {
      get: {
        tags: ['Productos'],
        summary: 'Lista productos con stock igual o por debajo del mínimo',
        description:
          'HU-11. Usa la vista `v_stock_bajo`. Nota: existe el mismo endpoint duplicado en `/inventario/stock-bajo` ' +
          '(ambos llaman a la misma consulta subyacente).',
        responses: {
          200: exito('Productos en stock bajo (vacío si ninguno).', [
            { id_producto: 10, sku: '001', nombre: 'Mascarilla de papaya', categoria: 'Mascarillas faciales', stock_actual: 0, stock_minimo: 5, diferencia: -5 }
          ]),
          401: respuestasComunes.Unauthorized
        }
      }
    },
    '/api/v1/productos/{id}': {
      put: {
        tags: ['Productos'],
        summary: 'Edita un producto existente',
        description:
          'HU-04. Solo administrador. Todos los campos son opcionales. Editar `precio_venta` o `nombre` NO altera ventas ' +
          'ya registradas (`detalle_venta` guarda su propio snapshot de nombre y precio al momento de la venta).',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 10 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  sku: { type: 'string' },
                  codigo_barras: { type: 'string', nullable: true },
                  id_categoria: { type: 'integer', nullable: true },
                  unidad_medida: { type: 'string' },
                  precio_venta: { type: 'number', format: 'float' },
                  costo_unitario: { type: 'number', format: 'float' },
                  stock_actual: { type: 'integer' },
                  stock_minimo: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          200: exito('Producto actualizado.', { id_producto: 10, sku: '001', nombre: 'Mascarilla de papaya', precio_venta: 220 }, {
            $ref: '#/components/schemas/Producto'
          }),
          400: respuestasComunes.ValidationError,
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden,
          404: errorResponse('El producto no existe.', 'El producto no existe'),
          409: respuestasComunes.Conflict
        }
      },
      delete: {
        tags: ['Productos'],
        summary: 'Desactiva un producto',
        description:
          'HU-04. Solo administrador. Baja lógica; el producto desactivado no puede agregarse a nuevas ventas (RN-03) pero ' +
          'conserva su historial. Si tiene stock > 0, exige `confirmar: true` en el body o responde 409 con advertencia.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 10 }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { confirmar: { type: 'boolean', default: false, example: true } } }
            }
          }
        },
        responses: {
          200: exito('Producto desactivado.', {
            producto: { id_producto: 10, activo: false },
            advertencia: true
          }),
          400: respuestasComunes.ValidationError,
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden,
          404: errorResponse('El producto no existe.', 'El producto no existe'),
          409: errorResponse(
            'El producto tiene stock > 0 y no se envió confirmar: true.',
            'El producto tiene 8 unidades en existencia. Confirme la desactivación para continuar.'
          )
        }
      }
    },

    '/api/v1/ventas': {
      get: {
        tags: ['Ventas'],
        summary: 'Lista ventas con filtros opcionales',
        parameters: [
          { name: 'folio', in: 'query', required: false, schema: { type: 'integer' }, example: 1024 },
          { name: 'fecha_inicio', in: 'query', required: false, schema: { type: 'string', format: 'date' }, example: '2026-07-01' },
          { name: 'fecha_fin', in: 'query', required: false, schema: { type: 'string', format: 'date' }, example: '2026-07-31' },
          { name: 'id_cajero', in: 'query', required: false, schema: { type: 'integer' }, example: 3 }
        ],
        responses: {
          200: exito('Lista de ventas que cumplen los filtros.', [{ id_venta: 12, folio: 1024, total: 232, estado: 'completada' }]),
          401: respuestasComunes.Unauthorized
        }
      },
      post: {
        tags: ['Ventas'],
        summary: 'Registra una venta (cobro)',
        description:
          'HU-06, HU-08. Cajero o administrador. Requiere una apertura de caja activa del cajero (RN-02); si no hay, ' +
          'responde 409. Los precios se recalculan siempre desde el catálogo (nunca se confía en el precio enviado por el cliente). ' +
          'Si el descuento de cualquier línea, o el descuento general, excede `descuento_maximo_cajero` (RN-04), se exige ' +
          '`pin_autorizacion` de un administrador válido; de lo contrario responde 403.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['carrito', 'pagos'],
                properties: {
                  carrito: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['id_producto', 'cantidad'],
                      properties: {
                        id_producto: { type: 'integer', example: 10 },
                        cantidad: { type: 'number', example: 2 },
                        descuento: { type: 'number', default: 0, example: 0, description: 'Monto en pesos, no porcentaje' }
                      }
                    }
                  },
                  pagos: {
                    type: 'array',
                    minItems: 1,
                    description: 'Más de un elemento = pago mixto',
                    items: {
                      type: 'object',
                      required: ['forma_pago', 'monto'],
                      properties: {
                        forma_pago: { type: 'string', enum: ['efectivo', 'tarjeta', 'transferencia'] },
                        monto: { type: 'number', example: 232 }
                      }
                    }
                  },
                  descuento_general: { type: 'number', default: 0, example: 0, description: 'Descuento en pesos a toda la venta' },
                  pin_autorizacion: { type: 'string', example: '0000', description: 'PIN de administrador, solo si algún descuento excede el máximo' }
                }
              },
              examples: {
                ventaSimple: {
                  summary: 'Venta de un producto, pago en efectivo exacto',
                  value: {
                    carrito: [{ id_producto: 10, cantidad: 2, descuento: 0 }],
                    pagos: [{ forma_pago: 'efectivo', monto: 232 }]
                  }
                },
                pagoMixto: {
                  summary: 'Pago mixto (efectivo + tarjeta)',
                  value: {
                    carrito: [{ id_producto: 10, cantidad: 1, descuento: 0 }],
                    pagos: [
                      { forma_pago: 'efectivo', monto: 100 },
                      { forma_pago: 'tarjeta', monto: 32 }
                    ]
                  }
                }
              }
            }
          }
        },
        responses: {
          201: exito('Venta registrada; el cambio ya viene calculado.', {
            id: 12,
            folio: 1024,
            subtotal: 200,
            iva: 32,
            descuento: 0,
            total: 232,
            cambio: 0,
            pagos: [{ forma_pago: 'efectivo', monto: 232 }]
          }, { $ref: '#/components/schemas/VentaCreada' }),
          400: errorResponse(
            'Body inválido, o la suma de los pagos no cubre el total.',
            'Monto insuficiente. Falta $32.00'
          ),
          401: respuestasComunes.Unauthorized,
          403: errorResponse(
            'El descuento excede el máximo permitido y no se envió un pin_autorizacion válido.',
            'El descuento excede el límite permitido. Se requiere autorización de un administrador'
          ),
          404: errorResponse('Alguno de los id_producto del carrito no existe o está inactivo.', 'El producto 10 no existe o no está disponible'),
          409: errorResponse(
            'No hay caja abierta (RN-02) o no hay stock suficiente (RN-06).',
            'Debe registrar el fondo para abrir una nueva caja'
          )
        }
      }
    },
    '/api/v1/ventas/{id}': {
      get: {
        tags: ['Ventas'],
        summary: 'Obtiene el ticket completo de una venta',
        description: 'Usa la vista `v_ticket`: una fila por producto de la venta, todas con los datos de cabecera repetidos.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 12 }],
        responses: {
          200: exito('Líneas del ticket.', [
            {
              id_venta: 12,
              folio: 1024,
              cajero: 'Administrador',
              nombre_producto: 'Mascarilla de papaya',
              cantidad: 2,
              subtotal_linea: 200,
              iva_linea: 32,
              total: 232
            }
          ], { type: 'array', items: { $ref: '#/components/schemas/TicketLinea' } }),
          401: respuestasComunes.Unauthorized,
          404: errorResponse('La venta no existe.', 'La venta no existe')
        }
      }
    },
    '/api/v1/ventas/{id}/reimprimir': {
      post: {
        tags: ['Ventas'],
        summary: 'Reimprime el ticket de una venta',
        description:
          'HU-09. Siempre permitida (incluso con más de 24 h), pero cada llamada queda registrada en el log de auditoría ' +
          'con acción `REIMPRESION`.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 12 }],
        responses: {
          200: exito('Mismas líneas de ticket que GET /ventas/{id}; el frontend agrega la leyenda "REIMPRESIÓN".', [
            { id_venta: 12, folio: 1024, nombre_producto: 'Mascarilla de papaya', total: 232 }
          ]),
          401: respuestasComunes.Unauthorized,
          404: errorResponse('La venta no existe.', 'La venta no existe')
        }
      }
    },
    '/api/v1/ventas/{id}/cancelar': {
      post: {
        tags: ['Ventas'],
        summary: 'Cancela una venta ya cobrada',
        description:
          'HU-07. Cajero o administrador, pero SIEMPRE requiere `pin_autorizacion` de un administrador válido, ' +
          'independientemente de quién haga la petición. Revierte el stock de cada línea y queda registrada en auditoría.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 12 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['motivo_cancelacion', 'pin_autorizacion'],
                properties: {
                  motivo_cancelacion: { type: 'string', example: 'El cliente se arrepintió de la compra' },
                  pin_autorizacion: { type: 'string', example: '0000' }
                }
              }
            }
          }
        },
        responses: {
          200: exito('Venta cancelada; incluye los datos de cancelación.', {
            id_venta: 12,
            estado: 'cancelada',
            motivo_cancelacion: 'El cliente se arrepintió de la compra'
          }),
          400: respuestasComunes.ValidationError,
          401: respuestasComunes.Unauthorized,
          403: errorResponse(
            'No se envió pin_autorizacion o no corresponde a un administrador activo.',
            'Se requiere el PIN de un administrador para cancelar la venta'
          ),
          404: errorResponse('La venta no existe.', 'La venta no existe'),
          409: errorResponse('La venta ya estaba cancelada previamente.', 'La venta ya se encuentra cancelada')
        }
      }
    },

    '/api/v1/inventario/stock-bajo': {
      get: {
        tags: ['Inventario'],
        summary: 'Lista productos con stock igual o por debajo del mínimo',
        description: 'HU-11. Equivalente a `/productos/stock-bajo` (mismo dato, ruta duplicada por conveniencia del módulo de inventario).',
        responses: {
          200: exito('Productos en stock bajo (vacío si ninguno).', [
            { id_producto: 10, sku: '001', nombre: 'Mascarilla de papaya', stock_actual: 0, stock_minimo: 5 }
          ]),
          401: respuestasComunes.Unauthorized
        }
      }
    },
    '/api/v1/inventario/movimientos': {
      get: {
        tags: ['Inventario'],
        summary: 'Lista el historial de movimientos de inventario',
        description: 'HU-12. Filtros combinables.',
        parameters: [
          { name: 'id_producto', in: 'query', required: false, schema: { type: 'integer' }, example: 10 },
          {
            name: 'tipo',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            example: 'ajuste_positivo,ajuste_negativo',
            description: 'Uno o varios tipos separados por coma: entrada, venta, ajuste_positivo, ajuste_negativo'
          }
        ],
        responses: {
          200: exito('Movimientos ordenados del más reciente al más antiguo.', [
            { fecha_hora: '2026-07-01T19:21:36Z', cantidad: 10, motivo: 'Reposición', tipo: 'entrada', id_producto: 10, nombre_usuario: 'Administrador' }
          ], { type: 'array', items: { $ref: '#/components/schemas/MovimientoInventario' } }),
          401: respuestasComunes.Unauthorized
        }
      }
    },
    '/api/v1/inventario/entradas': {
      post: {
        tags: ['Inventario'],
        summary: 'Registra una entrada de mercancía',
        description: 'HU-10. Cajero o administrador. Incrementa `stock_actual` y guarda el costo unitario de esa entrada.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id_producto', 'cantidad'],
                properties: {
                  id_producto: { type: 'integer', example: 10 },
                  cantidad: { type: 'number', example: 20, description: 'Debe ser mayor a 0' },
                  costo_unitario: { type: 'number', example: 100 },
                  motivo: { type: 'string', default: 'Entrada de mercancía', example: 'Compra a proveedor Acme' }
                }
              }
            }
          }
        },
        responses: {
          201: exito('Entrada registrada; retorna el nuevo stock.', { stock_actual: 28 }),
          400: errorResponse('cantidad <= 0 u otro dato inválido.', 'Datos inválidos: cantidad: La cantidad debe ser mayor a cero'),
          401: respuestasComunes.Unauthorized,
          404: errorResponse('El producto no existe.', 'El producto no existe')
        }
      }
    },
    '/api/v1/inventario/ajustes': {
      post: {
        tags: ['Inventario'],
        summary: 'Registra un ajuste manual de inventario (merma, robo, muestra, corrección)',
        description:
          'HU-12. Solo administrador. `motivo` es obligatorio. Si el ajuste negativo dejaría el stock por debajo de 0, ' +
          'responde 409 pidiendo confirmación explícita; reenviar con `confirmar: true` para forzarlo (RN-06).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id_producto', 'cantidad', 'tipo', 'motivo'],
                properties: {
                  id_producto: { type: 'integer', example: 10 },
                  cantidad: { type: 'number', example: 2 },
                  tipo: { type: 'string', enum: ['ajuste_positivo', 'ajuste_negativo'], example: 'ajuste_negativo' },
                  motivo: { type: 'string', example: 'Producto caducado' },
                  confirmar: { type: 'boolean', default: false, example: false }
                }
              }
            }
          }
        },
        responses: {
          201: exito('Ajuste registrado; retorna el nuevo stock.', { stock_actual: 6 }),
          400: errorResponse('Falta el motivo, o cantidad <= 0.', 'Datos inválidos: motivo: El motivo es obligatorio'),
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden,
          404: errorResponse('El producto no existe.', 'El producto no existe'),
          409: errorResponse(
            'El ajuste dejaría el stock en negativo y no se envió confirmar: true.',
            'Este ajuste dejaría el stock en un valor negativo (stock actual: 2). Confirme para continuar.'
          )
        }
      }
    },

    '/api/v1/caja/apertura': {
      post: {
        tags: ['Caja'],
        summary: 'Abre la caja del turno (fondo inicial)',
        description:
          'HU-13. Cajero o administrador. RN-02: sin una apertura activa no se pueden registrar ventas. ' +
          'Si ya existe una apertura de OTRO turno sin cerrar, exige `pin_autorizacion` de un administrador (409 si falta).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fondo_inicial'],
                properties: {
                  fondo_inicial: { type: 'number', example: 1000, description: 'No puede ser negativo' },
                  pin_autorizacion: { type: 'string', example: '0000', description: 'Solo si ya hay una apertura de un turno anterior' }
                }
              }
            }
          }
        },
        responses: {
          201: exito('Caja abierta.', {
            id_apertura: 1,
            id_usuario: 3,
            fondo_inicial: 1000,
            fecha_apertura: '2026-07-01T19:34:08Z',
            estado: 'abierta'
          }, { $ref: '#/components/schemas/AperturaCaja' }),
          400: respuestasComunes.ValidationError,
          401: respuestasComunes.Unauthorized,
          409: errorResponse(
            'Ya tiene una apertura propia en curso, o hay una ajena y no se autorizó con PIN de administrador.',
            'Existe una apertura de caja de un turno anterior. Se requiere autorización de un administrador'
          )
        }
      }
    },
    '/api/v1/caja/apertura/actual': {
      get: {
        tags: ['Caja'],
        summary: 'Obtiene la apertura de caja activa del usuario autenticado',
        responses: {
          200: exito('Apertura activa.', { id_apertura: 1, fondo_inicial: 1000, estado: 'abierta' }, {
            $ref: '#/components/schemas/AperturaCaja'
          }),
          401: respuestasComunes.Unauthorized,
          404: errorResponse('No hay una apertura de caja activa para este usuario.', 'No hay una apertura de caja activa para este usuario')
        }
      }
    },
    '/api/v1/caja/corte-x': {
      get: {
        tags: ['Caja'],
        summary: 'Genera un corte parcial (corte X)',
        description: 'HU-14. No cierra la caja ni afecta el estado operativo; puede llamarse cuantas veces se quiera durante el turno.',
        responses: {
          200: exito('Resumen del turno hasta el momento.', {
            id_apertura_caja: 1,
            fondo_inicial: 1000,
            total_ventas: 360,
            num_transacciones: 1,
            desglose_por_forma_pago: { efectivo: 360 }
          }, { $ref: '#/components/schemas/ResumenCorteX' }),
          401: respuestasComunes.Unauthorized,
          404: errorResponse('No hay una apertura de caja activa para este usuario.', 'No hay una apertura de caja activa para este usuario')
        }
      }
    },
    '/api/v1/caja/corte-z': {
      post: {
        tags: ['Caja'],
        summary: 'Genera el corte final (corte Z) y cierra el turno',
        description:
          'HU-15, RN-05. Cierre definitivo: no se puede reabrir ni modificar. Calcula `efectivo_esperado` ' +
          '(fondo inicial + ventas en efectivo) y la `diferencia` contra `efectivo_declarado`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['efectivo_declarado'],
                properties: { efectivo_declarado: { type: 'number', example: 1360, description: 'Efectivo físico contado en caja' } }
              }
            }
          }
        },
        responses: {
          201: exito('Corte Z generado; la apertura queda en estado cerrada.', {
            id_corte: 5,
            tipo: 'Z',
            fondo_inicial: 1000,
            efectivo_esperado: 1360,
            efectivo_declarado: 1360,
            diferencia: 0
          }, { $ref: '#/components/schemas/CorteZ' }),
          400: respuestasComunes.ValidationError,
          401: respuestasComunes.Unauthorized,
          404: errorResponse('No hay una apertura de caja activa para este usuario.', 'No hay una apertura de caja activa para este usuario'),
          409: errorResponse('Ya se generó el corte Z para esta apertura (no se puede repetir, RN-05).', 'Ya se generó el corte Z para esta apertura de caja')
        }
      }
    },

    '/api/v1/auditoria': {
      get: {
        tags: ['Auditoría'],
        summary: 'Lista el log de auditoría (últimos 500 registros)',
        description:
          'Solo administrador (sección 5.3 del spec: el cajero no puede ver ni modificar el log). ' +
          'No existen endpoints de edición o borrado: el log es inmutable por diseño.',
        responses: {
          200: exito('Registros más recientes primero.', [
            {
              id_log: 41,
              accion: 'CANCELACION_VENTA',
              descripcion: 'Venta 12 cancelada por autorización de admin: cliente se arrepintió',
              tabla_afectada: 'ventas',
              id_registro: 12,
              fecha_hora: '2026-07-02T10:00:00Z',
              usuarios: { nombre: 'Administrador' }
            }
          ], { type: 'array', items: { $ref: '#/components/schemas/LogAuditoria' } }),
          401: respuestasComunes.Unauthorized,
          403: respuestasComunes.Forbidden
        }
      }
    }
  }
};
