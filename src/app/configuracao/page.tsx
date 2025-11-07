"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, TableConfig, Trash2, Power } from "lucide-react";
import { ModalDelete } from "@/components/deleteModal";
import { useState, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { useCategorias, type Categoria } from "@/lib/hooks/useCategorias";
import { normalizeCategoriaNome } from "@/lib/utils/normalizeCategoria";

function CategoriaSection({
  natureza,
  titulo,
}: {
  natureza: "despesa" | "receita";
  titulo: string;
}) {
  const { user } = useAuth();
  const { categorias, loading, refetch } = useCategorias({
    natureza,
    usuarioId: user?.id,
    incluirInativas: true,
  });

  const [nomeCategoria, setNomeCategoria] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

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

  const categoriasOrdenadas = [...categorias].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TableConfig className="h-5 w-5 text-primary" />
          <CardTitle>{titulo}</CardTitle>
        </div>
        <CardDescription>
          Defina as categorias de{" "}
          {natureza === "despesa" ? "despesas" : "receitas"} da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="w-full md:w-1/2 gap-2 flex flex-col">
            <Label htmlFor={`nomeCategoria-${natureza}`}>
              Adicione uma nova categoria
            </Label>
            <div className="flex gap-2">
              <Input
                id={`nomeCategoria-${natureza}`}
                placeholder="Ex: Pix, Fornecedores..."
                value={nomeCategoria}
                onChange={(e) => setNomeCategoria(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting) {
                    e.preventDefault();
                    handleAdicionar();
                  }
                }}
                disabled={isSubmitting}
              />
              <Button
                onClick={handleAdicionar}
                disabled={isSubmitting || !nomeCategoria.trim()}
                className="whitespace-nowrap"
              >
                {isSubmitting ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Label className="text-sm font-semibold">Lista de Categorias</Label>
          {loading ? (
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          ) : categoriasOrdenadas.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">
              Nenhuma categoria cadastrada ainda.
            </p>
          ) : (
            <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto">
              {categoriasOrdenadas.map((categoria) => (
                <div
                  key={categoria.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{categoria.nome}</span>
                    <Badge
                      variant={categoria.ativo ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {categoria.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAtivo(categoria)}
                      disabled={processandoId === categoria.id}
                      className={
                        categoria.ativo
                          ? "text-orange-600 hover:text-orange-700"
                          : "text-green-600 hover:text-green-700"
                      }
                    >
                      <Power className="h-4 w-4 mr-1" />
                      {categoria.ativo ? "Desativar" : "Reativar"}
                    </Button>
                    <ModalDelete
                      itemName={categoria.nome}
                      itemType="categoria"
                      onConfirm={() => handleDeletar(categoria)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={processandoId === categoria.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Apagar
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAlterarSenha = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error("Todos os campos são obrigatórios");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("A nova senha e confirmação não coincidem");
      return;
    }

    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/configuracaoApi", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          senhaAtual,
          novaSenha,
          confirmarSenha,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Senha alterada com sucesso");
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
      } else {
        toast.error(data.error || "Erro ao alterar senha");
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Configurações
              </h1>
              <p className="text-muted-foreground">
                Gerencie as configurações do sistema
              </p>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          <CategoriaSection
            natureza="despesa"
            titulo="Categorias de Despesas"
          />
          <CategoriaSection
            natureza="receita"
            titulo="Categorias de Receitas"
          />

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Segurança</CardTitle>
              </div>
              <CardDescription>
                Configurações de segurança e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <Input
                  id="senhaAtual"
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    placeholder="Digite a nova senha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Confirme a nova senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="w-1/4"
                onClick={handleAlterarSenha}
                disabled={isLoading}
              >
                {isLoading ? "Alterando..." : "Alterar Senha"}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
