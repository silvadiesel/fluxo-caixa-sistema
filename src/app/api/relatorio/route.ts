import { calcularDre } from "@/lib/hooks/useCalcDre";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { user } from "@/db/schema/user";
import { receita } from "@/db/schema/receita";
import { despesa } from "@/db/schema/despesa";
import { and, eq, gte, lte } from "drizzle-orm";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

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

  // Calcular indicadores de performance
  const calcularMargem = (valor: number, receitaLiquida: number): number => {
    if (receitaLiquida === 0) return 0;
    return Number(((valor / receitaLiquida) * 100).toFixed(2));
  };

  const indicadores = {
    margemBruta: calcularMargem(dre.lucroBruto, dre.receitaLiquida),
    margemOperacional: calcularMargem(dre.resultadoOperacional, dre.receitaLiquida),
    margemLiquida: calcularMargem(dre.lucro, dre.receitaLiquida),
  };

  // Calcular evolução mensal dos últimos 6 meses
  const hoje = dayjs();
  const dataInicial6Meses = hoje.subtract(5, "month").startOf("month").format("YYYY-MM-DD");
  const dataFinal6Meses = hoje.endOf("month").format("YYYY-MM-DD");

  // Buscar receitas dos últimos 6 meses
  const receitas6Meses = await db
    .select({
      valor: receita.valor,
      data: receita.data,
    })
    .from(receita)
    .where(
      and(
        eq(receita.usuarioId, usuarioId),
        eq(receita.status, "pago"),
        gte(receita.data, dataInicial6Meses),
        lte(receita.data, dataFinal6Meses)
      )
    );

  // Buscar despesas dos últimos 6 meses
  const despesas6Meses = await db
    .select({
      valor: despesa.valor,
      data: despesa.data,
    })
    .from(despesa)
    .where(
      and(
        eq(despesa.usuarioId, usuarioId),
        eq(despesa.status, "pago"),
        gte(despesa.data, dataInicial6Meses),
        lte(despesa.data, dataFinal6Meses)
      )
    );

  // Agrupar por mês
  const mesesMap = new Map<string, { receitas: number; despesas: number }>();

  // Inicializar os últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const mes = hoje.subtract(i, "month");
    const chave = mes.format("YYYY-MM");
    mesesMap.set(chave, { receitas: 0, despesas: 0 });
  }

  // Somar receitas por mês
  receitas6Meses.forEach((r) => {
    const mes = dayjs(r.data).format("YYYY-MM");
    const atual = mesesMap.get(mes);
    if (atual) {
      atual.receitas += Number(r.valor) || 0;
    }
  });

  // Somar despesas por mês
  despesas6Meses.forEach((d) => {
    const mes = dayjs(d.data).format("YYYY-MM");
    const atual = mesesMap.get(mes);
    if (atual) {
      atual.despesas += Number(d.valor) || 0;
    }
  });

  // Converter para array no formato esperado
  const evolucaoMensal = Array.from(mesesMap.entries()).map(([chave, valores]) => {
    const [ano, mes] = chave.split("-");
    const mesObj = dayjs(chave + "-01").locale("pt-br");
    return {
      mes: mesObj.format("MMM"),
      ano: ano,
      receitas: valores.receitas,
      despesas: valores.despesas,
      lucro: valores.receitas - valores.despesas,
    };
  });

  return NextResponse.json({ dre, indicadores, evolucaoMensal });
}
