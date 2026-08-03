# Academia Certifica — Plataforma de cursos y certificaciones

Aplicación web para **vender cursos en video**, cobrar con **Mercado Pago Checkout Pro**, proteger el contenido, evaluar al alumno y emitir **certificados digitales**.

Compatible con hosting + MySQL de **DonWeb** (o cualquier MySQL) y dominio propio.

## Qué incluye

- Catálogo público de cursos
- Registro / login de alumnos y panel de administrador
- Compra con **Checkout Pro** (Mercado Pago) + webhook de confirmación
- Modo demo sin MP: activa el curso para poder probar el flujo
- Subida de videos desde el admin
- Reproductor protegido (token temporal, sin descarga, anti clic derecho, pausa al cambiar de ventana, marca de agua)
- Seguimiento de progreso por clase
- Examen final configurable
- Certificado PDF + verificación pública por código (`/verificar`)

> **Importante sobre privacidad de video:** ninguna web puede impedir al 100% la captura de pantalla del sistema operativo. La plataforma aplica barreras prácticas (streaming firmado, sin URL permanente, controles de descarga deshabilitados, watermark, bloqueo de atajos comunes). Para DRM de nivel estudio (Widevine/FairPlay) se puede integrar luego un proveedor como Mux, Vimeo OTT o AWS.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma + SQLite (dev) / MySQL (producción DonWeb)
- Auth.js (NextAuth) credentials
- Mercado Pago SDK (Checkout Pro)
- PDFKit para certificados

## Inicio rápido (local)

### Opción A — Visual Studio (archivo `.sln`)

1. Abrí **`CursosVentas.sln`** con Visual Studio 2022.
2. La primera vez, en la **Terminal de Visual Studio** (o PowerShell) corré:

```powershell
npm install
copy .env.example .env
npm run db:setup
```

3. Seleccioná el proyecto **CursosVentas** como inicio y pulsá **F5** (o el botón verde).  
   Eso ejecuta `npm run dev` y la app queda en [http://localhost:3000](http://localhost:3000).

> Requiere **Node.js LTS** instalado y, en Visual Studio, la workload de desarrollo web / JavaScript.

### Opción B — Terminal

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

**Admin por defecto (seed):**
- Email: `admin@academia.local`
- Contraseña: `Admin123!`

## Configurar Mercado Pago

1. Creá una aplicación en [developers.mercadopago.com](https://www.mercadopago.com.ar/developers/panel)
2. Copiá el **Access Token** (test o producción) a `.env`:

```env
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
APP_URL=https://tudominio.com
NEXTAUTH_URL=https://tudominio.com
```

3. El webhook apunta a: `https://tudominio.com/api/webhooks/mercadopago`
4. En el panel de MP, configurá esa URL de notificaciones.

Sin `MP_ACCESS_TOKEN`, el botón de compra activa el curso en **modo demo** para que puedas probar el resto del flujo.

## Base de datos en DonWeb (MySQL)

1. En el panel de DonWeb, creá una base MySQL y un usuario.
2. En `prisma/schema.prisma` cambiá:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

3. En `.env` de producción:

```env
DATABASE_URL="mysql://USUARIO:PASSWORD@HOST:3306/NOMBRE_BD"
```

- Si la app corre **en el mismo hosting** que MySQL: el host suele ser `localhost`.
- Si la app corre **afuera** (VPS/Vercel/Railway): usá el host remoto que te dé DonWeb y habilitá acceso remoto al MySQL si el plan lo permite.

4. Aplicá el schema:

```bash
npx prisma db push
npm run db:seed
```

## Despliegue con dominio

### Opción A — VPS / Node en DonWeb Cloud

1. Subí el código (git clone / deploy).
2. Configurá `.env` con MySQL, `AUTH_SECRET`, dominio y Mercado Pago.
3. Build y arranque:

```bash
npm install
npm run db:setup
npm run build
npm run start
```

4. Poné Nginx/Apache como reverse proxy al puerto 3000 y apuntá el dominio.

### Opción B — App en Vercel + MySQL DonWeb

1. Conectá el repo a Vercel.
2. Cargá las variables de entorno (incluido `DATABASE_URL` remoto).
3. Asegurate de que DonWeb permita conexiones remotas al MySQL (o usá un túnel).
4. Los videos: en Vercel el filesystem es efímero. Para producción real de videos grandes, guardalos en **storage externo** (S3, R2, o disco del VPS). El código actual guarda en `UPLOAD_DIR` (ideal para VPS).

### Variables mínimas de producción

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | MySQL DonWeb |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` / `APP_URL` | `https://tudominio.com` |
| `MP_ACCESS_TOKEN` | Token Checkout Pro |
| `UPLOAD_DIR` | Ruta absoluta writable, ej. `/var/www/academia/uploads` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Solo para el seed inicial |

## Flujo del alumno

1. Se registra e inicia sesión
2. Compra un curso → Mercado Pago
3. El webhook marca la inscripción como `ACTIVE`
4. Ve las clases en streaming protegido
5. Al completar el 100%, rinde el examen
6. Si aprueba (≥ `passingScore`), descarga el certificado PDF

## Flujo del admin

1. Login como admin → `/admin`
2. Crear curso, módulos y clases
3. Subir videos MP4/WebM/MOV
4. Crear examen y preguntas
5. Publicar el curso

## Scripts útiles

```bash
npm run dev          # desarrollo
npm run build        # build producción
npm run db:push      # sincronizar schema
npm run db:seed      # admin + curso demo
npm run db:setup     # push + seed
```

## Estructura relevante

```
src/app/                 # páginas y API routes
src/components/          # UI (player protegido, admin, etc.)
src/lib/                 # auth, prisma, mercadopago, certificados
prisma/schema.prisma     # modelo de datos
uploads/                 # videos y PDFs (no versionado)
```

Cuando tengas el **nombre de dominio**, lo configuramos en `APP_URL` / DNS y dejamos listo el SSL + Mercado Pago en producción.
