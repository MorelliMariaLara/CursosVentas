-- Servidor: LARA-NB\SQLEXPRESS02
-- Base: Cursosventas
-- Ejecutar en SSMS (F5)

IF DB_ID(N'Cursosventas') IS NULL
BEGIN
  CREATE DATABASE Cursosventas;
  PRINT 'Base Cursosventas creada.';
END
ELSE
BEGIN
  PRINT 'La base Cursosventas ya existe.';
END
GO
