"use client";

import { useEffect, useState } from "react";

export interface Categoria {
  id: number;
  usuarioId: number;
  natureza: "despesa" | "receita";
  nome: string;
  ativo: boolean;
}

interface UseCategoriasOptions {
  natureza?: "despesa" | "receita";
  usuarioId?: number;
  incluirInativas?: boolean;
}

export function useCategorias({
  natureza,
  usuarioId,
  incluirInativas = false,
}: UseCategoriasOptions = {}) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorias = async () => {
    if (!usuarioId) {
      setCategorias([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        usuarioId: String(usuarioId),
      });

      if (natureza) {
        params.append("natureza", natureza);
      }

      if (incluirInativas) {
        params.append("incluirInativas", "true");
      }

      const response = await fetch(`/api/categoriaApi?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar categorias");
      }

      const json = await response.json();
      setCategorias(json.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId, natureza, incluirInativas]);

  return {
    categorias,
    loading,
    error,
    refetch: fetchCategorias,
  };
}
