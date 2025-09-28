import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DespesaDados } from "@/lib/types/despesaModal.types";
import type { ApiListResponse, ListMeta } from "@/lib/types/despesaPage.types";

interface UseCalcDespesasProps {
    itens: DespesaDados[];
    meta: ListMeta;
    dataInicial?: string;
    dataFinal?: string;
}

// --- Helpers -----------------------------------------------------------------
const parseValor = (v: number | string) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : 0;
};
const sumBy = (arr: DespesaDados[], pick: (d: DespesaDados) => number) =>
    arr.reduce((acc, d) => acc + pick(d), 0);

/** Agrupa e soma por categoria */
const groupSumByCategoria = (arr: DespesaDados[]) => {
    const map: Record<string, number> = {};
    for (const d of arr) map[d.categoria] = (map[d.categoria] ?? 0) + parseValor(d.valor);
    return map;
};

/** Determina o mês de referência (início do mês) a partir do filtro ou do mês atual */
const getMesRef = (dataInicial?: string) =>
    dataInicial ? dayjs(dataInicial).startOf("month") : dayjs().startOf("month");

// Busca paginada de todas as despesas do ano para cálculos comparativos
async function fetchAllDespesasAno(usuarioId: number, ano: number): Promise<DespesaDados[]> {
    const pageSize = 100;
    let page = 1;
    const acumulado: DespesaDados[] = [];

    while (true) {
        const params = new URLSearchParams({
            usuarioId: String(usuarioId),
            page: String(page),
            pageSize: String(pageSize),
            dataInicial: `${ano}-01-01`,
            dataFinal: `${ano}-12-31`,
        });

        const res = await fetch(`/api/despesaApi?${params}`, { cache: "no-store" });
        if (!res.ok) break;

        const json: ApiListResponse<DespesaDados> = await res.json();
        const lote = json.data ?? [];
        acumulado.push(...lote);

        if (lote.length < pageSize) break; // acabou
        page += 1;
    }

    return acumulado;
}

// --- Hook --------------------------------------------------------------------
export function useCalcDespesas({ itens, meta, dataInicial }: UseCalcDespesasProps) {
    const [todosDados, setTodosDados] = useState<DespesaDados[]>([]);

    // Ano alvo: usa o do filtro se houver
    const anoRef = useMemo(
        () => (dataInicial ? dayjs(dataInicial).year() : dayjs().year()),
        [dataInicial]
    );

    const carregarTodosDados = useCallback(async () => {
        try {
            const all = await fetchAllDespesasAno(1, anoRef);
            setTodosDados(all);
        } catch {
            setTodosDados(itens);
        }
    }, [anoRef, itens]);

    useEffect(() => {
        let active = true;
        (async () => {
            await carregarTodosDados();
            if (!active) return;
        })();
        return () => {
            active = false;
        };
    }, [carregarTodosDados]);

    const base = todosDados.length > 0 ? todosDados : itens;

    // --- Cálculos ---------------------------------------------------------------
    const mesRef = useMemo(() => getMesRef(dataInicial), [dataInicial]);
    const mesAnt = useMemo(() => mesRef.subtract(1, "month"), [mesRef]);

    const totalDespesas = useMemo(() => sumBy(base, (d) => parseValor(d.valor)), [base]);

    const despesasMes = useMemo(() => {
        return sumBy(
            base.filter((d) => dayjs(d.data).isSame(mesRef, "month")),
            (d) => parseValor(d.valor)
        );
    }, [base, mesRef]);

    const despesasMesAnterior = useMemo(() => {
        return sumBy(
            base.filter((d) => dayjs(d.data).isSame(mesAnt, "month")),
            (d) => parseValor(d.valor)
        );
    }, [base, mesAnt]);

    const percentualMesAnterior = useMemo(() => {
        if (despesasMesAnterior === 0) return 0;
        return ((despesasMes - despesasMesAnterior) / despesasMesAnterior) * 100;
    }, [despesasMes, despesasMesAnterior]);

    const mediaDespesas = useMemo(
        () => (base.length ? totalDespesas / base.length : 0),
        [base.length, totalDespesas]
    );

    const categoriaComMaiorDespesa = useMemo(() => {
        if (base.length === 0) return { categoria: "Nenhuma", valor: 0 } as const;
        const byCat = groupSumByCategoria(base);
        let winner: { categoria: string; valor: number } = { categoria: "", valor: 0 };
        for (const [categoria, valor] of Object.entries(byCat))
            if (valor > winner.valor) winner = { categoria, valor };
        return winner;
    }, [base]);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(meta.total / meta.pageSize)),
        [meta.total, meta.pageSize]
    );

    return {
        totalDespesas,
        despesasMes,
        mediaDespesas,
        categoriaComMaiorDespesa,
        totalPages,
        percentualMesAnterior,
    } as const;
}
