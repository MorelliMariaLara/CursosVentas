@echo off
chcp 65001 >nul
title Academia Certifica - WEB
cd /d "%~dp0"

echo.
echo  ========================================
echo   ACADEMIA CERTIFICA  -  sitio web
echo   http://localhost:8080
echo  ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  Falta Node.js.
  echo  1^) Entra a https://nodejs.org/
  echo  2^) Descarga e instala la version LTS
  echo  3^) Reinicia la PC
  echo  4^) Volve a hacer doble clic en ABRIR.bat
  echo.
  start https://nodejs.org/
  pause
  exit /b 1
)

echo  Node:
node -v
echo.

echo  Preparando e iniciando el sitio web...
echo  ^(la primera vez puede tardar unos minutos^)
echo.
echo  NO CIERRES ESTA VENTANA
echo.

node scripts\start-local.js
echo.
echo  El servidor se detuvo.
pause
