import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getDefaultMonthFilter } from "@/lib/utils/dateUtils";

export const getCurrentMonth = getDefaultMonthFilter;

interface useFilterDateProps {
    filtroMes: string;
    setFiltroMes: (mes: string) => void;
    dataInicial: string;
    dataFinal: string;
    MonthSelectComponent: React.ComponentType<{
        filtroMes: string;
        setFiltroMes: (mes: string) => void;
        setPage: (page: number) => void;
    }>;
}

export const useFilterDate = (
    filtroMes: string,
    setFiltroMes: (mes: string) => void
): useFilterDateProps => {
    const currentYear = new Date().getFullYear();
    let dataInicial = `${currentYear}-01-01`;
    let dataFinal = `${currentYear}-12-31`;

    if (filtroMes !== "todos") {
        const mesNum = parseInt(filtroMes);
        dataInicial = `${currentYear}-${mesNum.toString().padStart(2, "0")}-01`;
        const ultimoDia = new Date(currentYear, mesNum, 0).getDate();
        dataFinal = `${currentYear}-${mesNum.toString().padStart(2, "0")}-${ultimoDia}`;
    }

    const MonthSelectComponent: React.ComponentType<{
        filtroMes: string;
        setFiltroMes: (mes: string) => void;
        setPage: (page: number) => void;
    }> = ({ filtroMes, setFiltroMes, setPage }) => (
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
    );

    return {
        filtroMes,
        setFiltroMes,
        dataInicial,
        dataFinal,
        MonthSelectComponent,
    };
};
