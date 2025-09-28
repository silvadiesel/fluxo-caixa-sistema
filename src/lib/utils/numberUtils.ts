export const toNumber = (v: number | string | null | undefined): number => {
    const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v ?? 0;
    return Number.isFinite(n as number) ? (n as number) : 0;
};
export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
export const currencyBR = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
