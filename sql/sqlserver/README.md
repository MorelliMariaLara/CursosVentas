# SQL Server — scripts manuales

Servidor: `LARA-NB\SQLEXPRESS02`  
Base: `Cusosventas`

## Orden en SSMS

1. Conectate a `LARA-NB\SQLEXPRESS02`
2. Ejecutá `01_create_database.sql`
3. Ejecutá `02_create_tables.sql`
4. (Opcional) `03_seed_admin_opcional.sql` — mejor usar `npm run db:seed`

## Conectar la app Next.js a esta BD

En `.env`:

```env
DATABASE_URL="sqlserver://LARA-NB\\SQLEXPRESS02;database=Cusosventas;integratedSecurity=true;trustServerCertificate=true"
```

Si usás usuario/contraseña SQL:

```env
DATABASE_URL="sqlserver://USUARIO:PASSWORD@localhost\\SQLEXPRESS02;database=Cusosventas;trustServerCertificate=true"
```

En `prisma/schema.prisma` cambiá:

```prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

Luego:

```powershell
npx prisma generate
npm run db:seed
npm run dev
```

> Si SQL Express no acepta conexiones TCP, habilitá TCP/IP en **SQL Server Configuration Manager** o usá autenticación Windows (`integratedSecurity=true`).
