import { calcularDre } from "@/lib/hooks/useCalcDre";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { user } from "@/db/schema/user";
import { eq } from "drizzle-orm";
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
    margemOperacional: calcularMargem(
      dre.resultadoOperacional,
      dre.receitaLiquida
    ),
    margemLiquida: calcularMargem(dre.lucro, dre.receitaLiquida),
  };

  // Calcular evolução mensal dos últimos 6 meses usando o mesmo cálculo do DRE
  const hoje = dayjs();
  const evolucaoMensalPromises = [];

  // Calcular DRE para cada um dos últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const mes = hoje.subtract(i, "month");
    const dataInicialMes = mes.startOf("month").format("YYYY-MM-DD");
    const dataFinalMes = mes.endOf("month").format("YYYY-MM-DD");
    const chave = mes.format("YYYY-MM");

    evolucaoMensalPromises.push(
      calcularDre({
        usuarioId,
        dataInicial: dataInicialMes,
        dataFinal: dataFinalMes,
      }).then((dreMes) => {
        const [ano] = chave.split("-");
        const mesObj = dayjs(chave + "-01").locale("pt-br");
        return {
          mes: mesObj.format("MMM"),
          ano: ano,
          receitas: dreMes.receitaBruta,
          despesas:
            dreMes.deducoes.imposto +
            dreMes.custoServicos.total +
            dreMes.despesasOperacionais.total +
            dreMes.despesasFinanceiras.total,
          lucro: dreMes.lucro,
        };
      })
    );
  }

  const evolucaoMensal = await Promise.all(evolucaoMensalPromises);

  return NextResponse.json({ dre, indicadores, evolucaoMensal });
}
