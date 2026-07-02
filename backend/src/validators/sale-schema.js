import { z } from 'zod';

const saleItemSchema = z.object({
  id_producto: z.number().int().positive('id_producto inválido'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  descuento: z.number().nonnegative('El descuento no puede ser negativo').optional().default(0),
});

const paymentSchema = z.object({
  forma_pago: z.enum(['efectivo', 'tarjeta', 'transferencia'], {
    errorMap: () => ({ message: 'forma_pago debe ser efectivo, tarjeta o transferencia' }),
  }),
  monto: z.number().positive('El monto del pago debe ser mayor a 0'),
});

const saleSchema = z.object({
  carrito: z.array(saleItemSchema).min(1, 'El carrito no puede estar vacío'),
  pagos: z.array(paymentSchema).min(1, 'Debe incluir al menos una forma de pago'),
  descuento_general: z.number().nonnegative().optional().default(0),
  pin_autorizacion: z.string().optional(),
});

const cancelSaleSchema = z.object({
  motivo_cancelacion: z.string().min(1, 'El motivo de cancelación es obligatorio'),
  pin_autorizacion: z.string().min(1, 'Se requiere el PIN de un administrador'),
});

export { saleItemSchema, paymentSchema, saleSchema, cancelSaleSchema };
