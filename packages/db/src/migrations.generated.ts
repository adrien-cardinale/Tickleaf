import type { Migration } from "./migrations"

export const GENERATED_MIGRATIONS: readonly Migration[] = [
  {
    tag: "0000_init",
    when: 1792139094285,
    sql: "CREATE TABLE `projects` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`position` integer DEFAULT 0 NOT NULL,\n\t`archived_at` text,\n\t`created_at` text NOT NULL,\n\t`updated_at` text NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `tasks` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`title` text NOT NULL,\n\t`description` text DEFAULT '' NOT NULL,\n\t`due` text,\n\t`priority` integer DEFAULT 4 NOT NULL,\n\t`project_id` text,\n\t`position` integer DEFAULT 0 NOT NULL,\n\t`completed_at` text,\n\t`created_at` text NOT NULL,\n\t`updated_at` text NOT NULL,\n\tFOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE INDEX `tasks_project_id_idx` ON `tasks` (`project_id`);--> statement-breakpoint\nCREATE INDEX `tasks_due_idx` ON `tasks` (`due`);--> statement-breakpoint\nCREATE INDEX `tasks_completed_at_idx` ON `tasks` (`completed_at`);",
  },
]
