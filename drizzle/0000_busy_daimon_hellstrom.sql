CREATE TABLE `site_content` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_name` text NOT NULL,
	`location_label` text NOT NULL,
	`hero_first` text NOT NULL,
	`hero_second` text NOT NULL,
	`tagline` text NOT NULL,
	`manifesto_prefix` text NOT NULL,
	`manifesto_highlight` text NOT NULL,
	`manifesto_suffix` text NOT NULL,
	`intro_note` text NOT NULL,
	`contact_first` text NOT NULL,
	`contact_second` text NOT NULL,
	`contact_email` text NOT NULL,
	`projects_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`theme` text NOT NULL,
	`accent` text NOT NULL,
	`secondary` text NOT NULL,
	`intensity` real NOT NULL,
	`motion` real NOT NULL,
	`grain` integer NOT NULL,
	`admin_email` text,
	`updated_at` text NOT NULL
);
