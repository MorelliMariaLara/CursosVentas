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
  echo  Instala Node.js 20 LTS: https://nodejs.org/
  echo  Reinicia la PC y volve a ejecutar ABRIR.bat
  echo.
  start https://nodejs.org/
  pause
  exit /b 1
)

echo  Node:
node -v
echo.

for /f "tokens=1 delims=." %%a in ('node -v') do set MAJOR=%%a
set MAJOR=%MAJOR:v=%
if %MAJOR% GEQ 24 (
  echo  ========================================
  echo   ATENCION: tenes Node %MAJOR%
  echo   En Windows conviene Node 20 LTS.
  echo.
  echo   1^) Entra a https://nodejs.org/
  echo   2^) Instala "20.x LTS" ^(no la Current^)
  echo   3^) Reinicia la PC
  echo   4^) En esta carpeta borra "node_modules"
  echo   5^) Volve a ejecutar ABRIR.bat
  echo  ========================================
  echo.
  echo  Intento continuar igual...
  echo.
)

echo  Si falla, borra la carpeta node_modules y reintenta.
echo  NO CIERRES ESTA VENTANA
echo.

if not exist "node_modules\next" (
  echo  Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo  npm install fallo. Proba con Node 20 LTS.
    pause
    exit /b 1
  )
)

node scripts\start-local.js
echo.
pause
