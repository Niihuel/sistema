#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('📱 Compilando aplicación para Android...\n');

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

// Verificar que Android Studio esté configurado
try {
  execSync('java -version', { stdio: 'ignore' });
  console.log('✅ Java detectado');
} catch (error) {
  console.log('⚠️  Java no detectado. Asegúrate de tener Android Studio instalado');
}

// Verificar que la plataforma Android exista
if (!fs.existsSync('android')) {
  console.log('📱 Configurando plataforma Android...');
  if (!runCommand('npx cap add android', 'Agregando plataforma Android')) {
    process.exit(1);
  }
}

// Construir la aplicación web
console.log('📦 Preparando aplicación web...');
if (!runCommand('CAPACITOR_EXPORT=true npm run build', 'Construyendo aplicación Next.js')) {
  process.exit(1);
}

// Sincronizar con Capacitor
if (!runCommand('npx cap sync android', 'Sincronizando con Capacitor')) {
  process.exit(1);
}

// Compilar APK
console.log('🔨 Compilando APK...');
if (!runCommand('npx cap build android', 'Compilando aplicación Android')) {
  process.exit(1);
}

console.log('🎉 ¡Compilación para Android completada!');
console.log('\n📁 Busca tu APK en:');
console.log('   android/app/build/outputs/apk/');
console.log('\n📋 Para desarrollo:');
console.log('   npm run dev:android');