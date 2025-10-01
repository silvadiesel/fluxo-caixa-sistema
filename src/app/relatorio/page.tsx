"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import { BarChart3, Calendar, DollarSign, FileText, PieChart, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function RelatorioPage() {
    const [periodo, setPeriodo] = useState("mes-atual");

    // Dados mockados baseados no DRE
    const dadosDRE = {
        receitaBruta: 45000.0,
        deducoes: 2250.0, // 5% de impostos/devoluções
        receitaLiquida: 42750.0,
        custoProdutos: 18000.0,
        lucroBruto: 24750.0,
        despesasOperacionais: {
            vendas: 3500.0,
            administrativas: 5200.0,
            financeiras: 800.0,
            total: 9500.0,
        },
        lucroOperacional: 15250.0,
        outrasReceitas: 500.0,
        outrasDespesas: 300.0,
        lucroAntesImposto: 15450.0,
        impostoRenda: 2317.5, // 15%
        lucroLiquido: 13132.5,
    };

    const comparativoMensal = [
        { mes: "Jan", receitas: 38000, despesas: 25000, lucro: 13000 },
        { mes: "Fev", receitas: 42000, despesas: 28000, lucro: 14000 },
        { mes: "Mar", receitas: 45000, despesas: 31868, lucro: 13132 },
    ];

    const indicadores = {
        margemBruta: ((dadosDRE.lucroBruto / dadosDRE.receitaLiquida) * 100).toFixed(1),
        margemOperacional: ((dadosDRE.lucroOperacional / dadosDRE.receitaLiquida) * 100).toFixed(1),
        margemLiquida: ((dadosDRE.lucroLiquido / dadosDRE.receitaLiquida) * 100).toFixed(1),
        roe: 18.5, // Return on Equity mockado
    };

    return (
        <ProtectedRoute>
            <header className="bg-card border-b border-border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Relatórios Financeiros
                        </h1>
                        <p className="text-muted-foreground">
                            Demonstrativo de Resultado do Exercício (DRE)
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Select value={periodo} onValueChange={setPeriodo}>
                            <SelectTrigger className="w-48">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mes-atual">Mês Atual</SelectItem>
                                <SelectItem value="trimestre">Trimestre</SelectItem>
                                <SelectItem value="ano">Ano</SelectItem>
                                <SelectItem value="personalizado">Período Personalizado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            Exportar PDF
                        </Button>
                    </div>
                </div>
            </header>

            {/* Conteúdo */}
            <main className="p-6 space-y-6">
                {/* Indicadores Principais */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">
                                Receita Líquida
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-900">
                                R${" "}
                                {dadosDRE.receitaLiquida.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <p className="text-xs text-green-600 mt-1">+8% vs mês anterior</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">
                                Lucro Bruto
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-900">
                                R${" "}
                                {dadosDRE.lucroBruto.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                Margem: {indicadores.margemBruta}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-800">
                                Lucro Operacional
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-900">
                                R${" "}
                                {dadosDRE.lucroOperacional.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <p className="text-xs text-purple-600 mt-1">
                                Margem: {indicadores.margemOperacional}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-50 border-orange-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-800">
                                Lucro Líquido
                            </CardTitle>
                            <PieChart className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-900">
                                R${" "}
                                {dadosDRE.lucroLiquido.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <p className="text-xs text-orange-600 mt-1">
                                Margem: {indicadores.margemLiquida}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* DRE Detalhado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Demonstrativo de Resultado (DRE)</CardTitle>
                            <CardDescription>
                                Estrutura completa do resultado financeiro
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="font-medium">Receita Bruta</span>
                                    <span className="font-semibold text-green-600">
                                        R${" "}
                                        {dadosDRE.receitaBruta.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 pl-4">
                                    <span className="text-muted-foreground">(-) Deduções</span>
                                    <span className="text-red-600">
                                        R${" "}
                                        {dadosDRE.deducoes.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b font-medium bg-green-50 px-2 rounded">
                                    <span>Receita Líquida</span>
                                    <span className="text-green-700">
                                        R${" "}
                                        {dadosDRE.receitaLiquida.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 pl-4">
                                    <span className="text-muted-foreground">
                                        (-) Custo dos Produtos
                                    </span>
                                    <span className="text-red-600">
                                        R${" "}
                                        {dadosDRE.custoProdutos.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b font-medium bg-blue-50 px-2 rounded">
                                    <span>Lucro Bruto</span>
                                    <span className="text-blue-700">
                                        R${" "}
                                        {dadosDRE.lucroBruto.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="pl-4 space-y-2">
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-muted-foreground text-sm">
                                            (-) Despesas de Vendas
                                        </span>
                                        <span className="text-red-600 text-sm">
                                            R${" "}
                                            {dadosDRE.despesasOperacionais.vendas.toLocaleString(
                                                "pt-BR",
                                                { minimumFractionDigits: 2 }
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-muted-foreground text-sm">
                                            (-) Despesas Administrativas
                                        </span>
                                        <span className="text-red-600 text-sm">
                                            R${" "}
                                            {dadosDRE.despesasOperacionais.administrativas.toLocaleString(
                                                "pt-BR",
                                                {
                                                    minimumFractionDigits: 2,
                                                }
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-muted-foreground text-sm">
                                            (-) Despesas Financeiras
                                        </span>
                                        <span className="text-red-600 text-sm">
                                            R${" "}
                                            {dadosDRE.despesasOperacionais.financeiras.toLocaleString(
                                                "pt-BR",
                                                {
                                                    minimumFractionDigits: 2,
                                                }
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b font-medium bg-purple-50 px-2 rounded">
                                    <span>Lucro Operacional</span>
                                    <span className="text-purple-700">
                                        R${" "}
                                        {dadosDRE.lucroOperacional.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 pl-4">
                                    <span className="text-muted-foreground">
                                        (+) Outras Receitas
                                    </span>
                                    <span className="text-green-600">
                                        R${" "}
                                        {dadosDRE.outrasReceitas.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 pl-4">
                                    <span className="text-muted-foreground">
                                        (-) Outras Despesas
                                    </span>
                                    <span className="text-red-600">
                                        R${" "}
                                        {dadosDRE.outrasDespesas.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 pl-4">
                                    <span className="text-muted-foreground">
                                        (-) Imposto de Renda
                                    </span>
                                    <span className="text-red-600">
                                        R${" "}
                                        {dadosDRE.impostoRenda.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-t-2 font-bold bg-orange-50 px-2 rounded">
                                    <span>Lucro Líquido</span>
                                    <span className="text-orange-700 text-lg">
                                        R${" "}
                                        {dadosDRE.lucroLiquido.toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Indicadores de Performance</CardTitle>
                            <CardDescription>Principais métricas financeiras</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-green-800">Margem Bruta</p>
                                        <p className="text-sm text-green-600">
                                            Lucro Bruto / Receita Líquida
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-700">
                                            {indicadores.margemBruta}%
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="text-green-600 border-green-300"
                                        >
                                            Excelente
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-blue-800">
                                            Margem Operacional
                                        </p>
                                        <p className="text-sm text-blue-600">
                                            Lucro Operacional / Receita Líquida
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-700">
                                            {indicadores.margemOperacional}%
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="text-blue-600 border-blue-300"
                                        >
                                            Muito Bom
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-purple-800">
                                            Margem Líquida
                                        </p>
                                        <p className="text-sm text-purple-600">
                                            Lucro Líquido / Receita Líquida
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-purple-700">
                                            {indicadores.margemLiquida}%
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="text-purple-600 border-purple-300"
                                        >
                                            Bom
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-orange-800">ROE</p>
                                        <p className="text-sm text-orange-600">
                                            Retorno sobre Patrimônio
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-orange-700">
                                            {indicadores.roe}%
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="text-orange-600 border-orange-300"
                                        >
                                            Satisfatório
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Comparativo Mensal */}
                <Card>
                    <CardHeader>
                        <CardTitle>Evolução Mensal</CardTitle>
                        <CardDescription>Comparativo dos últimos 3 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {comparativoMensal.map((mes, index) => (
                                <div
                                    key={mes.mes}
                                    className="flex items-center justify-between p-4 rounded-lg border"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="font-semibold text-primary">
                                                {mes.mes}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {mes.mes === "Jan"
                                                    ? "Janeiro"
                                                    : mes.mes === "Fev"
                                                    ? "Fevereiro"
                                                    : "Março"}{" "}
                                                2024
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Margem:{" "}
                                                {((mes.lucro / mes.receitas) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-8 text-right">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Receitas
                                            </p>
                                            <p className="font-semibold text-green-600">
                                                R$ {mes.receitas.toLocaleString("pt-BR")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Despesas
                                            </p>
                                            <p className="font-semibold text-red-600">
                                                R$ {mes.despesas.toLocaleString("pt-BR")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Lucro</p>
                                            <p className="font-semibold text-blue-600">
                                                R$ {mes.lucro.toLocaleString("pt-BR")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </ProtectedRoute>
    );
}
