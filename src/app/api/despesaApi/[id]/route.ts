import { NextRequest } from "next/server";
import { db } from "@/db/connection";
import { despesa } from "@/db/schema/despesa";
import { eq } from "drizzle-orm";
import { badRequest, notFound, ok, parseId, readJson } from "@/lib/https";
import { updateDespesaSchema } from "@/lib/validator/despesaValidator";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const id = parseId(params.id);
    if (!id) return badRequest("Invalid id");

    const [row] = await db.select().from(despesa).where(eq(despesa.id, id)).limit(1);
    if (!row) return notFound();
    return ok(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const id = parseId(params.id);
    if (!id) return badRequest("Invalid id");

    const { data, error } = await readJson(req, updateDespesaSchema);
    if (error || !data) return error!;

    const [row] = await db
        .update(despesa)
        .set({
            ...data,
            observacoes: data.observacoes ?? null,
        })
        .where(eq(despesa.id, id))
        .returning();

    if (!row) return notFound();
    return ok(row);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    const id = parseId(params.id);
    if (!id) return badRequest("Invalid id");

    const [row] = await db.delete(despesa).where(eq(despesa.id, id)).returning();
    if (!row) return notFound();
    return ok(row);
}
