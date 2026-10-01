import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { despesa } from "@/db/schema/despesa";
import { and, count, desc, eq, gte, lte, SQL } from "drizzle-orm";
import { ok, readJson, readQuery } from "@/lib/https";
import { requireUser } from "@/lib/auth/guard";
import { filtroTexto } from "@/lib/utils/busca";
import {
  createDespesaSchema,
  DespesaSelect,
  listDespesasQuerySchema,
} from "@/lib/validator/despesaValidator";

export async function GET(req: NextRequest) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  const { data: q, error } = readQuery(req, listDespesasQuerySchema);
  if (error || !q) return error!;

  // O usuarioId vem sempre da sessão; o que o cliente enviar é ignorado.
  const where: SQL[] = [eq(despesa.usuarioId, userId)];
  if (q.categoria) where.push(eq(despesa.categoria, q.categoria));
  if (q.status) where.push(eq(despesa.status, q.status));
  if (q.texto) where.push(filtroTexto(q.texto, despesa.descricao, despesa.observacoes));
  if (q.dataInicial) where.push(gte(despesa.data, q.dataInicial));
  if (q.dataFinal) where.push(lte(despesa.data, q.dataFinal));

  const predicate = where.length ? and(...where) : undefined;
  const offset = (q.page - 1) * q.pageSize;

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(despesa)
      .where(predicate)
      .orderBy(desc(despesa.data))
      .limit(q.pageSize)
      .offset(offset),
    db.select({ count: count() }).from(despesa).where(predicate),
  ]);

  const total = Number(totalRow[0]?.count ?? 0);
  return NextResponse.json({
    data: rows as DespesaSelect[],
    meta: { page: q.page, pageSize: q.pageSize, total },
  });
}

export async function POST(req: NextRequest) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  const { data, error } = await readJson(req, createDespesaSchema);
  if (error || !data) return error!;

  const [row] = await db
    .insert(despesa)
    .values({
      ...data,
      usuarioId: userId,
      valor: Number(data.valor),
      observacoes: data.observacoes ?? null,
    })
    .returning();

  return ok(row, { status: 201 });
}
