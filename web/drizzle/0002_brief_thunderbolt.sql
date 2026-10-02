CREATE TABLE `download_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`checked_at` integer NOT NULL,
	`retry_after` integer NOT NULL
);
