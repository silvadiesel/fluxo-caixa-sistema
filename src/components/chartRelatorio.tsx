"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

interface EvolucaoMensalData {
    mes: string;
    ano: string;
    receitas: number;
    despesas: number;
    lucro: number;
}

interface ChartRelatorioProps {
    data: EvolucaoMensalData[];
}

const chartConfig = {
    receitas: {
        label: "Receitas",
        color: "#10b981",
    },
    despesas: {
        label: "Despesas",
        color: "#ef4444",
    },
} satisfies ChartConfig;

export function ChartRelatorio({ data }: ChartRelatorioProps) {
    const chartData = data.map((item) => ({
        month: `${item.mes}/${item.ano.slice(2)}`,
        receitas: item.receitas,
        despesas: item.despesas,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Evolução Financeira</CardTitle>
                <CardDescription>Receitas vs Despesas nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value: number) =>
                                `R$ ${value.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}`
                            }
                        />
                        <Bar
                            dataKey="receitas"
                            fill="var(--color-receitas)"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="despesas"
                            fill="var(--color-despesas)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
