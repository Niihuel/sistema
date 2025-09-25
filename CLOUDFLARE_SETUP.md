# 🚀 Configuración de Cloudflare Tunnel - Sistema IT

## ✅ Paso 1: Descargar Cloudflared

1. **Descarga el ejecutable de Windows**:
   - Ve a: https://github.com/cloudflare/cloudflared/releases/latest
   - Descarga: `cloudflared-windows-amd64.exe`
   - Renómbralo a: `cloudflared.exe`
   - Muévelo a: `C:\Program Files\Cloudflared\cloudflared.exe`

2. **Agregar al PATH** (opcional pero recomendado):
   ```powershell
   # PowerShell como Administrador
   [Environment]::SetEnvironmentVariable("Path", "$env:Path;C:\Program Files\Cloudflared", "Machine")
   ```

## ✅ Paso 2: Autenticación con Cloudflare

1. **Abre PowerShell como Administrador** y ejecuta:
   ```powershell
   cd "C:\Program Files\Cloudflared"
   .\cloudflared.exe tunnel login
   ```

2. **Se abrirá tu navegador**:
   - Inicia sesión en Cloudflare (crea cuenta gratis si no tienes)
   - Selecciona tu dominio o usa uno gratis de Cloudflare
   - Autoriza la conexión

3. **El certificado se guardará en**:
   ```
   C:\Users\AuxSistemas\.cloudflared\cert.pem
   ```

## ✅ Paso 3: Crear el Tunnel

```powershell
# Crear el tunnel
.\cloudflared.exe tunnel create sistema-it

# Esto generará un ID único del tunnel
# Ejemplo: 123e4567-e89b-12d3-a456-426614174000
```

## ✅ Paso 4: Configurar DNS

```powershell
# Si tienes tu propio dominio en Cloudflare:
.\cloudflared.exe tunnel route dns sistema-it sistema.tudominio.com

# Si quieres usar un subdominio gratis de Cloudflare:
.\cloudflared.exe tunnel route dns sistema-it --hostname sistema-it.trycloudflare.com
```

## ✅ Paso 5: Actualizar Configuración

1. **Copia el ID del tunnel** del paso 3
2. **Edita** `cloudflare-config.yml`:
   - Reemplaza `sistema-it` con tu ID del tunnel
   - Reemplaza `sistema.tudominio.com` con tu dominio real

## ✅ Paso 6: Iniciar la Aplicación

### Opción A: Iniciar manualmente (para pruebas)

```powershell
# Terminal 1: Iniciar la aplicación Next.js
cd C:\Users\AuxSistemas\Documents\sistemas\sistema
npm run start

# Terminal 2: Iniciar Cloudflare Tunnel
cd "C:\Program Files\Cloudflared"
.\cloudflared.exe tunnel --config C:\Users\AuxSistemas\Documents\sistemas\sistema\cloudflare-config.yml run
```

### Opción B: Servicio de Windows (recomendado para producción)

```powershell
# Instalar como servicio de Windows
.\cloudflared.exe service install --config C:\Users\AuxSistemas\Documents\sistemas\sistema\cloudflare-config.yml

# Iniciar el servicio
.\cloudflared.exe service start

# Verificar estado
.\cloudflared.exe tunnel info sistema-it
```

## ✅ Paso 7: Configurar PM2 para la App

```powershell
# Instalar PM2
npm install -g pm2
npm install -g pm2-windows-startup

# Configurar inicio automático
pm2-startup install

# Iniciar la aplicación con PM2
cd C:\Users\AuxSistemas\Documents\sistemas\sistema
pm2 start ecosystem.config.js
pm2 save
```

## 📱 Acceder desde el Móvil (PWA)

1. **Abre en tu móvil**:
   ```
   https://sistema.tudominio.com
   ```
   o si usas el dominio gratis:
   ```
   https://sistema-it.trycloudflare.com
   ```

2. **Instalar como App**:
   - **Android**: Chrome mostrará "Agregar a pantalla de inicio"
   - **iPhone**: En Safari, toca compartir → "Agregar a pantalla de inicio"

3. **La app funcionará offline** para las páginas visitadas

## 🔍 Verificación y Troubleshooting

### Verificar que todo funciona:

```powershell
# Ver logs del tunnel
.\cloudflared.exe tunnel list
.\cloudflared.exe tunnel info sistema-it

# Ver métricas
.\cloudflared.exe tunnel metrics sistema-it

# Ver logs de PM2
pm2 logs
pm2 monit
```

### Si hay problemas:

1. **Error de conexión**:
   ```powershell
   # Reiniciar servicios
   pm2 restart all
   .\cloudflared.exe service restart
   ```

2. **Error 502 Bad Gateway**:
   - Verifica que la app esté corriendo: `pm2 status`
   - Verifica el puerto: `netstat -ano | findstr :3000`

3. **No se puede instalar PWA**:
   - Debe ser HTTPS (Cloudflare lo provee)
   - Verifica manifest.json: https://sistema.tudominio.com/manifest.json
   - Verifica service worker: https://sistema.tudominio.com/sw.js

## 🎯 URLs Finales

Una vez configurado, podrás acceder desde cualquier lugar:

- **Aplicación Web**: https://sistema.tudominio.com
- **API**: https://api.sistema.tudominio.com
- **PWA Móvil**: Instalar desde el navegador móvil

## 🔐 Seguridad Adicional

En el dashboard de Cloudflare puedes configurar:

1. **Access** (gratis para 5 usuarios):
   - Autenticación con Google/Microsoft
   - Restricción por IP
   - Códigos de acceso temporal

2. **WAF Rules**:
   - Bloquear países
   - Rate limiting
   - Bloquear bots maliciosos

3. **Page Rules**:
   - Cache agresivo para assets
   - Always HTTPS
   - Minificación automática

## 📞 Comandos Útiles

```powershell
# Estado del sistema
pm2 status
.\cloudflared.exe tunnel list

# Logs en tiempo real
pm2 logs --lines 50
.\cloudflared.exe tail sistema-it

# Reiniciar todo
pm2 restart all
.\cloudflared.exe service restart

# Detener todo
pm2 stop all
.\cloudflared.exe service stop
```

## ✨ Tips Finales

1. **Guarda las credenciales** del tunnel en un lugar seguro
2. **Configura alertas** en Cloudflare Dashboard
3. **Habilita 2FA** en tu cuenta de Cloudflare
4. **Monitorea el uso** desde el dashboard de Cloudflare
5. **La versión gratis** incluye:
   - SSL automático
   - DDoS protection
   - Analytics básico
   - 100k requests/día

---

**¿Necesitas ayuda?** Los logs te dirán exactamente qué está pasando:
- App logs: `pm2 logs`
- Tunnel logs: `.\cloudflared.exe tail sistema-it`
- Sistema logs: `C:\Users\AuxSistemas\Documents\sistemas\sistema\logs\`