import { Column, SQL, sql } from "drizzle-orm";

function normalizarBusca(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const VARIANTES: Record<string, string> = {
  a: "aáàâãä",
  e: "eéèêë",
  i: "iíìîï",
  o: "oóòôõö",
  u: "uúùûü",
  c: "cç",
  n: "nñ",
};

// LIKE/lower() do SQLite só ignoram caixa em ASCII e replace() aninhado estoura o
// parser, então cada letra do termo vira uma classe do GLOB com todas as variantes
// de acento e caixa: "agua" -> *[aáàâãäAÁÀÂÃÄ][gG][uúùûüUÚÙÛÜ][aáàâãäAÁÀÂÃÄ]*
function padraoGlob(termo: string): string {
  const corpo = [...normalizarBusca(termo)]
    .map((c) => {
      if ("*?[".includes(c)) return `[${c}]`;
      const variantes = VARIANTES[c] ?? c;
      const todas = [...new Set(variantes + variantes.toUpperCase())].join("");
      return todas === c ? c : `[${todas}]`;
    })
    .join("");
  return `*${corpo}*`;
}

export function filtroTexto(termo: string, ...colunas: Column[]): SQL {
  const padrao = padraoGlob(termo);
  const condicoes = colunas.map((c) => sql`${c} glob ${padrao}`);
  return sql`(${sql.join(condicoes, sql` or `)})`;
}
