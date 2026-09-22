import { NextRequest } from "next/server";
import { db } from "@/db/connection";
import { despesa } from "@/db/schema/despesa";
import { and, eq } from "drizzle-orm";
import { badRequest, notFound, ok, parseId, readJson } from "@/lib/https";
import { requireUser } from "@/lib/auth/guard";
import { updateDespesaSchema } from "@/lib/validator/despesaValidator";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { userId, error: authError } = await requireUser();
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) return badRequest("Invalid id");

    const [row] = await db.select().from(despesa)
        .where(and(eq(despesa.id, id), eq(despesa.usuarioId, userId)))
        .limit(1);
    if (!row) return notFound();
    return ok(row);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { userId, error: authError } = await requireUser();
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) return badRequest("Invalid id");

    const { data, error } = await readJson(req, updateDespesaSchema);
    if (error || !data) return error!;

    const [row] = await db
        .update(despesa)
        .set({
            ...data,
            valor: data.valor ? Number(data.valor) : undefined,
            observacoes: data.observacoes ?? null,
            usuarioId: userId,
        })
        .where(and(eq(despesa.id, id), eq(despesa.usuarioId, userId)))
        .returning();

    if (!row) return notFound();
    return ok(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { userId, error: authError } = await requireUser();
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) return badRequest("Invalid id");

    const [row] = await db.delete(despesa)
        .where(and(eq(despesa.id, id), eq(despesa.usuarioId, userId)))
        .returning();
    if (!row) return notFound();
    return ok(row);
}
