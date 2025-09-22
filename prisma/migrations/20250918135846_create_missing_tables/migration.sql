/*
  Warnings:

  - You are about to alter the column `userName` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `ipAddress` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(45)`.
  - You are about to alter the column `userAgent` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(500)`.
  - You are about to alter the column `backupName` on the `BackupLog` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `source` on the `BackupLog` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(500)`.
  - You are about to alter the column `destination` on the `BackupLog` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(500)`.
  - You are about to alter the column `errorMessage` on the `BackupLog` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `notes` on the `BackupLog` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `username` on the `CalipsoAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `password` on the `CalipsoAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `profile` on the `CalipsoAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `permissions` on the `CalipsoAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `modules` on the `CalipsoAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `notes` on the `CalipsoAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `name` on the `CatalogArea` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `itemName` on the `Consumable` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `email` on the `EmailAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(255)`.
  - You are about to alter the column `password` on the `EmailAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `forwardingTo` on the `EmailAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(255)`.
  - You are about to alter the column `aliases` on the `EmailAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `notes` on the `EmailAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `firstName` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `lastName` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `area` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `email` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(255)`.
  - You are about to alter the column `phone` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `position` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `name` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `location` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `serialNumber` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `ip` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(45)`.
  - You are about to alter the column `macAddress` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(17)`.
  - You are about to alter the column `area` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `brand` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `cpuNumber` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `ipAddress` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(45)`.
  - You are about to alter the column `model` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `motherboard` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `notes` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `operatingSystem` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `processor` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `ram` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `screenSize` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(20)`.
  - You are about to alter the column `storage` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `storageCapacity` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `storageType` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(20)`.
  - You are about to alter the column `name` on the `InventoryItem` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `brand` on the `InventoryItem` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `model` on the `InventoryItem` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `serialNumber` on the `InventoryItem` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `location` on the `InventoryItem` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `notes` on the `InventoryItem` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `title` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `message` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to drop the column `level` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `Permission` table. All the data in the column will be lost.
  - You are about to alter the column `resource` on the `Permission` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `model` on the `Printer` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `serialNumber` on the `Printer` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `area` on the `Printer` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `location` on the `Printer` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `ip` on the `Printer` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(45)`.
  - You are about to alter the column `macAddress` on the `Printer` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(17)`.
  - You are about to alter the column `notes` on the `Printer` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `requestId` on the `Purchase` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `itemName` on the `Purchase` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `requestNumber` on the `PurchaseRequest` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `itemName` on the `PurchaseRequest` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `description` on the `PurchaseRequest` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `justification` on the `PurchaseRequest` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `approvedBy` on the `PurchaseRequest` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `vendor` on the `PurchaseRequest` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `notes` on the `PurchaseRequest` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `username` on the `QnapAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `password` on the `QnapAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `userGroup` on the `QnapAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `folderPermissions` on the `QnapAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `quotaLimit` on the `QnapAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `notes` on the `QnapAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `notes` on the `Replacement` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `name` on the `Role` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `title` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(300)`.
  - You are about to alter the column `description` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `solution` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `area` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `category` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `ipAddress` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(45)`.
  - You are about to alter the column `resolutionTime` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `username` on the `User` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `passwordHash` on the `User` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(255)`.
  - You are about to alter the column `username` on the `WindowsAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(100)`.
  - You are about to alter the column `domain` on the `WindowsAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(50)`.
  - You are about to alter the column `password` on the `WindowsAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(200)`.
  - You are about to alter the column `profilePath` on the `WindowsAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(500)`.
  - You are about to alter the column `homeDirectory` on the `WindowsAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `NVarChar(500)`.
  - You are about to alter the column `groups` on the `WindowsAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `notes` on the `WindowsAccount` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - A unique constraint covering the columns `[name]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resource,action,scope]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emailVerificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserRole` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[AuditLog] DROP CONSTRAINT [AuditLog_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Permission] DROP CONSTRAINT [Permission_roleId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[UserRole] DROP CONSTRAINT [UserRole_roleId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[UserRole] DROP CONSTRAINT [UserRole_userId_fkey];

-- DropIndex
DROP INDEX [AuditLog_action_idx] ON [dbo].[AuditLog];

-- DropIndex
DROP INDEX [AuditLog_entity_idx] ON [dbo].[AuditLog];

-- DropIndex
DROP INDEX [BackupLog_backupType_idx] ON [dbo].[BackupLog];

-- DropIndex
DROP INDEX [BackupLog_status_idx] ON [dbo].[BackupLog];

-- DropIndex
ALTER TABLE [dbo].[CalipsoAccount] DROP CONSTRAINT [CalipsoAccount_employeeId_username_key];

-- DropIndex
DROP INDEX [CalipsoAccount_username_idx] ON [dbo].[CalipsoAccount];

-- DropIndex
ALTER TABLE [dbo].[CatalogArea] DROP CONSTRAINT [CatalogArea_name_key];

-- DropIndex
DROP INDEX [Consumable_status_idx] ON [dbo].[Consumable];

-- DropIndex
DROP INDEX [EmailAccount_accountType_idx] ON [dbo].[EmailAccount];

-- DropIndex
DROP INDEX [EmailAccount_email_idx] ON [dbo].[EmailAccount];

-- DropIndex
ALTER TABLE [dbo].[EmailAccount] DROP CONSTRAINT [EmailAccount_email_key];

-- DropIndex
ALTER TABLE [dbo].[Employee] DROP CONSTRAINT [Employee_email_key];

-- DropIndex
DROP INDEX [Equipment_area_idx] ON [dbo].[Equipment];

-- DropIndex
DROP INDEX [Equipment_ip_idx] ON [dbo].[Equipment];

-- DropIndex
ALTER TABLE [dbo].[Equipment] DROP CONSTRAINT [Equipment_serialNumber_key];

-- DropIndex
DROP INDEX [Equipment_status_idx] ON [dbo].[Equipment];

-- DropIndex
DROP INDEX [Equipment_type_idx] ON [dbo].[Equipment];

-- DropIndex
DROP INDEX [InventoryItem_category_idx] ON [dbo].[InventoryItem];

-- DropIndex
ALTER TABLE [dbo].[InventoryItem] DROP CONSTRAINT [InventoryItem_serialNumber_key];

-- DropIndex
DROP INDEX [InventoryItem_status_idx] ON [dbo].[InventoryItem];

-- DropIndex
DROP INDEX [Permission_roleId_idx] ON [dbo].[Permission];

-- DropIndex
ALTER TABLE [dbo].[Permission] DROP CONSTRAINT [Permission_roleId_resource_level_key];

-- DropIndex
ALTER TABLE [dbo].[Printer] DROP CONSTRAINT [Printer_ip_key];

-- DropIndex
ALTER TABLE [dbo].[Printer] DROP CONSTRAINT [Printer_serialNumber_key];

-- DropIndex
DROP INDEX [Printer_status_idx] ON [dbo].[Printer];

-- DropIndex
ALTER TABLE [dbo].[Purchase] DROP CONSTRAINT [Purchase_requestId_key];

-- DropIndex
DROP INDEX [Purchase_status_idx] ON [dbo].[Purchase];

-- DropIndex
DROP INDEX [PurchaseRequest_category_idx] ON [dbo].[PurchaseRequest];

-- DropIndex
DROP INDEX [PurchaseRequest_priority_idx] ON [dbo].[PurchaseRequest];

-- DropIndex
ALTER TABLE [dbo].[PurchaseRequest] DROP CONSTRAINT [PurchaseRequest_requestNumber_key];

-- DropIndex
DROP INDEX [PurchaseRequest_status_idx] ON [dbo].[PurchaseRequest];

-- DropIndex
ALTER TABLE [dbo].[QnapAccount] DROP CONSTRAINT [QnapAccount_employeeId_username_key];

-- DropIndex
DROP INDEX [QnapAccount_username_idx] ON [dbo].[QnapAccount];

-- DropIndex
ALTER TABLE [dbo].[Role] DROP CONSTRAINT [Role_name_key];

-- DropIndex
DROP INDEX [Ticket_status_idx] ON [dbo].[Ticket];

-- DropIndex
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_username_key];

-- DropIndex
ALTER TABLE [dbo].[WindowsAccount] DROP CONSTRAINT [WindowsAccount_employeeId_username_domain_key];

-- DropIndex
ALTER TABLE [dbo].[WindowsAccount] DROP CONSTRAINT [WindowsAccount_employeeId_username_domain_key];

-- DropIndex
DROP INDEX [WindowsAccount_username_idx] ON [dbo].[WindowsAccount];

-- AlterTable
ALTER TABLE [dbo].[AuditLog] ALTER COLUMN [userName] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[AuditLog] ALTER COLUMN [action] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[AuditLog] ALTER COLUMN [entity] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[AuditLog] ALTER COLUMN [ipAddress] NVARCHAR(45) NULL;
ALTER TABLE [dbo].[AuditLog] ALTER COLUMN [userAgent] NVARCHAR(500) NULL;
ALTER TABLE [dbo].[AuditLog] ADD [category] NVARCHAR(50),
[changes] TEXT,
[createdBy] NVARCHAR(50),
[description] NVARCHAR(500),
[duration] INT,
[endpoint] NVARCHAR(200),
[errorMessage] TEXT,
[expiresAt] DATETIME2,
[isSuccess] BIT NOT NULL CONSTRAINT [AuditLog_isSuccess_df] DEFAULT 1,
[metadata] TEXT,
[method] NVARCHAR(10),
[requestId] NVARCHAR(100),
[requiresReview] BIT NOT NULL CONSTRAINT [AuditLog_requiresReview_df] DEFAULT 0,
[reviewedAt] DATETIME2,
[reviewedBy] NVARCHAR(50),
[sessionId] NVARCHAR(100),
[severity] NVARCHAR(20) NOT NULL CONSTRAINT [AuditLog_severity_df] DEFAULT 'INFO',
[source] NVARCHAR(50),
[statusCode] INT,
[tags] TEXT;

-- AlterTable
ALTER TABLE [dbo].[BackupLog] ALTER COLUMN [backupName] NVARCHAR(200) NOT NULL;
ALTER TABLE [dbo].[BackupLog] ALTER COLUMN [backupType] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[BackupLog] ALTER COLUMN [source] NVARCHAR(500) NOT NULL;
ALTER TABLE [dbo].[BackupLog] ALTER COLUMN [destination] NVARCHAR(500) NOT NULL;
ALTER TABLE [dbo].[BackupLog] ALTER COLUMN [status] NVARCHAR(30) NOT NULL;
ALTER TABLE [dbo].[BackupLog] ALTER COLUMN [errorMessage] TEXT NULL;
ALTER TABLE [dbo].[BackupLog] ALTER COLUMN [notes] TEXT NULL;

-- AlterTable
ALTER TABLE [dbo].[CalipsoAccount] ALTER COLUMN [username] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[CalipsoAccount] ALTER COLUMN [password] NVARCHAR(200) NULL;
ALTER TABLE [dbo].[CalipsoAccount] ALTER COLUMN [profile] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[CalipsoAccount] ALTER COLUMN [permissions] TEXT NULL;
ALTER TABLE [dbo].[CalipsoAccount] ALTER COLUMN [modules] TEXT NULL;
ALTER TABLE [dbo].[CalipsoAccount] ALTER COLUMN [notes] TEXT NULL;

-- AlterTable
ALTER TABLE [dbo].[CatalogArea] ALTER COLUMN [name] NVARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Consumable] ALTER COLUMN [itemName] NVARCHAR(200) NOT NULL;
ALTER TABLE [dbo].[Consumable] ALTER COLUMN [color] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[Consumable] ALTER COLUMN [status] NVARCHAR(30) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[EmailAccount] ALTER COLUMN [email] NVARCHAR(255) NOT NULL;
ALTER TABLE [dbo].[EmailAccount] ALTER COLUMN [password] NVARCHAR(200) NULL;
ALTER TABLE [dbo].[EmailAccount] ALTER COLUMN [accountType] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[EmailAccount] ALTER COLUMN [forwardingTo] NVARCHAR(255) NULL;
ALTER TABLE [dbo].[EmailAccount] ALTER COLUMN [aliases] TEXT NULL;
ALTER TABLE [dbo].[EmailAccount] ALTER COLUMN [notes] TEXT NULL;

-- AlterTable
ALTER TABLE [dbo].[Employee] ALTER COLUMN [firstName] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[Employee] ALTER COLUMN [lastName] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[Employee] ALTER COLUMN [area] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Employee] ALTER COLUMN [email] NVARCHAR(255) NULL;
ALTER TABLE [dbo].[Employee] ALTER COLUMN [phone] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[Employee] ALTER COLUMN [position] NVARCHAR(100) NULL;

-- AlterTable
ALTER TABLE [dbo].[Equipment] DROP CONSTRAINT [Equipment_status_df];
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [name] NVARCHAR(200) NOT NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [type] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [status] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [location] NVARCHAR(200) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [serialNumber] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [ip] NVARCHAR(45) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [macAddress] NVARCHAR(17) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [area] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [brand] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [cpuNumber] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [ipAddress] NVARCHAR(45) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [model] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [motherboard] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [notes] TEXT NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [operatingSystem] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [processor] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [ram] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [screenSize] NVARCHAR(20) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [storage] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [storageCapacity] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[Equipment] ALTER COLUMN [storageType] NVARCHAR(20) NULL;
ALTER TABLE [dbo].[Equipment] ADD CONSTRAINT [Equipment_status_df] DEFAULT 'Activo' FOR [status];
ALTER TABLE [dbo].[Equipment] ADD [isPersonalProperty] BIT NOT NULL CONSTRAINT [Equipment_isPersonalProperty_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[InventoryItem] ALTER COLUMN [name] NVARCHAR(200) NOT NULL;
ALTER TABLE [dbo].[InventoryItem] ALTER COLUMN [category] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[InventoryItem] ALTER COLUMN [brand] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[InventoryItem] ALTER COLUMN [model] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[InventoryItem] ALTER COLUMN [serialNumber] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[InventoryItem] ALTER COLUMN [location] NVARCHAR(200) NULL;
ALTER TABLE [dbo].[InventoryItem] ALTER COLUMN [status] NVARCHAR(30) NOT NULL;
ALTER TABLE [dbo].[InventoryItem] ALTER COLUMN [condition] NVARCHAR(30) NOT NULL;
ALTER TABLE [dbo].[InventoryItem] ALTER COLUMN [notes] TEXT NULL;
ALTER TABLE [dbo].[InventoryItem] ADD [isPersonalProperty] BIT NOT NULL CONSTRAINT [InventoryItem_isPersonalProperty_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[Notification] ALTER COLUMN [title] NVARCHAR(200) NOT NULL;
ALTER TABLE [dbo].[Notification] ALTER COLUMN [message] TEXT NULL;

-- AlterTable
ALTER TABLE [dbo].[Permission] ALTER COLUMN [resource] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[Permission] DROP COLUMN [level],
[roleId];
ALTER TABLE [dbo].[Permission] ADD [action] NVARCHAR(30) NOT NULL,
[auditRequired] BIT NOT NULL CONSTRAINT [Permission_auditRequired_df] DEFAULT 1,
[category] NVARCHAR(50) NOT NULL,
[conditions] TEXT,
[createdBy] NVARCHAR(50),
[deletedAt] DATETIME2,
[description] NVARCHAR(500),
[displayName] NVARCHAR(150) NOT NULL,
[isActive] BIT NOT NULL CONSTRAINT [Permission_isActive_df] DEFAULT 1,
[isSystem] BIT NOT NULL CONSTRAINT [Permission_isSystem_df] DEFAULT 0,
[name] NVARCHAR(100) NOT NULL,
[requiresMFA] BIT NOT NULL CONSTRAINT [Permission_requiresMFA_df] DEFAULT 0,
[riskLevel] NVARCHAR(10) NOT NULL CONSTRAINT [Permission_riskLevel_df] DEFAULT 'LOW',
[scope] NVARCHAR(20) NOT NULL CONSTRAINT [Permission_scope_df] DEFAULT 'ALL',
[updatedBy] NVARCHAR(50);

-- AlterTable
ALTER TABLE [dbo].[Printer] ALTER COLUMN [model] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[Printer] ALTER COLUMN [serialNumber] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Printer] ALTER COLUMN [area] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Printer] ALTER COLUMN [location] NVARCHAR(200) NULL;
ALTER TABLE [dbo].[Printer] ALTER COLUMN [ip] NVARCHAR(45) NULL;
ALTER TABLE [dbo].[Printer] ALTER COLUMN [macAddress] NVARCHAR(17) NULL;
ALTER TABLE [dbo].[Printer] ALTER COLUMN [status] NVARCHAR(30) NOT NULL;
ALTER TABLE [dbo].[Printer] ALTER COLUMN [notes] TEXT NULL;

-- AlterTable
ALTER TABLE [dbo].[Purchase] ALTER COLUMN [requestId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[Purchase] ALTER COLUMN [itemName] NVARCHAR(200) NOT NULL;
ALTER TABLE [dbo].[Purchase] ALTER COLUMN [status] NVARCHAR(30) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [requestNumber] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [itemName] NVARCHAR(200) NOT NULL;
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [category] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [description] TEXT NULL;
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [justification] TEXT NULL;
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [priority] NVARCHAR(30) NOT NULL;
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [status] NVARCHAR(30) NOT NULL;
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [approvedBy] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [vendor] NVARCHAR(200) NULL;
ALTER TABLE [dbo].[PurchaseRequest] ALTER COLUMN [notes] TEXT NULL;

-- AlterTable
ALTER TABLE [dbo].[QnapAccount] ALTER COLUMN [username] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[QnapAccount] ALTER COLUMN [password] NVARCHAR(200) NULL;
ALTER TABLE [dbo].[QnapAccount] ALTER COLUMN [userGroup] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[QnapAccount] ALTER COLUMN [folderPermissions] TEXT NULL;
ALTER TABLE [dbo].[QnapAccount] ALTER COLUMN [quotaLimit] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[QnapAccount] ALTER COLUMN [notes] TEXT NULL;

-- AlterTable
ALTER TABLE [dbo].[Replacement] ALTER COLUMN [notes] TEXT NULL;

-- AlterTable
ALTER TABLE [dbo].[Role] ALTER COLUMN [name] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[Role] ADD [color] NVARCHAR(7),
[conditions] TEXT,
[createdBy] NVARCHAR(50),
[deletedAt] DATETIME2,
[description] NVARCHAR(500),
[displayName] NVARCHAR(100) NOT NULL,
[icon] NVARCHAR(50),
[isActive] BIT NOT NULL CONSTRAINT [Role_isActive_df] DEFAULT 1,
[isSystem] BIT NOT NULL CONSTRAINT [Role_isSystem_df] DEFAULT 0,
[level] INT NOT NULL CONSTRAINT [Role_level_df] DEFAULT 50,
[maxUsers] INT,
[metadata] TEXT,
[parentRoleId] INT,
[permissions] TEXT,
[priority] INT NOT NULL CONSTRAINT [Role_priority_df] DEFAULT 500,
[restrictions] TEXT,
[updatedBy] NVARCHAR(50);

-- AlterTable
ALTER TABLE [dbo].[Ticket] ALTER COLUMN [title] NVARCHAR(300) NOT NULL;
ALTER TABLE [dbo].[Ticket] ALTER COLUMN [description] TEXT NULL;
ALTER TABLE [dbo].[Ticket] ALTER COLUMN [status] NVARCHAR(30) NOT NULL;
ALTER TABLE [dbo].[Ticket] ALTER COLUMN [solution] TEXT NULL;
ALTER TABLE [dbo].[Ticket] ALTER COLUMN [area] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Ticket] ALTER COLUMN [category] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[Ticket] ALTER COLUMN [ipAddress] NVARCHAR(45) NULL;
ALTER TABLE [dbo].[Ticket] ALTER COLUMN [resolutionTime] NVARCHAR(50) NULL;

-- AlterTable
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_role_df];
ALTER TABLE [dbo].[User] ALTER COLUMN [username] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[User] ALTER COLUMN [passwordHash] NVARCHAR(255) NOT NULL;
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_role_df] DEFAULT 'USER' FOR [role];
ALTER TABLE [dbo].[User] ADD [createdBy] NVARCHAR(50),
[deletedAt] DATETIME2,
[email] NVARCHAR(255),
[emailVerificationToken] NVARCHAR(100),
[employeeId] INT,
[failedLoginAttempts] INT NOT NULL CONSTRAINT [User_failedLoginAttempts_df] DEFAULT 0,
[firstName] NVARCHAR(100),
[isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
[isEmailVerified] BIT NOT NULL CONSTRAINT [User_isEmailVerified_df] DEFAULT 0,
[lastLoginAt] DATETIME2,
[lastName] NVARCHAR(100),
[lockedUntil] DATETIME2,
[passwordExpiresAt] DATETIME2,
[passwordResetExpiresAt] DATETIME2,
[passwordResetToken] NVARCHAR(100),
[sessionExpiresAt] DATETIME2,
[sessionToken] NVARCHAR(500),
[twoFactorEnabled] BIT NOT NULL CONSTRAINT [User_twoFactorEnabled_df] DEFAULT 0,
[twoFactorSecret] NVARCHAR(100),
[updatedBy] NVARCHAR(50);

-- AlterTable
ALTER TABLE [dbo].[UserRole] ADD [assignedAt] DATETIME2 NOT NULL CONSTRAINT [UserRole_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
[assignedBy] NVARCHAR(50),
[conditions] TEXT,
[createdAt] DATETIME2 NOT NULL CONSTRAINT [UserRole_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
[expiresAt] DATETIME2,
[isActive] BIT NOT NULL CONSTRAINT [UserRole_isActive_df] DEFAULT 1,
[isPrimary] BIT NOT NULL CONSTRAINT [UserRole_isPrimary_df] DEFAULT 0,
[isTemporary] BIT NOT NULL CONSTRAINT [UserRole_isTemporary_df] DEFAULT 0,
[metadata] TEXT,
[reason] NVARCHAR(500),
[updatedAt] DATETIME2 NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[WindowsAccount] ALTER COLUMN [username] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[WindowsAccount] ALTER COLUMN [domain] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[WindowsAccount] ALTER COLUMN [password] NVARCHAR(200) NULL;
ALTER TABLE [dbo].[WindowsAccount] ALTER COLUMN [profilePath] NVARCHAR(500) NULL;
ALTER TABLE [dbo].[WindowsAccount] ALTER COLUMN [homeDirectory] NVARCHAR(500) NULL;
ALTER TABLE [dbo].[WindowsAccount] ALTER COLUMN [groups] TEXT NULL;
ALTER TABLE [dbo].[WindowsAccount] ALTER COLUMN [notes] TEXT NULL;

-- CreateTable
CREATE TABLE [dbo].[RolePermission] (
    [id] INT NOT NULL IDENTITY(1,1),
    [roleId] INT NOT NULL,
    [permissionId] INT NOT NULL,
    [conditions] TEXT,
    [grantedBy] NVARCHAR(50),
    [grantedAt] DATETIME2 NOT NULL CONSTRAINT [RolePermission_grantedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [isActive] BIT NOT NULL CONSTRAINT [RolePermission_isActive_df] DEFAULT 1,
    [expiresAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RolePermission_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [RolePermission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RolePermission_roleId_permissionId_key] UNIQUE NONCLUSTERED ([roleId],[permissionId])
);

-- CreateTable
CREATE TABLE [dbo].[UserPermission] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [permissionId] INT NOT NULL,
    [grantedBy] NVARCHAR(50),
    [grantedAt] DATETIME2 NOT NULL CONSTRAINT [UserPermission_grantedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [isDenied] BIT NOT NULL CONSTRAINT [UserPermission_isDenied_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [UserPermission_isActive_df] DEFAULT 1,
    [expiresAt] DATETIME2,
    [reason] NVARCHAR(500),
    [conditions] TEXT,
    [metadata] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserPermission_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [UserPermission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserPermission_userId_permissionId_key] UNIQUE NONCLUSTERED ([userId],[permissionId])
);

-- CreateTable
CREATE TABLE [dbo].[PermissionGroup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(100) NOT NULL,
    [displayName] NVARCHAR(150) NOT NULL,
    [description] NVARCHAR(500),
    [category] NVARCHAR(50) NOT NULL,
    [color] NVARCHAR(7),
    [icon] NVARCHAR(50),
    [isSystem] BIT NOT NULL CONSTRAINT [PermissionGroup_isSystem_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [PermissionGroup_isActive_df] DEFAULT 1,
    [priority] INT NOT NULL CONSTRAINT [PermissionGroup_priority_df] DEFAULT 500,
    [createdBy] NVARCHAR(50),
    [updatedBy] NVARCHAR(50),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PermissionGroup_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PermissionGroup_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PermissionGroup_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[PermissionGroupItem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [groupId] INT NOT NULL,
    [permissionId] INT NOT NULL,
    [isRequired] BIT NOT NULL CONSTRAINT [PermissionGroupItem_isRequired_df] DEFAULT 0,
    [priority] INT NOT NULL CONSTRAINT [PermissionGroupItem_priority_df] DEFAULT 500,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PermissionGroupItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PermissionGroupItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PermissionGroupItem_groupId_permissionId_key] UNIQUE NONCLUSTERED ([groupId],[permissionId])
);

-- CreateTable
CREATE TABLE [dbo].[UserSession] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [sessionToken] NVARCHAR(500) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [UserSession_isActive_df] DEFAULT 1,
    [ipAddress] NVARCHAR(45),
    [userAgent] NVARCHAR(500),
    [lastActivity] DATETIME2 NOT NULL CONSTRAINT [UserSession_lastActivity_df] DEFAULT CURRENT_TIMESTAMP,
    [metadata] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserSession_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [UserSession_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserSession_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken])
);

-- CreateIndex
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username]);

-- CreateIndex
ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_email_key] UNIQUE NONCLUSTERED ([email]);

-- CreateIndex
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RolePermission_roleId_idx] ON [dbo].[RolePermission]([roleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RolePermission_permissionId_idx] ON [dbo].[RolePermission]([permissionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RolePermission_isActive_idx] ON [dbo].[RolePermission]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RolePermission_expiresAt_idx] ON [dbo].[RolePermission]([expiresAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserPermission_userId_idx] ON [dbo].[UserPermission]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserPermission_permissionId_idx] ON [dbo].[UserPermission]([permissionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserPermission_isDenied_idx] ON [dbo].[UserPermission]([isDenied]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserPermission_isActive_idx] ON [dbo].[UserPermission]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserPermission_expiresAt_idx] ON [dbo].[UserPermission]([expiresAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PermissionGroup_name_idx] ON [dbo].[PermissionGroup]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PermissionGroup_category_idx] ON [dbo].[PermissionGroup]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PermissionGroup_isActive_idx] ON [dbo].[PermissionGroup]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PermissionGroupItem_groupId_idx] ON [dbo].[PermissionGroupItem]([groupId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PermissionGroupItem_permissionId_idx] ON [dbo].[PermissionGroupItem]([permissionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserSession_userId_idx] ON [dbo].[UserSession]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserSession_sessionToken_idx] ON [dbo].[UserSession]([sessionToken]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserSession_expiresAt_idx] ON [dbo].[UserSession]([expiresAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserSession_isActive_idx] ON [dbo].[UserSession]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserSession_lastActivity_idx] ON [dbo].[UserSession]([lastActivity]);

-- CreateIndex
ALTER TABLE [dbo].[Equipment] ADD CONSTRAINT [Equipment_serialNumber_key] UNIQUE NONCLUSTERED ([serialNumber]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Equipment_type_idx] ON [dbo].[Equipment]([type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Equipment_status_idx] ON [dbo].[Equipment]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Equipment_ip_idx] ON [dbo].[Equipment]([ip]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Equipment_area_idx] ON [dbo].[Equipment]([area]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_status_idx] ON [dbo].[Ticket]([status]);

-- CreateIndex
ALTER TABLE [dbo].[Printer] ADD CONSTRAINT [Printer_serialNumber_key] UNIQUE NONCLUSTERED ([serialNumber]);

-- CreateIndex
ALTER TABLE [dbo].[Printer] ADD CONSTRAINT [Printer_ip_key] UNIQUE NONCLUSTERED ([ip]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Printer_status_idx] ON [dbo].[Printer]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Consumable_status_idx] ON [dbo].[Consumable]([status]);

-- CreateIndex
ALTER TABLE [dbo].[Purchase] ADD CONSTRAINT [Purchase_requestId_key] UNIQUE NONCLUSTERED ([requestId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Purchase_status_idx] ON [dbo].[Purchase]([status]);

-- CreateIndex
ALTER TABLE [dbo].[CatalogArea] ADD CONSTRAINT [CatalogArea_name_key] UNIQUE NONCLUSTERED ([name]);

-- CreateIndex
ALTER TABLE [dbo].[InventoryItem] ADD CONSTRAINT [InventoryItem_serialNumber_key] UNIQUE NONCLUSTERED ([serialNumber]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InventoryItem_category_idx] ON [dbo].[InventoryItem]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InventoryItem_status_idx] ON [dbo].[InventoryItem]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WindowsAccount_username_idx] ON [dbo].[WindowsAccount]([username]);

-- CreateIndex
ALTER TABLE [dbo].[WindowsAccount] ADD CONSTRAINT [WindowsAccount_employeeId_username_domain_key] UNIQUE NONCLUSTERED ([employeeId], [username], [domain]);

-- CreateIndex
ALTER TABLE [dbo].[WindowsAccount] ADD CONSTRAINT [WindowsAccount_employeeId_username_domain_key] UNIQUE NONCLUSTERED ([employeeId], [username], [domain]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QnapAccount_username_idx] ON [dbo].[QnapAccount]([username]);

-- CreateIndex
ALTER TABLE [dbo].[QnapAccount] ADD CONSTRAINT [QnapAccount_employeeId_username_key] UNIQUE NONCLUSTERED ([employeeId], [username]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CalipsoAccount_username_idx] ON [dbo].[CalipsoAccount]([username]);

-- CreateIndex
ALTER TABLE [dbo].[CalipsoAccount] ADD CONSTRAINT [CalipsoAccount_employeeId_username_key] UNIQUE NONCLUSTERED ([employeeId], [username]);

-- CreateIndex
ALTER TABLE [dbo].[EmailAccount] ADD CONSTRAINT [EmailAccount_email_key] UNIQUE NONCLUSTERED ([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailAccount_email_idx] ON [dbo].[EmailAccount]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailAccount_accountType_idx] ON [dbo].[EmailAccount]([accountType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BackupLog_status_idx] ON [dbo].[BackupLog]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BackupLog_backupType_idx] ON [dbo].[BackupLog]([backupType]);

-- CreateIndex
ALTER TABLE [dbo].[PurchaseRequest] ADD CONSTRAINT [PurchaseRequest_requestNumber_key] UNIQUE NONCLUSTERED ([requestNumber]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_status_idx] ON [dbo].[PurchaseRequest]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_priority_idx] ON [dbo].[PurchaseRequest]([priority]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_category_idx] ON [dbo].[PurchaseRequest]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_entity_idx] ON [dbo].[AuditLog]([entity]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_action_idx] ON [dbo].[AuditLog]([action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_userName_idx] ON [dbo].[AuditLog]([userName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_sessionId_idx] ON [dbo].[AuditLog]([sessionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_severity_idx] ON [dbo].[AuditLog]([severity]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_category_idx] ON [dbo].[AuditLog]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_source_idx] ON [dbo].[AuditLog]([source]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_isSuccess_idx] ON [dbo].[AuditLog]([isSuccess]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_requiresReview_idx] ON [dbo].[AuditLog]([requiresReview]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_expiresAt_idx] ON [dbo].[AuditLog]([expiresAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_firstName_idx] ON [dbo].[Employee]([firstName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_lastName_idx] ON [dbo].[Employee]([lastName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_area_idx] ON [dbo].[Employee]([area]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_email_idx] ON [dbo].[Employee]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_status_idx] ON [dbo].[Employee]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Equipment_assignedToId_idx] ON [dbo].[Equipment]([assignedToId]);

-- CreateIndex
ALTER TABLE [dbo].[Permission] ADD CONSTRAINT [Permission_name_key] UNIQUE NONCLUSTERED ([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_name_idx] ON [dbo].[Permission]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_category_idx] ON [dbo].[Permission]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_resource_idx] ON [dbo].[Permission]([resource]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_action_idx] ON [dbo].[Permission]([action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_scope_idx] ON [dbo].[Permission]([scope]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_isActive_idx] ON [dbo].[Permission]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_riskLevel_idx] ON [dbo].[Permission]([riskLevel]);

-- CreateIndex
ALTER TABLE [dbo].[Permission] ADD CONSTRAINT [Permission_resource_action_scope_key] UNIQUE NONCLUSTERED ([resource], [action], [scope]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Printer_area_idx] ON [dbo].[Printer]([area]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_name_idx] ON [dbo].[Role]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_isActive_idx] ON [dbo].[Role]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_isSystem_idx] ON [dbo].[Role]([isSystem]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_level_idx] ON [dbo].[Role]([level]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_parentRoleId_idx] ON [dbo].[Role]([parentRoleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_priority_idx] ON [dbo].[Role]([priority]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_requestorId_idx] ON [dbo].[Ticket]([requestorId]);

-- CreateIndex
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email]);

-- CreateIndex
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken]);

-- CreateIndex
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_passwordResetToken_key] UNIQUE NONCLUSTERED ([passwordResetToken]);

-- CreateIndex
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_emailVerificationToken_key] UNIQUE NONCLUSTERED ([emailVerificationToken]);

-- CreateIndex
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_employeeId_key] UNIQUE NONCLUSTERED ([employeeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_username_idx] ON [dbo].[User]([username]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_email_idx] ON [dbo].[User]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_isActive_idx] ON [dbo].[User]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_role_idx] ON [dbo].[User]([role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_employeeId_idx] ON [dbo].[User]([employeeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_sessionToken_idx] ON [dbo].[User]([sessionToken]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_failedLoginAttempts_idx] ON [dbo].[User]([failedLoginAttempts]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_lockedUntil_idx] ON [dbo].[User]([lockedUntil]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_lastLoginAt_idx] ON [dbo].[User]([lastLoginAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserRole_userId_idx] ON [dbo].[UserRole]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserRole_isActive_idx] ON [dbo].[UserRole]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserRole_isPrimary_idx] ON [dbo].[UserRole]([isPrimary]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserRole_expiresAt_idx] ON [dbo].[UserRole]([expiresAt]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[Employee]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [Role_parentRoleId_fkey] FOREIGN KEY ([parentRoleId]) REFERENCES [dbo].[Role]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_permissionId_fkey] FOREIGN KEY ([permissionId]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserPermission] ADD CONSTRAINT [UserPermission_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserPermission] ADD CONSTRAINT [UserPermission_permissionId_fkey] FOREIGN KEY ([permissionId]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PermissionGroupItem] ADD CONSTRAINT [PermissionGroupItem_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[PermissionGroup]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PermissionGroupItem] ADD CONSTRAINT [PermissionGroupItem_permissionId_fkey] FOREIGN KEY ([permissionId]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserSession] ADD CONSTRAINT [UserSession_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_createdBy_fkey] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[User]([username]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_reviewedBy_fkey] FOREIGN KEY ([reviewedBy]) REFERENCES [dbo].[User]([username]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
