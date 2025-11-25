"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
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
        <CardDescription>
          Receitas vs Despesas nos últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent className="p-1 md:p-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) {
                  return null;
                }

                return (
                  <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                    <div className="font-medium">
                      {payload[0]?.payload?.month || ""}
                    </div>
                    <div className="grid gap-1.5">
                      {payload.map((item, index) => {
                        const isReceita = item.dataKey === "receitas";
                        const color = isReceita ? "#10b981" : "#ef4444";
                        const formattedValue = `R$ ${Number(
                          item.value || 0
                        ).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}`;

                        return (
                          <div
                            key={index}
                            className="flex w-full flex-wrap items-center gap-2"
                          >
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex flex-1 justify-between leading-none items-center">
                              <span className="text-muted-foreground">
                                {isReceita ? "Receitas" : "Despesas"}
                              </span>
                              <span
                                className="font-mono font-medium tabular-nums"
                                style={{ color }}
                              >
                                {formattedValue}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
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
