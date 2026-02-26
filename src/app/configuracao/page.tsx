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
import {
  Shield,
  TableConfig,
  Trash2,
  Power,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { ModalDelete } from "@/components/deleteModal";
import { useCategoriaSection } from "./useCategoriaSection";
import { useConfig } from "./useConfig";

function CategoriaSection({
  natureza,
  titulo,
}: {
  natureza: "despesa" | "receita";
  titulo: string;
}) {
  const {
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
  } = useCategoriaSection(natureza);

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
                  {editandoId === categoria.id ? (
                    <>
                      <Input
                        className="h-8 w-48"
                        value={nomeEditando}
                        onChange={(e) => setNomeEditando(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSalvarEdicao(categoria);
                          if (e.key === "Escape") handleCancelarEdicao();
                        }}
                        autoFocus
                        disabled={processandoId === categoria.id}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSalvarEdicao(categoria)}
                          disabled={processandoId === categoria.id}
                          className="text-green-700 hover:text-green-800"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelarEdicao}
                          disabled={processandoId === categoria.id}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
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
                          onClick={() => handleIniciarEdicao(categoria)}
                          disabled={processandoId === categoria.id}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
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
                    </>
                  )}
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
  const {
    senhaAtual,
    setSenhaAtual,
    novaSenha,
    setNovaSenha,
    confirmarSenha,
    setConfirmarSenha,
    isLoading,
    handleAlterarSenha,
  } = useConfig();

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
