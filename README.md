# Academia Certifica — Sitio web de cursos

## Ejecutar desde Visual Studio (.sln)

1. Instalá **Node.js 20 LTS**: https://nodejs.org/ (reiniciá la PC)
2. Abrí **`CursosVentas.sln`**
3. En el Explorador de soluciones, clic derecho en **`CursosVentas.Launcher`** → **Establecer como proyecto de inicio**
4. Pulsá **F5** (o el botón verde ▶)
5. Se abre la web en **http://localhost:8080**

```
Admin: admin@academia.local
Clave:  Admin123!
```

Dejá la ventana de consola abierta.

### Proyectos en la solución

| Proyecto | Para qué |
|---|---|
| **CursosVentas.Launcher** | **Proyecto de inicio** — ejecuta el sitio web |
| **CursosVentas.Web** | Archivos del sitio (páginas, API, etc.) — no se ejecuta solo |

## Alternativa sin Visual Studio

Doble clic en `ABRIR.bat`

## Requisitos

- Node.js **20 LTS** (evitar Node 24 en Windows)
- Visual Studio 2022 con workload de desarrollo .NET (para el Launcher)
