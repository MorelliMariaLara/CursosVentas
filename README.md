# Academia Certifica — Plataforma de cursos y certificaciones

Aplicación web para **vender cursos en video**, cobrar con **Mercado Pago Checkout Pro**, proteger el contenido, evaluar al alumno y emitir **certificados digitales**.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma + **SQL Server Express** (local: `LARA-NB\SQLEXPRESS02` / `Cursosventas`)
- Auth.js (NextAuth) credentials
- Mercado Pago SDK (Checkout Pro)
- PDFKit para certificados

## Inicio rápido — Windows + SQL Server

**Requisitos**
1. Node.js LTS: https://nodejs.org/ (reiniciá la PC después)
2. SQL Server Express corriendo: `LARA-NB\SQLEXPRESS02`
3. Base creada: `Cursosventas`

En SSMS (una sola vez):

```sql
IF DB_ID(N'Cursosventas') IS NULL CREATE DATABASE Cursosventas;
```

**Arrancar la app**

```powershell
cd "C:\Users\Maria Lara\source\repos\CursosVentas"
git pull origin main

# Actualizá .env a SQL Server (importante si antes usabas SQLite)
copy /Y .env.example .env

.\start-local.bat
```

Eso:
- conecta a SQL Server
- crea/sincroniza tablas
- carga admin + curso demo
- levanta http://localhost:3000
- abre Edge

```
Admin: admin@academia.local
Clave:  Admin123!
```

**Dejá la ventana negra abierta.**

### Si no conecta a SQL Server

1. SQL Server Configuration Manager → habilitar **TCP/IP** en `SQLEXPRESS02` → reiniciar servicio
2. En `.env` probá:

```env
DATABASE_URL="sqlserver://localhost\\SQLEXPRESS02;database=Cursosventas;integratedSecurity=true;trustServerCertificate=true"
```

## Mercado Pago

Sin `MP_ACCESS_TOKEN` la compra funciona en **modo demo** (activa el curso directo).

## DonWeb (MySQL) más adelante

Cambiar en `prisma/schema.prisma` a `provider = "mysql"` y el `DATABASE_URL` de DonWeb.
