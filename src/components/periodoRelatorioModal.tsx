"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, FileText } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface ModalPeriodoRelatorioProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (dataInicial: string, dataFinal: string) => void;
}

export function ModalPeriodoRelatorio({
    open,
    onOpenChange,
    onConfirm,
}: ModalPeriodoRelatorioProps) {
    const [dataInicial, setDataInicial] = useState("");
    const [dataFinal, setDataFinal] = useState("");

    const handleConfirm = () => {
        if (!dataInicial || !dataFinal) {
            toast.error("Por favor, selecione ambas as datas");
            return;
        }

        if (dataInicial > dataFinal) {
            toast.error("A data inicial não pode ser maior que a data final");
            return;
        }

        onConfirm(dataInicial, dataFinal);
        onOpenChange(false);

        setDataInicial("");
        setDataFinal("");
    };

    const handleCancel = () => {
        onOpenChange(false);
        setDataInicial("");
        setDataFinal("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-left">Período Personalizado</DialogTitle>
                            <DialogDescription className="text-left">
                                Selecione o intervalo de datas para o relatório
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="dataInicial">Data Inicial</Label>
                        <Input
                            id="dataInicial"
                            type="date"
                            value={dataInicial}
                            onChange={(e) => setDataInicial(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dataFinal">Data Final</Label>
                        <Input
                            id="dataFinal"
                            type="date"
                            value={dataFinal}
                            onChange={(e) => setDataFinal(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!dataInicial || !dataFinal}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Relatório
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
