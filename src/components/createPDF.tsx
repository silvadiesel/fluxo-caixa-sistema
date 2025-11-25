import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { RelatorioPayload } from "@/lib/types/relatorio.types";
import { formatDateBR } from "@/lib/utils/dateUtils";
import dayjs from "@/lib/config/dayjs.config";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #2563eb",
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1e40af",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 5,
  },
  periodo: {
    fontSize: 10,
    color: "#475569",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e293b",
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: "0.5 solid #f1f5f9",
  },
  rowLabel: {
    fontSize: 9,
    color: "#475569",
    flex: 1,
  },
  rowValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "right",
    width: 100,
  },
  rowValuePositive: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#059669",
    textAlign: "right",
    width: 100,
  },
  rowValueNegative: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#dc2626",
    textAlign: "right",
    width: 100,
  },
  highlightRow: {
    backgroundColor: "#f0f9ff",
    padding: 5,
    marginVertical: 3,
    borderRadius: 3,
  },
  highlightRowTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e40af",
  },
  highlightRowValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e40af",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTop: "1 solid #e2e8f0",
    paddingTop: 10,
  },
});

interface RelatorioPDFProps {
  dados: RelatorioPayload;
}

function RelatorioPDF({ dados }: RelatorioPDFProps) {
  const { dre, periodo } = dados;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPeriodoLabel = () => {
    if (!periodo || !periodo.tipo) return "Período não especificado";
    const tipo = periodo.tipo;
    if (tipo === "mes-atual") return "Mês Atual";
    if (tipo === "trimestre") return "Trimestre (3 meses)";
    if (tipo === "ano") return "Ano Atual";
    return "Período Personalizado";
  };

  const periodoDataInicial = periodo?.dataInicial || "";
  const periodoDataFinal = periodo?.dataFinal || "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório Financeiro</Text>
          <Text style={styles.subtitle}>
            Demonstrativo de Resultado do Exercício (DRE)
          </Text>
          <Text style={styles.periodo}>
            {getPeriodoLabel()}
            {periodoDataInicial && periodoDataFinal
              ? ` - ${formatDateBR(periodoDataInicial)} até ${formatDateBR(
                  periodoDataFinal
                )}`
              : ""}
          </Text>
          <Text style={styles.periodo}>
            Gerado em: {dayjs().format("DD/MM/YYYY [às] HH:mm")}
          </Text>
        </View>

        {/* DRE Detalhado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Demonstrativo de Resultado (DRE)
          </Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Receita Bruta</Text>
            <Text style={styles.rowValuePositive}>
              {formatCurrency(dre.receitaBruta)}
            </Text>
          </View>

          <View style={[styles.row, { paddingLeft: 15 }]}>
            <Text style={styles.rowLabel}>(-) Imposto</Text>
            <Text style={styles.rowValueNegative}>
              {formatCurrency(dre.deducoes.imposto)}
            </Text>
          </View>

          <View style={[styles.highlightRow, styles.row]}>
            <Text style={styles.highlightRowTitle}>Receita Líquida</Text>
            <Text style={styles.highlightRowValue}>
              {formatCurrency(dre.receitaLiquida)}
            </Text>
          </View>

          <View style={{ paddingLeft: 15, marginTop: 5 }}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Fornecedores</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.custoServicos.fornecedores)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Serviços de Terceiros</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.custoServicos.servicosTerceiros)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Fretes</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.custoServicos.fretes)}
              </Text>
            </View>
          </View>

          <View style={[styles.highlightRow, styles.row]}>
            <Text style={styles.highlightRowTitle}>Lucro Bruto</Text>
            <Text style={[styles.highlightRowValue, { color: "#2563eb" }]}>
              {formatCurrency(dre.lucroBruto)}
            </Text>
          </View>

          <View style={{ paddingLeft: 15, marginTop: 5 }}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                (-) Despesas Fixas e Variáveis
              </Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(
                  dre.despesasOperacionais.despesasFixasVariaveis
                )}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Despesas c/ Salários</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.despesasOperacionais.salarios)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Imposto s/ Salários</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.despesasOperacionais.impostoSalarios)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Despesas com Pessoal</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.despesasOperacionais.despesasPessoal)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Contador e Outros</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.despesasOperacionais.contadorOutros)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                (-) Água/Luz/Internet/Telefone
              </Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.despesasOperacionais.aguaLuzInternet)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Despesas Oficina</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.despesasOperacionais.despesasOficina)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                (-) Despesas Pessoais/Pró-labore
              </Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.despesasOperacionais.proLabore)}
              </Text>
            </View>
          </View>

          <View style={[styles.highlightRow, styles.row]}>
            <Text style={styles.highlightRowTitle}>Resultado Operacional</Text>
            <Text style={[styles.highlightRowValue, { color: "#7c3aed" }]}>
              {formatCurrency(dre.resultadoOperacional)}
            </Text>
          </View>

          <View style={{ paddingLeft: 15, marginTop: 5 }}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Empréstimos</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.despesasFinanceiras.emprestimos)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>(-) Juros/Taxas Bancárias</Text>
              <Text style={styles.rowValueNegative}>
                {formatCurrency(dre.despesasFinanceiras.jurosTaxas)}
              </Text>
            </View>
          </View>

          {dre.jurosPagos > 0 && (
            <View
              style={[
                styles.row,
                { marginTop: 5, borderTop: "1 dashed #cbd5e1" },
              ]}
            >
              <Text style={styles.rowLabel}>Juros Pagos</Text>
              <Text style={[styles.rowValue, { color: "#ea580c" }]}>
                {formatCurrency(dre.jurosPagos)}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.highlightRow,
              styles.row,
              {
                backgroundColor: "#fff7ed",
                borderTop: "2 solid #ea580c",
                marginTop: 5,
              },
            ]}
          >
            <Text style={[styles.highlightRowTitle, { fontSize: 12 }]}>
              Lucro
            </Text>
            <Text
              style={[
                styles.highlightRowValue,
                { fontSize: 14, color: "#ea580c" },
              ]}
            >
              {formatCurrency(dre.lucro)}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Relatório gerado automaticamente pelo Sistema de Fluxo de Caixa
        </Text>
      </Page>
    </Document>
  );
}

export async function gerarPDFRelatorio(dados: RelatorioPayload) {
  // Verificar se estamos no cliente
  if (typeof window === "undefined") {
    throw new Error("A geração de PDF só pode ser executada no cliente");
  }

  try {
    const doc = pdf(<RelatorioPDF dados={dados} />);
    const blob = await doc.toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-financeiro-${dayjs().format("YYYY-MM-DD")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
}

export default RelatorioPDF;
