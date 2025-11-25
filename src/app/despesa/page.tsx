"use client";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, DollarSign, Search, TrendingDown } from "lucide-react";
import { ModalDespesa } from "@/components/despesaModal";
import { ModalDelete } from "@/components/deleteModal";
import { formatDateBR } from "@/lib/utils/dateUtils";
import { currencyBR } from "@/lib/utils/numberUtils";
import { type StatusUI, STATUS } from "./utils";
import { useDespesa } from "./useDespesa";

// -----------------------------------------------------------------------------
export default function DespesaPage() {
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
    categoriaComMaiorDespesa,
    totalPages,
    despesasMesFiltradas,
    mediaDespesasFiltrada,
    labelDespesas,
    labelMedia,
    temFiltro,
  } = useDespesa();

  return (
    <ProtectedRoute>
      <header className="bg-card border-b border-border p-6">
        <div className="flex md:items-center md:flex-row flex-col gap-2 md:gap-0 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Despesas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as suas despesas
            </p>
          </div>
          {user?.id && (
            <ModalDespesa onSave={handleSaved} usuarioId={user.id} />
          )}
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Cards resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                Categoria com Maior Despesa
              </CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">
                {currencyBR.format(categoriaComMaiorDespesa.valor)}
              </div>
              <p className="text-xs text-red-600 mt-1">
                {categoriaComMaiorDespesa.categoria}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                {labelDespesas}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {currencyBR.format(despesasMesFiltradas)}
              </div>
              <p className="text-xs text-orange-600 mt-1">
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
                {currencyBR.format(mediaDespesasFiltrada)}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {temFiltro
                  ? "Média das despesas filtradas"
                  : "Valor médio por transação"}
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
                    placeholder="Buscar por despesas..."
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
                  {STATUS.map((status) => (
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

        {/* Lista */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Despesas</CardTitle>
            <CardDescription>
              {loading
                ? "Carregando..."
                : `${meta.total} despesa(s) encontrada(s)${
                    debouncedBusca ? ` para "${debouncedBusca}"` : ""
                  }`}
              {errorMsg ? (
                <span className="ml-2 text-destructive">— {errorMsg}</span>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!loading && itens.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum registro encontrado.
                </p>
              ) : null}

              {itens.map((despesa) => (
                <div
                  key={despesa.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex md:items-center items-start space-x-4 flex-1 min-w-0">
                    <div className="p-2 md:flex hidden rounded-full bg-red-100 text-red-600">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {despesa.descricao}
                      </p>
                      <div className="flex md:flex-row flex-col items-start md:items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {despesa.categoria}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDateBR(despesa.data)}
                        </span>
                      </div>
                      {despesa.observacoes && despesa.observacoes.trim() && (
                        <p className="md:flex hidden text-sm text-muted-foreground pt-1">
                          <span className="font-semibold">Observação:</span>{" "}
                          {despesa.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center space-x-4 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="font-semibold text-red-600 whitespace-nowrap">
                        {currencyBR.format(
                          typeof despesa.valor === "string"
                            ? parseFloat(despesa.valor)
                            : despesa.valor
                        )}
                      </p>
                      <Badge
                        variant={
                          despesa.status === "pago" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {despesa.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      {user?.id && (
                        <ModalDespesa
                          despesa={despesa}
                          usuarioId={user.id}
                          onSave={handleSaved}
                        />
                      )}
                      <ModalDelete
                        itemName={despesa.descricao}
                        itemType="despesa"
                        onConfirm={() => handleDelete(despesa.id)}
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
