"use client";

import { useEffect, useState } from "react";
import { ReceitaSelect } from "@/lib/validator/receitaValidator";
import { DespesaSelect } from "@/lib/validator/despesaValidator";

export interface AtividadeRecente {
    id: number;
    tipo: "entrada" | "saida";
    descricao: string;
    categoria: string;
    valor: number;
    data: string;
    status: string;
}

export function useUltimasAtividades(usuarioId: number) {
    const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUltimasAtividades = async () => {
        if (!usuarioId || usuarioId <= 0) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Buscar receitas e despesas em paralelo (limitado a 5 cada para depois ordenar)
            const [receitasResponse, despesasResponse] = await Promise.all([
                fetch(`/api/receitaApi?page=1&pageSize=5&usuarioId=${usuarioId}`),
                fetch(`/api/despesaApi?page=1&pageSize=5&usuarioId=${usuarioId}`),
            ]);

            if (!receitasResponse.ok || !despesasResponse.ok) {
                throw new Error("Erro ao buscar atividades");
            }

            const receitasData = await receitasResponse.json();
            const despesasData = await despesasResponse.json();

            // Transformar receitas em atividades
            const receitasAtividades: AtividadeRecente[] = receitasData.data.map(
                (receita: ReceitaSelect) => ({
                    id: receita.id,
                    tipo: "entrada" as const,
                    descricao: receita.descricao,
                    categoria: receita.categoria,
                    valor: parseFloat(receita.valor),
                    data: receita.data,
                    status: receita.status,
                })
            );

            // Transformar despesas em atividades
            const despesasAtividades: AtividadeRecente[] = despesasData.data.map(
                (despesa: DespesaSelect) => ({
                    id: despesa.id,
                    tipo: "saida" as const,
                    descricao: despesa.descricao,
                    categoria: despesa.categoria,
                    valor: parseFloat(despesa.valor),
                    data: despesa.data,
                    status: despesa.status,
                })
            );

            // Combinar e ordenar por data (mais recente primeiro)
            const todasAtividades = [...receitasAtividades, ...despesasAtividades];
            todasAtividades.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

            // Pegar apenas as 5 mais recentes
            const ultimasAtividades = todasAtividades.slice(0, 5);

            setAtividades(ultimasAtividades);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUltimasAtividades();
    }, [usuarioId]);

    return { atividades, loading, error, refetch: fetchUltimasAtividades };
}
