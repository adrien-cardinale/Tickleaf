ALTER TABLE `projects` ADD `parent_id` text;--> statement-breakpoint
CREATE INDEX `projects_parent_id_idx` ON `projects` (`parent_id`);