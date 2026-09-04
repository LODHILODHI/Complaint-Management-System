-- AlterTable
ALTER TABLE `user` ADD COLUMN `approvalStatus` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `otherDepartmentNote` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `User_approvalStatus_idx` ON `User`(`approvalStatus`);
