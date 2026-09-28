CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `limits_expiry` ON `limits` (`expires`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`host_hash` text NOT NULL,
	`pair_hash` text,
	`phone_hash` text,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rooms_expiry` ON `rooms` (`expires`);--> statement-breakpoint
CREATE TABLE `signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`sender` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `signals_room_sender` ON `signals` (`room`,`sender`);