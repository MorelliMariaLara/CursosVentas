# Academia Certifica — CursosVentas

Plataforma de cursos en video + Mercado Pago + certificados.  
Local: **SQL Server Express** `LARA-NB\SQLEXPRESS02` / base `Cursosventas`  
App: **http://localhost:8080**

## Arrancar en Windows

1. Node.js LTS: https://nodejs.org/ (reiniciá la PC)
2. En SSMS, creá la base si no existe:

```sql
IF DB_ID(N'Cursosventas') IS NULL CREATE DATABASE Cursosventas;
```

3. En PowerShell:

```powershell
cd "C:\Users\Maria Lara\source\repos\CursosVentas"
git pull origin main
copy /Y .env.example .env
.\start-local.bat
```

4. Cuando diga listo, abrí **http://localhost:8080** (Edge se abre solo).

```
Admin: admin@academia.local
Clave:  Admin123!
```

**No cierres la ventana negra.** Si la cerrás → `ERR_CONNECTION_REFUSED`.

### Si no conecta a SQL Server

En `.env`:

```env
DATABASE_URL="sqlserver://localhost\\SQLEXPRESS02;database=Cursosventas;integratedSecurity=true;trustServerCertificate=true"
```

Y habilitá TCP/IP en SQL Server Configuration Manager para `SQLEXPRESS02`.

## Puerto

Usa **8080** (no 3000) para evitar conflictos.
