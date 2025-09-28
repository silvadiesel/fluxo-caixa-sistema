import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const receita = sqliteTable("receita", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  descricao: text("descricao", { length: 255 }).notNull(),
  categoria: text("categoria", { length: 100 }).notNull(),
  valor: real("valor").notNull(),
  data: text("data").notNull(),
  status: text("status", { length: 50 }).notNull(),
  observacoes: text("observacoes"),
  usuarioId: integer("usuario_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
});
