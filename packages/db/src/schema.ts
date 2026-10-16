import type { IsoDate, Priority } from "@tickleaf/core"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  archivedAt: text("archived_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    due: text("due").$type<IsoDate>(),
    priority: integer("priority").$type<Priority>().notNull().default(4),
    projectId: text("project_id").references(() => projects.id),
    position: integer("position").notNull().default(0),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("tasks_project_id_idx").on(table.projectId),
    index("tasks_due_idx").on(table.due),
    index("tasks_completed_at_idx").on(table.completedAt),
  ],
)

export type ProjectRow = typeof projects.$inferSelect
export type NewProjectRow = typeof projects.$inferInsert
export type TaskRow = typeof tasks.$inferSelect
export type NewTaskRow = typeof tasks.$inferInsert
