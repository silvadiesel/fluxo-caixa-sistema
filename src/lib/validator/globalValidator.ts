import { z } from "zod";
export const moneyString = z.coerce
    .number()
    .nonnegative()
    .transform((n) => n.toFixed(2));

export const dateYMD = z.coerce.date().transform((d: Date) => d.toISOString().slice(0, 10));

export const statusEnum = z.enum(["pago", "pendente", "cancelado"]);
