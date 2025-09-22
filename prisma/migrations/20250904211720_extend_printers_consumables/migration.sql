BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Printer] (
    [id] INT NOT NULL IDENTITY(1,1),
    [model] NVARCHAR(1000) NOT NULL,
    [serialNumber] NVARCHAR(1000),
    [area] NVARCHAR(1000),
    [location] NVARCHAR(1000),
    [ip] NVARCHAR(1000),
    [macAddress] NVARCHAR(1000),
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Printer_status_df] DEFAULT 'ACTIVE',
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Printer_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Printer_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Printer_serialNumber_key] UNIQUE NONCLUSTERED ([serialNumber]),
    CONSTRAINT [Printer_ip_key] UNIQUE NONCLUSTERED ([ip])
);

-- CreateTable
CREATE TABLE [dbo].[Consumable] (
    [id] INT NOT NULL IDENTITY(1,1),
    [itemName] NVARCHAR(1000) NOT NULL,
    [color] NVARCHAR(20),
    [quantityAvailable] INT NOT NULL CONSTRAINT [Consumable_quantityAvailable_df] DEFAULT 0,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Consumable_status_df] DEFAULT 'OK',
    [printerId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Consumable_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Consumable_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Replacement] (
    [id] INT NOT NULL IDENTITY(1,1),
    [printerId] INT NOT NULL,
    [consumableId] INT,
    [replacementDate] DATETIME2 NOT NULL,
    [completionDate] DATETIME2,
    [rendimientoDays] INT,
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Replacement_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Replacement_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Purchase] (
    [id] INT NOT NULL IDENTITY(1,1),
    [requestId] NVARCHAR(1000),
    [itemName] NVARCHAR(1000) NOT NULL,
    [requestedQty] INT NOT NULL CONSTRAINT [Purchase_requestedQty_df] DEFAULT 0,
    [requestedDate] DATETIME2,
    [receivedQty] INT NOT NULL CONSTRAINT [Purchase_receivedQty_df] DEFAULT 0,
    [receivedDate] DATETIME2,
    [pendingQty] INT NOT NULL CONSTRAINT [Purchase_pendingQty_df] DEFAULT 0,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Purchase_status_df] DEFAULT 'PENDING',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Purchase_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Purchase_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Purchase_requestId_key] UNIQUE NONCLUSTERED ([requestId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Printer_status_idx] ON [dbo].[Printer]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Consumable_printerId_idx] ON [dbo].[Consumable]([printerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Consumable_status_idx] ON [dbo].[Consumable]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Replacement_printerId_idx] ON [dbo].[Replacement]([printerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Replacement_consumableId_idx] ON [dbo].[Replacement]([consumableId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Purchase_status_idx] ON [dbo].[Purchase]([status]);

-- AddForeignKey
ALTER TABLE [dbo].[Consumable] ADD CONSTRAINT [Consumable_printerId_fkey] FOREIGN KEY ([printerId]) REFERENCES [dbo].[Printer]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Replacement] ADD CONSTRAINT [Replacement_printerId_fkey] FOREIGN KEY ([printerId]) REFERENCES [dbo].[Printer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Replacement] ADD CONSTRAINT [Replacement_consumableId_fkey] FOREIGN KEY ([consumableId]) REFERENCES [dbo].[Consumable]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
