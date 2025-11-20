import { useCallback, useEffect, useMemo, useState } from "react";
import type { DespesaDados } from "@/lib/types/despesaModal.types";
import type { ApiListResponse } from "@/lib/types/despesaPage.types";

interface UseDespesaCardsProps {
  usuarioId?: number;
  dataInicial?: string;
  dataFinal?: string;
  filtroCategoria: string;
  filtroStatus: string;
  filtroTexto: string;
}

// Busca todas as despesas com os filtros aplicados (sem paginação)
async function fetchDespesasFiltradas(
  usuarioId: number,
  params: Record<string, string | number | undefined>
): Promise<DespesaDados[]> {
  const pageSize = 100;
  let page = 1;
  const acumulado: DespesaDados[] = [];

  while (true) {
    const searchParams = new URLSearchParams();

    // Adiciona parâmetros fixos
    searchParams.set("usuarioId", String(usuarioId));
    searchParams.set("page", String(page));
    searchParams.set("pageSize", String(pageSize));

    // Adiciona parâmetros de filtro
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length) {
        searchParams.set(key, String(value));
      }
    });

    const res = await fetch(`/api/despesaApi?${searchParams}`, {
      cache: "no-store",
    });

    if (!res.ok) break;

    const json: ApiListResponse<DespesaDados> = await res.json();
    const lote = json.data ?? [];
    acumulado.push(...lote);

    if (lote.length < pageSize) break; // acabou
    page += 1;
  }

  return acumulado;
}

const parseValor = (v: number | string): number => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
};

export function useDespesaCards({
  usuarioId,
  dataInicial,
  dataFinal,
  filtroCategoria,
  filtroStatus,
  filtroTexto,
}: UseDespesaCardsProps) {
  const [despesasFiltradas, setDespesasFiltradas] = useState<DespesaDados[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Prepara os parâmetros de filtro
  const filtros = useMemo(() => {
    return {
      categoria: filtroCategoria !== "todas" ? filtroCategoria : undefined,
      status: filtroStatus !== "todos" ? filtroStatus : undefined,
      texto: filtroTexto.trim() || undefined,
      dataInicial,
      dataFinal,
    };
  }, [filtroCategoria, filtroStatus, filtroTexto, dataInicial, dataFinal]);

  // Verifica se há algum filtro ativo
  const temFiltro = useMemo(() => {
    return (
      filtros.categoria !== undefined ||
      filtros.status !== undefined ||
      filtros.texto !== undefined
    );
  }, [filtros]);

  // Carrega as despesas com os filtros aplicados
  const carregarDespesas = useCallback(async () => {
    if (!usuarioId || !dataInicial || !dataFinal) {
      setDespesasFiltradas([]);
      return;
    }

    setLoading(true);
    try {
      const despesas = await fetchDespesasFiltradas(usuarioId, filtros);
      setDespesasFiltradas(despesas);
    } catch (error) {
      console.error("Erro ao carregar despesas filtradas:", error);
      setDespesasFiltradas([]);
    } finally {
      setLoading(false);
    }
  }, [usuarioId, filtros, dataInicial, dataFinal]);

  useEffect(() => {
    carregarDespesas();
  }, [carregarDespesas]);

  // Calcula os valores dos cards
  const despesasMes = useMemo(() => {
    return despesasFiltradas.reduce((acc, d) => {
      return acc + parseValor(d.valor);
    }, 0);
  }, [despesasFiltradas]);

  const mediaDespesas = useMemo(() => {
    if (despesasFiltradas.length === 0) return 0;
    return despesasMes / despesasFiltradas.length;
  }, [despesasFiltradas.length, despesasMes]);

  // Determina o label do card baseado no filtro ativo
  const labelDespesas = useMemo(() => {
    if (filtros.status) {
      // Capitaliza a primeira letra do status
      const statusCapitalizado =
        filtroStatus.charAt(0).toUpperCase() + filtroStatus.slice(1);
      return `Despesas ${statusCapitalizado}`;
    }
    if (filtros.categoria) {
      return `Despesas - ${filtroCategoria}`;
    }
    if (filtros.texto) {
      return `Despesas - "${filtroTexto}"`;
    }
    return "Despesas do Mês";
  }, [filtros, filtroCategoria, filtroStatus, filtroTexto]);

  const labelMedia = useMemo(() => {
    if (temFiltro) {
      return "Média por Despesa (filtradas)";
    }
    return "Média por Despesa";
  }, [temFiltro]);

  return {
    despesasMes,
    mediaDespesas,
    labelDespesas,
    labelMedia,
    temFiltro,
    loading,
  };
}
