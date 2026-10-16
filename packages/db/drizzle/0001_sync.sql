CREATE TABLE `sync_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `sync_version` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `sync_version` integer;