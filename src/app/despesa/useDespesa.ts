import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCategorias } from "@/lib/hooks/useCategorias";
import { useFilterDate } from "@/lib/hooks/useFilterDate";
import { useCalcDespesas } from "./useCalcDespesas";
import { useDespesaCards } from "./useDespesaCards";
import { useDebounce } from "@/lib/utils/queryUtils";
import { qs } from "@/lib/utils/queryUtils";
import { getDefaultMonthFilter, getCurrentYear } from "@/lib/utils/dateUtils";
import type { ApiListResponse, ListMeta } from "@/lib/types/despesaPage.types";
import type { DespesaDados } from "@/lib/types/despesaModal.types";
import { type StatusUI } from "./utils";
import { toast } from "sonner";

export function useDespesa() {
  const { user, isLoading } = useAuth();
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<StatusUI>("todos");
  const [filtroMes, setFiltroMes] = useState<string>(getDefaultMonthFilter());
  const [filtroAno, setFiltroAno] = useState<string>(getCurrentYear());

  const { categorias: categoriasList } = useCategorias({
    natureza: "despesa",
    usuarioId: user?.id,
    incluirInativas: false,
  });

  const [busca, setBusca] = useState<string>("");
  const debouncedBusca = useDebounce(busca.trim());

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [itens, setItens] = useState<DespesaDados[]>([]);
  const [meta, setMeta] = useState<ListMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { dataInicial, dataFinal, MonthSelectComponent } = useFilterDate(
    filtroMes,
    setFiltroMes,
    filtroAno,
    setFiltroAno
  );

  const queryParams = useMemo(() => {
    return {
      usuarioId: user?.id,
      page,
      pageSize,
      categoria: filtroCategoria !== "todas" ? filtroCategoria : undefined,
      status: filtroStatus !== "todos" ? filtroStatus : undefined,
      texto: debouncedBusca || undefined,
      dataInicial,
      dataFinal,
    } satisfies Record<string, string | number | undefined | null>;
  }, [
    user?.id,
    page,
    pageSize,
    filtroCategoria,
    filtroStatus,
    debouncedBusca,
    dataInicial,
    dataFinal,
  ]);

  const carregar = useCallback(async () => {
    if (!user?.id || isLoading) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/despesaApi?${qs(queryParams)}`, {
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error(`Falha ao carregar despesas (${res.status})`);
      const json: ApiListResponse<DespesaDados> = await res.json();
      setItens(json.data);
      setMeta(json.meta);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar dados";
      setErrorMsg(msg);
      setItens([]);
      setMeta((m) => ({ ...m, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [queryParams, user?.id, isLoading]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleSaved = useCallback(() => {
    setPage(1);
    carregar();
  }, [carregar]);

  const { categoriaComMaiorDespesa, totalPages } = useCalcDespesas({
    meta,
    dataInicial,
    dataFinal,
    usuarioId: user?.id,
  });

  const {
    despesasMes: despesasMesFiltradas,
    mediaDespesas: mediaDespesasFiltrada,
    labelDespesas,
    labelMedia,
    temFiltro,
  } = useDespesaCards({
    usuarioId: user?.id,
    dataInicial,
    dataFinal,
    filtroCategoria,
    filtroStatus,
    filtroTexto: debouncedBusca,
  });

  const handleDelete = useCallback(
    async (id?: number) => {
      if (!id) return;
      try {
        const res = await fetch(`/api/despesaApi/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Não foi possível excluir.");

        setItens((prev) => prev.filter((x) => x.id !== id));
        setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));

        setTimeout(() => {
          setItens((curr) => {
            if (curr.length === 0 && page > 1)
              setPage((p) => Math.max(1, p - 1));
            else carregar();
            return curr;
          });
        }, 0);

        toast.success("Despesa excluída com sucesso!", {
          description: "A despesa foi removida do sistema.",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao excluir.";
        toast.error("Erro ao excluir despesa", { description: message });
      }
    },
    [carregar, page]
  );

  const handleBuscaChange = useCallback((value: string) => {
    setPage(1);
    setBusca(value);
  }, []);

  const handleCategoriaChange = useCallback((value: string) => {
    setPage(1);
    setFiltroCategoria(value);
  }, []);

  const handleStatusChange = useCallback((value: StatusUI) => {
    setPage(1);
    setFiltroStatus(value);
  }, []);

  const handlePageSizeChange = useCallback((value: string) => {
    setPage(1);
    setPageSize(Number(value));
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  return {
    // Dados
    user,
    itens,
    meta,
    loading,
    errorMsg,
    busca,
    debouncedBusca,
    categoriasList,
    // Filtros
    filtroCategoria,
    filtroStatus,
    filtroMes,
    filtroAno,
    page,
    pageSize,
    // Handlers
    handleBuscaChange,
    handleCategoriaChange,
    handleStatusChange,
    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage,
    handleSaved,
    handleDelete,
    // Filtros de data
    MonthSelectComponent,
    setFiltroMes,
    setFiltroAno,
    setPage,
    // Cards e cálculos
    categoriaComMaiorDespesa,
    totalPages,
    despesasMesFiltradas,
    mediaDespesasFiltrada,
    labelDespesas,
    labelMedia,
    temFiltro,
  };
}
