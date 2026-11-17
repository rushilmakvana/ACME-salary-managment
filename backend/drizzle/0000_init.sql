CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`job_title` text NOT NULL,
	`department` text NOT NULL,
	`country` text NOT NULL,
	`hire_date` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE INDEX `employees_country_idx` ON `employees` (`country`);--> statement-breakpoint
CREATE INDEX `employees_department_idx` ON `employees` (`department`);--> statement-breakpoint
CREATE INDEX `employees_job_title_idx` ON `employees` (`job_title`);--> statement-breakpoint
CREATE TABLE `salaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`effective_date` text NOT NULL,
	`reason` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "salaries_amount_positive" CHECK("salaries"."amount" > 0)
);
--> statement-breakpoint
CREATE INDEX `salaries_employee_date_idx` ON `salaries` (`employee_id`,`effective_date`);