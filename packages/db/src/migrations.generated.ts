import type { Migration } from "./migrations"

export const GENERATED_MIGRATIONS: readonly Migration[] = [
  {
    tag: "0000_init",
    when: 1792139094285,
    sql: "CREATE TABLE `projects` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`position` integer DEFAULT 0 NOT NULL,\n\t`archived_at` text,\n\t`created_at` text NOT NULL,\n\t`updated_at` text NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `tasks` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`title` text NOT NULL,\n\t`description` text DEFAULT '' NOT NULL,\n\t`due` text,\n\t`priority` integer DEFAULT 4 NOT NULL,\n\t`project_id` text,\n\t`position` integer DEFAULT 0 NOT NULL,\n\t`completed_at` text,\n\t`created_at` text NOT NULL,\n\t`updated_at` text NOT NULL,\n\tFOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE INDEX `tasks_project_id_idx` ON `tasks` (`project_id`);--> statement-breakpoint\nCREATE INDEX `tasks_due_idx` ON `tasks` (`due`);--> statement-breakpoint\nCREATE INDEX `tasks_completed_at_idx` ON `tasks` (`completed_at`);",
  },
  {
    tag: "0001_sync",
    when: 1792141011395,
    sql: "CREATE TABLE `sync_state` (\n\t`key` text PRIMARY KEY NOT NULL,\n\t`value` text NOT NULL\n);\n--> statement-breakpoint\nALTER TABLE `projects` ADD `deleted_at` text;--> statement-breakpoint\nALTER TABLE `projects` ADD `sync_version` integer;--> statement-breakpoint\nALTER TABLE `tasks` ADD `deleted_at` text;--> statement-breakpoint\nALTER TABLE `tasks` ADD `sync_version` integer;",
  },
  {
    tag: "0002_sections",
    when: 1792241616083,
    sql: "CREATE TABLE `sections` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`project_id` text NOT NULL,\n\t`name` text NOT NULL,\n\t`position` integer DEFAULT 0 NOT NULL,\n\t`created_at` text NOT NULL,\n\t`updated_at` text NOT NULL,\n\t`deleted_at` text,\n\t`sync_version` integer,\n\tFOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action\n);\n--> statement-breakpoint\nCREATE INDEX `sections_project_id_idx` ON `sections` (`project_id`);--> statement-breakpoint\nALTER TABLE `tasks` ADD `section_id` text REFERENCES sections(id);--> statement-breakpoint\nCREATE INDEX `tasks_section_id_idx` ON `tasks` (`section_id`);",
  },
  {
    tag: "0003_reminders",
    when: 1792243076924,
    sql: "ALTER TABLE `tasks` ADD `reminder_at` text;",
  },
  {
    tag: "0004_recurrence",
    when: 1792266814603,
    sql: "ALTER TABLE `tasks` ADD `recurrence` text;",
  },
  {
    tag: "0005_subtasks",
    when: 1792267552656,
    sql: "ALTER TABLE `tasks` ADD `parent_id` text;--> statement-breakpoint\nCREATE INDEX `tasks_parent_id_idx` ON `tasks` (`parent_id`);",
  },
  {
    tag: "0006_subprojects",
    when: 1792270118928,
    sql: "ALTER TABLE `projects` ADD `parent_id` text;--> statement-breakpoint\nCREATE INDEX `projects_parent_id_idx` ON `projects` (`parent_id`);",
  },
  {
    tag: "0007_project-colors",
    when: 1792271356893,
    sql: "ALTER TABLE `projects` ADD `color` text DEFAULT 'gray' NOT NULL;",
  },
]
