@echo off
echo ========================================
echo   CONFIGURACION PARA PRODUCCION
echo ========================================
echo.

REM Crear carpeta de logs
if not exist logs mkdir logs

REM Instalar PM2 globalmente si no está instalado
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando PM2...
    npm install -g pm2
    npm install -g pm2-windows-startup
)

echo.
echo Compilando aplicación para producción...
call npm run build

echo.
echo ========================================
echo   INSTRUCCIONES PARA INICIAR
echo ========================================
echo.
echo 1. Para iniciar en producción LOCAL:
echo    npm run start
echo.
echo 2. Para iniciar con PM2 (recomendado):
echo    pm2 start ecosystem.config.js
echo.
echo 3. Para ver logs con PM2:
echo    pm2 logs
echo.
echo 4. Para detener con PM2:
echo    pm2 stop all
echo.
pause