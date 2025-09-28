export type status = "pendente" | "pago" | "cancelado";

export type DespesaDados = {
    id?: number;
    descricao: string;
    categoria: string;
    valor: number | string;
    data: string;
    status: status;
    observacoes?: string | null;
    usuarioId?: number;
};
export type DespesaUpdatePayload = Partial<DespesaDados>;

export type ApiSuccess<T> = { data: T };
export type ApiError = { error: string; issues?: unknown };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function isApiError<T>(r: ApiResponse<T>): r is ApiError {
    return "error" in r;
}
