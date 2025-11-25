"use client";

import { useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  PieChart,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRelatorio } from "@/lib/hooks/useRelatorio";
import { ModalPeriodoRelatorio } from "@/components/periodoRelatorioModal";
import { ChartRelatorio } from "@/components/chartRelatorio";
import { gerarPDFRelatorio } from "@/components/createPDF";
import { toast } from "sonner";

export default function RelatorioPage() {
  const { user } = useAuth();
  const { loading, dados, error, gerarRelatorio } = useRelatorio();

  const [periodo, setPeriodo] = useState<
    "mes-atual" | "trimestre" | "ano" | "personalizado"
  >("mes-atual");

  const [modalOpen, setModalOpen] = useState(false);

  // Quando mudar período (exceto personalizado), chama o relatório automático
  useEffect(() => {
    if (user?.id && periodo !== "personalizado") {
      gerarRelatorio(user.id, periodo);
    }
  }, [user?.id, periodo, gerarRelatorio]);

  const handlePeriodoChange = (value: string) => {
    const novoPeriodo = value as typeof periodo;
    setPeriodo(novoPeriodo);

    if (novoPeriodo === "personalizado") {
      setModalOpen(true);
    }
  };

  const handleConfirmarDatasPersonalizadas = (
    dataInicial: string,
    dataFinal: string
  ) => {
    if (user?.id) {
      gerarRelatorio(user.id, "personalizado", dataInicial, dataFinal);
    }
    setModalOpen(false);
  };

  const dadosDRE = dados?.dre || {
    receitaBruta: 0,
    deducoes: {
      imposto: 0,
    },
    receitaLiquida: 0,
    custoServicos: {
      fornecedores: 0,
      servicosTerceiros: 0,
      fretes: 0,
      total: 0,
    },
    lucroBruto: 0,
    despesasOperacionais: {
      salarios: 0,
      impostoSalarios: 0,
      despesasPessoal: 0,
      contadorOutros: 0,
      aguaLuz: 0,
      internetTelefone: 0,
      despesasOficina: 0,
      despesasPessoais: 0,
      proLabore: 0,
      total: 0,
    },
    resultadoOperacional: 0,
    despesasFinanceiras: {
      emprestimos: 0,
      jurosTaxas: 0,
      total: 0,
    },
    jurosPagos: 0,
    lucro: 0,
  };

  const totalReceitasRecebidasPeriodo = (
    dados?.detalhamento?.receitas ?? []
  ).reduce((total, receita) => total + (receita.total ?? 0), 0);

  const receitaBrutaPeriodo =
    totalReceitasRecebidasPeriodo > 0
      ? totalReceitasRecebidasPeriodo
      : dadosDRE.receitaBruta;

  const comparativoMensal = dados?.evolucaoMensal || [];
  // Pegar os últimos 6 meses para o gráfico
  const dadosGrafico = comparativoMensal.slice(-6);
  const dadosTabela = comparativoMensal.slice(-3);

  const indicadores = dados?.indicadores || {
    margemBruta: 0,
    margemOperacional: 0,
    margemLiquida: 0,
  };

  const classificarMargem = (valor: number) => {
    if (valor >= 30)
      return { texto: "Excelente", cor: "text-green-600 border-green-300" };
    if (valor >= 20)
      return { texto: "Muito Bom", cor: "text-blue-600 border-blue-300" };
    if (valor >= 10)
      return { texto: "Bom", cor: "text-purple-600 border-purple-300" };
    if (valor >= 0)
      return { texto: "Regular", cor: "text-orange-600 border-orange-300" };
    return { texto: "Negativo", cor: "text-red-600 border-red-300" };
  };

  const handleExportarPDF = async () => {
    if (!dados) {
      toast.error("Nenhum relatório disponível para exportar");
      return;
    }

    try {
      await gerarPDFRelatorio(dados);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <ProtectedRoute>
      <ModalPeriodoRelatorio
        open={modalOpen}
        onOpenChange={setModalOpen}
        onConfirm={handleConfirmarDatasPersonalizadas}
      />

      <header className="bg-card border-b border-border p-6">
        <div className="flex flex-col gap-2 md:gap-0 md:flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Relatórios Financeiros
            </h1>
            <p className="text-muted-foreground">
              Demonstrativo de Resultado do Exercício (DRE)
            </p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-2 md:gap-4">
            <Select value={periodo} onValueChange={handlePeriodoChange}>
              <SelectTrigger className="md:w-48 w-1/2">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes-atual">Mês Atual</SelectItem>
                <SelectItem value="trimestre">Trimestre (3 meses)</SelectItem>
                <SelectItem value="ano">Ano Atual</SelectItem>
                <SelectItem value="personalizado">
                  Período Personalizado
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleExportarPDF}
              disabled={!dados || loading}
              className="w-1/2 md:w-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {error && !loading && (
          <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              Gerando relatório...
            </span>
          </div>
        )}

        {!loading && (
          <>
            {/* Cards principais */}
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
                    R{"$ "}
                    {dadosDRE.receitaLiquida.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {/* Quando tiver comparativo real, a gente troca esse fixo */}
                    +8% vs mês anterior
                  </p>
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
                    R{"$ "}
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
                    Resultado Operacional
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">
                    R{"$ "}
                    {dadosDRE.resultadoOperacional.toLocaleString("pt-BR", {
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
                    Lucro
                  </CardTitle>
                  <PieChart className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    R{"$ "}
                    {dadosDRE.lucro.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Margem: {indicadores.margemLiquida}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* DRE + Indicadores + Gráfico */}
            <div className="flex gap-6 w-full">
              {/* DRE detalhado */}
              <Card className="w-1/2">
                <CardHeader>
                  <CardTitle>Demonstrativo de Resultado (DRE)</CardTitle>
                  <CardDescription>
                    Estrutura completa do resultado financeiro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Receita Bruta</span>
                      <span className="font-semibold text-green-600">
                        R{"$ "}
                        {receitaBrutaPeriodo.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 pl-4">
                      <span className="text-muted-foreground">(-) Imposto</span>
                      <span className="text-red-600">
                        R{"$ "}
                        {dadosDRE.deducoes.imposto.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b font-medium bg-green-50 px-2 rounded">
                      <span>Receita Líquida</span>
                      <span className="text-green-700">
                        R{"$ "}
                        {dadosDRE.receitaLiquida.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Fornecedores
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.custoServicos.fornecedores.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Serviços de Terceiros
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.custoServicos.servicosTerceiros.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Fretes
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.custoServicos.fretes.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b font-medium bg-blue-50 px-2 rounded">
                      <span>Lucro Bruto</span>
                      <span className="text-blue-700">
                        R{"$ "}
                        {dadosDRE.lucroBruto.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="pl-4 space-y-1">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Salários
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasOperacionais.salarios.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Imposto s/ Salários
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasOperacionais.impostoSalarios.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Despesas com Pessoal
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasOperacionais.despesasPessoal.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Contador e Outros
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasOperacionais.contadorOutros.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Água e Luz
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasOperacionais.aguaLuz.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Internet e Telefone
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasOperacionais.internetTelefone.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Despesas Oficina
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasOperacionais.despesasOficina.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Despesas Pessoais
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasOperacionais.despesasPessoais.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Pró-labore
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasOperacionais.proLabore.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b font-medium bg-purple-50 px-2 rounded">
                      <span>Resultado Operacional</span>
                      <span className="text-purple-700">
                        R{"$ "}
                        {dadosDRE.resultadoOperacional.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="pl-4 space-y-1 pt-2">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Empréstimos
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasFinanceiras.emprestimos.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">
                          (-) Juros/Taxas Bancárias
                        </span>
                        <span className="text-red-600 text-sm">
                          R{"$ "}
                          {dadosDRE.despesasFinanceiras.jurosTaxas.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 border-t-2 font-bold bg-orange-50 px-2 rounded">
                      <span>Lucro</span>
                      <span className="text-orange-700 text-lg">
                        R{"$ "}
                        {dadosDRE.lucro.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Indicadores + Gráfico */}
              <div className="w-1/2 flex flex-col gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Indicadores de Performance</CardTitle>
                    <CardDescription>
                      Principais métricas financeiras
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">
                            Margem Bruta
                          </p>
                          <p className="text-sm text-green-600">
                            Lucro Bruto / Receita Líquida
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-700">
                            {indicadores.margemBruta.toFixed(2)}%
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              classificarMargem(indicadores.margemBruta).cor
                            }
                          >
                            {classificarMargem(indicadores.margemBruta).texto}
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
                            {indicadores.margemOperacional.toFixed(2)}%
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              classificarMargem(indicadores.margemOperacional)
                                .cor
                            }
                          >
                            {
                              classificarMargem(indicadores.margemOperacional)
                                .texto
                            }
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
                            {indicadores.margemLiquida.toFixed(2)}%
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              classificarMargem(indicadores.margemLiquida).cor
                            }
                          >
                            {classificarMargem(indicadores.margemLiquida).texto}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ChartRelatorio data={dadosGrafico} />
              </div>
            </div>

            {/* Evolução mensal */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>
                  Comparativo dos últimos 3 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dadosTabela.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Sem dados para exibir
                  </p>
                ) : (
                  <div className="space-y-4">
                    {dadosTabela.map((mes, index) => (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 md:flex hidden items-center justify-center">
                            <span className="font-semibold text-primary">
                              {mes.mes}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {mes.mes} {mes.ano}
                            </p>
                            <p className="text-sm pb-2 text-muted-foreground">
                              Margem:{" "}
                              {mes.receitas > 0
                                ? ((mes.lucro / mes.receitas) * 100).toFixed(1)
                                : 0}
                              %
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-8 text-right">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Receitas
                            </p>
                            <p className="font-semibold text-green-600">
                              R{"$ "}
                              {mes.receitas.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Despesas
                            </p>
                            <p className="font-semibold text-red-600">
                              R{"$ "}
                              {mes.despesas.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Lucro
                            </p>
                            <p
                              className={`font-semibold ${
                                mes.lucro >= 0
                                  ? "text-blue-600"
                                  : "text-red-600"
                              }`}
                            >
                              R{"$ "}
                              {mes.lucro.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
