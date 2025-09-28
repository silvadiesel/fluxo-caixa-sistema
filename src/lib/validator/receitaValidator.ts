import { z } from "zod";
import { moneyString, dateYMD, statusEnum } from "./globalValidator";
import type { receita as receitaTable } from "@/db/schema/receita";

export const createReceitaSchema = z
    .object({
        descricao: z.string().min(1),
        categoria: z.string().min(1),
        valor: moneyString,
        data: dateYMD,
        status: statusEnum,
        observacoes: z.string().nullish(),
        usuarioId: z.coerce.number().int().positive(),
    })
    .strict();

export const updateReceitaSchema = createReceitaSchema.partial().strict();

export const listReceitasQuerySchema = z
    .object({
        usuarioId: z.coerce.number().int().positive().optional(),
        dataInicial: z.string().optional(),
        dataFinal: z.string().optional(),
        categoria: z.string().optional(),
        texto: z.string().optional(),
        status: statusEnum.optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict();

export type ReceitaInsert = typeof receitaTable.$inferInsert;
export type ReceitaSelect = typeof receitaTable.$inferSelect;
