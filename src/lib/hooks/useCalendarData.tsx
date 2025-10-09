"use client";

import { useState, useEffect, useCallback } from "react";

interface DespesaData {
    id: number;
    descricao: string;
    categoria: string;
    valor: number;
    data: string;
    status: string;
    observacoes?: string;
    usuarioId: number;
}

interface ReceitaData {
    id: number;
    descricao: string;
    categoria: string;
    valor: number;
    data: string;
    status: string;
    observacoes?: string;
    usuarioId: number;
}

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    allDay: boolean;
    color: string;
    description: string;
    extendedProps: {
        type: "despesa" | "receita";
        valor: number;
        categoria: string;
        status: string;
        observacoes?: string;
        originalData: DespesaData | ReceitaData;
        order: number;
    };
}

interface UseCalendarDataReturn {
    events: CalendarEvent[];
    loading: boolean;
    error: string | null;
    refreshData: () => void;
}

export function useCalendarData(usuarioId: number): UseCalendarDataReturn {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
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

            // Buscar dados dos últimos 6 meses e próximos 6 meses
            const today = new Date();
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            const sixMonthsFromNow = new Date(today);
            sixMonthsFromNow.setMonth(today.getMonth() + 6);

            const dataInicial = sixMonthsAgo.toISOString().split("T")[0];
            const dataFinal = sixMonthsFromNow.toISOString().split("T")[0];

            // Função para buscar todas as páginas
            const fetchAllPages = async (
                endpoint: string
            ): Promise<(DespesaData | ReceitaData)[]> => {
                const allData: (DespesaData | ReceitaData)[] = [];
                let page = 1;
                const pageSize = 100; // Usar o limite máximo permitido

                while (true) {
                    const response = await fetch(
                        `/api/${endpoint}?usuarioId=${usuarioId}&page=${page}&pageSize=${pageSize}&dataInicial=${dataInicial}&dataFinal=${dataFinal}`
                    );

                    if (!response.ok) {
                        throw new Error(`Erro ao buscar dados de ${endpoint}`);
                    }

                    const data = await response.json();
                    allData.push(...data.data);

                    // Se retornou menos que o pageSize, chegamos ao fim
                    if (data.data.length < pageSize) {
                        break;
                    }

                    page++;
                }

                return allData;
            };

            const [despesasData, receitasData] = await Promise.all([
                fetchAllPages("despesaApi"),
                fetchAllPages("receitaApi"),
            ]);

            const despesasPendentes = (despesasData as DespesaData[]).filter(
                (despesa) => despesa.status.toLowerCase() === "pendente"
            );

            const receitasPendentes = (receitasData as ReceitaData[]).filter(
                (receita) => receita.status.toLowerCase() === "pendente"
            );

            const despesasEvents: CalendarEvent[] = despesasPendentes.map(
                (despesa: DespesaData) => ({
                    id: `despesa-${despesa.id}`,
                    title: despesa.descricao,
                    start: despesa.data,
                    allDay: true,
                    color: getColorByStatus(despesa.status, "despesa"),
                    description: `Despesa: ${despesa.descricao}`,
                    extendedProps: {
                        type: "despesa" as const,
                        valor: despesa.valor,
                        categoria: despesa.categoria,
                        status: despesa.status,
                        observacoes: despesa.observacoes,
                        originalData: despesa,
                        order: 1,
                    },
                })
            );

            const receitasEvents: CalendarEvent[] = receitasPendentes.map(
                (receita: ReceitaData) => ({
                    id: `receita-${receita.id}`,
                    title: receita.descricao,
                    start: receita.data,
                    allDay: true,
                    color: getColorByStatus(receita.status, "receita"),
                    description: `Receita: ${receita.descricao}`,
                    extendedProps: {
                        type: "receita" as const,
                        valor: receita.valor,
                        categoria: receita.categoria,
                        status: receita.status,
                        observacoes: receita.observacoes,
                        originalData: receita,
                        order: 2, // Receitas depois
                    },
                })
            );

            const allEvents = [...despesasEvents, ...receitasEvents].sort((a, b) => {
                const dateA = new Date(a.start);
                const dateB = new Date(b.start);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                }
                return a.extendedProps.order - b.extendedProps.order;
            });
            setEvents(allEvents);
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
        events,
        loading,
        error,
        refreshData,
    };
}

// Função para definir cores baseadas no status e tipo
function getColorByStatus(status: string, type: "despesa" | "receita"): string {
    if (type === "despesa") {
        // Para despesas pendentes, mostrar em vermelho (cor de alerta)
        if (status.toLowerCase() === "pendente") {
            return "#DC2626"; // Vermelho para despesas pendentes
        }
        return "#EF4444"; // Vermelho padrão
    } else {
        // Para receitas pendentes, mostrar em verde
        if (status.toLowerCase() === "pendente") {
            return "#059669"; // Verde para receitas pendentes
        }
        return "#10B981"; // Verde padrão
    }
}
