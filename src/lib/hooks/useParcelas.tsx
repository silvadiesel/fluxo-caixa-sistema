import { useState } from "react";
import dayjs from "@/lib/config/dayjs.config";

export interface Parcela {
    numero: number;
    valor: string;
    data: Date;
}

export function useParcelas() {
    const [possuiParcelas, setPossuiParcelas] = useState(false);
    const [numeroParcelas, setNumeroParcelas] = useState("1");
    const [parcelas, setParcelas] = useState<Parcela[]>([]);

    const gerarParcelas = (numParcelas: number, valorTotal: number, dataBase: Date) => {
        const valorParcela = (valorTotal / numParcelas).toFixed(2);
        const novasParcelas: Parcela[] = [];

        for (let i = 0; i < numParcelas; i++) {
            const dataParcela = dayjs(dataBase).add(i, "month").toDate();
            novasParcelas.push({
                numero: i + 1,
                valor: valorParcela,
                data: dataParcela,
            });
        }

        setParcelas(novasParcelas);
    };

    const handleParcelasChange = (checked: boolean, valorAtual: string, dataAtual: Date) => {
        setPossuiParcelas(checked);
        if (checked && valorAtual) {
            const num = parseInt(numeroParcelas) || 1;
            gerarParcelas(num, parseFloat(valorAtual), dataAtual);
        } else {
            setParcelas([]);
        }
    };

    const handleNumeroParcelasChange = (valor: string, valorAtual: string, dataAtual: Date) => {
        setNumeroParcelas(valor);
        const num = parseInt(valor);
        if (num > 0 && valorAtual) {
            gerarParcelas(num, parseFloat(valorAtual), dataAtual);
        }
    };

    const atualizarParcela = (index: number, campo: "valor" | "data", valor: string | Date) => {
        const novasParcelas = [...parcelas];
        if (campo === "valor") {
            novasParcelas[index].valor = valor as string;
        } else {
            novasParcelas[index].data = valor as Date;
        }
        setParcelas(novasParcelas);
    };

    const resetarParcelas = () => {
        setPossuiParcelas(false);
        setNumeroParcelas("1");
        setParcelas([]);
    };

    return {
        possuiParcelas,
        numeroParcelas,
        parcelas,
        handleParcelasChange,
        handleNumeroParcelasChange,
        atualizarParcela,
        resetarParcelas,
        gerarParcelas,
    };
}
