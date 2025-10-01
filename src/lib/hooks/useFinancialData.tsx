"use client";

import { useState, useEffect, useCallback } from "react";

interface DespesaReceita {
    id: number;
    descricao: string;
    categoria: string;
    valor: number;
    data: string;
    status: string;
    observacoes?: string;
    usuarioId: number;
    tipo: "despesa" | "receita";
}

interface UseFinancialDataReturn {
    despesasReceitas: DespesaReceita[];
    loading: boolean;
    error: string | null;
    refreshData: () => void;
}

export function useFinancialData(usuarioId: number): UseFinancialDataReturn {
    const [despesasReceitas, setDespesasReceitas] = useState<DespesaReceita[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!usuarioId || usuarioId <= 0) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);

            // Vamos testar primeiro sem filtros de data para ver se existem despesas
            console.log("Testando busca sem filtros de data...");

            // Função para buscar todas as páginas
            const fetchAllPages = async (
                endpoint: string,
                tipo: "despesa" | "receita"
            ): Promise<DespesaReceita[]> => {
                const allData: DespesaReceita[] = [];
                let page = 1;
                const pageSize = 100;

                while (true) {
                    // Primeiro vamos testar sem filtros de data
                    const url = `/api/${endpoint}?usuarioId=${usuarioId}&page=${page}&pageSize=${pageSize}`;
                    console.log("Fazendo requisição para:", url);

                    const response = await fetch(url);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("Erro na resposta:", response.status, errorText);
                        throw new Error(`Erro ao buscar dados de ${endpoint}: ${response.status}`);
                    }

                    const data = await response.json();

                    const typedData = data.data.map((item: Omit<DespesaReceita, "tipo">) => ({
                        ...item,
                        tipo,
                    }));
                    allData.push(...typedData);

                    if (data.data.length < pageSize) {
                        break;
                    }

                    page++;
                }

                return allData;
            };

            // Buscar apenas despesas por enquanto
            const despesasData = await fetchAllPages("despesaApi", "despesa");

            console.log("Total de despesas encontradas:", despesasData.length);

            // Por enquanto, vamos focar apenas em despesas
            const allData = despesasData.sort(
                (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
            );

            setDespesasReceitas(allData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, [usuarioId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refreshData = () => {
        fetchData();
    };

    return {
        despesasReceitas,
        loading,
        error,
        refreshData,
    };
}
