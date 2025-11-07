import { NextRequest } from "next/server";
import { db } from "@/db/connection";
import { categorias } from "@/db/schema/categorias";
import { and, eq } from "drizzle-orm";
import { despesa } from "@/db/schema/despesa";
import { receita } from "@/db/schema/receita";
import { badRequest, notFound, ok, parseId, readJson } from "@/lib/https";
import { updateCategoriaSchema } from "@/lib/validator/categoriaValidator";
import { normalizeCategoriaNome } from "@/lib/utils/normalizeCategoria";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) return badRequest("ID inválido");

    const { data, error } = await readJson(req, updateCategoriaSchema);
    if (error || !data) return error!;

    // Verificar se a categoria existe
    const [existing] = await db
      .select()
      .from(categorias)
      .where(eq(categorias.id, id))
      .limit(1);

    if (!existing) {
      return notFound();
    }

    const updateData: { nome?: string; ativo?: boolean } = {};

    if (data.nome !== undefined) {
      const nomeNormalizado = normalizeCategoriaNome(data.nome);
      if (!nomeNormalizado) {
        return badRequest("Nome da categoria não pode estar vazio");
      }

      // Verificar se já existe outra categoria com mesmo nome e natureza
      const allCategorias = await db
        .select()
        .from(categorias)
        .where(
          and(
            eq(categorias.usuarioId, existing.usuarioId),
            eq(categorias.natureza, existing.natureza),
            eq(categorias.nome, nomeNormalizado)
          )
        );

      const duplicate = allCategorias.find((cat) => cat.id !== id);

      if (duplicate) {
        return badRequest("Categoria já existe");
      }

      updateData.nome = nomeNormalizado;
    }

    if (data.ativo !== undefined) {
      updateData.ativo = data.ativo;
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("Nenhum campo para atualizar");
    }

    const [updated] = await db
      .update(categorias)
      .set(updateData)
      .where(eq(categorias.id, id))
      .returning();

    if (!updated) {
      return notFound();
    }

    return ok(updated);
  } catch (err) {
    console.error("Erro ao atualizar categoria:", err);
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return badRequest("Categoria já existe");
    }
    return badRequest(
      `Erro ao atualizar categoria: ${
        err instanceof Error ? err.message : "Erro desconhecido"
      }`
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) return badRequest("ID inválido");

    const [existing] = await db
      .select()
      .from(categorias)
      .where(eq(categorias.id, id))
      .limit(1);

    if (!existing) {
      return notFound();
    }

    // Verificar se há registros usando esta categoria

    const [despesasComCategoria] = await db
      .select()
      .from(despesa)
      .where(
        and(
          eq(despesa.usuarioId, existing.usuarioId),
          eq(despesa.categoria, existing.nome)
        )
      )
      .limit(1);

    const [receitasComCategoria] = await db
      .select()
      .from(receita)
      .where(
        and(
          eq(receita.usuarioId, existing.usuarioId),
          eq(receita.categoria, existing.nome)
        )
      )
      .limit(1);

    if (despesasComCategoria || receitasComCategoria) {
      return badRequest(
        "Não é possível deletar esta categoria pois ela está sendo usada em despesas ou receitas"
      );
    }

    // Deletar permanentemente
    const [deleted] = await db
      .delete(categorias)
      .where(eq(categorias.id, id))
      .returning();

    if (!deleted) {
      return notFound();
    }

    return ok(deleted);
  } catch (err) {
    console.error("Erro ao deletar categoria:", err);
    return badRequest(
      `Erro ao deletar categoria: ${
        err instanceof Error ? err.message : "Erro desconhecido"
      }`
    );
  }
}
