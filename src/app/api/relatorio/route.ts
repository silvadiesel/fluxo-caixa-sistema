import { calcularDre } from "@/lib/hooks/useCalcDre";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { user } from "@/db/schema/user";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const usuarioId = Number(url.searchParams.get("usuarioId"));
  const dataInicial = url.searchParams.get("dataInicial");
  const dataFinal = url.searchParams.get("dataFinal");

  if (!usuarioId || !dataInicial || !dataFinal) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  const [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, usuarioId))
    .limit(1);

  if (!currentUser) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  const dre = await calcularDre({
    usuarioId,
    dataInicial,
    dataFinal,
  });

  return NextResponse.json({ dre });
}
