"use client";

import { ModalDespesa } from "@/components/despesaModal";
import { ModalReceita } from "@/components/receitaModal";
import { Sidebar } from "@/components/sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, TrendingDown } from "lucide-react";
import { useUltimasAtividades } from "@/lib/hooks/useUltimasAtividades";
import { useResumoFinanceiro } from "@/lib/hooks/useResumoFinanceiro";
import { useAuth } from "@/lib/hooks/useAuth";

export default function HomePage() {
    const { user } = useAuth();
    const {
        atividades,
        loading,
        error,
        refetch: refetchAtividades,
    } = useUltimasAtividades(user?.id || 0);
    const {
        resumo,
        loading: loadingResumo,
        error: errorResumo,
        refetch: refetchResumo,
    } = useResumoFinanceiro(user?.id || 0);

    const handleDataUpdate = () => {
        refetchAtividades();
        refetchResumo();
    };

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 overflow-auto">
                    <header className="bg-card border-b border-border p-6">
                        <div className="flex flex-col md:gap-0 gap-2 md:flex-row md:items-center justify-between">
                            <div>
                                <h1 className="text-sm">Olá {user?.nome || "Usuário"}</h1>
                                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                                <p className="text-muted-foreground text-sm">
                                    Visão geral do seu fluxo de caixa
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                {user?.id && (
                                    <ModalReceita usuarioId={user.id} onSave={handleDataUpdate} />
                                )}
                                {user?.id && (
                                    <ModalDespesa usuarioId={user.id} onSave={handleDataUpdate} />
                                )}
                            </div>
                        </div>
                    </header>

                    <main className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-orange-50 border-orange-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-orange-800">
                                        Categoria de Maior Impacto
                                    </CardTitle>
                                    <TrendingDown className="h-4 w-4 text-orange-600" />
                                </CardHeader>
                                <CardContent>
                                    {loadingResumo ? (
                                        <div className="text-sm text-orange-600">Carregando...</div>
                                    ) : errorResumo ? (
                                        <div className="text-sm text-red-600">Erro ao carregar</div>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold text-orange-900">
                                                R${" "}
                                                {(
                                                    resumo.categoriaMaisImpactante?.valor || 0
                                                ).toLocaleString("pt-BR", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </div>
                                            <p className="text-xs text-orange-600 mt-1">
                                                {resumo.categoriaMaisImpactante?.categoria}
                                            </p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-green-50 border-green-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-green-800">
                                        Entradas do Mês
                                    </CardTitle>
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    {loadingResumo ? (
                                        <div className="text-sm text-green-600">Carregando...</div>
                                    ) : errorResumo ? (
                                        <div className="text-sm text-red-600">Erro ao carregar</div>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold text-green-900">
                                                R${" "}
                                                {resumo.entradasMes.toLocaleString("pt-BR", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </div>
                                            <p className="text-xs text-green-600 mt-1">
                                                Total de receitas do mês atual
                                            </p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-red-50 border-red-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-red-800">
                                        Saídas do Mês
                                    </CardTitle>
                                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    {loadingResumo ? (
                                        <div className="text-sm text-red-600">Carregando...</div>
                                    ) : errorResumo ? (
                                        <div className="text-sm text-red-600">Erro ao carregar</div>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold text-red-900">
                                                R${" "}
                                                {resumo.saidasMes.toLocaleString("pt-BR", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </div>
                                            <p className="text-xs text-red-600 mt-1">
                                                Total de despesas do mês atual
                                            </p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Transações Recentes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Últimas Atividades</CardTitle>
                                <CardDescription>
                                    Últimas movimentações do seu fluxo de caixa
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center p-6">
                                        <div className="text-muted-foreground">
                                            Carregando atividades...
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center p-6">
                                        <div className="text-red-600">
                                            Erro ao carregar atividades: {error}
                                        </div>
                                    </div>
                                ) : atividades.length === 0 ? (
                                    <div className="flex items-center justify-center p-6">
                                        <div className="text-muted-foreground">
                                            Nenhuma atividade encontrada
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {atividades.map((atividade) => (
                                            <div
                                                key={`${atividade.tipo}-${atividade.id}`}
                                                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className={`p-2 rounded-full ${
                                                            atividade.tipo === "entrada"
                                                                ? "bg-green-100 text-green-600"
                                                                : "bg-red-100 text-red-600"
                                                        }`}
                                                    >
                                                        {atividade.tipo === "entrada" ? (
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        ) : (
                                                            <ArrowDownRight className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {atividade.descricao}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(
                                                                atividade.data
                                                            ).toLocaleDateString("pt-BR")}{" "}
                                                            • {atividade.categoria}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`font-semibold ${
                                                            atividade.tipo === "entrada"
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }`}
                                                    >
                                                        {atividade.tipo === "entrada" ? "+" : "-"}R${" "}
                                                        {atividade.valor.toLocaleString("pt-BR", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                    <Badge
                                                        variant={
                                                            atividade.tipo === "entrada"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {atividade.tipo === "entrada"
                                                            ? "Receita"
                                                            : "Despesa"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
