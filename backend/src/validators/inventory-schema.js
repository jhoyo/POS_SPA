import { z } from 'zod';

const inventoryEntrySchema = z.object({
  id_producto: z.number().int().positive('id_producto inválido'),
  cantidad: z.number().positive('La cantidad debe ser mayor a cero'),
  costo_unitario: z.number().nonnegative('El costo unitario no puede ser negativo').optional(),
  motivo: z.string().optional().default('Entrada de mercancía'),
});

const inventoryAdjustmentSchema = z.object({
  id_producto: z.number().int().positive('id_producto inválido'),
  cantidad: z.number().positive('La cantidad debe ser mayor a cero'),
  tipo: z.enum(['ajuste_positivo', 'ajuste_negativo'], {
    errorMap: () => ({ message: 'tipo debe ser ajuste_positivo o ajuste_negativo' }),
  }),
  motivo: z.string().min(1, 'El motivo es obligatorio'),
  confirmar: z.boolean().optional().default(false),
});

export { inventoryEntrySchema, inventoryAdjustmentSchema };
