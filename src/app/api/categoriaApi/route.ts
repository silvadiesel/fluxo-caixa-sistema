import { NextRequest } from "next/server";
import { db } from "@/db/connection";
import { categorias } from "@/db/schema/categorias";
import { and, eq, SQL } from "drizzle-orm";
import { badRequest, ok, readJson, readQuery } from "@/lib/https";
import {
  createCategoriaSchema,
  listCategoriasQuerySchema,
} from "@/lib/validator/categoriaValidator";
import { normalizeCategoriaNome } from "@/lib/utils/normalizeCategoria";

export async function GET(req: NextRequest) {
  const { data: q, error } = readQuery(req, listCategoriasQuerySchema);
  if (error || !q) return error!;

  const where: SQL[] = [];
  where.push(eq(categorias.usuarioId, q.usuarioId));

  if (q.natureza) {
    where.push(eq(categorias.natureza, q.natureza));
  }

  if (!q.incluirInativas) {
    where.push(eq(categorias.ativo, true));
  }

  const predicate = and(...where);

  const rows = await db
    .select()
    .from(categorias)
    .where(predicate)
    .orderBy(categorias.nome);

  return ok(rows);
}

export async function POST(req: NextRequest) {
  const { data, error } = await readJson(req, createCategoriaSchema);
  if (error || !data) return error!;

  // Normalizar o nome
  const nomeNormalizado = normalizeCategoriaNome(data.nome);

  if (!nomeNormalizado) {
    return badRequest("Nome da categoria não pode estar vazio");
  }

  try {
    // Verificar se já existe categoria com mesmo nome e natureza para o usuário
    const [existing] = await db
      .select()
      .from(categorias)
      .where(
        and(
          eq(categorias.usuarioId, data.usuarioId),
          eq(categorias.natureza, data.natureza),
          eq(categorias.nome, nomeNormalizado)
        )
      )
      .limit(1);

    if (existing) {
      return badRequest("Categoria já existe");
    }

    const [row] = await db
      .insert(categorias)
      .values({
        usuarioId: data.usuarioId,
        natureza: data.natureza,
        nome: nomeNormalizado,
        ativo: true,
      })
      .returning();

    return ok(row, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar categoria:", err);
    // Verificar se é erro de constraint única
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return badRequest("Categoria já existe");
    }
    return badRequest("Erro ao criar categoria");
  }
}
