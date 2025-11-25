"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, DollarSign, Search, TrendingDown } from "lucide-react";
import { ModalDespesa } from "@/components/despesaModal";
import { ModalDelete } from "@/components/deleteModal";
import { toast } from "sonner";

import type { DespesaDados } from "@/lib/types/despesaModal.types";
import type { ApiListResponse, ListMeta } from "@/lib/types/despesaPage.types";
import { useCalcDespesas } from "./useCalcDespesas";
import { useDespesaCards } from "./useDespesaCards";
import { useFilterDate } from "@/lib/hooks/useFilterDate";
import { useCategorias } from "@/lib/hooks/useCategorias";
import {
  getDefaultMonthFilter,
  formatDateBR,
  getCurrentYear,
} from "@/lib/utils/dateUtils";

// -----------------------------------------------------------------------------
const currencyBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const STATUS = ["todos", "pago", "pendente", "cancelado"] as const;
type StatusUI = (typeof STATUS)[number];

function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && String(v).length)
      search.set(k, String(v));
  return search.toString();
}

function useDebounce<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// -----------------------------------------------------------------------------
export default function DespesaPage() {
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

  // Hook para calcular os cards baseado nos filtros
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

  return (
    <ProtectedRoute>
      <header className="bg-card border-b border-border p-6">
        <div className="flex md:items-center md:flex-row flex-col gap-2 md:gap-0 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Despesas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as suas despesas
            </p>
          </div>
          {user?.id && (
            <ModalDespesa onSave={handleSaved} usuarioId={user.id} />
          )}
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Cards resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                Categoria com Maior Despesa
              </CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">
                {currencyBR.format(categoriaComMaiorDespesa.valor)}
              </div>
              <p className="text-xs text-red-600 mt-1">
                {categoriaComMaiorDespesa.categoria}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                {labelDespesas}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {currencyBR.format(despesasMesFiltradas)}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                {temFiltro ? "Valores filtrados" : "Referente ao mês atual"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">
                {labelMedia}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {currencyBR.format(mediaDespesasFiltrada)}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {temFiltro
                  ? "Média das despesas filtradas"
                  : "Valor médio por transação"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por despesas..."
                    value={busca}
                    onChange={(e) => {
                      setPage(1);
                      setBusca(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={filtroCategoria}
                onValueChange={(value) => {
                  setPage(1);
                  setFiltroCategoria(value);
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {categoriasList.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.nome}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtroStatus}
                onValueChange={(value: StatusUI) => {
                  setPage(1);
                  setFiltroStatus(value);
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPage(1);
                  setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((number) => (
                    <SelectItem key={number} value={String(number)}>
                      {number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <MonthSelectComponent
                filtroMes={filtroMes}
                filtroAno={filtroAno}
                setFiltroMes={setFiltroMes}
                setFiltroAno={setFiltroAno}
                setPage={setPage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Despesas</CardTitle>
            <CardDescription>
              {loading
                ? "Carregando..."
                : `${meta.total} despesa(s) encontrada(s)${
                    debouncedBusca ? ` para "${debouncedBusca}"` : ""
                  }`}
              {errorMsg ? (
                <span className="ml-2 text-destructive">— {errorMsg}</span>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!loading && itens.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum registro encontrado.
                </p>
              ) : null}

              {itens.map((despesa) => (
                <div
                  key={despesa.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex md:items-center items-start space-x-4 flex-1 min-w-0">
                    <div className="p-2 md:flex hidden rounded-full bg-red-100 text-red-600">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {despesa.descricao}
                      </p>
                      <div className="flex md:flex-row flex-col items-start md:items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {despesa.categoria}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDateBR(despesa.data)}
                        </span>
                      </div>
                      {despesa.observacoes && despesa.observacoes.trim() && (
                        <p className="md:flex hidden text-sm text-muted-foreground pt-1">
                          <span className="font-semibold">Observação:</span>{" "}
                          {despesa.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center space-x-4 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="font-semibold text-red-600 whitespace-nowrap">
                        {currencyBR.format(
                          typeof despesa.valor === "string"
                            ? parseFloat(despesa.valor)
                            : despesa.valor
                        )}
                      </p>
                      <Badge
                        variant={
                          despesa.status === "pago" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {despesa.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      {user?.id && (
                        <ModalDespesa
                          despesa={despesa}
                          usuarioId={user.id}
                          onSave={handleSaved}
                        />
                      )}
                      <ModalDelete
                        itemName={despesa.descricao}
                        itemType="despesa"
                        onConfirm={() => handleDelete(despesa.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex md:flex-row flex-col items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {meta.page} de {totalPages}
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={loading || page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </ProtectedRoute>
  );
}
