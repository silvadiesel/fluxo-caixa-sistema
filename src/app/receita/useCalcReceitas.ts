import dayjs from "@/lib/config/dayjs.config";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReceitaDadosUI } from "@/lib/types/receitaModal.types";
import type { ApiListResponse, ListMeta } from "@/lib/types/receitaPage.types";

interface UseCalcReceitasProps {
  meta: ListMeta;
  dataInicial?: string;
  dataFinal?: string;
  usuarioId?: number;
}

// --- Helpers -----------------------------------------------------------------
const parseValor = (v: number) => (Number.isFinite(v) ? v : 0);
const sumBy = (arr: ReceitaDadosUI[], pick: (r: ReceitaDadosUI) => number) =>
  arr.reduce((acc, r) => acc + pick(r), 0);

/** Agrupa e soma por categoria */
const groupSumByCategoria = (arr: ReceitaDadosUI[]) => {
  const map: Record<string, number> = {};
  for (const r of arr)
    map[r.categoria] = (map[r.categoria] ?? 0) + parseValor(r.valor);
  return map;
};

/** Determina o mês de referência (início do mês) a partir do filtro ou do mês atual */
const getMesRef = (dataInicial?: string) =>
  dataInicial ? dayjs(dataInicial).startOf("month") : dayjs().startOf("month");

// Busca paginada de todas as receitas do mês atual
async function fetchAllReceitasMes(
  usuarioId: number,
  dataInicial: string,
  dataFinal: string
): Promise<ReceitaDadosUI[]> {
  const pageSize = 100;
  let page = 1;
  const acumulado: ReceitaDadosUI[] = [];

  while (true) {
    const params = new URLSearchParams({
      usuarioId: String(usuarioId),
      page: String(page),
      pageSize: String(pageSize),
      dataInicial,
      dataFinal,
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

// Busca paginada de todas as receitas do ano para cálculos comparativos
async function fetchAllReceitasAno(
  usuarioId: number,
  ano: number
): Promise<ReceitaDadosUI[]> {
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
export function useCalcReceitas({
  meta,
  dataInicial,
  dataFinal,
  usuarioId,
}: UseCalcReceitasProps) {
  const [receitasMesAtual, setReceitasMesAtual] = useState<ReceitaDadosUI[]>(
    []
  );
  const [receitasAno, setReceitasAno] = useState<ReceitaDadosUI[]>([]);

  // Descobre o ano-alvo para comparação (usa o filtro se existir)
  const anoRef = useMemo(
    () => (dataInicial ? dayjs(dataInicial).year() : dayjs().year()),
    [dataInicial]
  );

  // Carrega todas as receitas do mês atual
  const carregarReceitasMes = useCallback(async () => {
    if (!usuarioId || !dataInicial || !dataFinal) {
      setReceitasMesAtual([]);
      return;
    }
    try {
      const all = await fetchAllReceitasMes(usuarioId, dataInicial, dataFinal);
      setReceitasMesAtual(all);
    } catch (error) {
      setReceitasMesAtual([]);
      console.error("Erro ao carregar todas as receitas do mês:", error);
    }
  }, [usuarioId, dataInicial, dataFinal]);

  // Carrega todas as receitas do ano (sem filtro de data) para permitir comparação com o mês anterior
  const carregarReceitasAno = useCallback(async () => {
    if (!usuarioId) {
      setReceitasAno([]);
      return;
    }
    try {
      const all = await fetchAllReceitasAno(usuarioId, anoRef);
      setReceitasAno(all);
    } catch (error) {
      setReceitasAno([]);
      console.error("Erro ao carregar todas as receitas do ano:", error);
    }
  }, [usuarioId, anoRef]);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.all([carregarReceitasMes(), carregarReceitasAno()]);
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [carregarReceitasMes, carregarReceitasAno]);

  // --- Cálculos ---------------------------------------------------------------
  const mesRef = useMemo(() => getMesRef(dataInicial), [dataInicial]);
  const mesAnt = useMemo(() => mesRef.subtract(1, "month"), [mesRef]);

  // Usa receitasMesAtual para calcular o total do mês (todas as receitas do mês, não apenas da página)
  const receitasMes = useMemo(() => {
    return sumBy(receitasMesAtual, (r) => parseValor(r.valor));
  }, [receitasMesAtual]);

  // Usa receitasAno para comparar com o mês anterior
  const receitasMesAnterior = useMemo(() => {
    return sumBy(
      receitasAno.filter((r) => dayjs(r.data).isSame(mesAnt, "month")),
      (r) => parseValor(r.valor)
    );
  }, [receitasAno, mesAnt]);

  const percentualMesAnterior = useMemo(() => {
    if (receitasMesAnterior === 0) return 0;
    return ((receitasMes - receitasMesAnterior) / receitasMesAnterior) * 100;
  }, [receitasMes, receitasMesAnterior]);

  const mediaReceitas = useMemo(
    () => (receitasMesAtual.length ? receitasMes / receitasMesAtual.length : 0),
    [receitasMesAtual.length, receitasMes]
  );

  const categoriaComMaiorReceita = useMemo(() => {
    if (receitasMesAtual.length === 0)
      return { categoria: "Nenhuma", valor: 0 } as const;
    const byCat = groupSumByCategoria(receitasMesAtual);
    let winner: { categoria: string; valor: number } = {
      categoria: "",
      valor: 0,
    };
    for (const [categoria, valor] of Object.entries(byCat))
      if (valor > winner.valor) winner = { categoria, valor };
    return winner;
  }, [receitasMesAtual]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(meta.total / meta.pageSize)),
    [meta.total, meta.pageSize]
  );

  return {
    receitasMes,
    mediaReceitas,
    categoriaComMaiorReceita,
    totalPages,
    percentualMesAnterior,
  } as const;
}
