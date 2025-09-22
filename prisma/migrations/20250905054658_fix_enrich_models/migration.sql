BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Employee] ADD [position] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Equipment] ADD [area] NVARCHAR(1000),
[brand] NVARCHAR(1000),
[cpuNumber] NVARCHAR(1000),
[dvdUnit] BIT NOT NULL CONSTRAINT [Equipment_dvdUnit_df] DEFAULT 0,
[ipAddress] NVARCHAR(1000),
[model] NVARCHAR(1000),
[motherboard] NVARCHAR(1000),
[notes] NVARCHAR(1000),
[operatingSystem] NVARCHAR(1000),
[processor] NVARCHAR(1000),
[purchaseDate] DATETIME2,
[ram] NVARCHAR(1000),
[screenSize] NVARCHAR(1000),
[storage] NVARCHAR(1000),
[storageCapacity] NVARCHAR(1000),
[storageType] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Ticket] ADD [area] NVARCHAR(1000),
[category] NVARCHAR(1000),
[ipAddress] NVARCHAR(1000),
[resolutionTime] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[InventoryItem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(50) NOT NULL,
    [brand] NVARCHAR(1000),
    [model] NVARCHAR(1000),
    [serialNumber] NVARCHAR(1000),
    [quantity] INT NOT NULL CONSTRAINT [InventoryItem_quantity_df] DEFAULT 0,
    [location] NVARCHAR(1000),
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [InventoryItem_status_df] DEFAULT 'AVAILABLE',
    [condition] NVARCHAR(20) NOT NULL CONSTRAINT [InventoryItem_condition_df] DEFAULT 'NEW',
    [notes] NVARCHAR(1000),
    [assignedToId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [InventoryItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [InventoryItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [InventoryItem_serialNumber_key] UNIQUE NONCLUSTERED ([serialNumber])
);

-- CreateTable
CREATE TABLE [dbo].[WindowsAccount] (
    [id] INT NOT NULL IDENTITY(1,1),
    [employeeId] INT NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [domain] NVARCHAR(1000) CONSTRAINT [WindowsAccount_domain_df] DEFAULT 'PRETENSA',
    [password] NVARCHAR(1000),
    [profilePath] NVARCHAR(1000),
    [homeDirectory] NVARCHAR(1000),
    [groups] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [WindowsAccount_isActive_df] DEFAULT 1,
    [lastLogin] DATETIME2,
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [WindowsAccount_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [WindowsAccount_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [WindowsAccount_employeeId_username_domain_key] UNIQUE NONCLUSTERED ([employeeId],[username],[domain])
);

-- CreateTable
CREATE TABLE [dbo].[QnapAccount] (
    [id] INT NOT NULL IDENTITY(1,1),
    [employeeId] INT NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000),
    [userGroup] NVARCHAR(1000),
    [folderPermissions] NVARCHAR(1000),
    [quotaLimit] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [QnapAccount_isActive_df] DEFAULT 1,
    [lastAccess] DATETIME2,
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [QnapAccount_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [QnapAccount_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [QnapAccount_employeeId_username_key] UNIQUE NONCLUSTERED ([employeeId],[username])
);

-- CreateTable
CREATE TABLE [dbo].[CalipsoAccount] (
    [id] INT NOT NULL IDENTITY(1,1),
    [employeeId] INT NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000),
    [profile] NVARCHAR(1000),
    [permissions] NVARCHAR(1000),
    [modules] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [CalipsoAccount_isActive_df] DEFAULT 1,
    [lastLogin] DATETIME2,
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CalipsoAccount_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CalipsoAccount_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CalipsoAccount_employeeId_username_key] UNIQUE NONCLUSTERED ([employeeId],[username])
);

-- CreateTable
CREATE TABLE [dbo].[EmailAccount] (
    [id] INT NOT NULL IDENTITY(1,1),
    [employeeId] INT NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000),
    [accountType] NVARCHAR(20) NOT NULL,
    [forwardingTo] NVARCHAR(1000),
    [aliases] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [EmailAccount_isActive_df] DEFAULT 1,
    [lastSync] DATETIME2,
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [EmailAccount_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [EmailAccount_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [EmailAccount_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[BackupLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [backupName] NVARCHAR(1000) NOT NULL,
    [backupType] NVARCHAR(30) NOT NULL,
    [source] NVARCHAR(1000) NOT NULL,
    [destination] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(20) NOT NULL,
    [startTime] DATETIME2,
    [endTime] DATETIME2,
    [duration] INT,
    [sizeBytes] BIGINT,
    [errorMessage] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BackupLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [BackupLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PurchaseRequest] (
    [id] INT NOT NULL IDENTITY(1,1),
    [requestNumber] NVARCHAR(1000),
    [requestorId] INT,
    [itemName] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(50) NOT NULL,
    [description] NVARCHAR(1000),
    [justification] NVARCHAR(1000),
    [quantity] INT NOT NULL CONSTRAINT [PurchaseRequest_quantity_df] DEFAULT 1,
    [estimatedCost] DECIMAL(10,2),
    [priority] NVARCHAR(20) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [PurchaseRequest_status_df] DEFAULT 'PENDING',
    [approvedBy] NVARCHAR(1000),
    [approvalDate] DATETIME2,
    [purchaseDate] DATETIME2,
    [receivedDate] DATETIME2,
    [vendor] NVARCHAR(1000),
    [actualCost] DECIMAL(10,2),
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PurchaseRequest_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PurchaseRequest_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PurchaseRequest_requestNumber_key] UNIQUE NONCLUSTERED ([requestNumber])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InventoryItem_category_idx] ON [dbo].[InventoryItem]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InventoryItem_status_idx] ON [dbo].[InventoryItem]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InventoryItem_assignedToId_idx] ON [dbo].[InventoryItem]([assignedToId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WindowsAccount_employeeId_idx] ON [dbo].[WindowsAccount]([employeeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WindowsAccount_username_idx] ON [dbo].[WindowsAccount]([username]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QnapAccount_employeeId_idx] ON [dbo].[QnapAccount]([employeeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QnapAccount_username_idx] ON [dbo].[QnapAccount]([username]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CalipsoAccount_employeeId_idx] ON [dbo].[CalipsoAccount]([employeeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CalipsoAccount_username_idx] ON [dbo].[CalipsoAccount]([username]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailAccount_employeeId_idx] ON [dbo].[EmailAccount]([employeeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailAccount_email_idx] ON [dbo].[EmailAccount]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailAccount_accountType_idx] ON [dbo].[EmailAccount]([accountType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BackupLog_status_idx] ON [dbo].[BackupLog]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BackupLog_backupType_idx] ON [dbo].[BackupLog]([backupType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BackupLog_startTime_idx] ON [dbo].[BackupLog]([startTime]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_status_idx] ON [dbo].[PurchaseRequest]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_priority_idx] ON [dbo].[PurchaseRequest]([priority]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_requestorId_idx] ON [dbo].[PurchaseRequest]([requestorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_category_idx] ON [dbo].[PurchaseRequest]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Equipment_area_idx] ON [dbo].[Equipment]([area]);

-- AddForeignKey
ALTER TABLE [dbo].[InventoryItem] ADD CONSTRAINT [InventoryItem_assignedToId_fkey] FOREIGN KEY ([assignedToId]) REFERENCES [dbo].[Employee]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WindowsAccount] ADD CONSTRAINT [WindowsAccount_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[Employee]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QnapAccount] ADD CONSTRAINT [QnapAccount_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[Employee]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CalipsoAccount] ADD CONSTRAINT [CalipsoAccount_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[Employee]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[EmailAccount] ADD CONSTRAINT [EmailAccount_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[Employee]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseRequest] ADD CONSTRAINT [PurchaseRequest_requestorId_fkey] FOREIGN KEY ([requestorId]) REFERENCES [dbo].[Employee]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
