# Fluxo de Caixa – Sistema Web

Aplicação web para **controle de fluxo de caixa**, focada em pequenas empresas e autônomos que precisam acompanhar receitas, despesas e resultado financeiro diário/mensal de forma simples.

O sistema permite:

- **Cadastrar receitas e despesas** (com categorias, descrição e valores).
- **Visualizar o fluxo de caixa** por período (dia, semana, mês).
- **Gerar relatórios e gráficos** de desempenho financeiro.
- **Acompanhar parcelas**, vencimentos e histórico.
- **Exportar/gerar PDF** de relatórios.

👉 Acesse o sistema em produção: [`https://fluxocaixa.silvadiesel.com/`](https://fluxocaixa.silvadiesel.com/)

---

## Principais Tecnologias (Stack)

- **Frontend / Backend**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **UI**: React 19 + Tailwind CSS + Radix UI + componentes próprios em `src/components`
- **Charts e calendário**: Recharts, FullCalendar
- **Validações**: Zod
- **Banco de dados / ORM**: Drizzle ORM (`src/db`) com scripts de migração em `drizzle/`
- **Autenticação**: rotas de API em `src/app/api/auth`
- **Outros**: Day.js / Date-fns para datas, Sonner para toasts, @react-pdf/renderer para geração de PDF

## Como rodar o projeto localmente

1. **Instalar dependências**

```bash
bun i
```

ou

```bash
npm i
```

2. **Configurar variáveis de ambiente**

Crie um arquivo `.env` baseado nas variáveis usadas pelo projeto (banco de dados, URL, etc.).

3. **Rodar migrações do banco (Drizzle)**

```bash
bun db:migrate
```

4. **Subir o servidor de desenvolvimento**

```bash
bun dev
```

O app ficará disponível normalmente em `http://localhost:3000`.

---

## Objetivo do Projeto

Entregar um **painel limpo, rápido e responsivo** para acompanhar o fluxo de caixa do negócio, facilitando decisões do dia a dia (quanto entrou, quanto saiu e qual o resultado do período) sem precisar de planilhas complexas.
