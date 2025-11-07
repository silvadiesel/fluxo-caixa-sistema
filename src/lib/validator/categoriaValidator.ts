import { z } from "zod";

export const createCategoriaSchema = z.object({
  usuarioId: z.number().int().positive(),
  natureza: z.enum(["despesa", "receita"]),
  nome: z.string().min(1).max(100),
});

export const updateCategoriaSchema = z
  .object({
    nome: z.string().min(1).max(100).optional(),
    ativo: z.boolean().optional(),
  })
  .refine((data) => data.nome !== undefined || data.ativo !== undefined, {
    message: "Pelo menos um campo deve ser fornecido para atualização",
  });

export const listCategoriasQuerySchema = z.object({
  usuarioId: z.coerce.number().int().positive(),
  natureza: z.enum(["despesa", "receita"]).optional(),
  incluirInativas: z.coerce.boolean().optional().default(false),
});

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
export type ListCategoriasQuery = z.infer<typeof listCategoriasQuerySchema>;
