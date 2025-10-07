"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiResponse, DespesaDados, isApiError, status } from "@/lib/types/despesaModal.types";
import { cn } from "@/lib/utils";
import dayjs from "@/lib/config/dayjs.config";
import { CalendarIcon, Edit, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useParcelas } from "@/lib/hooks/useParcelas";
import { ParcelasSection } from "@/components/parcelasSection";

interface ModalDespesaProps {
    despesa?: DespesaDados;
    usuarioId?: number;
    onSave?: (d?: DespesaDados) => void;
}

export function ModalDespesa({ despesa, onSave, usuarioId }: ModalDespesaProps) {
    const isEditing = !!despesa;

    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        descricao: despesa?.descricao ?? "",
        categoria: despesa?.categoria ?? "",
        valor: despesa ? String(despesa.valor) : "",
        data: new Date(despesa?.data ?? new Date()),
        status: (despesa?.status ?? "Pendente") as status,
        observacoes: despesa?.observacoes ?? "",
    });

    const {
        possuiParcelas,
        numeroParcelas,
        parcelas,
        handleParcelasChange: handleParcelasChangeHook,
        handleNumeroParcelasChange: handleNumeroParcelasChangeHook,
        atualizarParcela,
        resetarParcelas,
    } = useParcelas();

    const handleParcelasChange = (checked: boolean) => {
        handleParcelasChangeHook(checked, formData.valor, formData.data);
    };

    const handleNumeroParcelasChange = (valor: string) => {
        handleNumeroParcelasChangeHook(valor, formData.valor, formData.data);
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const uid = Math.abs(parseInt(String(despesa?.usuarioId ?? usuarioId), 10));
        setSubmitting(true);
        try {
            // Se possui parcelas, criar múltiplas despesas
            if (possuiParcelas && parcelas.length > 0) {
                let sucessos = 0;
                for (let i = 0; i < parcelas.length; i++) {
                    const parcela = parcelas[i];
                    const payload = {
                        descricao: `${formData.descricao} (${parcela.numero}/${parcelas.length})`,
                        categoria: formData.categoria,
                        valor: parseFloat(parcela.valor),
                        data: parcela.data,
                        status: formData.status,
                        observacoes: formData.observacoes,
                        usuarioId: uid,
                    };

                    const res = await fetch("/api/despesaApi", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });

                    const json = (await res.json()) as ApiResponse<DespesaDados>;

                    if (res.ok && !isApiError(json)) {
                        sucessos++;
                        if (i === parcelas.length - 1) {
                            onSave?.(json.data);
                        }
                    }
                }

                setOpen(false);
                toast.success(`${sucessos} despesas parceladas adicionadas com sucesso!`, {
                    description: `${sucessos} parcelas foram cadastradas.`,
                });

                setFormData({
                    descricao: "",
                    categoria: "",
                    valor: "",
                    data: new Date(),
                    status: "pendente" as status,
                    observacoes: "",
                });
                resetarParcelas();
                return;
            }

            // Fluxo normal (sem parcelas)
            let res: Response;
            const payload = {
                descricao: formData.descricao,
                categoria: formData.categoria,
                valor: parseFloat(formData.valor),
                data: formData.data,
                status: formData.status,
                observacoes: formData.observacoes,
                usuarioId: uid,
            };

            if (isEditing && despesa?.id) {
                res = await fetch(`/api/despesaApi/${despesa.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/despesaApi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const json = (await res.json()) as ApiResponse<DespesaDados>;
            if (!res.ok || isApiError(json)) {
                const message = isApiError(json) ? json.error : "Falha ao salvar a despesa.";
                toast.error(message || "Erro ao salvar despesa.", {
                    description: "Verifique os dados e tente novamente.",
                });
                return;
            }
            onSave?.(json.data);
            setOpen(false);
            toast.success(
                isEditing ? "Despesa atualizada com sucesso!" : "Despesa adicionada com sucesso!",
                {
                    description: isEditing
                        ? "As alterações foram salvas."
                        : "A despesa foi cadastrada.",
                }
            );
            if (!isEditing) {
                setFormData({
                    descricao: "",
                    categoria: "",
                    valor: "",
                    data: new Date(),
                    status: "pendente" as status,
                    observacoes: "",
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro de rede ao salvar a despesa.", {
                description: "Não foi possível conectar ao servidor.",
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button className="bg-red-600 hover:bg-red-700 text-white md:w-auto w-1/2">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Despesa
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Edite as informações da despesa abaixo."
                            : "Preencha as informações para adicionar uma nova despesa."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="descricao">Descrição *</Label>
                            <Input
                                id="descricao"
                                placeholder="Ex: Venda de produto, Prestação de serviço..."
                                value={formData.descricao}
                                onChange={(e) =>
                                    setFormData({ ...formData, descricao: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="w-full items-center flex gap-4">
                            <div className="w-1/2 gap-2 flex flex-col">
                                <Label htmlFor="categoria">Categoria *</Label>
                                <Select
                                    value={formData.categoria}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, categoria: value })
                                    }
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Retirada de Sócio">
                                            Retirada de Sócio
                                        </SelectItem>
                                        <SelectItem value="Pix">Pix</SelectItem>
                                        <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                                        <SelectItem value="Juros">Juros</SelectItem>
                                        <SelectItem value="Impostos">Impostos</SelectItem>
                                        <SelectItem value="Despesa Pessoal">
                                            Despesa Pessoal
                                        </SelectItem>
                                        <SelectItem value="Saque">Saque</SelectItem>
                                        <SelectItem value="Despesa Oficina">
                                            Despesa Oficina
                                        </SelectItem>
                                        <SelectItem value="Contador">Contador</SelectItem>
                                        <SelectItem value="Despesas com salario">
                                            Despesas com salário
                                        </SelectItem>
                                        <SelectItem value="Despesa água/luz">
                                            Despesa água/luz
                                        </SelectItem>
                                        <SelectItem value="Despesa internet/telefone">
                                            Despesa internet/telefone
                                        </SelectItem>
                                        <SelectItem value="Outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-1/2 gap-2 flex flex-col">
                                <Label htmlFor="valor">Valor (R$) *</Label>
                                <Input
                                    id="valor"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0,00"
                                    value={formData.valor}
                                    onChange={(e) =>
                                        setFormData({ ...formData, valor: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex w-full gap-4 items-center">
                            <div className="w-1/2 gap-2 flex flex-col">
                                <Label>Data *</Label>
                                <Popover>
                                    <PopoverTrigger asChild className="w-full">
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "justify-start text-left font-normal",
                                                !formData.data && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.data ? (
                                                dayjs(formData.data).format("DD/MM/YYYY")
                                            ) : (
                                                <span>Selecione a data</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.data}
                                            onSelect={(date) =>
                                                date && setFormData({ ...formData, data: date })
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex flex-col w-1/2 gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, status: value as status })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="pago">Pago</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col w-full gap-2">
                            <Label htmlFor="observacoes">Observações</Label>
                            <Textarea
                                id="observacoes"
                                placeholder="Informações adicionais sobre a despesa..."
                                value={formData.observacoes}
                                onChange={(e) =>
                                    setFormData({ ...formData, observacoes: e.target.value })
                                }
                                rows={3}
                            />
                        </div>

                        {!isEditing && (
                            <ParcelasSection
                                possuiParcelas={possuiParcelas}
                                numeroParcelas={numeroParcelas}
                                parcelas={parcelas}
                                onParcelasChange={handleParcelasChange}
                                onNumeroParcelasChange={handleNumeroParcelasChange}
                                onAtualizarParcela={atualizarParcela}
                            />
                        )}
                    </div>
                    <DialogFooter className="pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={submitting}
                        >
                            {isEditing ? "Salvar Alterações" : "Adicionar despesa"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
