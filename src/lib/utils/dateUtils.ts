import dayjs from "dayjs";
import { Periodo, PeriodoPreset } from "../types/relatorio.types";

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
