import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("usuario", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome", { length: 120 }).notNull(),
  email: text("email", { length: 150 }).notNull().unique(),
  senha: text("senha", { length: 255 }).notNull(),
});
