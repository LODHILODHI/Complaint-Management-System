-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN', 'DEPARTMENT_HEAD') NOT NULL DEFAULT 'USER',
    `departmentId` VARCHAR(191) NULL,
    `profileCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Department_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Complaint` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `assignedDeptHeadId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Complaint_userId_idx`(`userId`),
    INDEX `Complaint_departmentId_idx`(`departmentId`),
    INDEX `Complaint_assignedDeptHeadId_idx`(`assignedDeptHeadId`),
    INDEX `Complaint_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComplaintAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `complaintId` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ComplaintAttachment_complaintId_idx`(`complaintId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComplaintComment` (
    `id` VARCHAR(191) NOT NULL,
    `complaintId` VARCHAR(191) NOT NULL,
    `commentedBy` VARCHAR(191) NOT NULL,
    `comment` TEXT NOT NULL,
    `isFinalResolution` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ComplaintComment_complaintId_idx`(`complaintId`),
    INDEX `ComplaintComment_commentedBy_idx`(`commentedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_assignedDeptHeadId_fkey` FOREIGN KEY (`assignedDeptHeadId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintAttachment` ADD CONSTRAINT `ComplaintAttachment_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintComment` ADD CONSTRAINT `ComplaintComment_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintComment` ADD CONSTRAINT `ComplaintComment_commentedBy_fkey` FOREIGN KEY (`commentedBy`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
