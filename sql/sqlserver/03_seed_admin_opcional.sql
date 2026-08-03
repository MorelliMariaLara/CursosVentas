/*
  Opcional: usuario admin inicial
  Password en texto plano NO se guarda: usá el seed de Node
  (npm run db:seed) después de conectar Prisma a SQL Server.

  Si igual querés insertar a mano, generá el hash con Node:
    node -e "require('bcryptjs').hash('Admin123!',12).then(console.log)"
  y reemplazá @PasswordHash abajo.
*/

USE [Cusosventas];
GO

DECLARE @AdminId NVARCHAR(191) = REPLACE(CONVERT(NVARCHAR(36), NEWID()), '-', '');
DECLARE @Email NVARCHAR(191) = N'admin@academia.local';
DECLARE @PasswordHash NVARCHAR(191) = N'REEMPLAZAR_CON_HASH_BCRYPT';
DECLARE @Name NVARCHAR(191) = N'Administrador';

IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE [email] = @Email)
BEGIN
  INSERT INTO dbo.[User] ([id], [email], [passwordHash], [name], [role], [createdAt], [updatedAt])
  VALUES (@AdminId, @Email, @PasswordHash, @Name, N'ADMIN', SYSUTCDATETIME(), SYSUTCDATETIME());
  PRINT 'Admin insertado (recordá poner un passwordHash bcrypt válido).';
END
ELSE
BEGIN
  PRINT 'El admin ya existe.';
END
GO
