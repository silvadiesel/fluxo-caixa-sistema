import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./user";

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
  },
  (t) => ({
    uniqUserNaturezaNome: uniqueIndex("uniq_user_natureza_nome").on(
      t.usuarioId,
      t.natureza,
      t.nome
    ),
  })
);
