# Academia Certifica — Sitio web de cursos

Aplicación **web** para vender cursos en video, pagar con Mercado Pago,
rendir examen y emitir certificados.

## Cómo verlo (Windows)

1. Instalá [Node.js LTS](https://nodejs.org/) y reiniciá la PC (solo una vez).
2. En la carpeta del proyecto, **doble clic** en:

### `ABRIR.bat`

3. Se abre el navegador en **http://localhost:8080**

```
Admin: admin@academia.local
Clave:  Admin123!
```

No cierres la ventana negra mientras uses el sitio.

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
