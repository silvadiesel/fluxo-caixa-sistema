import { db } from "@/db/connection";
import { receita } from "@/db/schema/receita";
import { despesa } from "@/db/schema/despesa";
import { categorias } from "@/db/schema/categorias";
import { and, eq, gte, lte } from "drizzle-orm";

export interface DreResultado {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custoProdutos: number;
  lucroBruto: number;
  despesasOperacionais: {
    vendas: number;
    administrativas: number;
    financeiras: number;
    total: number;
  };
  lucroOperacional: number;
  receitasFinanceiras: number;
  outrasReceitas: number;
  outrasDespesas: number;
  lucroAntesImposto: number;
  impostoRenda: number;
  lucroLiquido: number;
}

interface CalcularDreParams {
  usuarioId: number;
  dataInicial: string; // "YYYY-MM-DD"
  dataFinal: string; // "YYYY-MM-DD"
}

export async function calcularDre({
  usuarioId,
  dataInicial,
  dataFinal,
}: CalcularDreParams): Promise<DreResultado> {
  const receitas = await db
    .select({
      valor: receita.valor,
      dreGrupo: categorias.dreGrupo,
      dreSubgrupo: categorias.dreSubgrupo,
    })
    .from(receita)
    .leftJoin(
      categorias,
      and(
        eq(categorias.usuarioId, receita.usuarioId),
        eq(categorias.natureza, "receita"),
        eq(categorias.nome, receita.categoria)
      )
    )
    .where(
      and(
        eq(receita.usuarioId, usuarioId),
        gte(receita.data, dataInicial),
        lte(receita.data, dataFinal)
      )
    );

  const despesas = await db
    .select({
      valor: despesa.valor,
      dreGrupo: categorias.dreGrupo,
      dreSubgrupo: categorias.dreSubgrupo,
    })
    .from(despesa)
    .leftJoin(
      categorias,
      and(
        eq(categorias.usuarioId, despesa.usuarioId),
        eq(categorias.natureza, "despesa"),
        eq(categorias.nome, despesa.categoria)
      )
    )
    .where(
      and(
        eq(despesa.usuarioId, usuarioId),
        gte(despesa.data, dataInicial),
        lte(despesa.data, dataFinal)
      )
    );

  const sum = (nums: (number | null | undefined)[]) =>
    nums.reduce((acc, n) => (acc ?? 0) + (n ?? 0), 0);

  const receitaBruta = sum(
    receitas.filter((r) => r.dreGrupo === "RECEITA_BRUTA").map((r) => r.valor)
  );

  const deducoes = sum(
    despesas
      .filter((d) => d.dreGrupo === "IMPOSTO_SOBRE_RECEITA")
      .map((d) => d.valor)
  );

  const receitaLiquida = (receitaBruta ?? 0) - (deducoes ?? 0);

  const custoProdutos = sum(
    despesas
      .filter((d) => d.dreGrupo === "CUSTO_PRODUTO_SERVICO")
      .map((d) => d.valor)
  );

  const lucroBruto = receitaLiquida - (custoProdutos ?? 0);

  const despesasOperacionaisTotal =
    sum(
      despesas
        .filter((d) => d.dreGrupo === "DESPESA_OPERACIONAL")
        .map((d) => d.valor)
    ) ?? 0;

  const despesasOperacionais = {
    vendas: 0,
    administrativas: despesasOperacionaisTotal,
    financeiras: 0,
    total: despesasOperacionaisTotal,
  };

  const lucroOperacional = lucroBruto - (despesasOperacionais.total ?? 0);

  const despesasFinanceirasTotal = sum(
    despesas
      .filter((d) => d.dreGrupo === "DESPESA_FINANCEIRA")
      .map((d) => d.valor)
  );

  const receitasFinanceiras = 0;
  const outrasReceitas = 0;
  const outrasDespesas = despesasFinanceirasTotal;

  const lucroAntesImposto = lucroOperacional - (outrasDespesas ?? 0);

  const impostoRenda = 0;
  const lucroLiquido = lucroAntesImposto - impostoRenda;

  return {
    receitaBruta: receitaBruta ?? 0,
    deducoes: deducoes ?? 0,
    receitaLiquida: receitaLiquida ?? 0,
    custoProdutos: custoProdutos ?? 0,
    lucroBruto: lucroBruto ?? 0,
    despesasOperacionais: despesasOperacionais ?? 0,
    lucroOperacional: lucroOperacional ?? 0,
    receitasFinanceiras,
    outrasReceitas: outrasReceitas ?? 0,
    outrasDespesas: outrasDespesas ?? 0,
    lucroAntesImposto,
    impostoRenda: impostoRenda ?? 0,
    lucroLiquido: lucroLiquido ?? 0,
  };
}
