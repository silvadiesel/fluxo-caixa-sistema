import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { Parcela } from "@/lib/hooks/useParcelas";
import dayjs from "@/lib/config/dayjs.config";
import { CalendarIcon } from "lucide-react";

interface ParcelasSectionProps {
    possuiParcelas: boolean;
    numeroParcelas: string;
    parcelas: Parcela[];
    onParcelasChange: (checked: boolean) => void;
    onNumeroParcelasChange: (valor: string) => void;
    onAtualizarParcela: (index: number, campo: "valor" | "data", valor: string | Date) => void;
    disabled?: boolean;
}

export function ParcelasSection({
    possuiParcelas,
    numeroParcelas,
    parcelas,
    onParcelasChange,
    onNumeroParcelasChange,
    onAtualizarParcela,
    disabled = false,
}: ParcelasSectionProps) {
    return (
        <>
            <div className="flex items-center justify-between border-t pt-4">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="parcelas" className={disabled ? "opacity-50" : ""}>
                        Esta conta possui parcelas?
                    </Label>
                    <p className={`text-xs text-muted-foreground ${disabled ? "opacity-50" : ""}`}>
                        {disabled
                            ? "Preencha todos os campos obrigatórios primeiro"
                            : "Divida o valor em múltiplas transações mensais"}
                    </p>
                </div>
                <Switch
                    id="parcelas"
                    checked={possuiParcelas}
                    onCheckedChange={onParcelasChange}
                    disabled={disabled}
                />
            </div>

            {possuiParcelas && (
                <div className="flex flex-col gap-4 border rounded-lg p-4 bg-muted/50">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="numParcelas">Número de parcelas *</Label>
                        <Input
                            id="numParcelas"
                            type="number"
                            min="1"
                            max="60"
                            value={numeroParcelas}
                            onChange={(e) => onNumeroParcelasChange(e.target.value)}
                            placeholder="Ex: 3"
                        />
                    </div>

                    {parcelas.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <Label>Parcelas geradas:</Label>
                            <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {parcelas.map((parcela, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-2 items-end bg-background p-3 rounded border"
                                    >
                                        <div className="flex flex-col gap-1 w-16">
                                            <Label className="text-xs">Parcela</Label>
                                            <div className="h-9 flex items-center justify-center font-medium">
                                                {parcela.numero}/{parcelas.length}
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <Label className="text-xs">Valor (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={parcela.valor}
                                                onChange={(e) =>
                                                    onAtualizarParcela(
                                                        index,
                                                        "valor",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <Label className="text-xs">Data</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="justify-start text-left font-normal h-9"
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {dayjs(parcela.data).format("DD/MM/YYYY")}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={parcela.data}
                                                        onSelect={(date) =>
                                                            date &&
                                                            onAtualizarParcela(index, "data", date)
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
