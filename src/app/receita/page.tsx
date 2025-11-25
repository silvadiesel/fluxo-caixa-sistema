"use client";

import React, { JSX } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ModalReceita } from "@/components/receitaModal";
import { ModalDelete } from "@/components/deleteModal";
import { BarChart3, DollarSign, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateBR } from "@/lib/utils/dateUtils";
import { currencyBR } from "@/lib/utils/numberUtils";
import { type StatusUI } from "./utils";
import { useReceita } from "./useReceita";

// --- Component ---------------------------------------------------------------
export default function ReceitaPage(): JSX.Element {
  const {
    user,
    itens,
    meta,
    loading,
    errorMsg,
    busca,
    debouncedBusca,
    categoriasList,
    filtroCategoria,
    filtroStatus,
    filtroMes,
    filtroAno,
    page,
    pageSize,
    handleBuscaChange,
    handleCategoriaChange,
    handleStatusChange,
    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage,
    handleSaved,
    handleDelete,
    MonthSelectComponent,
    setFiltroMes,
    setFiltroAno,
    setPage,
    categoriaComMaiorReceita,
    totalPages,
    receitasMesFiltradas,
    mediaReceitasFiltrada,
    labelReceitas,
    labelMedia,
    temFiltro,
  } = useReceita();

  return (
    <ProtectedRoute>
      <header className="bg-card border-b border-border p-6">
        <div className="flex md:flex-row flex-col gap-2 md:gap-0 md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Receitas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as suas receitas
            </p>
          </div>
          {user?.id && (
            <ModalReceita usuarioId={user.id} onSave={handleSaved} />
          )}
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Cards resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Categoria com Maior Receita
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {currencyBR.format(categoriaComMaiorReceita.valor)}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {categoriaComMaiorReceita.categoria}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                {labelReceitas}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {currencyBR.format(receitasMesFiltradas)}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {temFiltro ? "Valores filtrados" : "Referente ao mês atual"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">
                {labelMedia}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {currencyBR.format(mediaReceitasFiltrada)}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {temFiltro ? "Média das receitas filtradas" : "Valor médio"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por Receitas..."
                    value={busca}
                    onChange={(e) => handleBuscaChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={filtroCategoria}
                onValueChange={handleCategoriaChange}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {categoriasList.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.nome}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtroStatus}
                onValueChange={(value: StatusUI) => handleStatusChange(value)}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["todos", "Recebido", "Pendente", "Cancelado"] as StatusUI[]
                  ).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((number) => (
                    <SelectItem key={number} value={String(number)}>
                      {number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <MonthSelectComponent
                filtroMes={filtroMes}
                filtroAno={filtroAno}
                setFiltroMes={setFiltroMes}
                setFiltroAno={setFiltroAno}
                setPage={setPage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Receitas</CardTitle>
            <CardDescription>
              {loading
                ? "Carregando..."
                : `${meta.total} receita(s) encontrada(s)${
                    debouncedBusca ? ` para "${debouncedBusca}"` : ""
                  }`}
              {errorMsg ? (
                <span className="ml-2 text-destructive">{errorMsg}</span>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 w-full">
              {!loading && itens.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum registro encontrado.
                </p>
              ) : null}

              {itens.map((receita) => (
                <div
                  key={receita.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors w-full"
                  )}
                >
                  <div className="flex md:items-center items-start space-x-4 flex-1 min-w-0">
                    <div className="p-2 md:flex hidden rounded-full bg-green-100 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {receita.descricao}
                      </p>
                      <div className="flex md:flex-row flex-col items-start md:items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {receita.categoria}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDateBR(receita.data)}
                        </span>
                      </div>
                      {receita.observacoes && receita.observacoes.trim() && (
                        <p className="hidden md:flex text-sm text-muted-foreground pt-1">
                          <span className="font-semibold">Observação:</span>{" "}
                          {receita.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-row flex-col items-center space-x-4 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-600 whitespace-nowrap">
                        {currencyBR.format(receita.valor)}
                      </p>
                      <Badge
                        variant={
                          receita.status === "Recebido"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {receita.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      {user?.id && (
                        <ModalReceita
                          receita={receita}
                          usuarioId={user.id}
                          onSave={handleSaved}
                        />
                      )}
                      <ModalDelete
                        itemName={receita.descricao}
                        itemType="receita"
                        onConfirm={() => handleDelete(receita.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex md:flex-row flex-col items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {meta.page} de {totalPages}
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  disabled={loading || page <= 1}
                  onClick={handlePreviousPage}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={loading || page >= totalPages}
                  onClick={handleNextPage}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </ProtectedRoute>
  );
}
