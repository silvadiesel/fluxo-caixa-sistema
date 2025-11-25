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

  const sum = (nums: (number | null | undefined)[]): number =>
    nums.reduce<number>((acc, n) => acc + (n ?? 0), 0);

  // Função auxiliar para normalizar nome da categoria (case-insensitive)
  const normalizeNome = (nome: string | null | undefined) =>
    nome?.toLowerCase().trim() || "";

  // Receita Bruta: TODAS as receitas pagas
  const receitaBruta = sum(receitas.map((r) => r.valor));

  // Deduções: Imposto - apenas despesas marcadas como "Impostos"
  const deducoesImposto = sum(
    despesas
      .filter((d) => normalizeNome(d.categoria) === "impostos")
      .map((d) => d.valor)
  );

  const deducoes = {
    imposto: deducoesImposto ?? 0,
  };

  const receitaLiquida = receitaBruta - deducoes.imposto;

  const isCategoria = (
    valorCategoria: string | null | undefined,
    alvo: string
  ) => normalizeNome(valorCategoria) === normalizeNome(alvo);

  // FORNECEDORES: todas as despesas marcadas com categoria "Fornecedores"
  const fornecedores = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Fornecedores"))
      .map((d) => d.valor)
  );

  // SERVIÇOS DE TERCEIROS: todas as categorias que contêm "serviço" ou "terceiro" no nome
  const servicosTerceiros = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Serviço De Terceiro"))
      .map((d) => d.valor)
  );

  // FRETES: todas as categorias que contêm "frete" no nome
  const fretes = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Frete"))
      .map((d) => d.valor)
  );

  const custoServicos = {
    fornecedores: fornecedores ?? 0,
    servicosTerceiros: servicosTerceiros ?? 0,
    fretes: fretes ?? 0,
    total: (fornecedores ?? 0) + (servicosTerceiros ?? 0) + (fretes ?? 0),
  };

  const lucroBruto = receitaLiquida - custoServicos.total;

  // SALÁRIOS: todas as categorias que contêm "salário", "salario" ou "folha" no nome
  const salarios = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Salário"))
      .map((d) => d.valor)
  );

  // IMPOSTO SEM SALÁRIOS: categorias que contêm "imposto" e não são "salário"
  const impostoSalarios = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Imposto Sem Salário"))
      .map((d) => d.valor)
  );

  // DESPESAS COM PESSOAL: categorias que contêm "pessoal", "benefício" ou "beneficio"
  const despesasPessoal = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Despesa Com Pessoal"))
      .map((d) => d.valor)
  );

  // CONTADOR E OUTROS: categorias que contêm "contador", "programa", "software" ou "sistema"
  const contadorOutros = sum(
    despesas
      .filter(
        (d) =>
          isCategoria(d.categoria, "Contador") ||
          isCategoria(d.categoria, "Outros")
      )
      .map((d) => d.valor)
  );

  // ÁGUA e LUZ - comparação exata (case-sensitive) para evitar duplicatas
  const aguaLuz = sum(
    despesas
      .filter((d) => d.categoria === "Despesa Água/luz")
      .map((d) => d.valor)
  );
  const internetTelefone = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Despesa Internet/telefone"))
      .map((d) => d.valor)
  );

  // DESPESAS OFICINA: categorias que contêm "oficina", "manutenção" ou "manutencao"
  const despesasOficina = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Despesa Oficina"))
      .map((d) => d.valor)
  );

  // PRÓ-LABORE: categorias que contêm "pró-labore", "pro-labore", "prolabore" ou "pró labore"
  const proLabore = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Pro-labore"))
      .map((d) => d.valor)
  );

  const despesasPessoais = sum(
    despesas
      .filter((d) => isCategoria(d.categoria, "Despesa Pessoal"))
      .map((d) => d.valor)
  );

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
    total:
      (salarios ?? 0) +
      (impostoSalarios ?? 0) +
      (despesasPessoal ?? 0) +
      (contadorOutros ?? 0) +
      (aguaLuz ?? 0) +
      (despesasOficina ?? 0) +
      (internetTelefone ?? 0) +
      (despesasPessoais ?? 0) +
      (proLabore ?? 0),
  };

  const resultadoOperacional = lucroBruto - despesasOperacionais.total;

  // Despesas Financeiras: agrupa por nome da categoria
  // EMPRÉSTIMOS: categorias que contêm "empréstimo" ou "emprestimo"
  const emprestimos = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          nomeNormalizado.includes("empréstimo") ||
          nomeNormalizado.includes("emprestimo")
        );
      })
      .map((d) => d.valor)
  );

  // JUROS E TAXAS: categorias que contêm "juros" ou "taxa"
  const jurosTaxas = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          nomeNormalizado.includes("juros") ||
          nomeNormalizado.includes("taxa") ||
          nomeNormalizado.includes("tarifa")
        );
      })
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
