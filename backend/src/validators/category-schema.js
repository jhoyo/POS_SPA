import { z } from 'zod';

const categorySchema = z.object({
  nombre: z.string().min(1, 'El nombre de la categoría es obligatorio'),
});

export { categorySchema };
