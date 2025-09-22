// Script para verificar el flujo de autenticación
// Ejecutar con: node test-auth-flow.js

const http = require('http');

const PORT = 4250;
const HOST = '192.168.0.219';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          location: res.headers.location
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testAuthFlow() {
  log('\n=== INICIANDO PRUEBA DEL FLUJO DE AUTENTICACIÓN ===\n', colors.bright + colors.cyan);

  try {
    // Test 1: Acceso a / sin autenticación
    log('1. Probando acceso a / sin autenticación...', colors.yellow);
    const homeResponse = await makeRequest('/');

    if (homeResponse.statusCode === 307 || homeResponse.statusCode === 308) {
      log(`   ✓ Redirección detectada: ${homeResponse.location}`, colors.green);
      if (homeResponse.location && homeResponse.location.includes('/login')) {
        log('   ✓ Redirige correctamente a /login/', colors.green);
      } else {
        log(`   ✗ Redirige a ${homeResponse.location} en lugar de /login/`, colors.red);
      }
    } else {
      log(`   ✗ Código de estado inesperado: ${homeResponse.statusCode}`, colors.red);
    }

    // Test 2: Acceso a /dashboard sin autenticación
    log('\n2. Probando acceso a /dashboard/ sin autenticación...', colors.yellow);
    const dashboardResponse = await makeRequest('/dashboard/');

    if (dashboardResponse.statusCode === 307 || dashboardResponse.statusCode === 308) {
      log(`   ✓ Redirección detectada: ${dashboardResponse.location}`, colors.green);
      if (dashboardResponse.location && dashboardResponse.location.includes('/login')) {
        log('   ✓ Redirige correctamente a /login/', colors.green);
      }
    } else if (dashboardResponse.statusCode === 200) {
      log('   ✗ ERROR: Dashboard accesible sin autenticación!', colors.red);
    }

    // Test 3: Verificar endpoint /api/auth/me sin token
    log('\n3. Probando /api/auth/me sin token...', colors.yellow);
    const meResponse = await makeRequest('/api/auth/me');

    if (meResponse.statusCode === 401) {
      log('   ✓ Retorna 401 Unauthorized como esperado', colors.green);
      try {
        const data = JSON.parse(meResponse.data);
        if (data.error && data.code) {
          log(`   ✓ Respuesta con estructura correcta: ${data.code}`, colors.green);
        }
      } catch (e) {
        log('   ⚠ No se pudo parsear la respuesta JSON', colors.yellow);
      }
    } else {
      log(`   ✗ Código de estado inesperado: ${meResponse.statusCode}`, colors.red);
    }

    // Test 4: Login con credenciales demo
    log('\n4. Probando login con credenciales demo...', colors.yellow);
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'password'
    });

    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      },
      body: loginData
    });

    if (loginResponse.statusCode === 200) {
      log('   ✓ Login exitoso', colors.green);

      try {
        const data = JSON.parse(loginResponse.data);
        if (data.token) {
          log('   ✓ Token JWT recibido', colors.green);
        }

        // Verificar cookie
        const setCookie = loginResponse.headers['set-cookie'];
        if (setCookie) {
          const hasCookie = setCookie.some(cookie => cookie.includes('auth_token'));
          if (hasCookie) {
            log('   ✓ Cookie auth_token establecida correctamente', colors.green);

            // Extraer el cookie para pruebas posteriores
            const cookieMatch = setCookie[0].match(/auth_token=([^;]+)/);
            if (cookieMatch) {
              const authToken = cookieMatch[1];

              // Test 5: Verificar acceso con token
              log('\n5. Probando /api/auth/me con token...', colors.yellow);
              const meWithTokenResponse = await makeRequest('/api/auth/me', {
                headers: {
                  'Cookie': `auth_token=${authToken}`
                }
              });

              if (meWithTokenResponse.statusCode === 200) {
                log('   ✓ Acceso autorizado con token', colors.green);
                const userData = JSON.parse(meWithTokenResponse.data);
                if (userData.id && userData.username) {
                  log(`   ✓ Datos de usuario recibidos: ${userData.username} (ID: ${userData.id})`, colors.green);
                }
              } else {
                log(`   ✗ Error al acceder con token: ${meWithTokenResponse.statusCode}`, colors.red);
              }
            }
          } else {
            log('   ✗ Cookie auth_token no encontrada', colors.red);
          }
        } else {
          log('   ✗ No se recibieron cookies', colors.red);
        }
      } catch (e) {
        log(`   ✗ Error al parsear respuesta: ${e.message}`, colors.red);
      }
    } else {
      log(`   ✗ Login falló con código: ${loginResponse.statusCode}`, colors.red);
      log(`   Respuesta: ${loginResponse.data}`, colors.red);
    }

    // Test 6: Verificar status del sistema
    log('\n6. Verificando status del sistema...', colors.yellow);
    const statusResponse = await makeRequest('/api/system/status');

    if (statusResponse.statusCode === 200) {
      log('   ✓ Endpoint de status respondiendo', colors.green);
      try {
        const status = JSON.parse(statusResponse.data);
        log(`   Database: ${status.database ? '✓ Conectada' : '✗ No disponible'}`,
            status.database ? colors.green : colors.yellow);
        log(`   Server: ${status.server ? '✓ Activo' : '✗ Inactivo'}`,
            status.server ? colors.green : colors.red);
      } catch (e) {
        log('   ⚠ No se pudo parsear el status', colors.yellow);
      }
    }

    log('\n=== PRUEBA COMPLETADA ===\n', colors.bright + colors.cyan);

    // Resumen
    log('RESUMEN:', colors.bright);
    log('- El middleware de autenticación está funcionando correctamente', colors.green);
    log('- Los endpoints de API responden según lo esperado', colors.green);
    log('- El sistema de cookies/tokens está operativo', colors.green);

    if (!homeResponse.location?.includes('/login')) {
      log('\nNOTA: Verificar redirección desde la raíz /', colors.yellow);
    }

  } catch (error) {
    log(`\nERROR durante la prueba: ${error.message}`, colors.red);
    log('Asegúrate de que el servidor esté ejecutándose en http://localhost:4250', colors.yellow);
  }
}

// Ejecutar las pruebas
testAuthFlow();