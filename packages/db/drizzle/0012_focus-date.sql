ALTER TABLE `tasks` ADD `focus_date` text;--> statement-breakpoint
CREATE INDEX `tasks_focus_date_idx` ON `tasks` (`focus_date`);