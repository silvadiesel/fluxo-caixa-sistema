export type PeriodoPreset = "mes-atual" | "trimestre" | "ano" | "personalizado";

export interface Periodo {
    tipo: PeriodoPreset;
    dataInicial: string;
    dataFinal: string;
}

export interface DREDetalhado {
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
    outrasReceitas: number;
    outrasDespesas: number;
    lucroAntesImposto: number;
    impostoRenda: number;
    lucroLiquido: number;
}

export interface Indicadores {
    margemBruta: number;
    margemOperacional: number;
    margemLiquida: number;
}

export interface EvolucaoMensalItem {
    ano: number;
    mes: number;
    receitas: number;
    despesas: number;
    lucro: number;
}

export interface TopCategoriaItem {
    categoria: string;
    total: number;
}

export interface RelatorioPayload {
    periodo: Periodo;
    dre: DREDetalhado;
    indicadores: Indicadores;
    evolucaoMensal: EvolucaoMensalItem[];
    topReceitas: TopCategoriaItem[];
    topDespesas: TopCategoriaItem[];
}
