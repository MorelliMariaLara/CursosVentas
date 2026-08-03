# SQL Server — CursosVentas

Servidor: `LARA-NB\SQLEXPRESS02`  
Base: `Cursosventas`

## 1) Crear solo la base (SSMS)

Ejecutá `01_create_database.sql`.

Las tablas las crea Prisma al correr `start-local.bat` (`prisma db push`).

## 2) Connection string (.env)

```env
DATABASE_URL="sqlserver://LARA-NB\\SQLEXPRESS02;database=Cursosventas;integratedSecurity=true;trustServerCertificate=true"
```

## 3) Arrancar app

```powershell
.\start-local.bat
```
