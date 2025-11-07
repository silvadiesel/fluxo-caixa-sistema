import dayjs from "@/lib/config/dayjs.config";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DespesaDados } from "@/lib/types/despesaModal.types";
import type { ApiListResponse, ListMeta } from "@/lib/types/despesaPage.types";

interface UseCalcDespesasProps {
  meta: ListMeta;
  dataInicial?: string;
  dataFinal?: string;
  usuarioId?: number;
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
  for (const d of arr)
    map[d.categoria] = (map[d.categoria] ?? 0) + parseValor(d.valor);
  return map;
};

/** Determina o mês de referência (início do mês) a partir do filtro ou do mês atual */
const getMesRef = (dataInicial?: string) =>
  dataInicial ? dayjs(dataInicial).startOf("month") : dayjs().startOf("month");

// Busca paginada de todas as despesas do mês atual
async function fetchAllDespesasMes(
  usuarioId: number,
  dataInicial: string,
  dataFinal: string
): Promise<DespesaDados[]> {
  const pageSize = 100;
  let page = 1;
  const acumulado: DespesaDados[] = [];

  while (true) {
    const params = new URLSearchParams({
      usuarioId: String(usuarioId),
      page: String(page),
      pageSize: String(pageSize),
      dataInicial,
      dataFinal,
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

// Busca paginada de todas as despesas do ano para cálculos comparativos
async function fetchAllDespesasAno(
  usuarioId: number,
  ano: number
): Promise<DespesaDados[]> {
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
export function useCalcDespesas({
  meta,
  dataInicial,
  dataFinal,
  usuarioId,
}: UseCalcDespesasProps) {
  const [despesasMesAtual, setDespesasMesAtual] = useState<DespesaDados[]>([]);
  const [despesasAno, setDespesasAno] = useState<DespesaDados[]>([]);

  // Ano alvo: usa o do filtro se houver
  const anoRef = useMemo(
    () => (dataInicial ? dayjs(dataInicial).year() : dayjs().year()),
    [dataInicial]
  );

  // Carrega todas as despesas do mês atual
  const carregarDespesasMes = useCallback(async () => {
    if (!usuarioId || !dataInicial || !dataFinal) {
      setDespesasMesAtual([]);
      return;
    }
    try {
      const all = await fetchAllDespesasMes(usuarioId, dataInicial, dataFinal);
      setDespesasMesAtual(all);
    } catch (error) {
      setDespesasMesAtual([]);
      console.error("Erro ao carregar todas as despesas do mês:", error);
    }
  }, [usuarioId, dataInicial, dataFinal]);

  // Carrega todas as despesas do ano (sem filtro de data) para permitir comparação com o mês anterior
  const carregarDespesasAno = useCallback(async () => {
    if (!usuarioId) {
      setDespesasAno([]);
      return;
    }
    try {
      const all = await fetchAllDespesasAno(usuarioId, anoRef);
      setDespesasAno(all);
    } catch (error) {
      setDespesasAno([]);
      console.error("Erro ao carregar todas as despesas do ano:", error);
    }
  }, [usuarioId, anoRef]);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.all([carregarDespesasMes(), carregarDespesasAno()]);
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [carregarDespesasMes, carregarDespesasAno]);

  // --- Cálculos ---------------------------------------------------------------
  const mesRef = useMemo(() => getMesRef(dataInicial), [dataInicial]);
  const mesAnt = useMemo(() => mesRef.subtract(1, "month"), [mesRef]);

  // Usa despesasMesAtual para calcular o total do mês (todas as despesas do mês, não apenas da página)
  const despesasMes = useMemo(() => {
    return sumBy(despesasMesAtual, (d) => parseValor(d.valor));
  }, [despesasMesAtual]);

  // Usa despesasAno para comparar com o mês anterior
  const despesasMesAnterior = useMemo(() => {
    return sumBy(
      despesasAno.filter((d) => dayjs(d.data).isSame(mesAnt, "month")),
      (d) => parseValor(d.valor)
    );
  }, [despesasAno, mesAnt]);

  const percentualMesAnterior = useMemo(() => {
    if (despesasMesAnterior === 0) return 0;
    return ((despesasMes - despesasMesAnterior) / despesasMesAnterior) * 100;
  }, [despesasMes, despesasMesAnterior]);

  const mediaDespesas = useMemo(
    () => (despesasMesAtual.length ? despesasMes / despesasMesAtual.length : 0),
    [despesasMesAtual.length, despesasMes]
  );

  const categoriaComMaiorDespesa = useMemo(() => {
    if (despesasMesAtual.length === 0)
      return { categoria: "Nenhuma", valor: 0 } as const;
    const byCat = groupSumByCategoria(despesasMesAtual);
    let winner: { categoria: string; valor: number } = {
      categoria: "",
      valor: 0,
    };
    for (const [categoria, valor] of Object.entries(byCat))
      if (valor > winner.valor) winner = { categoria, valor };
    return winner;
  }, [despesasMesAtual]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(meta.total / meta.pageSize)),
    [meta.total, meta.pageSize]
  );

  return {
    despesasMes,
    mediaDespesas,
    categoriaComMaiorDespesa,
    totalPages,
    percentualMesAnterior,
  } as const;
}
