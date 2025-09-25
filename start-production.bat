@echo off
echo ========================================
echo   INICIANDO SISTEMA IT EN PRODUCCION
echo ========================================
echo.

REM Verificar si existe la carpeta .next (compilado)
if not exist .next (
    echo [ERROR] No se encontro la carpeta .next
    echo Ejecutando compilacion...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Fallo la compilacion
        pause
        exit /b 1
    )
)

REM Crear carpeta de logs si no existe
if not exist logs mkdir logs

echo.
echo Iniciando aplicacion en puerto 3000...
echo.

REM Iniciar con PM2 si esta instalado
where pm2 >nul 2>&1
if %errorlevel% equ 0 (
    echo Usando PM2 para gestionar la aplicacion...
    pm2 delete sistema-it >nul 2>&1
    pm2 start ecosystem.config.js
    pm2 save
    echo.
    echo ========================================
    echo   APLICACION INICIADA CON PM2
    echo ========================================
    echo.
    echo Comandos utiles:
    echo   pm2 status        - Ver estado
    echo   pm2 logs          - Ver logs
    echo   pm2 restart all   - Reiniciar
    echo   pm2 stop all      - Detener
    echo.
) else (
    echo PM2 no instalado, iniciando con npm...
    start "Sistema IT" npm run start
)

echo.
echo ========================================
echo   SISTEMA LISTO
echo ========================================
echo.
echo La aplicacion esta corriendo en:
echo   Local: http://localhost:3000
echo   Red: http://192.168.0.219:3000
echo.
echo Para Cloudflare Tunnel, ejecuta:
echo   cloudflare-tunnel.bat
echo.
pause