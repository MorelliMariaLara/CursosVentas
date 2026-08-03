-- Crear base Cursosventas en LARA-NB\SQLEXPRESS02
IF DB_ID(N'Cursosventas') IS NULL
BEGIN
  CREATE DATABASE Cursosventas;
END
GO
