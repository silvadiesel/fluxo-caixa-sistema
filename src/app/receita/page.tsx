"use client";

import React, { JSX, useCallback, useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ModalReceita } from "@/components/receitaModal";
import { ModalDelete } from "@/components/deleteModal";
import { BarChart3, DollarSign, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiListResponse, ListMeta } from "@/lib/types/receitaPage.types";
import type { ReceitaDadosUI } from "@/lib/types/receitaModal.types";
import { useCalcReceitas } from "./useCalcReceitas";
import { useFilterDate } from "../../lib/hooks/useFilterDate";
import { toast } from "sonner";
import { getDefaultMonthFilter, formatDateBR } from "@/lib/utils/dateUtils";

// --- Utils ------------------------------------------------------------------
const currencyBR = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
});

const CATEGORIES = [
    { label: "Todas as categorias", value: "todas" },
    { label: "Retirada de Sócio", value: "Retirada de Sócio" },
    { label: "Pix", value: "pix" },
    { label: "Cartão de Débito", value: "debito" },
    { label: "Cartão de Crédito", value: "credito" },
    { label: "Boletos", value: "boletos" },
    { label: "Dinheiro", value: "dinheiro" },
    { label: "Cheque", value: "cheque" },
    { label: "Transferência", value: "transferencia" },
    { label: "Outros", value: "outros" },
] as const;

type StatusUI = "todos" | "Recebido" | "Pendente" | "Cancelado";
type StatusAPI = "pago" | "pendente" | "cancelado";

const uiToApiStatus: Record<Exclude<StatusUI, "todos">, StatusAPI> = {
    Recebido: "pago",
    Pendente: "pendente",
    Cancelado: "cancelado",
};

function qs(params: Record<string, string | number | undefined | null>) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params))
        if (v !== undefined && v !== null && String(v).length) search.set(k, String(v));
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

// --- Component ---------------------------------------------------------------
export default function ReceitaPage(): JSX.Element {
    const { user, isLoading } = useAuth();
    const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
    const [filtroStatus, setFiltroStatus] = useState<StatusUI>("todos");
    const [filtroMes, setFiltroMes] = useState<string>(getDefaultMonthFilter());
    const [busca, setBusca] = useState<string>("");
    const debouncedBusca = useDebounce(busca.trim());

    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    const [itens, setItens] = useState<ReceitaDadosUI[]>([]);
    const [meta, setMeta] = useState<ListMeta>({ page: 1, pageSize: 10, total: 0 });
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { dataInicial, dataFinal, MonthSelectComponent } = useFilterDate(filtroMes, setFiltroMes);

    const queryParams = useMemo(() => {
        return {
            usuarioId: user?.id,
            page,
            pageSize,
            categoria: filtroCategoria !== "todas" ? filtroCategoria : undefined,
            status: filtroStatus !== "todos" ? uiToApiStatus[filtroStatus] : undefined,
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
            const res = await fetch(`/api/receitaApi?${qs(queryParams)}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`Falha ao carregar receitas (${res.status})`);
            const json: ApiListResponse<ReceitaDadosUI> = await res.json();
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

    const {
        receitasMes,
        mediaReceitas,
        categoriaComMaiorReceita,
        totalPages,
        percentualMesAnterior,
    } = useCalcReceitas({ itens, meta, dataInicial, dataFinal });

    const handleDelete = useCallback(
        async (id: number) => {
            try {
                const res = await fetch(`/api/receitaApi/${id}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Não foi possível excluir.");

                setItens((prev) => prev.filter((x) => x.id !== id));
                setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));

                setTimeout(() => {
                    setItens((curr) => {
                        if (curr.length === 0 && page > 1) setPage((p) => Math.max(1, p - 1));
                        else carregar();
                        return curr;
                    });
                }, 0);

                toast.success("Receita excluída com sucesso!", {
                    description: "A receita foi removida do sistema.",
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao excluir.";
                toast.error("Erro ao excluir receita", { description: message });
            }
        },
        [carregar, page]
    );

    return (
        <ProtectedRoute>
            <header className="bg-card border-b border-border p-6">
                <div className="flex md:flex-row flex-col gap-2 md:gap-0 md:items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Receitas</h1>
                        <p className="text-muted-foreground">Gerencie todas as suas receitas</p>
                    </div>
                    {user?.id && <ModalReceita usuarioId={user.id} onSave={handleSaved} />}
                </div>
            </header>

            <main className="p-6 space-y-6">
                {/* Cards resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">
                                Categoria com Maior Receita
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-900">
                                {currencyBR.format(categoriaComMaiorReceita.valor)}
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                                {categoriaComMaiorReceita.categoria}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">
                                Receitas do Mês
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-900">
                                {currencyBR.format(receitasMes)}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                {percentualMesAnterior !== 0 ? (
                                    <>
                                        {percentualMesAnterior > 0 ? "+" : ""}
                                        {percentualMesAnterior.toFixed(1)}% vs mês anterior
                                    </>
                                ) : (
                                    "Referente ao mês atual"
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-800">
                                Média por Receita
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-900">
                                {currencyBR.format(mediaReceitas)}
                            </div>
                            <p className="text-xs text-purple-600 mt-1">Valor médio</p>
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
                                        placeholder="Buscar por Receitas..."
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
                                    {CATEGORIES.map((categories) => (
                                        <SelectItem key={categories.value} value={categories.value}>
                                            {categories.label}
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
                                    {(
                                        ["todos", "Recebido", "Pendente", "Cancelado"] as StatusUI[]
                                    ).map((status) => (
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
                                setFiltroMes={setFiltroMes}
                                setPage={setPage}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Receitas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Receitas</CardTitle>
                        <CardDescription>
                            {loading
                                ? "Carregando..."
                                : `${meta.total} receita(s) encontrada(s)${
                                      debouncedBusca ? ` para "${debouncedBusca}"` : ""
                                  }`}
                            {errorMsg ? (
                                <span className="ml-2 text-destructive">{errorMsg}</span>
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

                            {itens.map((receita) => (
                                <div
                                    key={receita.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                                    )}
                                >
                                    <div className="flex md:flex-row flex-col items-center space-x-4">
                                        <div className="p-2 md:flex hidden rounded-full bg-green-100 text-green-600">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {receita.descricao}
                                            </p>
                                            <div className="flex md:flex-row flex-col items-start md:items-center space-x-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {receita.categoria}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDateBR(receita.data)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-row flex-col items-center space-x-4">
                                        <div className="text-right ">
                                            <p className="font-semibold text-green-600">
                                                {currencyBR.format(receita.valor)}
                                            </p>
                                            <Badge
                                                variant={
                                                    receita.status === "Recebido"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                                className="text-xs"
                                            >
                                                {receita.status}
                                            </Badge>
                                        </div>
                                        <div className="flex space-x-2">
                                            {user?.id && (
                                                <ModalReceita
                                                    receita={receita}
                                                    usuarioId={user.id}
                                                    onSave={handleSaved}
                                                />
                                            )}
                                            <ModalDelete
                                                itemName={receita.descricao}
                                                itemType="receita"
                                                onConfirm={() => handleDelete(receita.id)}
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
