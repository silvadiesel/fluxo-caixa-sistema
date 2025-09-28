import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReceitaDadosUI } from "@/lib/types/receitaModal.types";
import type { ApiListResponse, ListMeta } from "@/lib/types/receitaPage.types";

interface UseCalcReceitasProps {
    itens: ReceitaDadosUI[];
    meta: ListMeta;
    dataInicial?: string;
    dataFinal?: string;
}

// --- Helpers -----------------------------------------------------------------
const parseValor = (v: number) => (Number.isFinite(v) ? v : 0);
const sumBy = (arr: ReceitaDadosUI[], pick: (r: ReceitaDadosUI) => number) =>
    arr.reduce((acc, r) => acc + pick(r), 0);

/** Agrupa e soma por categoria */
const groupSumByCategoria = (arr: ReceitaDadosUI[]) => {
    const map: Record<string, number> = {};
    for (const r of arr) map[r.categoria] = (map[r.categoria] ?? 0) + parseValor(r.valor);
    return map;
};

/** Determina o mês de referência (início do mês) a partir do filtro ou do mês atual */
const getMesRef = (dataInicial?: string) =>
    dataInicial ? dayjs(dataInicial).startOf("month") : dayjs().startOf("month");

// Busca paginada de todas as receitas do ano para cálculos comparativos
async function fetchAllReceitasAno(usuarioId: number, ano: number): Promise<ReceitaDadosUI[]> {
    const pageSize = 100;
    let page = 1;
    const acumulado: ReceitaDadosUI[] = [];

    while (true) {
        const params = new URLSearchParams({
            usuarioId: String(usuarioId),
            page: String(page),
            pageSize: String(pageSize),
            dataInicial: `${ano}-01-01`,
            dataFinal: `${ano}-12-31`,
        });

        const res = await fetch(`/api/receitaApi?${params}`, { cache: "no-store" });
        if (!res.ok) break;

        const json: ApiListResponse<ReceitaDadosUI> = await res.json();
        const lote = json.data ?? [];
        acumulado.push(...lote);

        if (lote.length < pageSize) break; // acabou
        page += 1;
    }

    return acumulado;
}

// --- Hook --------------------------------------------------------------------
export function useCalcReceitas({ itens, meta, dataInicial }: UseCalcReceitasProps) {
    const [todosDados, setTodosDados] = useState<ReceitaDadosUI[]>([]);

    // Descobre o ano-alvo para comparação (usa o filtro se existir)
    const anoRef = useMemo(
        () => (dataInicial ? dayjs(dataInicial).year() : dayjs().year()),
        [dataInicial]
    );

    // Carrega todas as receitas do ano (sem filtro de data) para permitir comparação com o mês anterior
    const carregarTodosDados = useCallback(async () => {
        try {
            const all = await fetchAllReceitasAno(1, anoRef);
            setTodosDados(all);
        } catch (error) {
            setTodosDados(itens);
            console.error("Erro ao carregar todas as receitas do ano:", error);
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

    // Usa todosDados se disponível; senão, cai para itens
    const base = todosDados.length > 0 ? todosDados : itens;

    // --- Cálculos ---------------------------------------------------------------
    const mesRef = useMemo(() => getMesRef(dataInicial), [dataInicial]);
    const mesAnt = useMemo(() => mesRef.subtract(1, "month"), [mesRef]);

    const totalReceitas = useMemo(() => sumBy(base, (r) => parseValor(r.valor)), [base]);

    const receitasMes = useMemo(() => {
        return sumBy(
            base.filter((r) => dayjs(r.data).isSame(mesRef, "month")),
            (r) => parseValor(r.valor)
        );
    }, [base, mesRef]);

    const receitasMesAnterior = useMemo(() => {
        return sumBy(
            base.filter((r) => dayjs(r.data).isSame(mesAnt, "month")),
            (r) => parseValor(r.valor)
        );
    }, [base, mesAnt]);

    const percentualMesAnterior = useMemo(() => {
        if (receitasMesAnterior === 0) return 0;
        return ((receitasMes - receitasMesAnterior) / receitasMesAnterior) * 100;
    }, [receitasMes, receitasMesAnterior]);

    const mediaReceitas = useMemo(
        () => (base.length ? totalReceitas / base.length : 0),
        [base.length, totalReceitas]
    );

    const categoriaComMaiorReceita = useMemo(() => {
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
        totalReceitas,
        receitasMes,
        mediaReceitas,
        categoriaComMaiorReceita,
        totalPages,
        percentualMesAnterior,
    } as const;
}
