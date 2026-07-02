import { z } from 'zod';

const cashOpenSchema = z.object({
  fondo_inicial: z.number().nonnegative('El fondo inicial no puede ser negativo'),
  pin_autorizacion: z.string().optional(),
});

const cashCloseZSchema = z.object({
  efectivo_declarado: z.number().nonnegative('El efectivo declarado no puede ser negativo'),
});

export { cashOpenSchema, cashCloseZSchema };
