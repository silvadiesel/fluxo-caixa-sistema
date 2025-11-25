export type PeriodoPreset = "mes-atual" | "trimestre" | "ano" | "personalizado";

export interface Periodo {
  tipo: PeriodoPreset;
  dataInicial: string;
  dataFinal: string;
}

export interface DREDetalhado {
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

export interface Indicadores {
  margemBruta: number;
  margemOperacional: number;
  margemLiquida: number;
}

export interface EvolucaoMensalItem {
  mes: string;
  ano: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

export interface TopCategoriaItem {
  categoria: string;
  total: number;
}

export interface CategoriaDetalhada {
  categoria: string;
  total: number;
  quantidade: number;
  tipo: string;
}

export interface RelatorioPayload {
  success: boolean;
  periodo: {
    tipo: string;
    dataInicial: string;
    dataFinal: string;
  };
  dre: DREDetalhado;
  indicadores: Indicadores;
  evolucaoMensal: EvolucaoMensalItem[];
  topReceitas?: TopCategoriaItem[];
  topDespesas?: TopCategoriaItem[];
  detalhamento?: {
    receitas: CategoriaDetalhada[];
    despesas: CategoriaDetalhada[];
  };
}
