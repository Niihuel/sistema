-- Actualizar valores NULL en User.isActive
UPDATE [dbo].[User] SET isActive = 1 WHERE isActive IS NULL;

-- Asegurar que todas las columnas requeridas tengan valores
UPDATE [dbo].[Permission] SET name = 'unnamed_' + CAST(id AS NVARCHAR) WHERE name IS NULL;
UPDATE [dbo].[Permission] SET displayName = 'Unnamed Permission' WHERE displayName IS NULL;
UPDATE [dbo].[Permission] SET category = 'System' WHERE category IS NULL;

UPDATE [dbo].[Role] SET displayName = name WHERE displayName IS NULL;

UPDATE [dbo].[UserRole] SET updatedAt = GETDATE() WHERE updatedAt IS NULL;