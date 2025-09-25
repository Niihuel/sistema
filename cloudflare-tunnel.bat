@echo off
echo ========================================
echo   CONFIGURANDO CLOUDFLARE TUNNEL
echo ========================================
echo.

REM Verificar si cloudflared existe
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] cloudflared no esta en PATH
    echo.
    echo Por favor descarga cloudflared de:
    echo https://github.com/cloudflare/cloudflared/releases/latest
    echo.
    echo Descarga: cloudflared-windows-amd64.exe
    echo Renombra a: cloudflared.exe
    echo Coloca en: C:\Program Files\Cloudflared\
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   OPCIONES DE CLOUDFLARE TUNNEL
echo ========================================
echo.
echo 1. Primera vez - Login y crear tunnel
echo 2. Iniciar tunnel existente
echo 3. Ver estado del tunnel
echo 4. Instalar como servicio Windows
echo 5. Desinstalar servicio
echo.
set /p opcion="Selecciona una opcion (1-5): "

if "%opcion%"=="1" goto primera_vez
if "%opcion%"=="2" goto iniciar_tunnel
if "%opcion%"=="3" goto estado_tunnel
if "%opcion%"=="4" goto instalar_servicio
if "%opcion%"=="5" goto desinstalar_servicio
goto fin

:primera_vez
echo.
echo ========================================
echo   CONFIGURACION INICIAL
echo ========================================
echo.
echo Paso 1: Autenticando con Cloudflare...
cloudflared tunnel login
echo.
echo Paso 2: Creando tunnel...
cloudflared tunnel create sistema-it
echo.
echo Paso 3: Configurando DNS...
echo Ingresa tu dominio (ej: sistema.tuempresa.com)
echo O presiona ENTER para usar dominio gratis
set /p dominio="Dominio: "
if "%dominio%"=="" (
    echo Usando dominio gratuito de Cloudflare...
    cloudflared tunnel route dns sistema-it --hostname sistema-it.trycloudflare.com
) else (
    cloudflared tunnel route dns sistema-it %dominio%
)
echo.
echo ========================================
echo   CONFIGURACION COMPLETA
echo ========================================
echo.
echo Ahora puedes iniciar el tunnel con opcion 2
echo.
pause
goto fin

:iniciar_tunnel
echo.
echo Iniciando tunnel...
echo Presiona Ctrl+C para detener
echo.
cloudflared tunnel --config cloudflare-config.yml run
goto fin

:estado_tunnel
echo.
cloudflared tunnel list
echo.
cloudflared tunnel info sistema-it
echo.
pause
goto fin

:instalar_servicio
echo.
echo Instalando como servicio de Windows...
cloudflared service install --config "%~dp0cloudflare-config.yml"
echo.
echo Iniciando servicio...
cloudflared service start
echo.
echo Servicio instalado e iniciado!
echo.
pause
goto fin

:desinstalar_servicio
echo.
echo Deteniendo servicio...
cloudflared service stop
echo.
echo Desinstalando servicio...
cloudflared service uninstall
echo.
echo Servicio desinstalado!
echo.
pause
goto fin

:fin
exit /b 0