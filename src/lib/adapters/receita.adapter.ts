import dayjs from "dayjs";
import type {
    ReceitaUpdatePayload,
    ApiStatus,
    UiStatus,
    ReceitaDadosUI,
    ReceitaDadosApi,
} from "@/lib/types/receitaModal.types";
import { ReceitaSelect } from "../validator/receitaValidator";

export const uiToApiStatus: Record<UiStatus, ApiStatus> = {
    Pendente: "pendente",
    Recebido: "pago",
    Cancelado: "cancelado",
};
export const apiToUiStatus: Record<ApiStatus, UiStatus> = {
    pendente: "Pendente",
    pago: "Recebido",
    cancelado: "Cancelado",
};

export function renderReceita(row: ReceitaSelect): ReceitaDadosUI {
    return {
        id: row.id,
        descricao: row.descricao,
        categoria: row.categoria,
        valor: typeof row.valor === "string" ? Number.parseFloat(row.valor) : Number(row.valor),
        data: row.data,
        status: apiToUiStatus[row.status as ApiStatus],
        observacoes: row.observacoes ?? "",
        usuarioId: row.usuarioId,
    };
}
export function renderReceitas(rows: ReceitaSelect[]): ReceitaDadosUI[] {
    return rows.map(renderReceita);
}

export function buildCreatePayloadForm(
    form: {
        descricao: string;
        categoria: string;
        valor: string;
        data: Date;
        status: UiStatus;
        observacoes?: string;
    },
    usuarioId?: number
): ReceitaDadosApi {
    return {
        descricao: form.descricao.trim(),
        categoria: form.categoria,
        valor: Number.parseFloat((form.valor || "").replace(",", ".")),
        data: dayjs(form.data).format("YYYY-MM-DD"),
        status: uiToApiStatus[form.status],
        observacoes: form.observacoes?.trim() || null,
        ...(usuarioId !== undefined ? { usuarioId } : {}),
    };
}

export function buildUpdatePayloadForm(form: {
    descricao: string;
    categoria: string;
    valor: string;
    data: Date;
    status: UiStatus;
    observacoes?: string;
}): ReceitaUpdatePayload {
    return {
        descricao: form.descricao.trim(),
        categoria: form.categoria,
        valor: Number.parseFloat((form.valor || "").replace(",", ".")),
        data: dayjs(form.data).format("YYYY-MM-DD"),
        status: uiToApiStatus[form.status],
        observacoes: form.observacoes?.trim() || null,
    };
}
