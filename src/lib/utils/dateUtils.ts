import dayjs from "@/lib/config/dayjs.config";
import { Periodo, PeriodoPreset } from "../types/relatorio.types";

/**
 * Formata uma data no formato YYYY-MM-DD para exibição em pt-BR (DD/MM/YYYY)
 * Evita problemas de timezone ao interpretar a data como local, não UTC
 */
export function formatDateBR(dateString: string): string {
    // Se a string já contém horário, usa dayjs diretamente
    if (dateString.includes("T") || dateString.includes(" ")) {
        return dayjs(dateString).format("DD/MM/YYYY");
    }

    // Para datas no formato YYYY-MM-DD, cria a data localmente sem conversão UTC
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR");
}

export function buildPeriodo(
    tipo: PeriodoPreset,
    custom?: { inicio: string; fim: string }
): Periodo {
    const today = dayjs();
    if (tipo === "mes-atual") {
        return {
            tipo,
            dataInicial: today.startOf("month").format("YYYY-MM-DD"),
            dataFinal: today.endOf("month").format("YYYY-MM-DD"),
        };
    }
    if (tipo === "trimestre") {
        const currentMonth = today.month();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
        const start = today.month(quarterStartMonth).startOf("month");
        const end = today.month(quarterStartMonth + 2).endOf("month");
        return {
            tipo,
            dataInicial: start.format("YYYY-MM-DD"),
            dataFinal: end.format("YYYY-MM-DD"),
        };
    }
    if (tipo === "ano") {
        const start = today.startOf("year");
        const end = today.endOf("year");
        return {
            tipo,
            dataInicial: start.format("YYYY-MM-DD"),
            dataFinal: end.format("YYYY-MM-DD"),
        };
    }
    // personalizado
    return {
        tipo,
        dataInicial: custom?.inicio ?? today.startOf("month").format("YYYY-MM-DD"),
        dataFinal: custom?.fim ?? today.endOf("month").format("YYYY-MM-DD"),
    };
}
export const getCurrentMonth = (): string => {
    return String(new Date().getMonth() + 1);
};

export const getCurrentYear = (): string => {
    return String(new Date().getFullYear());
};

export const getDefaultMonthFilter = (): string => {
    return getCurrentMonth();
};
