import { z } from 'zod';

const userSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  usuario: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  pin: z.string().regex(/^\d{4,6}$/, 'El PIN debe tener entre 4 y 6 dígitos numéricos'),
  rol: z.enum(['administrador', 'cajero', 'esteticista'], {
    errorMap: () => ({ message: 'El rol debe ser administrador, cajero o esteticista' }),
  }),
});

const userUpdateSchema = userSchema.partial();

const loginSchema = z.object({
  usuario: z.string().min(1, 'El usuario es obligatorio'),
  pin: z.string().min(1, 'El PIN es obligatorio'),
});

export { userSchema, userUpdateSchema, loginSchema };
