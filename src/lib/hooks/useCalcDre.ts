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

  // Receita Bruta: TODAS as receitas pagas, sem exceção
  const receitaBruta = sum(receitas.map((r) => r.valor));

  // Deduções: Imposto - agrupa por nome da categoria
  // Busca todas as categorias que contêm "imposto" no nome
  const deducoesImposto = sum(
    despesas
      .filter((d) => {
        const nomeCategoria = normalizeNome(d.categoria);
        return (
          nomeCategoria.includes("imposto") ||
          nomeCategoria.includes("simples") ||
          nomeCategoria.includes("icms")
        );
      })
      .map((d) => d.valor)
  );

  const deducoes = {
    imposto: deducoesImposto ?? 0,
  };

  const receitaLiquida = receitaBruta - deducoes.imposto;

  // Custos de Serviços: agrupa por nome da categoria
  // FORNECEDORES: todas as categorias que contêm "fornecedor" no nome
  const fornecedores = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        // Exclui fretes e serviços de terceiros do cálculo de fornecedores
        if (
          nomeNormalizado.includes("frete") ||
          nomeNormalizado.includes("serviço") ||
          nomeNormalizado.includes("terceiro")
        ) {
          return false;
        }
        return (
          nomeNormalizado.includes("fornecedor") ||
          nomeNormalizado.includes("fornecedores")
        );
      })
      .map((d) => d.valor)
  );

  // SERVIÇOS DE TERCEIROS: todas as categorias que contêm "serviço" ou "terceiro" no nome
  const servicosTerceiros = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          nomeNormalizado.includes("serviço") ||
          nomeNormalizado.includes("servico") ||
          nomeNormalizado.includes("terceiro")
        );
      })
      .map((d) => d.valor)
  );

  // FRETES: todas as categorias que contêm "frete" no nome
  const fretes = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return nomeNormalizado.includes("frete");
      })
      .map((d) => d.valor)
  );

  const custoServicos = {
    fornecedores: fornecedores ?? 0,
    servicosTerceiros: servicosTerceiros ?? 0,
    fretes: fretes ?? 0,
    total: (fornecedores ?? 0) + (servicosTerceiros ?? 0) + (fretes ?? 0),
  };

  const lucroBruto = receitaLiquida - custoServicos.total;

  // Despesas Operacionais: agrupa por nome da categoria
  // Despesas Fixas e Variáveis: categorias que não se encaixam em outras categorias específicas
  // (será calculado como o que sobra após subtrair as outras despesas operacionais)

  // SALÁRIOS: todas as categorias que contêm "salário", "salario" ou "folha" no nome
  const salarios = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          nomeNormalizado.includes("salário") ||
          nomeNormalizado.includes("salario") ||
          nomeNormalizado.includes("folha")
        );
      })
      .map((d) => d.valor)
  );

  // IMPOSTO SOBRE SALÁRIOS: categorias que contêm "imposto" e ("folha" ou "salário")
  const impostoSalarios = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          (nomeNormalizado.includes("imposto") &&
            (nomeNormalizado.includes("folha") ||
              nomeNormalizado.includes("salário") ||
              nomeNormalizado.includes("salario"))) ||
          nomeNormalizado.includes("inss") ||
          nomeNormalizado.includes("fgts")
        );
      })
      .map((d) => d.valor)
  );

  // DESPESAS COM PESSOAL: categorias que contêm "pessoal", "benefício" ou "beneficio"
  const despesasPessoal = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          nomeNormalizado.includes("pessoal") ||
          nomeNormalizado.includes("benefício") ||
          nomeNormalizado.includes("beneficio")
        );
      })
      .map((d) => d.valor)
  );

  // CONTADOR E OUTROS: categorias que contêm "contador", "programa", "software" ou "sistema"
  const contadorOutros = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          nomeNormalizado.includes("contador") ||
          nomeNormalizado.includes("programa") ||
          nomeNormalizado.includes("software") ||
          nomeNormalizado.includes("sistema")
        );
      })
      .map((d) => d.valor)
  );

  // ÁGUA/LUZ/INTERNET: categorias que contêm essas palavras
  const aguaLuzInternet = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          nomeNormalizado.includes("água") ||
          nomeNormalizado.includes("agua") ||
          nomeNormalizado.includes("luz") ||
          nomeNormalizado.includes("energia") ||
          nomeNormalizado.includes("internet") ||
          nomeNormalizado.includes("telefone") ||
          nomeNormalizado.includes("telecomunicação") ||
          nomeNormalizado.includes("telecomunicacao")
        );
      })
      .map((d) => d.valor)
  );

  // DESPESAS OFICINA: categorias que contêm "oficina", "manutenção" ou "manutencao"
  const despesasOficina = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          nomeNormalizado.includes("oficina") ||
          nomeNormalizado.includes("manutenção") ||
          nomeNormalizado.includes("manutencao")
        );
      })
      .map((d) => d.valor)
  );

  // PRÓ-LABORE: categorias que contêm "pró-labore", "pro-labore", "prolabore" ou "pró labore"
  const proLabore = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        return (
          nomeNormalizado.includes("pró-labore") ||
          nomeNormalizado.includes("pro-labore") ||
          nomeNormalizado.includes("prolabore") ||
          nomeNormalizado.includes("pró labore")
        );
      })
      .map((d) => d.valor)
  );

  // DESPESAS FIXAS E VARIÁVEIS: todas as outras despesas que não se encaixam nas categorias acima
  // e que não são custos de serviços, impostos sobre receita ou despesas financeiras
  const despesasFixasVariaveis = sum(
    despesas
      .filter((d) => {
        const nomeNormalizado = normalizeNome(d.categoria);
        // Exclui custos de serviços
        if (
          nomeNormalizado.includes("fornecedor") ||
          nomeNormalizado.includes("serviço") ||
          nomeNormalizado.includes("servico") ||
          nomeNormalizado.includes("terceiro") ||
          nomeNormalizado.includes("frete")
        ) {
          return false;
        }
        // Exclui impostos sobre receita
        if (
          nomeNormalizado.includes("imposto") &&
          !nomeNormalizado.includes("folha") &&
          !nomeNormalizado.includes("salário") &&
          !nomeNormalizado.includes("salario")
        ) {
          return false;
        }
        // Exclui despesas operacionais específicas já categorizadas
        if (
          nomeNormalizado.includes("salário") ||
          nomeNormalizado.includes("salario") ||
          nomeNormalizado.includes("folha") ||
          nomeNormalizado.includes("pessoal") ||
          nomeNormalizado.includes("benefício") ||
          nomeNormalizado.includes("beneficio") ||
          nomeNormalizado.includes("contador") ||
          nomeNormalizado.includes("programa") ||
          nomeNormalizado.includes("software") ||
          nomeNormalizado.includes("sistema") ||
          nomeNormalizado.includes("água") ||
          nomeNormalizado.includes("agua") ||
          nomeNormalizado.includes("luz") ||
          nomeNormalizado.includes("energia") ||
          nomeNormalizado.includes("internet") ||
          nomeNormalizado.includes("telefone") ||
          nomeNormalizado.includes("oficina") ||
          nomeNormalizado.includes("manutenção") ||
          nomeNormalizado.includes("manutencao") ||
          nomeNormalizado.includes("pró-labore") ||
          nomeNormalizado.includes("pro-labore") ||
          nomeNormalizado.includes("prolabore")
        ) {
          return false;
        }
        // Exclui despesas financeiras
        if (
          nomeNormalizado.includes("juros") ||
          nomeNormalizado.includes("empréstimo") ||
          nomeNormalizado.includes("emprestimo") ||
          nomeNormalizado.includes("taxa")
        ) {
          return false;
        }
        return true;
      })
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
