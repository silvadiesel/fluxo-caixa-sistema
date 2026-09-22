<div align="center">

# 💰 Fluxo de Caixa — Silva Diesel

**Controle financeiro simples e eficiente para pequenas empresas e autônomos.**

Cadastre receitas e despesas, acompanhe o caixa no calendário, gere o DRE do período e exporte tudo em PDF — sem depender de planilha.

🌐 **Produção:** [fluxocaixa.silvadiesel.com](https://fluxocaixa.silvadiesel.com/)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Turso](https://img.shields.io/badge/Turso-libSQL-4FF8D2?logo=sqlite&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-instalável-5A0FC8?logo=pwa&logoColor=white)

</div>

---

## ✨ O que o sistema faz

| | Funcionalidade | Detalhes |
|---|---|---|
| 📊 | **Dashboard** | Resumo do caixa (entradas, saídas, saldo) + últimas atividades lançadas |
| 💵 | **Receitas** | CRUD completo com categoria, status, observações, filtros por texto/período/categoria |
| 💸 | **Despesas** | Mesmo fluxo das receitas, com cards de totalizadores por situação |
| 🧾 | **Parcelamento** | Um lançamento vira N parcelas mensais automaticamente, com valor e vencimento calculados |
| 📅 | **Calendário** | Visão mensal com os vencimentos do período, lançamento direto pelo dia clicado |
| 📈 | **Relatório / DRE** | DRE estruturado (receita bruta → deduções → lucro) + gráficos de evolução dos últimos 6 meses |
| 🎯 | **Indicadores** | Margem bruta, margem operacional e margem líquida calculadas no servidor |
| 📄 | **Exportar PDF** | Relatório do período gerado com `@react-pdf/renderer` |
| 🏷️ | **Categorias** | Cadastro próprio por usuário, mapeadas para grupos/subgrupos do DRE |
| 🔐 | **Autenticação** | Login e cadastro com senha em SHA-256, rotas protegidas por `ProtectedRoute` |
| 📱 | **PWA + responsivo** | Instalável no celular, com menu mobile dedicado |
| 🌗 | **Tema claro/escuro** | Via `next-themes` |

---

## 🧠 O coração do sistema: o DRE

O grande diferencial não é só somar entradas e saídas — é **classificar cada lançamento na estrutura contábil certa**.

Cada categoria cadastrada carrega dois campos:

- **`dreGrupo`** → onde ela entra no demonstrativo
  `RECEITA_BRUTA` · `IMPOSTO_SOBRE_RECEITA` · `CUSTO_PRODUTO_SERVICO` · `DESPESA_OPERACIONAL` · `DESPESA_FINANCEIRA` · `OUTROS`
- **`dreSubgrupo`** → o detalhamento dentro do grupo
  `SIMPLES` · `ICMS` · `FORNECEDORES` · `SERVICOS_TERCEIROS` · `SALARIOS` · `IMPOSTO_SOBRE_FOLHA` · `PRO_LABORE` · `DESP_OFICINA` · `AGUA_LUZ_INTERNET` · `CONTADOR_PROGRAMAS` · `EMPRESTIMOS` · `JUROS_TAXAS` · …

Com isso o `calcularDre()` monta a cascata automaticamente:

```
🟢 Receita bruta
 ➖ Deduções (impostos sobre receita)
 ═ Receita líquida
 ➖ Custo dos produtos/serviços
 ═ Lucro bruto
 ➖ Despesas operacionais (salários, pró-labore, oficina, água/luz, contador…)
 ═ Resultado operacional
 ➖ Despesas financeiras (empréstimos, juros e taxas)
 ═ 🏁 Lucro líquido
```

> 💡 Categoria sem classificação cai em `OUTROS` por padrão — ela aparece no relatório, mas listada à parte para você reclassificar depois em **Configurações**.

---

## 🛠️ Stack

| Camada | Tecnologias |
|---|---|
| **Framework** | Next.js 16 (App Router, Route Handlers) |
| **Linguagem** | TypeScript 5 |
| **UI** | React 19 · Tailwind CSS 4 · Radix UI · shadcn/ui · lucide-react |
| **Banco** | Turso (libSQL/SQLite) via `@libsql/client` |
| **ORM** | Drizzle ORM + Drizzle Kit |
| **Validação** | Zod 4 (schemas em `src/lib/validator`) |
| **Datas** | Day.js (locale pt-BR) + date-fns |
| **Gráficos** | Recharts |
| **Calendário** | FullCalendar + react-day-picker |
| **PDF** | @react-pdf/renderer |
| **Feedback** | Sonner (toasts) |

---

## 🚀 Rodando localmente

### 1️⃣ Pré-requisitos

- Node.js 20+ (ou [Bun](https://bun.sh))
- Uma database no [Turso](https://turso.tech) (o plano free já dá conta)

### 2️⃣ Instalar dependências

```bash
bun install      # ou: npm install
```

### 3️⃣ Configurar o `.env`

```env
TURSO_DATABASE_URL=libsql://sua-database.turso.io
TURSO_AUTH_TOKEN=seu_token_aqui
```

> 🐘 O `docker-compose.yml` com Postgres é legado de uma versão anterior. **O banco em uso hoje é o Turso** — você não precisa subir o container.

### 4️⃣ Criar as tabelas

```bash
bun db:push      # empurra o schema direto pro Turso (caminho rápido)
```

ou, se preferir versionar as migrations:

```bash
bun db:generate  # gera os SQLs em ./drizzle
bun db:migrate   # aplica no banco
```

### 5️⃣ Subir o servidor

```bash
bun dev
```

Acesse 👉 **http://localhost:3000** e crie sua conta na tela de login.

---

## 📜 Scripts disponíveis

| Comando | O que faz |
|---|---|
| `bun dev` | 🔥 Servidor de desenvolvimento |
| `bun build` | 📦 Build de produção |
| `bun start` | ▶️ Roda o build de produção |
| `bun lint` | 🧹 ESLint |
| `bun db:push` | ⬆️ Sincroniza o schema com o banco (sem migration) |
| `bun db:generate` | 📝 Gera arquivos de migration a partir do schema |
| `bun db:migrate` | 🗄️ Aplica as migrations pendentes |
| `bun db:studio` | 🔍 Abre o Drizzle Studio pra inspecionar os dados |
| `bun db:pull` | 📥 Faz introspect do banco e gera o schema |
| `bun db:check` | ✅ Valida consistência das migrations |

---

## 📁 Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx              # 📊 Dashboard
│   ├── receita/              # 💵 Receitas (page + hooks de estado, filtros e totais)
│   ├── despesa/              # 💸 Despesas (mesma estrutura)
│   ├── calendario/           # 📅 Visão mensal de vencimentos
│   ├── relatorio/            # 📈 DRE, gráficos e exportação
│   ├── configuracao/         # ⚙️ Categorias e troca de senha
│   ├── login/                # 🔐 Login e cadastro
│   └── api/
│       ├── auth/             #    login · register
│       ├── receitaApi/       #    GET/POST + [id] PUT/DELETE
│       ├── despesaApi/       #    GET/POST + [id] PUT/DELETE
│       ├── categoriaApi/     #    CRUD de categorias
│       ├── configuracaoApi/  #    troca de senha
│       └── relatorio/        #    DRE + indicadores + evolução mensal
│
├── components/
│   ├── ui/                   # 🎨 Primitivos shadcn/Radix
│   ├── receitaModal.tsx      # ➕ Modais de lançamento
│   ├── despesaModal.tsx
│   ├── parcelasSection.tsx   # 🧾 Geração de parcelas
│   ├── chartRelatorio.tsx    # 📉 Gráficos do relatório
│   ├── createPDF.tsx         # 📄 Documento PDF
│   ├── calendar.tsx · sidebar.tsx · menuMobile.tsx
│   └── ProtectedRoute.tsx    # 🛡️ Guarda de rota autenticada
│
├── db/
│   ├── connection.ts         # 🔌 Client libSQL + Drizzle
│   └── schema/               # 🗃️ usuario · receita · despesa · categorias
│
└── lib/
    ├── hooks/                # 🪝 useAuth, useCalcDre, useFinancialData, useParcelas…
    ├── validator/            # ✅ Schemas Zod das rotas
    ├── types/                # 🏷️ Tipos de DRE, relatório, modais
    ├── utils/                # 🔧 Datas e normalização de categorias
    ├── adapters/             # 🔄 Formatação de dados pra UI
    └── https.ts              # 🌐 Helpers de resposta/parse das rotas
```

---

## 🔌 API — visão rápida

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Autentica e devolve os dados do usuário |
| `POST` | `/api/auth/register` | Cria uma conta |
| `GET` | `/api/receitaApi` | Lista paginada com filtros (`usuarioId`, `categoria`, `status`, `texto`, `dataInicial`, `dataFinal`, `page`, `pageSize`) |
| `POST` | `/api/receitaApi` | Cria receita |
| `PUT` `DELETE` | `/api/receitaApi/[id]` | Atualiza / remove |
| `GET` `POST` | `/api/despesaApi` | Mesmo contrato das receitas |
| `PUT` `DELETE` | `/api/despesaApi/[id]` | Atualiza / remove |
| `GET` `POST` | `/api/categoriaApi` | Lista (com `incluirInativas`) e cria categorias |
| `PUT` `DELETE` | `/api/categoriaApi/[id]` | Edita ou desativa |
| `PUT` | `/api/configuracaoApi` | Troca de senha |
| `GET` | `/api/relatorio` | DRE + indicadores + evolução dos últimos 6 meses |

---

## 🎯 Objetivo do projeto

Entregar um **painel limpo, rápido e responsivo** para acompanhar o fluxo de caixa do negócio e responder as três perguntas que importam no dia a dia:

> 💚 Quanto entrou? &nbsp;·&nbsp; ❤️ Quanto saiu? &nbsp;·&nbsp; 🎯 Sobrou quanto no fim do período?

---

<div align="center">

Feito com ☕ e TypeScript.

</div>
