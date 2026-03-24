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
    salarios: number;
    impostoSalarios: number;
    despesasPessoal: number;
    contadorOutros: number;
    aguaLuz: number;
    internetTelefone: number;
    despesasOficina: number;
    despesasPessoais: number;
    proLabore: number;
    outros: { categoria: string; total: number }[];
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
      id: despesa.id,
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

  const sum = (nums: (number | null | undefined)[]): number =>
    nums.reduce<number>((acc, n) => acc + (n ?? 0), 0);

  const normalizeNome = (nome: string | null | undefined) =>
    nome?.toLowerCase().trim() || "";

  const receitaBruta = sum(receitas.map((r) => r.valor));

  const isCategoria = (
    valorCategoria: string | null | undefined,
    alvo: string
  ) => normalizeNome(valorCategoria) === normalizeNome(alvo);

  const isSubgrupo = (
    d: { dreSubgrupo: string | null | undefined },
    subgrupo: string
  ) => d.dreSubgrupo === subgrupo;

  const usedIds = new Set<number>();

  const filterAndMark = (
    predicate: (d: (typeof despesas)[number]) => boolean
  ) =>
    despesas.filter((d) => {
      if (predicate(d)) {
        usedIds.add(d.id);
        return true;
      }
      return false;
    });

  // Deduções: Imposto
  const deducoesImposto = sum(
    filterAndMark(
      (d) =>
        d.dreGrupo === "IMPOSTO_SOBRE_RECEITA" ||
        normalizeNome(d.categoria) === "impostos"
    ).map((d) => d.valor)
  );

  const deducoes = {
    imposto: deducoesImposto ?? 0,
  };

  const receitaLiquida = receitaBruta - deducoes.imposto;

  // FORNECEDORES
  const fornecedores = sum(
    filterAndMark(
      (d) =>
        isSubgrupo(d, "FORNECEDORES") ||
        isCategoria(d.categoria, "Fornecedores")
    ).map((d) => d.valor)
  );

  // SERVIÇOS DE TERCEIROS
  const servicosTerceiros = sum(
    filterAndMark(
      (d) =>
        isSubgrupo(d, "SERVICOS_TERCEIROS") ||
        isCategoria(d.categoria, "Serviço De Terceiro")
    ).map((d) => d.valor)
  );

  // FRETES
  const fretes = sum(
    filterAndMark((d) => isCategoria(d.categoria, "Frete")).map((d) => d.valor)
  );

  const custoServicos = {
    fornecedores: fornecedores ?? 0,
    servicosTerceiros: servicosTerceiros ?? 0,
    fretes: fretes ?? 0,
    total: (fornecedores ?? 0) + (servicosTerceiros ?? 0) + (fretes ?? 0),
  };

  const lucroBruto = receitaLiquida - custoServicos.total;

  // SALÁRIOS
  const salarios = sum(
    filterAndMark(
      (d) => isSubgrupo(d, "SALARIOS") || isCategoria(d.categoria, "Salário")
    ).map((d) => d.valor)
  );

  // IMPOSTO SOBRE FOLHA / SALÁRIOS
  const impostoSalarios = sum(
    filterAndMark(
      (d) =>
        isSubgrupo(d, "IMPOSTO_SOBRE_FOLHA") ||
        isCategoria(d.categoria, "Imposto Sem Salário")
    ).map((d) => d.valor)
  );

  // DESPESAS COM PESSOAL
  const despesasPessoal = sum(
    filterAndMark(
      (d) =>
        isSubgrupo(d, "DESPESAS_PESSOAIS") ||
        isCategoria(d.categoria, "Despesa Com Pessoal")
    ).map((d) => d.valor)
  );

  // CONTADOR E OUTROS
  const contadorOutros = sum(
    filterAndMark(
      (d) =>
        isSubgrupo(d, "CONTADOR_PROGRAMAS") ||
        isCategoria(d.categoria, "Contador") ||
        isCategoria(d.categoria, "Outros")
    ).map((d) => d.valor)
  );

  // ÁGUA E LUZ
  const aguaLuz = sum(
    filterAndMark(
      (d) =>
        isSubgrupo(d, "AGUA_LUZ_INTERNET") ||
        d.categoria === "Despesa Água/luz"
    ).map((d) => d.valor)
  );

  const internetTelefone = sum(
    filterAndMark((d) =>
      isCategoria(d.categoria, "Despesa Internet/telefone")
    ).map((d) => d.valor)
  );

  // DESPESAS OFICINA
  const despesasOficina = sum(
    filterAndMark(
      (d) =>
        isSubgrupo(d, "DESP_OFICINA") ||
        isCategoria(d.categoria, "Despesa Oficina")
    ).map((d) => d.valor)
  );

  // PRÓ-LABORE
  const proLabore = sum(
    filterAndMark(
      (d) =>
        isSubgrupo(d, "PRO_LABORE") || isCategoria(d.categoria, "Pro-labore")
    ).map((d) => d.valor)
  );

  const despesasPessoais = sum(
    filterAndMark((d) => isCategoria(d.categoria, "Despesa Pessoal")).map(
      (d) => d.valor
    )
  );

  // EMPRÉSTIMOS
  const emprestimos = sum(
    filterAndMark((d) => {
      const nomeNormalizado = normalizeNome(d.categoria);
      return (
        isSubgrupo(d, "EMPRESTIMOS") ||
        nomeNormalizado.includes("empréstimo") ||
        nomeNormalizado.includes("emprestimo")
      );
    }).map((d) => d.valor)
  );

  // JUROS E TAXAS
  const jurosTaxas = sum(
    filterAndMark((d) => {
      const nomeNormalizado = normalizeNome(d.categoria);
      return (
        isSubgrupo(d, "JUROS_TAXAS") ||
        nomeNormalizado.includes("juros") ||
        nomeNormalizado.includes("taxa") ||
        nomeNormalizado.includes("tarifa")
      );
    }).map((d) => d.valor)
  );

  // Despesas não mapeadas: agrupadas por categoria (calculado após todas as categorias conhecidas)
  const outrosMap = new Map<string, number>();
  for (const d of despesas.filter((d) => !usedIds.has(d.id))) {
    const cat = d.categoria ?? "Sem categoria";
    outrosMap.set(cat, (outrosMap.get(cat) ?? 0) + (d.valor ?? 0));
  }
  const outros = Array.from(outrosMap.entries()).map(([categoria, total]) => ({
    categoria,
    total,
  }));
  const outrosTotal = sum(outros.map((o) => o.total));

  const despesasOperacionais = {
    salarios: salarios ?? 0,
    impostoSalarios: impostoSalarios ?? 0,
    despesasPessoal: despesasPessoal ?? 0,
    contadorOutros: contadorOutros ?? 0,
    aguaLuz: aguaLuz ?? 0,
    internetTelefone: internetTelefone ?? 0,
    despesasOficina: despesasOficina ?? 0,
    despesasPessoais: despesasPessoais ?? 0,
    proLabore: proLabore ?? 0,
    outros,
    total:
      (salarios ?? 0) +
      (impostoSalarios ?? 0) +
      (despesasPessoal ?? 0) +
      (contadorOutros ?? 0) +
      (aguaLuz ?? 0) +
      (despesasOficina ?? 0) +
      (internetTelefone ?? 0) +
      (despesasPessoais ?? 0) +
      (proLabore ?? 0) +
      outrosTotal,
  };

  const resultadoOperacional = lucroBruto - despesasOperacionais.total;

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
