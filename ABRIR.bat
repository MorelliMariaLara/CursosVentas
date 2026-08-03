@echo off
title Academia Certifica
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js desde https://nodejs.org/  ^(LTS^)
  echo Despues reinicia la PC y volve a hacer doble clic aca.
  pause
  exit /b 1
)

echo.
echo  Abriendo Academia Certifica en Edge...
echo  http://localhost:8080
echo.
echo  Deja esta ventana abierta.
echo.

node scripts\start-local.js
echo.
pause
