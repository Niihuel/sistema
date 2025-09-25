# 🚀 GUÍA DE INICIO RÁPIDO - Sistema IT

## ✅ TODO ESTÁ CONFIGURADO - Sigue estos pasos:

### 📱 1. INSTALAR CLOUDFLARED (5 minutos)

1. **Descarga cloudflared**:
   - Ve a: https://github.com/cloudflare/cloudflared/releases
   - Descarga: `cloudflared-windows-amd64.exe`
   - Renómbralo a: `cloudflared.exe`
   - Colócalo en: `C:\cloudflared\cloudflared.exe`

### 🌐 2. CONFIGURAR CLOUDFLARE (10 minutos)

Ejecuta el script que preparé:
```cmd
cloudflare-tunnel.bat
```

Selecciona opción **1** (Primera vez) y sigue las instrucciones:
- Se abrirá tu navegador
- Crea cuenta gratis en Cloudflare
- Autoriza la conexión

### 🚀 3. INICIAR LA APLICACIÓN

```cmd
start-production.bat
```

Esto iniciará:
- La aplicación en puerto 3000
- PM2 para gestión de procesos

### 📲 4. ACCEDER DESDE TU MÓVIL

#### Opción A: Con dominio gratis de Cloudflare
```
https://sistema-it.trycloudflare.com
```

#### Opción B: Si configuraste tu propio dominio
```
https://sistema.tudominio.com
```

### 📱 5. INSTALAR COMO APP (PWA)

En tu móvil:
1. Abre el link en Chrome (Android) o Safari (iPhone)
2. **Android**: Menú → "Agregar a pantalla de inicio"
3. **iPhone**: Compartir → "Agregar a pantalla de inicio"

¡La app funcionará como nativa!

---

## 🔑 USUARIOS DE PRUEBA

| Usuario | Contraseña | Rol | Permisos |
|---------|-----------|-----|----------|
| **superadmin** | Admin123! | SuperAdmin 👑 | TODO |
| **admin** | Admin123! | Admin 🛡️ | Casi todo |
| **manager** | Manager123! | Manager 👔 | Gestión |
| **tech** | Tech123! | Técnico 🔧 | Soporte |

---

## 📋 COMANDOS ÚTILES

### Ver logs en tiempo real:
```cmd
pm2 logs
```

### Reiniciar aplicación:
```cmd
pm2 restart all
```

### Ver estado:
```cmd
pm2 status
```

### Detener todo:
```cmd
pm2 stop all
```

---

## ⚡ ACCESO RÁPIDO LOCAL

Si estás en la red local:
- http://192.168.0.219:3000

Desde fuera (con NAT):
- http://190.220.8.91:5335

---

## 🆘 ¿PROBLEMAS?

### La app no compila:
```cmd
npm run dev
```
(Usa modo desarrollo temporalmente)

### Cloudflare no conecta:
1. Verifica que la app esté corriendo: `pm2 status`
2. Verifica el tunnel: `cloudflared tunnel list`
3. Reinicia: `pm2 restart all`

### No se puede instalar PWA:
- Debe ser HTTPS (Cloudflare lo provee)
- Verifica en: https://tudominio.com/manifest.json

---

## 📱 CARACTERÍSTICAS PWA

✅ **Instalable** como app nativa
✅ **Funciona offline** (páginas visitadas)
✅ **Notificaciones push** (configurables)
✅ **Pantalla completa** sin barra del navegador
✅ **Ícono en home** del móvil
✅ **Splash screen** al abrir

---

## 🔐 SEGURIDAD INCLUIDA

- ✅ HTTPS automático con Cloudflare
- ✅ Protección DDoS
- ✅ Oculta tu IP real
- ✅ Headers de seguridad configurados
- ✅ Sistema de roles y permisos
- ✅ Autenticación segura

---

## 📊 MONITOREO

Dashboard de Cloudflare te mostrará:
- Visitantes en tiempo real
- Ancho de banda usado
- Amenazas bloqueadas
- Performance metrics

Accede en: https://dash.cloudflare.com

---

**¿Todo listo?** ¡Ya puedes usar el sistema desde cualquier lugar! 🎉