# 🚀 Guía de Despliegue - Sistema IT

## 📋 Opciones de Despliegue

### Opción 1: Cloudflare Tunnel (RECOMENDADO) ⭐
**Más seguro, gratis y fácil de configurar**

#### Ventajas:
- ✅ No necesitas abrir puertos en el router
- ✅ SSL/HTTPS automático y gratis
- ✅ Protección DDoS incluida
- ✅ Oculta tu IP real
- ✅ Dashboard de analytics
- ✅ Sin costo para uso básico

#### Pasos de configuración:

1. **Crear cuenta en Cloudflare** (gratis)
   - Ve a https://cloudflare.com
   - Registra tu dominio o usa un subdominio gratis

2. **Instalar Cloudflare Tunnel**:
   ```bash
   # Descargar cloudflared para Windows
   # https://github.com/cloudflare/cloudflared/releases

   # O usando winget:
   winget install --id Cloudflare.cloudflared
   ```

3. **Configurar el tunnel**:
   ```bash
   # Autenticarse con Cloudflare
   cloudflared tunnel login

   # Crear un tunnel
   cloudflared tunnel create sistema-it

   # Crear configuración
   cloudflared tunnel route dns sistema-it tudominio.com
   ```

4. **Crear archivo de configuración**:
   Crea `cloudflare-tunnel.yml`:
   ```yaml
   tunnel: <TU_TUNNEL_ID>
   credentials-file: C:\Users\AuxSistemas\.cloudflared\<TU_TUNNEL_ID>.json

   ingress:
     - hostname: sistema.tudominio.com
       service: http://localhost:3000
     - hostname: sistema-api.tudominio.com
       service: http://localhost:3000/api
     - service: http_status:404
   ```

5. **Iniciar el tunnel**:
   ```bash
   cloudflared tunnel run sistema-it
   ```

---

### Opción 2: Acceso Directo con Port Forwarding 🔧

#### Configuración actual:
- **IP Local**: 192.168.0.219:4250
- **IP Pública NAT**: 190.220.8.91:5335

#### Pasos de configuración:

1. **Preparar la aplicación**:
   ```bash
   # Instalar dependencias de producción
   npm ci --production

   # Compilar para producción
   npm run build
   ```

2. **Configurar variables de entorno** (.env.production):
   ```env
   NODE_ENV=production
   DATABASE_URL="sqlserver://tu-servidor:1433;database=sistemas;..."
   NEXTAUTH_URL=http://190.220.8.91:5335
   NEXTAUTH_SECRET=genera-un-secret-seguro-de-32-caracteres-minimo
   ```

3. **Iniciar en modo producción**:
   ```bash
   # Opción A: Con npm directamente
   npm run start -- -p 4250 -H 192.168.0.219

   # Opción B: Con PM2 (recomendado)
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Configurar el firewall de Windows**:
   ```powershell
   # Ejecutar como administrador
   New-NetFirewallRule -DisplayName "Sistema IT" -Direction Inbound -Protocol TCP -LocalPort 4250 -Action Allow
   ```

---

### Opción 3: Nginx Reverse Proxy con SSL 🔒

1. **Instalar Nginx para Windows**:
   - Descargar de: http://nginx.org/en/download.html

2. **Configurar Nginx** (nginx.conf):
   ```nginx
   server {
       listen 80;
       server_name sistema.tudominio.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name sistema.tudominio.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

---

## 🔐 Medidas de Seguridad Importantes

### 1. Variables de Entorno Seguras
```bash
# Generar NEXTAUTH_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configurar CORS
Editar `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://tudominio.com" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE" }
        ]
      }
    ]
  }
}
```

### 3. Rate Limiting
Instalar y configurar:
```bash
npm install express-rate-limit
```

### 4. Monitoreo
- Usar PM2 para monitoreo: `pm2 monit`
- Configurar alertas en Cloudflare (si usas tunnel)
- Revisar logs regularmente: `pm2 logs`

---

## 📱 Acceso desde Cualquier Red

### Para acceder desde fuera de la red local:

1. **Con Cloudflare Tunnel**:
   - URL: https://sistema.tudominio.com
   - Accesible desde cualquier lugar con internet

2. **Con Port Forwarding**:
   - URL: http://190.220.8.91:5335
   - Asegúrate de que el puerto esté abierto en el router

3. **Aplicación móvil**:
   - La aplicación es responsive
   - Funciona en cualquier navegador móvil
   - Considera crear un PWA para mejor experiencia

---

## 🚦 Comandos Útiles

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs --lines 50

# Reiniciar aplicación
pm2 restart sistema-it

# Detener aplicación
pm2 stop sistema-it

# Monitoreo en tiempo real
pm2 monit

# Ver métricas
pm2 info sistema-it
```

---

## ⚠️ Troubleshooting

### Error: Puerto en uso
```bash
# Windows - encontrar proceso usando el puerto
netstat -ano | findstr :4250

# Matar proceso por PID
taskkill /PID <PID> /F
```

### Error: Base de datos no conecta
- Verificar string de conexión en .env
- Asegurar que SQL Server permite conexiones remotas
- Verificar firewall del servidor de base de datos

### Error: Página no carga
- Verificar logs: `pm2 logs`
- Verificar que el build se completó: `npm run build`
- Limpiar caché: `rm -rf .next && npm run build`

---

## 📞 Soporte

Para ayuda adicional:
- Revisa los logs en `/logs`
- Verifica el estado con `pm2 status`
- Consulta la documentación de Next.js: https://nextjs.org/docs