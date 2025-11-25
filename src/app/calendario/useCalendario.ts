import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFinancialData } from "@/lib/hooks/useFinancialData";

export function useCalendario() {
  const { user } = useAuth();
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { despesasReceitas, loading, error, refreshData } = useFinancialData(
    user?.id || 0
  );

  const dadosProcessados = useMemo(() => {
    const hoje = new Date();

    return despesasReceitas
      .filter(
        (item) =>
          item.tipo === "despesa" && item.status.toLowerCase() === "pendente"
      )
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
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [despesasReceitas]);

  const dadosFiltrados = useMemo(() => {
    return dadosProcessados.filter((item) => {
      if (filtroStatus === "todas") return true;
      if (filtroStatus === "vencidas") return item.diasRestantes < 0;
      if (filtroStatus === "proximas")
        return item.diasRestantes >= 0 && item.diasRestantes <= 7;
      if (filtroStatus === "futuras") return item.diasRestantes > 7;

      return true;
    });
  }, [dadosProcessados, filtroStatus]);

  const totalItems = dadosFiltrados.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const dadosPaginados = dadosFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    setPage(1);
  }, [filtroStatus]);

  const getStatusColor = (
    status: string,
    diasRestantes: number,
    tipo: string
  ) => {
    if (diasRestantes < 0) return "bg-red-100 text-red-800 border-red-200";
    if (diasRestantes <= 3)
      return "bg-orange-100 text-orange-800 border-orange-200";
    if (diasRestantes <= 7)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (tipo === "receita")
      return "bg-green-100 text-green-800 border-green-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getStatusIcon = (
    status: string,
    diasRestantes: number,
    tipo: string
  ) => {
    if (diasRestantes < 0) return "AlertTriangle";
    if (diasRestantes <= 3) return "AlertTriangle";
    if (tipo === "receita") return "TrendingUp";
    return "Clock";
  };

  const totalVencidas = useMemo(() => {
    return dadosProcessados
      .filter((d) => d.diasRestantes < 0)
      .reduce((acc, d) => acc + d.valor, 0);
  }, [dadosProcessados]);

  const totalProximas = useMemo(() => {
    return dadosProcessados
      .filter((d) => d.diasRestantes >= 0 && d.diasRestantes <= 7)
      .reduce((acc, d) => acc + d.valor, 0);
  }, [dadosProcessados]);

  const totalDespesasMes = useMemo(() => {
    return dadosProcessados
      .filter((d) => {
        const dataItem = new Date(d.data);
        const hoje = new Date();
        return (
          dataItem.getMonth() === hoje.getMonth() &&
          dataItem.getFullYear() === hoje.getFullYear()
        );
      })
      .reduce((acc, d) => acc + d.valor, 0);
  }, [dadosProcessados]);

  const handleStatusChange = (value: string) => {
    setFiltroStatus(value);
  };

  const handlePreviousPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  return {
    user,
    filtroStatus,
    page,
    pageSize,
    loading,
    error,
    refreshData,
    dadosPaginados,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    totalVencidas,
    totalProximas,
    totalDespesasMes,
    getStatusColor,
    getStatusIcon,
    handleStatusChange,
    handlePreviousPage,
    handleNextPage,
  };
}
