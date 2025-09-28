type DespesaStatus = "Pago" | "Pendente" | "Cancelada";

export type DespesaDados = {
    id: number;
    descricao: string;
    categoria: string;
    valor: number | string;
    data: string;
    status: DespesaStatus;
    observacoes?: string;
    usuarioId: number;
};

export type ListMeta = {
    page: number;
    pageSize: number;
    total: number;
};

export type ApiListResponse<T> = {
    data: T[];
    meta: ListMeta;
};
