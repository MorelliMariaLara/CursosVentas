@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta en el PATH.
  echo Instala LTS desde https://nodejs.org/ y reinicia la PC.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo No hay node_modules. Ejecutando npm install...
  call npm install
  if errorlevel 1 (
    echo npm install fallo.
    pause
    exit /b 1
  )
)

if not exist ".env" (
  copy /Y .env.example .env >nul
)

echo.
echo ========================================
echo  Servidor: http://localhost:3000
echo  Deja ESTA ventana abierta
echo  Luego Edge se abrira solo
echo ========================================
echo.

start "" msedge "http://localhost:3000"
call npm run dev
