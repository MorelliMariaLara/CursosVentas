@echo off
title Academia Certifica - NO CERRAR - puerto 8080
cd /d "%~dp0"

echo.
echo ========================================
echo   Academia Certifica + SQL Server
echo   URL: http://localhost:8080
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no encontrado.
  echo Instala https://nodejs.org/ LTS y reinicia la PC.
  pause
  exit /b 1
)

echo Node:
node -v
npm -v
echo.

if not exist ".env" (
  echo Creando .env...
  copy /Y .env.example .env >nul
)

echo Arrancando... (deja esta ventana abierta)
echo.

node scripts\start-local.js
set ERR=%ERRORLEVEL%

echo.
if not "%ERR%"=="0" (
  echo FALLO el arranque. Codigo %ERR%
  echo Copia TODO el texto de esta ventana y envialo.
)
pause
exit /b %ERR%
