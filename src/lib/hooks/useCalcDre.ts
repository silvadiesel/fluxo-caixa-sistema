import { db } from "@/db/connection";
import { receita } from "@/db/schema/receita";
import { despesa } from "@/db/schema/despesa";
import { categorias } from "@/db/schema/categorias";
import { and, eq, gte, lte } from "drizzle-orm";

export interface DreResultado {
  receitaBruta: number;
  deducoes: {
    imposto: number;
  };
  receitaLiquida: number;
  custoServicos: {
    fornecedores: number;
    servicosTerceiros: number;
    fretes: number;
    total: number;
  };
  lucroBruto: number;
  despesasOperacionais: {
    despesasFixasVariaveis: number;
    salarios: number;
    impostoSalarios: number;
    despesasPessoal: number;
    contadorOutros: number;
    aguaLuzInternet: number;
    despesasOficina: number;
    proLabore: number;
    total: number;
  };
  resultadoOperacional: number;
  despesasFinanceiras: {
    emprestimos: number;
    jurosTaxas: number;
    total: number;
  };
  jurosPagos: number;
  lucro: number;
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
        eq(receita.status, "pago"), // Apenas receitas recebidas
        gte(receita.data, dataInicial),
        lte(receita.data, dataFinal)
      )
    );

  const despesas = await db
    .select({
      valor: despesa.valor,
      categoria: despesa.categoria,
      descricao: despesa.descricao,
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
        eq(despesa.status, "pago"), // Apenas despesas pagas
        gte(despesa.data, dataInicial),
        lte(despesa.data, dataFinal)
      )
    );

  const sum = (nums: (number | null | undefined)[]) =>
    nums.reduce((acc, n) => (acc ?? 0) + (n ?? 0), 0);

  // Função auxiliar para normalizar nome da categoria (case-insensitive)
  const normalizeNome = (nome: string | null | undefined) =>
    nome?.toLowerCase().trim() || "";

  // Receita Bruta: TODOS os recebimentos (status "pago"), incluindo juros
  const receitaBruta = sum(receitas.map((r) => r.valor));

  // Deduções: Imposto (SIMPLES + ICMS unificados)
  // Soma apenas despesas com categoria "Impostos" ou que tenham dreGrupo correto
  const deducoesImposto = sum(
    despesas
      .filter((d) => {
        const nomeCategoria = normalizeNome(d.categoria);

        // Verifica pelos campos DRE
        if (
          d.dreGrupo === "IMPOSTO_SOBRE_RECEITA" &&
          (d.dreSubgrupo === "SIMPLES" || d.dreSubgrupo === "ICMS")
        ) {
          return true;
        }

        // Fallback: verifica apenas por nome da categoria "Impostos"
        if (nomeCategoria === "impostos" || nomeCategoria === "imposto") {
          return true;
        }

        return false;
      })
      .map((d) => d.valor)
  );

  const deducoes = {
    imposto: deducoesImposto ?? 0,
  };

  const receitaLiquida = receitaBruta - deducoes.imposto;

  // Custos de Serviços: FORNECEDORES + SERVICOS_TERCEIROS + FRETES
  const fornecedores = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        // Exclui fretes do cálculo de fornecedores
        if (nomeNormalizado === "frete" || nomeNormalizado.includes("frete")) {
          return false;
        }
        return (
          (d.dreGrupo === "CUSTO_PRODUTO_SERVICO" &&
            d.dreSubgrupo === "FORNECEDORES") ||
          // Fallback: se dreGrupo for OUTROS mas nome for "Fornecedor"
          (d.dreGrupo === "OUTROS" && nomeNormalizado.includes("fornecedor"))
        );
      })
      .map((d) => d.valor)
  );

  const servicosTerceiros = sum(
    despesas
      .filter(
        (d) =>
          d.dreGrupo === "CUSTO_PRODUTO_SERVICO" &&
          d.dreSubgrupo === "SERVICOS_TERCEIROS"
      )
      .map((d) => d.valor)
  );

  // FRETES: busca por nome da categoria "Frete" independente do dreGrupo/dreSubgrupo
  const fretes = sum(
    despesas
      .filter(
        (d) =>
          normalizeNome(d.categoria) === "frete" ||
          normalizeNome(d.categoria).includes("frete")
      )
      .map((d) => d.valor)
  );

  const custoServicos = {
    fornecedores: fornecedores ?? 0,
    servicosTerceiros: servicosTerceiros ?? 0,
    fretes: fretes ?? 0,
    total: (fornecedores ?? 0) + (servicosTerceiros ?? 0) + (fretes ?? 0),
  };

  const lucroBruto = receitaLiquida - custoServicos.total;

  // Despesas Operacionais detalhadas
  const despesasOperacionaisData = despesas.filter(
    (d) => d.dreGrupo === "DESPESA_OPERACIONAL"
  );

  const despesasFixasVariaveis = sum(
    despesasOperacionaisData
      .filter((d) => d.dreSubgrupo === "OUTROS")
      .map((d) => d.valor)
  );

  const salarios = sum(
    despesasOperacionaisData
      .filter((d) => d.dreSubgrupo === "SALARIOS")
      .map((d) => d.valor)
  );

  const impostoSalarios = sum(
    despesasOperacionaisData
      .filter((d) => d.dreSubgrupo === "IMPOSTO_SOBRE_FOLHA")
      .map((d) => d.valor)
  );

  const despesasPessoal = sum(
    despesasOperacionaisData
      .filter((d) => d.dreSubgrupo === "DESPESAS_PESSOAIS")
      .map((d) => d.valor)
  );

  const contadorOutros = sum(
    despesasOperacionaisData
      .filter((d) => d.dreSubgrupo === "CONTADOR_PROGRAMAS")
      .map((d) => d.valor)
  );

  const aguaLuzInternet = sum(
    despesasOperacionaisData
      .filter((d) => d.dreSubgrupo === "AGUA_LUZ_INTERNET")
      .map((d) => d.valor)
  );

  const despesasOficina = sum(
    despesasOperacionaisData
      .filter((d) => d.dreSubgrupo === "DESP_OFICINA")
      .map((d) => d.valor)
  );

  const proLabore = sum(
    despesasOperacionaisData
      .filter((d) => d.dreSubgrupo === "PRO_LABORE")
      .map((d) => d.valor)
  );

  const despesasOperacionais = {
    despesasFixasVariaveis: despesasFixasVariaveis ?? 0,
    salarios: salarios ?? 0,
    impostoSalarios: impostoSalarios ?? 0,
    despesasPessoal: despesasPessoal ?? 0,
    contadorOutros: contadorOutros ?? 0,
    aguaLuzInternet: aguaLuzInternet ?? 0,
    despesasOficina: despesasOficina ?? 0,
    proLabore: proLabore ?? 0,
    total:
      (despesasFixasVariaveis ?? 0) +
      (salarios ?? 0) +
      (impostoSalarios ?? 0) +
      (despesasPessoal ?? 0) +
      (contadorOutros ?? 0) +
      (aguaLuzInternet ?? 0) +
      (despesasOficina ?? 0) +
      (proLabore ?? 0),
  };

  const resultadoOperacional = lucroBruto - despesasOperacionais.total;

  // Despesas Financeiras
  const despesasFinanceirasData = despesas.filter(
    (d) =>
      d.dreGrupo === "DESPESA_FINANCEIRA" ||
      // Fallback: se dreGrupo for OUTROS mas nome for "Juros"
      (d.dreGrupo === "OUTROS" && normalizeNome(d.categoria).includes("juros"))
  );

  const emprestimos = sum(
    despesasFinanceirasData
      .filter((d) => d.dreSubgrupo === "EMPRESTIMOS")
      .map((d) => d.valor)
  );

  const jurosTaxas = sum(
    despesasFinanceirasData
      .filter(
        (d) =>
          d.dreSubgrupo === "JUROS_TAXAS" ||
          // Fallback: se nome da categoria for "Juros" mesmo com OUTROS
          (d.dreGrupo === "OUTROS" &&
            normalizeNome(d.categoria).includes("juros"))
      )
      .map((d) => d.valor)
  );

  const despesasFinanceiras = {
    emprestimos: emprestimos ?? 0,
    jurosTaxas: jurosTaxas ?? 0,
    total: (emprestimos ?? 0) + (jurosTaxas ?? 0),
  };

  // Juros pagos (despesas financeiras com subgrupo JUROS_TAXAS)
  const jurosPagos = jurosTaxas ?? 0;

  const lucro = resultadoOperacional - despesasFinanceiras.total;

  return {
    receitaBruta: receitaBruta ?? 0,
    deducoes,
    receitaLiquida: receitaLiquida ?? 0,
    custoServicos,
    lucroBruto: lucroBruto ?? 0,
    despesasOperacionais,
    resultadoOperacional: resultadoOperacional ?? 0,
    despesasFinanceiras,
    jurosPagos,
    lucro: lucro ?? 0,
  };
}
