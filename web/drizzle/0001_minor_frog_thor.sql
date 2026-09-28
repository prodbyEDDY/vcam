ALTER TABLE `rooms` ADD `code_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_code` ON `rooms` (`code_hash`);