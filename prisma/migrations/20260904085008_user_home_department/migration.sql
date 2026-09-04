-- AlterTable
ALTER TABLE `user` ADD COLUMN `homeDepartmentId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `User_homeDepartmentId_idx` ON `User`(`homeDepartmentId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_homeDepartmentId_fkey` FOREIGN KEY (`homeDepartmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
