type ReceitaStatus = "Recebido" | "Pendente" | "Cancelado";

export type ReceitaDadosUi = {
    id: number;
    descricao: string;
    categoria: string;
    valor: number;
    data: string;
    status: ReceitaStatus;
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
