import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDefaultMonthFilter, getCurrentYear } from "@/lib/utils/dateUtils";

export const getCurrentMonth = getDefaultMonthFilter;

interface UseFilterDateProps {
  filtroMes: string;
  setFiltroMes: (mes: string) => void;
  filtroAno: string;
  setFiltroAno: (ano: string) => void;
  dataInicial: string;
  dataFinal: string;
  MonthSelectComponent: React.ComponentType<{
    filtroMes: string;
    filtroAno: string;
    setFiltroMes: (mes: string) => void;
    setFiltroAno: (ano: string) => void;
    setPage: (page: number) => void;
  }>;
}

const buildYearOptions = (selectedYear: number): string[] => {
  const normalizedSelectedYear = Number.isNaN(selectedYear)
    ? new Date().getFullYear()
    : selectedYear;
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 4;
  const years = Array.from({ length: 9 }, (_, idx) => String(startYear + idx));

  if (!years.includes(String(normalizedSelectedYear))) {
    years.push(String(normalizedSelectedYear));
    years.sort();
  }

  return years;
};

export const useFilterDate = (
  filtroMes: string,
  setFiltroMes: (mes: string) => void,
  filtroAno: string,
  setFiltroAno: (ano: string) => void
): UseFilterDateProps => {
  const currentYear = Number(filtroAno) || Number(getCurrentYear());
  let dataInicial = `${currentYear}-01-01`;
  let dataFinal = `${currentYear}-12-31`;

  if (filtroMes !== "todos") {
    const mesNum = parseInt(filtroMes, 10);
    const mesFormatado = mesNum.toString().padStart(2, "0");
    dataInicial = `${currentYear}-${mesFormatado}-01`;
    const ultimoDia = new Date(currentYear, mesNum, 0).getDate();
    dataFinal = `${currentYear}-${mesFormatado}-${ultimoDia}`;
  }

  const MonthSelectComponent: React.ComponentType<{
    filtroMes: string;
    filtroAno: string;
    setFiltroMes: (mes: string) => void;
    setFiltroAno: (ano: string) => void;
    setPage: (page: number) => void;
  }> = ({ filtroMes, filtroAno, setFiltroMes, setFiltroAno, setPage }) => {
    const years = buildYearOptions(Number(filtroAno));

    return (
      <div className="flex w-full md:w-auto gap-2">
        <Select
          value={filtroMes}
          onValueChange={(v) => {
            setPage(1);
            setFiltroMes(v);
          }}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os meses</SelectItem>
            <SelectItem value="1">Janeiro</SelectItem>
            <SelectItem value="2">Fevereiro</SelectItem>
            <SelectItem value="3">Março</SelectItem>
            <SelectItem value="4">Abril</SelectItem>
            <SelectItem value="5">Maio</SelectItem>
            <SelectItem value="6">Junho</SelectItem>
            <SelectItem value="7">Julho</SelectItem>
            <SelectItem value="8">Agosto</SelectItem>
            <SelectItem value="9">Setembro</SelectItem>
            <SelectItem value="10">Outubro</SelectItem>
            <SelectItem value="11">Novembro</SelectItem>
            <SelectItem value="12">Dezembro</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filtroAno}
          onValueChange={(value) => {
            setPage(1);
            setFiltroAno(value);
          }}
        >
          <SelectTrigger className="w-full md:w-28">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return {
    filtroMes,
    setFiltroMes,
    filtroAno,
    setFiltroAno,
    dataInicial,
    dataFinal,
    MonthSelectComponent,
  };
};
