@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado o no esta en el PATH.
  echo Descargalo de https://nodejs.org/ e instala la version LTS.
  echo Despues cerra y volve a abrir esta ventana.
  pause
  exit /b 1
)

echo == Node ==
node -v
npm -v
echo.

if not exist ".env" (
  echo Creando .env desde .env.example ...
  copy /Y .env.example .env >nul
)

echo == npm install ==
call npm install
if errorlevel 1 (
  echo.
  echo npm install FALLO. Copiá el error de arriba y pedí ayuda.
  pause
  exit /b 1
)

echo.
echo == Base de datos local ==
call npm run db:setup
if errorlevel 1 (
  echo.
  echo db:setup FALLO. Copiá el error de arriba.
  pause
  exit /b 1
)

echo.
echo LISTO. Ahora podes:
echo   1^) Abrir CursosVentas.sln en Visual Studio y pulsar F5
echo   2^) O correr: npm run dev
echo.
echo App: http://localhost:3000
echo Admin: admin@academia.local / Admin123!
echo.
pause
