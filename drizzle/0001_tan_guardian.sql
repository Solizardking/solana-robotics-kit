CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codename` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('market_analyst','social_analyst','news_analyst','fundamental_analyst','bullish_researcher','bearish_researcher','trader','risk_manager','executor') NOT NULL,
	`model` varchar(128) NOT NULL,
	`motto` text,
	`strategy` text,
	`startingCapital` decimal(18,2) NOT NULL DEFAULT '10000.00',
	`currentCapital` decimal(18,2) NOT NULL DEFAULT '10000.00',
	`roi` decimal(10,4) NOT NULL DEFAULT '0.0000',
	`pnl` decimal(18,2) NOT NULL DEFAULT '0.00',
	`tradesExecuted` int NOT NULL DEFAULT 0,
	`winRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`sharpeRatio` decimal(6,3) NOT NULL DEFAULT '0.000',
	`maxDrawdown` decimal(5,2) NOT NULL DEFAULT '0.00',
	`rank` int,
	`status` enum('active','idle','competing') NOT NULL DEFAULT 'idle',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_codename_unique` UNIQUE(`codename`)
);
--> statement-breakpoint
CREATE TABLE `avatars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`colorScheme` varchar(64) DEFAULT 'solana_purple',
	`personality` json,
	`capabilities` json,
	`safetyParams` json,
	`aiModel` varchar(128) DEFAULT 'nvidia/nemotron-3-nano-30b-a3b',
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avatars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int NOT NULL,
	`competitionId` varchar(64) NOT NULL,
	`amount` decimal(18,6) NOT NULL,
	`currency` varchar(16) NOT NULL DEFAULT 'USDC',
	`odds` decimal(8,4),
	`potentialPayout` decimal(18,6),
	`status` enum('pending','won','lost','cancelled') NOT NULL DEFAULT 'pending',
	`txSignature` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`settledAt` timestamp,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`prizePool` decimal(18,2) NOT NULL DEFAULT '0.00',
	`bettingVolume` decimal(18,2) NOT NULL DEFAULT '0.00',
	`status` enum('upcoming','live','completed') NOT NULL DEFAULT 'upcoming',
	`startTime` timestamp,
	`endTime` timestamp,
	`winnerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `robots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`codename` varchar(64) NOT NULL,
	`type` enum('market_analyst','social_analyst','news_analyst','fundamental_analyst','bullish_researcher','bearish_researcher','trader','risk_manager','executor') NOT NULL,
	`model` varchar(128) NOT NULL,
	`description` text,
	`capabilities` json,
	`platform` varchar(64),
	`computeTops` int,
	`powerRange` varchar(32),
	`status` enum('active','idle','busy','offline') NOT NULL DEFAULT 'idle',
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `robots_id` PRIMARY KEY(`id`),
	CONSTRAINT `robots_codename_unique` UNIQUE(`codename`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`type` enum('buy','sell','long','short') NOT NULL,
	`pair` varchar(32) NOT NULL,
	`entryPrice` decimal(18,8) NOT NULL,
	`exitPrice` decimal(18,8),
	`positionSize` decimal(18,8) NOT NULL,
	`pnl` decimal(18,2),
	`status` enum('open','closed','cancelled') NOT NULL DEFAULT 'open',
	`txSignature` varchar(128),
	`confidence` decimal(5,2),
	`reasoning` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `walletAddress` varchar(64);