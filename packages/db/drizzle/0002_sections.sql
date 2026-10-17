CREATE TABLE `sections` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`sync_version` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sections_project_id_idx` ON `sections` (`project_id`);--> statement-breakpoint
ALTER TABLE `tasks` ADD `section_id` text REFERENCES sections(id);--> statement-breakpoint
CREATE INDEX `tasks_section_id_idx` ON `tasks` (`section_id`);