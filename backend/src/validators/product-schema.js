import { z } from 'zod';

const productSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  codigo_barras: z.string().optional().nullable(),
  id_categoria: z.number().int().positive().optional().nullable(),
  unidad_medida: z.string().min(1, 'La unidad de medida es obligatoria'),
  precio_venta: z.number().positive('El precio de venta debe ser mayor a 0'),
  costo_unitario: z.number().nonnegative('El costo no puede ser negativo').optional().default(0),
  stock_actual: z.number().nonnegative('El stock no puede ser negativo').optional().default(0),
  stock_minimo: z.number().int().min(1, 'El stock mínimo debe ser al menos 1'),
});

const productUpdateSchema = productSchema.partial();

const productDeactivateSchema = z.object({
  confirmar: z.boolean().optional().default(false),
});

export { productSchema, productUpdateSchema, productDeactivateSchema };
