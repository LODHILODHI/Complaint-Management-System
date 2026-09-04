-- Create join table first
CREATE TABLE `_HeadDepartments` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_HeadDepartments_AB_unique`(`A`, `B`),
    INDEX `_HeadDepartments_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve existing head → department assignments
INSERT INTO `_HeadDepartments` (`A`, `B`)
SELECT `departmentId`, `id`
FROM `user`
WHERE `departmentId` IS NOT NULL;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_departmentId_fkey`;

-- DropIndex
DROP INDEX `User_departmentId_idx` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `departmentId`;

-- AddForeignKey
ALTER TABLE `_HeadDepartments` ADD CONSTRAINT `_HeadDepartments_A_fkey` FOREIGN KEY (`A`) REFERENCES `Department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_HeadDepartments` ADD CONSTRAINT `_HeadDepartments_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
