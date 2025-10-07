"use client";

import { useEffect, useState } from "react";
import { ReceitaSelect } from "@/lib/validator/receitaValidator";
import { DespesaSelect } from "@/lib/validator/despesaValidator";

export interface ResumoFinanceiro {
    entradasMes: number;
    saidasMes: number;
    categoriaMaisImpactante: {
        categoria: string;
        valor: number;
    } | null;
}

export function useResumoFinanceiro(usuarioId: number) {
    const [resumo, setResumo] = useState<ResumoFinanceiro>({
        entradasMes: 0,
        saidasMes: 0,
        categoriaMaisImpactante: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchResumoFinanceiro = async () => {
        if (!usuarioId || usuarioId <= 0) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Obter primeiro e último dia do mês atual
            const hoje = new Date();
            const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

            const dataInicial = primeiroDiaMes.toISOString().split("T")[0];
            const dataFinal = ultimoDiaMes.toISOString().split("T")[0];

            // Função auxiliar para buscar todos os dados com paginação
            const fetchAllData = async (endpoint: string) => {
                const allData = [];
                let page = 1;
                const pageSize = 100; // Máximo permitido pela validação

                while (true) {
                    const response = await fetch(
                        `/api/${endpoint}?page=${page}&pageSize=${pageSize}&usuarioId=${usuarioId}&dataInicial=${dataInicial}&dataFinal=${dataFinal}`
                    );

                    if (!response.ok) {
                        throw new Error(`Erro ao buscar dados de ${endpoint}`);
                    }

                    const data = await response.json();
                    allData.push(...data.data);

                    // Se retornou menos que o pageSize, não há mais dados
                    if (data.data.length < pageSize) {
                        break;
                    }

                    page++;
                }

                return allData;
            };

            // Buscar receitas e despesas do mês atual em paralelo
            const [receitasData, despesasData] = await Promise.all([
                fetchAllData("receitaApi"),
                fetchAllData("despesaApi"),
            ]);

            // Calcular total de entradas do mês
            const totalEntradas = receitasData.reduce((total: number, receita: ReceitaSelect) => {
                return total + Number(receita.valor);
            }, 0);

            // Calcular total de saídas do mês
            const totalSaidas = despesasData.reduce((total: number, despesa: DespesaSelect) => {
                return total + Number(despesa.valor);
            }, 0);

            // Calcular categoria que mais impacta (maior gasto)
            const categoriasDespesas: { [categoria: string]: number } = {};

            despesasData.forEach((despesa: DespesaSelect) => {
                const categoria = despesa.categoria;
                const valor = Number(despesa.valor);

                if (!categoriasDespesas[categoria]) {
                    categoriasDespesas[categoria] = 0;
                }
                categoriasDespesas[categoria] += valor;
            });

            // Encontrar a categoria com maior valor
            let categoriaMaisImpactante: { categoria: string; valor: number } | null = null;
            let maiorValor = 0;

            Object.entries(categoriasDespesas).forEach(([categoria, valor]) => {
                if (valor > maiorValor) {
                    maiorValor = valor;
                    categoriaMaisImpactante = { categoria, valor };
                }
            });

            setResumo({
                entradasMes: totalEntradas,
                saidasMes: totalSaidas,
                categoriaMaisImpactante,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResumoFinanceiro();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuarioId]);

    return { resumo, loading, error, refetch: fetchResumoFinanceiro };
}
