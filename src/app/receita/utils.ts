export type StatusUI = "todos" | "Recebido" | "Pendente" | "Cancelado";
export type StatusAPI = "pago" | "pendente" | "cancelado";

export const uiToApiStatus: Record<Exclude<StatusUI, "todos">, StatusAPI> = {
  Recebido: "pago",
  Pendente: "pendente",
  Cancelado: "cancelado",
};
