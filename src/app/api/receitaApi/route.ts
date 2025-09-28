import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { receita } from "@/db/schema/receita";
import { and, count, desc, eq, gte, ilike, lte, SQL } from "drizzle-orm";
import { createReceitaSchema, listReceitasQuerySchema } from "@/lib/validator/receitaValidator";
import { readJson, readQuery, ok } from "@/lib/https";
import { renderReceitas } from "@/lib/adapters/receita.adapter";
export async function GET(req: NextRequest) {
    const { data: q, error } = readQuery(req, listReceitasQuerySchema);
    if (error || !q) return error!;

    const where: SQL[] = [];
    if (q.usuarioId !== undefined) where.push(eq(receita.usuarioId, q.usuarioId));
    if (q.categoria) where.push(ilike(receita.categoria, `%${q.categoria}%`));
    if (q.status) where.push(eq(receita.status, q.status));
    if (q.texto) where.push(ilike(receita.descricao, `%${q.texto}%`));
    if (q.dataInicial) where.push(gte(receita.data, q.dataInicial));
    if (q.dataFinal) where.push(lte(receita.data, q.dataFinal));

    const predicate = where.length ? and(...where) : undefined;
    const offset = (q.page - 1) * q.pageSize;

    const [rows, totalRow] = await Promise.all([
        db
            .select()
            .from(receita)
            .where(predicate)
            .orderBy(desc(receita.data))
            .limit(q.pageSize)
            .offset(offset),
        db.select({ count: count() }).from(receita).where(predicate),
    ]);

    const total = Number(totalRow[0]?.count ?? 0);
    return NextResponse.json({
        data: renderReceitas(rows),
        meta: { page: q.page, pageSize: q.pageSize, total },
    });
}

export async function POST(req: NextRequest) {
    const { data, error } = await readJson(req, createReceitaSchema);
    if (error || !data) return error!;

    const [row] = await db
        .insert(receita)
        .values({
            ...data,
            observacoes: data.observacoes ?? null,
        })
        .returning();

    return ok(row, { status: 201 });
}
