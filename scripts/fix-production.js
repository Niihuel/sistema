#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 SISTEMA DE REPARACIÓN AUTOMÁTICA')
console.log('===================================')

const runCommand = (command, description) => {
  try {
    console.log(`\n📋 ${description}...`)
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} completado`)
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message)
    process.exit(1)
  }
}

const main = async () => {
  try {
    // Paso 1: Limpiar caché y dependencias
    console.log('\n🧹 PASO 1: Limpiando caché y dependencias...')
    
    const pathsToRemove = [
      'node_modules',
      'package-lock.json', 
      '.next',
      '.next/cache',
      'dist'
    ]
    
    for (const dirPath of pathsToRemove) {
      if (fs.existsSync(dirPath)) {
        console.log(`🗑️  Eliminando ${dirPath}...`)
        fs.rmSync(dirPath, { recursive: true, force: true })
      }
    }

    // Paso 2: Reinstalar dependencias
    runCommand('npm install', 'Instalando dependencias')

    // Paso 3: Generar Prisma Client
    runCommand('npx prisma generate', 'Generando Prisma Client')

    // Paso 4: Migrar base de datos
    runCommand('npx prisma migrate deploy', 'Aplicando migraciones de BD')

    // Paso 5: Seed de producción
    runCommand('npm run prisma:seed', 'Ejecutando seed de producción')

    // Paso 6: Construir para producción
    runCommand('npm run build', 'Construyendo para producción')

    console.log('\n🎉 REPARACIÓN COMPLETADA EXITOSAMENTE')
    console.log('=====================================')
    console.log('✅ Todas las dependencias problemáticas eliminadas')
    console.log('✅ Base de datos sincronizada')
    console.log('✅ Aplicación construida correctamente')
    console.log('\n🚀 Ejecuta "npm run start" para iniciar el servidor')
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA REPARACIÓN:', error.message)
    console.log('\n📋 INSTRUCCIONES MANUALES:')
    console.log('1. rm -rf node_modules package-lock.json .next')
    console.log('2. npm install')
    console.log('3. npx prisma generate')
    console.log('4. npx prisma migrate deploy')
    console.log('5. npm run prisma:seed')
    console.log('6. npm run build')
    process.exit(1)
  }
}

main()

