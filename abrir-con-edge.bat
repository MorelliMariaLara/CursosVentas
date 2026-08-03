@echo off
cd /d "%~dp0"

echo Iniciando servidor...
start "CursosVentas" cmd /k "npm run dev"

echo Esperando a que levante localhost:3000 ...
timeout /t 5 /nobreak >nul

echo Abriendo Microsoft Edge...
start msedge "http://localhost:3000"

echo.
echo Si Edge muestra error de conexion, espera unos segundos y recarga.
echo La ventana "CursosVentas" debe quedar abierta mientras usas la app.
