"use client";

import FullCalendarComponent from "@/components/calendar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useFinancialData } from "@/lib/hooks/useFinancialData";
import { formatDateBR } from "@/lib/utils/dateUtils";

export default function CalendarioPage() {
    const { user } = useAuth();
    const [filtroStatus, setFiltroStatus] = useState("todas");

    const { despesasReceitas, loading, error, refreshData } = useFinancialData(user?.id || 0);

    const dadosProcessados = useMemo(() => {
        const hoje = new Date();

        return despesasReceitas
            .filter((item) => item.tipo === "despesa")
            .map((item) => {
                const dataVencimento = new Date(item.data);
                const diasRestantes = Math.ceil(
                    (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
                );

                return {
                    ...item,
                    valor: item.valor,
                    dataVencimento: item.data,
                    diasRestantes,
                };
            });
    }, [despesasReceitas]);

    const dadosFiltrados = dadosProcessados.filter((item) => {
        if (filtroStatus === "todas") return true;
        if (filtroStatus === "vencidas") return item.diasRestantes < 0;
        if (filtroStatus === "proximas") return item.diasRestantes >= 0 && item.diasRestantes <= 7;
        if (filtroStatus === "pendentes") return item.status.toLowerCase() === "pendente";

        return true;
    });

    const getStatusColor = (status: string, diasRestantes: number, tipo: string) => {
        if (diasRestantes < 0) return "bg-red-100 text-red-800 border-red-200";
        if (diasRestantes <= 3) return "bg-orange-100 text-orange-800 border-orange-200";
        if (diasRestantes <= 7) return "bg-yellow-100 text-yellow-800 border-yellow-200";
        if (tipo === "receita") return "bg-green-100 text-green-800 border-green-200";
        return "bg-blue-100 text-blue-800 border-blue-200";
    };

    const getStatusIcon = (status: string, diasRestantes: number, tipo: string) => {
        if (diasRestantes < 0) return <AlertTriangle className="h-4 w-4" />;
        if (diasRestantes <= 3) return <AlertTriangle className="h-4 w-4" />;
        if (tipo === "receita") return <TrendingUp className="h-4 w-4" />;
        return <Clock className="h-4 w-4" />;
    };

    const totalVencidas = dadosProcessados
        .filter((d) => d.diasRestantes < 0 && d.tipo === "despesa")
        .reduce((acc, d) => acc + d.valor, 0);
    const totalProximas = dadosProcessados
        .filter((d) => d.diasRestantes >= 0 && d.diasRestantes <= 7)
        .reduce((acc, d) => acc + d.valor, 0);
    const totalReceitas = dadosProcessados
        .filter((d) => d.tipo === "receita")
        .reduce((acc, d) => acc + d.valor, 0);

    return (
        <ProtectedRoute>
            <header className="bg-card border-b border-border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Calendário de Vencimentos
                        </h1>
                        <p className="text-muted-foreground">
                            Acompanhe as despesas que vão vencer
                        </p>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-red-50 border-red-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-800">
                                Despesas Vencidas
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-900">
                                R${" "}
                                {totalVencidas.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <p className="text-xs text-red-600 mt-1">Requer atenção imediata</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-50 border-orange-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-800">
                                Próximas (7 dias)
                            </CardTitle>
                            <Clock className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-900">
                                R${" "}
                                {totalProximas.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <p className="text-xs text-orange-600 mt-1">Vencimento próximo</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">
                                Total Receitas
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-900">
                                R${" "}
                                {totalReceitas.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <p className="text-xs text-green-600 mt-1">Receitas do período</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="hidden md:flex">
                        <CardContent className="flex justify-center">
                            {user?.id && <FullCalendarComponent usuarioId={user.id} />}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Filtros de Despesas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Status</label>
                                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todas">Todas</SelectItem>
                                            <SelectItem value="vencidas">Vencidas</SelectItem>
                                            <SelectItem value="proximas">
                                                Próximas (7 dias)
                                            </SelectItem>
                                            <SelectItem value="pendentes">Pendentes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Lista de Despesas</CardTitle>
                                <CardDescription>
                                    {loading
                                        ? "Carregando despesas..."
                                        : `${dadosFiltrados.length} despesa(s) encontrada(s)`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                        <p className="text-red-800 text-sm">{error}</p>
                                        <button
                                            onClick={refreshData}
                                            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                                        >
                                            Tentar novamente
                                        </button>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {dadosFiltrados.map((item) => (
                                        <div
                                            key={`${item.tipo}-${item.id}`}
                                            className="flex md:flex-row flex-col gap-2 md:gap-0 md:items-center md:justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`p-2 rounded-full md:flex hidden ${getStatusColor(
                                                        item.status,
                                                        item.diasRestantes,
                                                        item.tipo
                                                    )}`}
                                                >
                                                    {getStatusIcon(
                                                        item.status,
                                                        item.diasRestantes,
                                                        item.tipo
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground text-sm">
                                                        {item.descricao}
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {item.categoria}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDateBR(item.dataVencimento)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:text-right flex md:flex-col items-center md:items-end gap-2">
                                                <p className="font-semibold text-sm text-red-600">
                                                    R${" "}
                                                    {item.valor.toLocaleString("pt-BR", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.diasRestantes > 0
                                                        ? `${item.diasRestantes} dias`
                                                        : item.diasRestantes === 0
                                                        ? "Hoje"
                                                        : `${Math.abs(
                                                              item.diasRestantes
                                                          )} dias atraso`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
