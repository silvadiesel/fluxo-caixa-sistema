import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReceitaDadosUI } from "@/lib/types/receitaModal.types";
import type { ApiListResponse } from "@/lib/types/receitaPage.types";
import { type StatusUI, uiToApiStatus } from "./utils";

interface UseReceitaCardsProps {
  usuarioId?: number;
  dataInicial?: string;
  dataFinal?: string;
  filtroCategoria: string;
  filtroStatus: StatusUI;
  filtroTexto: string;
}

// Busca todas as receitas com os filtros aplicados (sem paginação)
async function fetchReceitasFiltradas(
  usuarioId: number,
  params: Record<string, string | number | undefined>
): Promise<ReceitaDadosUI[]> {
  const pageSize = 100;
  let page = 1;
  const acumulado: ReceitaDadosUI[] = [];

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

    const res = await fetch(`/api/receitaApi?${searchParams}`, {
      cache: "no-store",
    });

    if (!res.ok) break;

    const json: ApiListResponse<ReceitaDadosUI> = await res.json();
    const lote = json.data ?? [];
    acumulado.push(...lote);

    if (lote.length < pageSize) break;
    page += 1;
  }

  return acumulado;
}

export function useReceitaCards({
  usuarioId,
  dataInicial,
  dataFinal,
  filtroCategoria,
  filtroStatus,
  filtroTexto,
}: UseReceitaCardsProps) {
  const [receitasFiltradas, setReceitasFiltradas] = useState<ReceitaDadosUI[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Prepara os parâmetros de filtro
  const filtros = useMemo(() => {
    return {
      categoria: filtroCategoria !== "todas" ? filtroCategoria : undefined,
      status:
        filtroStatus !== "todos"
          ? uiToApiStatus[filtroStatus as Exclude<StatusUI, "todos">]
          : undefined,
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

  // Carrega as receitas com os filtros aplicados
  const carregarReceitas = useCallback(async () => {
    if (!usuarioId || !dataInicial || !dataFinal) {
      setReceitasFiltradas([]);
      return;
    }

    setLoading(true);
    try {
      const receitas = await fetchReceitasFiltradas(usuarioId, filtros);
      setReceitasFiltradas(receitas);
    } catch (error) {
      console.error("Erro ao carregar receitas filtradas:", error);
      setReceitasFiltradas([]);
    } finally {
      setLoading(false);
    }
  }, [usuarioId, filtros, dataInicial, dataFinal]);

  useEffect(() => {
    carregarReceitas();
  }, [carregarReceitas]);

  // Calcula os valores dos cards
  const receitasMes = useMemo(() => {
    return receitasFiltradas.reduce((acc, r) => {
      const valor = Number.isFinite(r.valor) ? r.valor : 0;
      return acc + valor;
    }, 0);
  }, [receitasFiltradas]);

  const mediaReceitas = useMemo(() => {
    if (receitasFiltradas.length === 0) return 0;
    return receitasMes / receitasFiltradas.length;
  }, [receitasFiltradas.length, receitasMes]);

  // Determina o label do card baseado no filtro ativo
  const labelReceitas = useMemo(() => {
    if (filtros.status) {
      return `Receitas ${filtroStatus}`;
    }
    if (filtros.categoria) {
      return `Receitas - ${filtroCategoria}`;
    }
    if (filtros.texto) {
      return `Receitas - "${filtroTexto}"`;
    }
    return "Receitas do Mês";
  }, [filtros, filtroCategoria, filtroStatus, filtroTexto]);

  const labelMedia = useMemo(() => {
    if (temFiltro) {
      return "Média por Receita (filtradas)";
    }
    return "Média por Receita";
  }, [temFiltro]);

  return {
    receitasMes,
    mediaReceitas,
    labelReceitas,
    labelMedia,
    temFiltro,
    loading,
  };
}
