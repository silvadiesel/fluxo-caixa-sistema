import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCategorias, type Categoria } from "@/lib/hooks/useCategorias";
import { normalizeCategoriaNome } from "@/lib/utils/normalizeCategoria";
import { toast } from "sonner";

export function useCategoriaSection(natureza: "despesa" | "receita") {
  const { user } = useAuth();
  const { categorias, loading, refetch } = useCategorias({
    natureza,
    usuarioId: user?.id,
    incluirInativas: true,
  });

  const [nomeCategoria, setNomeCategoria] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");

  const handleAdicionar = useCallback(async () => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    const nomeNormalizado = normalizeCategoriaNome(nomeCategoria);
    if (!nomeNormalizado) {
      toast.error("Nome da categoria não pode estar vazio");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/categoriaApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: user.id,
          natureza,
          nome: nomeNormalizado,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          toast.success("Categoria criada com sucesso!");
          setNomeCategoria("");
          refetch();
        } else {
          const errorMsg = data.error || "Erro ao criar categoria";
          if (errorMsg.includes("já existe")) {
            toast.error("Categoria já existe");
          } else {
            toast.error(errorMsg);
          }
        }
      } else {
        const text = await response.text();
        console.error("Resposta não-JSON ao criar categoria:", text);
        toast.error(`Erro ao criar categoria (${response.status})`);
      }
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      toast.error("Erro interno do servidor");
    } finally {
      setIsSubmitting(false);
    }
  }, [nomeCategoria, user?.id, natureza, refetch]);

  const handleToggleAtivo = useCallback(
    async (categoria: Categoria) => {
      if (!user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      setProcessandoId(categoria.id);
      try {
        const response = await fetch(`/api/categoriaApi/${categoria.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ativo: !categoria.ativo,
          }),
        });

        if (response.ok) {
          toast.success(
            categoria.ativo
              ? "Categoria desativada com sucesso!"
              : "Categoria reativada com sucesso!"
          );
          refetch();
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            toast.error(data.error || "Erro ao alterar status da categoria");
          } else {
            const text = await response.text();
            console.error("Resposta não-JSON:", text);
            toast.error(`Erro ao alterar status (${response.status})`);
          }
        }
      } catch (error) {
        console.error("Erro ao alterar status da categoria:", error);
        toast.error("Erro interno do servidor");
      } finally {
        setProcessandoId(null);
      }
    },
    [user?.id, refetch]
  );

  const handleIniciarEdicao = useCallback((categoria: Categoria) => {
    setEditandoId(categoria.id);
    setNomeEditando(categoria.nome);
  }, []);

  const handleCancelarEdicao = useCallback(() => {
    setEditandoId(null);
    setNomeEditando("");
  }, []);

  const handleSalvarEdicao = useCallback(
    async (categoria: Categoria) => {
      const nomeNormalizado = normalizeCategoriaNome(nomeEditando);
      if (!nomeNormalizado) {
        toast.error("Nome da categoria não pode estar vazio");
        return;
      }

      if (nomeNormalizado === categoria.nome) {
        setEditandoId(null);
        setNomeEditando("");
        return;
      }

      setProcessandoId(categoria.id);
      try {
        const response = await fetch(`/api/categoriaApi/${categoria.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: nomeNormalizado }),
        });

        if (response.ok) {
          toast.success("Categoria renomeada com sucesso!");
          setEditandoId(null);
          setNomeEditando("");
          refetch();
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            toast.error(data.error || "Erro ao renomear categoria");
          } else {
            toast.error(`Erro ao renomear categoria (${response.status})`);
          }
        }
      } catch (error) {
        console.error("Erro ao renomear categoria:", error);
        toast.error("Erro interno do servidor");
      } finally {
        setProcessandoId(null);
      }
    },
    [nomeEditando, refetch]
  );

  const handleDeletar = useCallback(
    async (categoria: Categoria) => {
      if (!user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      setProcessandoId(categoria.id);
      try {
        const response = await fetch(`/api/categoriaApi/${categoria.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          toast.success("Categoria apagada com sucesso!");
          refetch();
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            toast.error(data.error || "Erro ao apagar categoria");
          } else {
            const text = await response.text();
            console.error("Resposta não-JSON:", text);
            toast.error(`Erro ao apagar categoria (${response.status})`);
          }
        }
      } catch (error) {
        console.error("Erro ao apagar categoria:", error);
        toast.error("Erro interno do servidor");
      } finally {
        setProcessandoId(null);
      }
    },
    [user?.id, refetch]
  );

  const categoriasOrdenadas = useMemo(() => {
    return [...categorias].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  }, [categorias]);

  return {
    nomeCategoria,
    setNomeCategoria,
    isSubmitting,
    processandoId,
    loading,
    categoriasOrdenadas,
    handleAdicionar,
    handleToggleAtivo,
    handleDeletar,
    editandoId,
    nomeEditando,
    setNomeEditando,
    handleIniciarEdicao,
    handleCancelarEdicao,
    handleSalvarEdicao,
  };
}
