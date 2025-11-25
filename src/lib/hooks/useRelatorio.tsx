import { useState, useCallback } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { RelatorioPayload } from "../types/relatorio.types";

export function useRelatorio() {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<RelatorioPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gerarRelatorio = useCallback(
    async (
      usuarioId: number,
      tipoPeriodo: "mes-atual" | "trimestre" | "ano" | "personalizado",
      dataInicial?: string,
      dataFinal?: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const periodo = calcularPeriodo(tipoPeriodo, dataInicial, dataFinal);

        const params = new URLSearchParams({
          usuarioId: String(usuarioId),
          dataInicial: periodo.dataInicial,
          dataFinal: periodo.dataFinal,
          periodo: tipoPeriodo,
        });

        const response = await fetch(`/api/relatorio?${params}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Erro ao gerar relatório");
        }

        const data = await response.json();

        // Adicionar período e campos opcionais aos dados
        const dadosCompletos: RelatorioPayload = {
          ...data,
          success: true,
          periodo: {
            tipo: tipoPeriodo,
            dataInicial: periodo.dataInicial,
            dataFinal: periodo.dataFinal,
          },
          topReceitas: data.topReceitas || [],
          topDespesas: data.topDespesas || [],
          detalhamento: data.detalhamento || {
            receitas: [],
            despesas: [],
          },
        };

        setDados(dadosCompletos);

        toast.success("Relatório gerado com sucesso!");

        return dadosCompletos;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao gerar relatório";
        setError(errorMessage);
        console.error("Erro ao gerar relatório:", error);
        toast.error("Erro ao gerar relatório");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    dados,
    error,
    gerarRelatorio,
  };
}

function calcularPeriodo(
  tipo: string,
  dataInicial?: string,
  dataFinal?: string
) {
  const hoje = dayjs();

  if (tipo === "personalizado" && dataInicial && dataFinal) {
    return { dataInicial, dataFinal };
  }

  switch (tipo) {
    case "mes-atual":
      return {
        dataInicial: hoje.startOf("month").format("YYYY-MM-DD"),
        dataFinal: hoje.endOf("month").format("YYYY-MM-DD"),
      };

    case "trimestre":
      return {
        dataInicial: hoje
          .subtract(2, "month")
          .startOf("month")
          .format("YYYY-MM-DD"),
        dataFinal: hoje.endOf("month").format("YYYY-MM-DD"),
      };

    case "ano":
      return {
        dataInicial: hoje.startOf("year").format("YYYY-MM-DD"),
        dataFinal: hoje.endOf("year").format("YYYY-MM-DD"),
      };

    default:
      return {
        dataInicial: hoje.startOf("month").format("YYYY-MM-DD"),
        dataFinal: hoje.endOf("month").format("YYYY-MM-DD"),
      };
  }
}
