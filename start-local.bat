@echo off
title Academia CursosVentas
cd /d "%~dp0"

echo.
echo  Arrancando Academia / CursosVentas...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado o no esta en el PATH.
  echo.
  echo 1^) Descarga Node.js LTS: https://nodejs.org/
  echo 2^) Instala y REINICIA la PC
  echo 3^) Volve a ejecutar este archivo
  echo.
  pause
  exit /b 1
)

node scripts\start-local.js
if errorlevel 1 (
  echo.
  echo El arranque fallo. Copia el error de arriba.
  pause
  exit /b 1
)
