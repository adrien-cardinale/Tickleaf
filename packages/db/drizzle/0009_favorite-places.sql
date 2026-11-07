CREATE TABLE `favorite_places` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`radius` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`sync_version` integer
);
