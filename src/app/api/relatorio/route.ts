import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { receita } from "@/db/schema/receita";
import { despesa } from "@/db/schema/despesa";
import { and, eq, gte, lte, sum, count } from "drizzle-orm";
import dayjs from "@/lib/config/dayjs.config";

interface DadosAgrupados {
    categoria: string;
    total: string | null;
    quantidade: number;
}

interface DRE {
    receitaBruta: number;
    deducoes: number;
    receitaLiquida: number;
    custoProdutos: number;
    lucroBruto: number;
    despesasOperacionais: {
        vendas: number;
        administrativas: number;
        financeiras: number;
        total: number;
    };
    lucroOperacional: number;
    receitasFinanceiras: number;
    outrasReceitas: number;
    outrasDespesas: number;
    lucroAntesImposto: number;
    impostoRenda: number;
    lucroLiquido: number;
}

interface Indicadores {
    margemBruta: number;
    margemOperacional: number;
    margemLiquida: number;
}

const CATEGORIA_RECEITA_MAP: Record<string, string> = {
    Vendas: "bruta",
    Serviços: "bruta",
    Produtos: "bruta",
    "Receita Financeira": "financeira",
    Rendimentos: "financeira",
    Investimentos: "financeira",
    "Outras Receitas": "outras",
};

const CATEGORIA_DESPESA_MAP: Record<string, string> = {
    "Custo Mercadoria": "custo_produto",
    "Custo Produto": "custo_produto",
    "Matéria Prima": "custo_produto",
    Marketing: "vendas",
    Comissões: "vendas",
    Propaganda: "vendas",
    Publicidade: "vendas",
    Salários: "administrativa",
    Aluguel: "administrativa",
    Água: "administrativa",
    Luz: "administrativa",
    Telefone: "administrativa",
    Internet: "administrativa",
    "Material Escritório": "administrativa",
    Juros: "financeira",
    "Taxas Bancárias": "financeira",
    IOF: "financeira",
    Multas: "outras",
    "Outras Despesas": "outras",
};

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const usuarioId = Number(searchParams.get("usuarioId"));
    const dataInicial = searchParams.get("dataInicial");
    const dataFinal = searchParams.get("dataFinal");
    const periodo = searchParams.get("periodo") || "mensal";

    if (!usuarioId || !dataInicial || !dataFinal) {
        return NextResponse.json(
            { error: "Parâmetros obrigatórios: usuarioId, dataInicial, dataFinal" },
            { status: 400 }
        );
    }

    try {
        const receitasData = await db
            .select({
                categoria: receita.categoria,
                total: sum(receita.valor),
                quantidade: count(),
            })
            .from(receita)
            .where(
                and(
                    eq(receita.usuarioId, usuarioId),
                    gte(receita.data, dataInicial),
                    lte(receita.data, dataFinal),
                    eq(receita.status, "pago")
                )
            )
            .groupBy(receita.categoria);

        const despesasData = await db
            .select({
                categoria: despesa.categoria,
                total: sum(despesa.valor),
                quantidade: count(),
            })
            .from(despesa)
            .where(
                and(
                    eq(despesa.usuarioId, usuarioId),
                    gte(despesa.data, dataInicial),
                    lte(despesa.data, dataFinal),
                    eq(despesa.status, "pago")
                )
            )
            .groupBy(despesa.categoria);

        const topReceitas = receitasData
            .map((r) => ({ categoria: r.categoria, total: Number(r.total || 0) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        const topDespesas = despesasData
            .map((d) => ({ categoria: d.categoria, total: Number(d.total || 0) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // Buscar evolução mensal (sempre usa data atual para mostrar últimos 6 meses para o gráfico)
        const evolucaoMensal = await buscarEvolucaoMensal(usuarioId, 6);

        const dre = calcularDRE(receitasData, despesasData);

        const indicadores = calcularIndicadores(dre);

        return NextResponse.json({
            success: true,
            periodo: { tipo: periodo, dataInicial, dataFinal },
            dre,
            indicadores,
            evolucaoMensal,
            topReceitas,
            topDespesas,
            detalhamento: {
                receitas: receitasData.map((r) => ({
                    categoria: r.categoria,
                    total: Number(r.total || 0),
                    quantidade: Number(r.quantidade || 0),
                    tipo: classificarReceita(r.categoria),
                })),
                despesas: despesasData.map((d) => ({
                    categoria: d.categoria,
                    total: Number(d.total || 0),
                    quantidade: Number(d.quantidade || 0),
                    tipo: classificarDespesa(d.categoria),
                })),
            },
        });
    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 });
    }
}

function classificarReceita(categoria: string): string {
    return CATEGORIA_RECEITA_MAP[categoria] || "bruta";
}

function classificarDespesa(categoria: string): string {
    return CATEGORIA_DESPESA_MAP[categoria] || "administrativa";
}

function calcularDRE(receitas: DadosAgrupados[], despesas: DadosAgrupados[]): DRE {
    const receitaBruta = receitas
        .filter((r) => classificarReceita(r.categoria) === "bruta")
        .reduce((acc, r) => acc + Number(r.total || 0), 0);

    const receitasFinanceiras = receitas
        .filter((r) => classificarReceita(r.categoria) === "financeira")
        .reduce((acc, r) => acc + Number(r.total || 0), 0);

    const outrasReceitas = receitas
        .filter((r) => classificarReceita(r.categoria) === "outras")
        .reduce((acc, r) => acc + Number(r.total || 0), 0);

    const deducoes = receitaBruta * 0.08;
    const receitaLiquida = receitaBruta - deducoes;

    const custoProdutos = despesas
        .filter((d) => classificarDespesa(d.categoria) === "custo_produto")
        .reduce((acc, d) => acc + Number(d.total || 0), 0);

    const despesasVendas = despesas
        .filter((d) => classificarDespesa(d.categoria) === "vendas")
        .reduce((acc, d) => acc + Number(d.total || 0), 0);

    const despesasAdministrativas = despesas
        .filter((d) => classificarDespesa(d.categoria) === "administrativa")
        .reduce((acc, d) => acc + Number(d.total || 0), 0);

    const despesasFinanceiras = despesas
        .filter((d) => classificarDespesa(d.categoria) === "financeira")
        .reduce((acc, d) => acc + Number(d.total || 0), 0);

    const outrasDespesas = despesas
        .filter((d) => classificarDespesa(d.categoria) === "outras")
        .reduce((acc, d) => acc + Number(d.total || 0), 0);

    const lucroBruto = receitaLiquida - custoProdutos;
    const despesasOperacionaisTotal =
        despesasVendas + despesasAdministrativas + despesasFinanceiras;
    const lucroOperacional = lucroBruto - despesasOperacionaisTotal;
    const lucroAntesImposto =
        lucroOperacional + receitasFinanceiras + outrasReceitas - outrasDespesas;
    const impostoRenda = lucroAntesImposto > 0 ? lucroAntesImposto * 0.15 : 0;
    const lucroLiquido = lucroAntesImposto - impostoRenda;

    return {
        receitaBruta,
        deducoes,
        receitaLiquida,
        custoProdutos,
        lucroBruto,
        despesasOperacionais: {
            vendas: despesasVendas,
            administrativas: despesasAdministrativas,
            financeiras: despesasFinanceiras,
            total: despesasOperacionaisTotal,
        },
        lucroOperacional,
        receitasFinanceiras,
        outrasReceitas,
        outrasDespesas,
        lucroAntesImposto,
        impostoRenda,
        lucroLiquido,
    };
}

function calcularIndicadores(dre: DRE): Indicadores {
    const margemBruta = dre.receitaLiquida > 0 ? (dre.lucroBruto / dre.receitaLiquida) * 100 : 0;

    const margemOperacional =
        dre.receitaLiquida > 0 ? (dre.lucroOperacional / dre.receitaLiquida) * 100 : 0;

    const margemLiquida =
        dre.receitaLiquida > 0 ? (dre.lucroLiquido / dre.receitaLiquida) * 100 : 0;

    return {
        margemBruta: Number(margemBruta.toFixed(1)),
        margemOperacional: Number(margemOperacional.toFixed(1)),
        margemLiquida: Number(margemLiquida.toFixed(1)),
    };
}

async function buscarEvolucaoMensal(usuarioId: number, meses: number = 6) {
    const resultado = [];
    const hoje = dayjs(); // Sempre usa a data atual

    for (let i = meses - 1; i >= 0; i--) {
        const mesRef = hoje.subtract(i, "month");
        const inicio = mesRef.startOf("month").format("YYYY-MM-DD");
        const fim = mesRef.endOf("month").format("YYYY-MM-DD");

        const [receitasRes, despesasRes] = await Promise.all([
            db
                .select({ total: sum(receita.valor) })
                .from(receita)
                .where(
                    and(
                        eq(receita.usuarioId, usuarioId),
                        gte(receita.data, inicio),
                        lte(receita.data, fim),
                        eq(receita.status, "pago")
                    )
                ),
            db
                .select({ total: sum(despesa.valor) })
                .from(despesa)
                .where(
                    and(
                        eq(despesa.usuarioId, usuarioId),
                        gte(despesa.data, inicio),
                        lte(despesa.data, fim),
                        eq(despesa.status, "pago")
                    )
                ),
        ]);

        const totalReceitas = Number(receitasRes[0]?.total || 0);
        const totalDespesas = Number(despesasRes[0]?.total || 0);

        resultado.push({
            mes: mesRef.format("MMM"),
            ano: mesRef.format("YYYY"),
            receitas: totalReceitas,
            despesas: totalDespesas,
            lucro: totalReceitas - totalDespesas,
        });
    }

    return resultado;
}
