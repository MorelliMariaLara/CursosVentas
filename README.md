# Academia Certifica

## Ver la app (una sola acción)

1. Instalá Node.js LTS: https://nodejs.org/ → reiniciá la PC  
2. **Doble clic** en:

# `ABRIR.bat`

Eso prepara todo, levanta la web y abre **Microsoft Edge** en:

**http://localhost:8080**

```
Admin: admin@academia.local
Clave:  Admin123!
```

Dejá la ventana negra abierta.

---

## SQL Server (opcional, después)

Cuando la UI ya te funcione y quieras usar `LARA-NB\SQLEXPRESS02` / `Cursosventas`:

1. Copiá `prisma/schema.sqlserver.prisma` → `prisma/schema.prisma`
2. En `.env` poné el `DATABASE_URL` de SQL Server
3. `npx prisma generate` && `npx prisma db push` && `npm run db:seed`

Scripts SQL en `sql/sqlserver/`.
