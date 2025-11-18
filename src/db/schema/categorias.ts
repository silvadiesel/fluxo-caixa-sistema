import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { DreGrupo, DreSubgrupo } from "@/lib/types/dre.types";

export const categorias = sqliteTable(
  "categorias",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    usuarioId: integer("usuario_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    natureza: text("natureza", { length: 10 }).notNull(),
    nome: text("nome", { length: 100 }).notNull(),
    ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),

    dreGrupo: text("dre_grupo", { length: 50 })
      .$type<DreGrupo>()
      .notNull()
      .default("OUTROS"),

    dreSubgrupo: text("dre_subgrupo", { length: 50 })
      .$type<DreSubgrupo>()
      .notNull()
      .default("OUTROS"),
  },
  (t) => ({
    uniqUserNaturezaNome: uniqueIndex("uniq_user_natureza_nome").on(
      t.usuarioId,
      t.natureza,
      t.nome
    ),
  })
);
