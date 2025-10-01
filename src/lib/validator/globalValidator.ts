import { z } from "zod";
export const moneyString = z.coerce
    .number()
    .nonnegative()
    .transform((n) => n.toFixed(2));

export const dateYMD = z.coerce.date().transform((d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
});

export const statusEnum = z.enum(["pago", "pendente", "cancelado"]);
