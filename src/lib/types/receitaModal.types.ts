export type ApiStatus = "pendente" | "pago" | "cancelado";
export type UiStatus = "Pendente" | "Recebido" | "Cancelado";

export type ReceitaDadosUI = {
    id: number;
    descricao: string;
    categoria: string;
    valor: number;
    data: string;
    status: UiStatus;
    observacoes?: string;
    usuarioId: number;
};

export type ReceitaDadosApi = {
    descricao: string;
    categoria: string;
    valor: number;
    data: string;
    status: ApiStatus;
    observacoes?: string | null;
    usuarioId?: number;
};
export type ReceitaUpdatePayload = Partial<ReceitaDadosApi>;

export type ApiSuccess<T> = { data: T };
export type ApiError = { error: string; issues?: unknown };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function isApiError<T>(r: ApiResponse<T>): r is ApiError {
    return "error" in r;
}
