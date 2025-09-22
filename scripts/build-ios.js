#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const fs = require('fs');
const os = require('os');

console.log('🍎 Compilando aplicación para iOS...\n');

// Función para obtener la IP de producción o detectar IP local
function getLocalNetworkIP() {
  // Para producción, usar la IP fija de la empresa
  if (process.env.NODE_ENV === 'production' || process.env.PRODUCTION_MODE) {
    return '192.168.0.219';
  }
  
  // En desarrollo, detectar IP local
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prioritize common network ranges
        if (iface.address.startsWith('192.168.') || 
            iface.address.startsWith('10.') || 
            iface.address.startsWith('172.')) {
          return iface.address;
        }
      }
    }
  }
  
  return '192.168.0.219'; // Fallback a IP de producción
}

// Configurar variable de entorno para Capacitor server
const localIP = getLocalNetworkIP();
const serverURL = `http://${localIP}:4250`;

console.log(`🌐 Detectada IP local: ${localIP}`);
console.log(`📡 Configurando servidor para móvil: ${serverURL}\n`);

// Set environment variable for this build
process.env.CAPACITOR_SERVER_URL = serverURL;

function runCommand(command, description) {
  try {
    console.log(`⏳ ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado\n`);
  } catch (error) {
    console.log(`❌ Error en ${description}: ${error.message}\n`);
    return false;
  }
  return true;
}

// Verificar que estamos en macOS
if (os.platform() !== 'darwin') {
  console.log('❌ iOS solo puede compilarse en macOS');
  console.log('💡 Para desarrollo, puedes usar el simulador con: npm run dev:ios');
  process.exit(1);
}

// Verificar que Xcode esté instalado
try {
  execSync('xcode-select --version', { stdio: 'ignore' });
  console.log('✅ Xcode detectado');
} catch (error) {
  console.log('❌ Xcode no está instalado. Instala Xcode desde el App Store');
  process.exit(1);
}

// Verificar que la plataforma iOS exista
if (!fs.existsSync('ios')) {
  console.log('🍎 Configurando plataforma iOS...');
  if (!runCommand('npx cap add ios', 'Agregando plataforma iOS')) {
    process.exit(1);
  }
}

// Construir la aplicación web
console.log('📦 Preparando aplicación web...');
if (!runCommand('CAPACITOR_EXPORT=true npm run build', 'Construyendo aplicación Next.js')) {
  process.exit(1);
}

// Sincronizar con Capacitor
if (!runCommand('npx cap sync ios', 'Sincronizando con Capacitor')) {
  process.exit(1);
}

// Compilar para iOS
console.log('🔨 Compilando aplicación iOS...');
if (!runCommand('npx cap build ios', 'Compilando aplicación iOS')) {
  process.exit(1);
}

console.log('🎉 ¡Compilación para iOS completada!');
console.log('\n📱 Para continuar:');
console.log('   1. Asegúrate de que tu servidor Next.js esté ejecutándose:');
console.log(`      npm run dev`);
console.log(`   2. La app se conectará a: ${serverURL}`);
console.log('   3. Abre Xcode: npx cap open ios');
console.log('   4. Configura tu equipo de desarrollo en Xcode');
console.log('   5. Conecta tu dispositivo iOS o selecciona simulador');
console.log('   6. Haz clic en Run');
console.log('\n🌐 Configuración de red:');
console.log(`   • IP local detectada: ${localIP}`);
console.log(`   • Servidor móvil: ${serverURL}`);
console.log(`   • Asegúrate de que tu iPhone esté en la misma red WiFi`);
console.log('\n📋 Comandos útiles:');
console.log('   • Desarrollo con recarga en vivo: npm run dev:ios');
console.log('   • Abrir proyecto iOS: npx cap open ios');
console.log('   • Sincronizar cambios: npx cap sync ios');
console.log('\n⚠️  Importante:');
console.log('   • Tu iPhone y computadora deben estar en la misma red WiFi');
console.log('   • El firewall de Windows no debe bloquear el puerto 4200');
console.log('   • Starlink DHCP puede cambiar IPs, recompila si hay problemas');