# Academia Certifica — Sitio web de cursos

Aplicación **web** para vender cursos en video, pagar con Mercado Pago,
rendir examen y emitir certificados.

## Cómo verlo (Windows)

1. Instalá **Node.js 20 LTS** (importante: no uses Node 24): https://nodejs.org/
2. Reiniciá la PC.
3. En la carpeta del proyecto, **doble clic** en `ABRIR.bat`
4. Se abre **http://localhost:8080**

```
Admin: admin@academia.local
Clave:  Admin123!
```

Si falló antes: borrá la carpeta `node_modules` y volvé a ejecutar `ABRIR.bat`.

## Qué incluye el sitio

- `/` — Inicio
- `/cursos` — Catálogo
- `/cursos/[slug]` — Detalle y compra
- `/login` `/registro` — Acceso
- `/mis-cursos` — Aula del alumno
- `/aprender/[slug]` — Videos protegidos
- `/admin` — Panel para subir cursos/videos/exámenes
- `/verificar` — Validar certificados

## SQL Server / DonWeb

- Local ya funciona con SQLite (incluido en `ABRIR.bat`).
- SQL Server: ver `prisma/schema.sqlserver.prisma` y `sql/sqlserver/`.
- DonWeb MySQL: cambiar `provider` a `mysql` y el `DATABASE_URL`.
