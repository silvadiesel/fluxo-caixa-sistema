import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit } from "lucide-react";
import dayjs from "@/lib/config/dayjs.config";
import { cn } from "@/lib/utils";

import { ApiResponse, isApiError, ReceitaDadosUI, UiStatus } from "@/lib/types/receitaModal.types";
import { toast } from "sonner";

interface ModalReceitaProps {
    receita?: ReceitaDadosUI;
    usuarioId?: number;
    onSave?: (r?: ReceitaDadosUI) => void;
}

export function ModalReceita({ receita, usuarioId, onSave }: ModalReceitaProps) {
    const isEditing = !!receita;

    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        descricao: receita?.descricao ?? "",
        categoria: receita?.categoria ?? "",
        valor: receita ? String(receita.valor) : "",
        data: new Date(receita?.data ?? new Date()),
        status: (receita?.status ?? "Pendente") as UiStatus,
        observacoes: receita?.observacoes ?? "",
    });

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const uid = Math.abs(parseInt(String(receita?.usuarioId ?? usuarioId), 10));
        // Usuário opcional: não bloqueia o fluxo se não houver usuário

        setSubmitting(true);
        try {
            let res: Response;

            const statusMapping: Record<UiStatus, string> = {
                Recebido: "pago",
                Pendente: "pendente",
                Cancelado: "cancelado",
            };

            const payload = {
                descricao: formData.descricao,
                categoria: formData.categoria,
                valor: parseFloat(formData.valor),
                data: formData.data,
                status: statusMapping[formData.status],
                observacoes: formData.observacoes,
                usuarioId: uid,
            };
            if (isEditing && receita?.id) {
                res = await fetch(`/api/receitaApi/${receita!.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/receitaApi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const json = (await res.json()) as ApiResponse<ReceitaDadosUI>;

            if (!res.ok || isApiError(json)) {
                const message = isApiError(json) ? json.error : "Falha ao salvar a receita.";
                toast.error(message || "Erro ao salvar receita.", {
                    description: "Verifique os dados e tente novamente.",
                });
                return;
            }

            onSave?.(json.data);
            setOpen(false);
            toast.success(
                isEditing ? "Receita atualizada com sucesso!" : "Receita adicionada com sucesso!",
                {
                    description: isEditing
                        ? "As alterações foram salvas."
                        : "A receita foi cadastrada.",
                }
            );

            if (!isEditing) {
                setFormData({
                    descricao: "",
                    categoria: "",
                    valor: "",
                    data: new Date(),
                    status: "Pendente",
                    observacoes: "",
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro de rede ao salvar a receita.", {
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
                    <Button className="bg-green-600 hover:bg-green-700 w-1/2 md:w-auto text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Receita
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Receita" : "Nova Receita"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Edite as informações da receita abaixo."
                            : "Preencha as informações para adicionar uma nova receita."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-6">
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
                                        <SelectItem value="pix">Pix</SelectItem>
                                        <SelectItem value="debito">Cartão de Débito</SelectItem>
                                        <SelectItem value="credito">Cartão de Crédito</SelectItem>
                                        <SelectItem value="boletos">Boletos</SelectItem>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="transferencia">Transferência</SelectItem>
                                        <SelectItem value="outros">Outros</SelectItem>
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
                                            type="button"
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
                                        setFormData({ ...formData, status: value as UiStatus })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                        <SelectItem value="Recebido">Recebido</SelectItem>
                                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col w-full gap-2">
                            <Label htmlFor="observacoes">Observações</Label>
                            <Textarea
                                id="observacoes"
                                placeholder="Informações adicionais sobre a receita..."
                                value={formData.observacoes}
                                onChange={(e) =>
                                    setFormData({ ...formData, observacoes: e.target.value })
                                }
                                rows={3}
                            />
                        </div>
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
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={submitting}
                        >
                            {isEditing ? "Salvar Alterações" : "Adicionar Receita"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
