import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRelatorio as useRelatorioHook } from "@/lib/hooks/useRelatorio";
import { gerarPDFRelatorio } from "@/components/createPDF";
import { toast } from "sonner";

export function useRelatorio() {
  const { user } = useAuth();
  const { loading, dados, error, gerarRelatorio } = useRelatorioHook();

  const [periodo, setPeriodo] = useState<
    "mes-atual" | "trimestre" | "ano" | "personalizado"
  >("mes-atual");

  const [modalOpen, setModalOpen] = useState(false);
  const lastPeriodoRef = useRef<string | null>(null);
  const lastUserIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (
      user?.id &&
      periodo !== "personalizado" &&
      (lastPeriodoRef.current !== periodo || lastUserIdRef.current !== user.id)
    ) {
      lastPeriodoRef.current = periodo;
      lastUserIdRef.current = user.id;
      gerarRelatorio(user.id, periodo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, periodo]);

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

  const dadosDRE = useMemo(() => {
    return (
      dados?.dre || {
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
      }
    );
  }, [dados?.dre]);

  const totalReceitasRecebidasPeriodo = useMemo(() => {
    return (dados?.detalhamento?.receitas ?? []).reduce(
      (total, receita) => total + (receita.total ?? 0),
      0
    );
  }, [dados?.detalhamento?.receitas]);

  const receitaBrutaPeriodo = useMemo(() => {
    return totalReceitasRecebidasPeriodo > 0
      ? totalReceitasRecebidasPeriodo
      : dadosDRE.receitaBruta;
  }, [totalReceitasRecebidasPeriodo, dadosDRE.receitaBruta]);

  const comparativoMensal = useMemo(() => {
    return dados?.evolucaoMensal || [];
  }, [dados?.evolucaoMensal]);

  const dadosGrafico = useMemo(() => {
    return comparativoMensal.slice(-6);
  }, [comparativoMensal]);

  const dadosTabela = useMemo(() => {
    return comparativoMensal.slice(-3);
  }, [comparativoMensal]);

  const indicadores = useMemo(() => {
    return (
      dados?.indicadores || {
        margemBruta: 0,
        margemOperacional: 0,
        margemLiquida: 0,
      }
    );
  }, [dados?.indicadores]);

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

  return {
    loading,
    error,
    dados,
    periodo,
    modalOpen,
    setModalOpen,
    dadosDRE,
    receitaBrutaPeriodo,
    dadosGrafico,
    dadosTabela,
    indicadores,
    classificarMargem,
    handlePeriodoChange,
    handleConfirmarDatasPersonalizadas,
    handleExportarPDF,
  };
}
