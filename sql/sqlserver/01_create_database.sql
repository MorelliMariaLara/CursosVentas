/*
  Academia / CursosVentas
  SQL Server Express — crear base de datos

  Servidor: LARA-NB\SQLEXPRESS02
  Base:     Cusosventas

  Cómo ejecutarlo:
  1. Abrí SQL Server Management Studio (SSMS)
  2. Conectate a: LARA-NB\SQLEXPRESS02
  3. New Query → pegá este script → Execute (F5)
*/

IF DB_ID(N'Cusosventas') IS NULL
BEGIN
  CREATE DATABASE [Cusosventas];
  PRINT 'Base Cusosventas creada.';
END
ELSE
BEGIN
  PRINT 'La base Cusosventas ya existe.';
END
GO
