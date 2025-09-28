import { NextRequest } from "next/server";
import { db } from "@/db/connection";
import { receita } from "@/db/schema/receita";
import { eq } from "drizzle-orm";
import { updateReceitaSchema } from "@/lib/validator/receitaValidator";
import { badRequest, notFound, ok, parseId, readJson } from "@/lib/https";
import { renderReceita } from "@/lib/adapters/receita.adapter";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const id = parseId(params.id);
    if (!id) return badRequest("Invalid id");

    const [row] = await db.select().from(receita).where(eq(receita.id, id)).limit(1);
    if (!row) return notFound();
    return ok(renderReceita(row));
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const id = parseId(params.id);
    if (!id) return badRequest("Invalid id");

    const { data, error } = await readJson(req, updateReceitaSchema);
    if (error || !data) return error!;

    const [row] = await db
        .update(receita)
        .set({
            ...data,
            observacoes: data.observacoes ?? null,
        })
        .where(eq(receita.id, id))
        .returning();

    if (!row) return notFound();
    return ok(renderReceita(row));
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const id = parseId(params.id);
    if (!id) return badRequest("Invalid id");

    const [row] = await db.delete(receita).where(eq(receita.id, id)).returning();
    if (!row) return notFound();
    return ok(renderReceita(row));
}
