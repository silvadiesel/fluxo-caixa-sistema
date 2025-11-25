export const STATUS = ["todos", "pago", "pendente", "cancelado"] as const;
export type StatusUI = (typeof STATUS)[number];
