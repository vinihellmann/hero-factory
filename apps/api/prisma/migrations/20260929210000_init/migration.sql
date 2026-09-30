CREATE TABLE `heroes` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(255) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `universe` VARCHAR(255) NOT NULL,
    `main_power` VARCHAR(255) NOT NULL,
    `avatar_url` VARCHAR(2048) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `heroes_created_at_id_idx` (`created_at` DESC, `id` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
