import { NextRequest, NextResponse } from "next/server";
import { withDatabase, isDatabaseAvailable } from "@/lib/prisma";
import { verifyPassword, signJwt, logSecurityEvent } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * USUARIOS DEMO para fallback cuando BD no esté disponible
 * Usando los mismos que tienes configurados en tu .env
 */
const DEMO_USERS = [
  {
    id: 1,
    username: 'auxsistemas', // Usuario principal de tu empresa
    passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password  
    role: 'ADMIN',
    isActive: true
  },
  {
    id: 2,
    username: 'admin', // Usuario admin secundario
    passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    role: 'ADMIN',
    isActive: true
  },
  {
    id: 3,
    username: 'tech', // Usuario técnico
    passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    role: 'TECHNICIAN',
    isActive: true
  }
];

/**
 * CONFIGURACIÓN de seguridad para producción
 */
const SECURITY_CONFIG = {
  maxLoginAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5'),
  lockoutDurationMs: parseInt(process.env.LOGIN_LOCKOUT_DURATION_MS || '900000'), // 15 minutos
  sessionDurationMs: 24 * 60 * 60 * 1000, // 24 horas
  cookieName: 'auth_token',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos  
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
};

/**
 * Cache temporal para rate limiting (en producción usar Redis)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number; lockedUntil?: number }>();

/**
 * FUNCIÓN: Obtener IP del cliente de forma segura
 */
function getClientIP(req: NextRequest): string {
  // CORRECCIÓN: Múltiples métodos para obtener IP real
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfIP = req.headers.get('cf-connecting-ip'); // Cloudflare
  const remoteAddr = req.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (cfIP) return cfIP;
  if (realIP) return realIP;
  if (remoteAddr) return remoteAddr;
  return 'unknown';
}

/**
 * FUNCIÓN: Rate limiting mejorado para tu configuración
 */
function checkRateLimit(ip: string): { allowed: boolean; lockedUntil?: number; remaining: number } {
  const now = Date.now();
  const key = ip;
  const attempts = rateLimitMap.get(key);
  
  if (!attempts) {
    // Primera request
    rateLimitMap.set(key, { count: 1, resetTime: now + SECURITY_CONFIG.rateLimitWindowMs });
    return { allowed: true, remaining: SECURITY_CONFIG.rateLimitMaxRequests - 1 };
  }
  
  // Si estamos en la ventana de tiempo actual
  if (now < attempts.resetTime) {
    // Si está bloqueado temporalmente
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      return { allowed: false, lockedUntil: attempts.lockedUntil, remaining: 0 };
    }
    
    // Si excede el límite de requests
    if (attempts.count >= SECURITY_CONFIG.rateLimitMaxRequests) {
      const lockUntil = now + SECURITY_CONFIG.lockoutDurationMs;
      attempts.lockedUntil = lockUntil;
      return { allowed: false, lockedUntil: lockUntil, remaining: 0 };
    }
    
    // Incrementar contador
    attempts.count++;
    return { allowed: true, remaining: SECURITY_CONFIG.rateLimitMaxRequests - attempts.count };
  } else {
    // Reset de ventana de tiempo
    rateLimitMap.set(key, { count: 1, resetTime: now + SECURITY_CONFIG.rateLimitWindowMs });
    return { allowed: true, remaining: SECURITY_CONFIG.rateLimitMaxRequests - 1 };
  }
}

/**
 * FUNCIÓN: Limpiar rate limits expirados
 */
function cleanExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime && (!data.lockedUntil || now > data.lockedUntil)) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * FUNCIÓN: Validar datos de login de forma segura
 */
function validateLoginData(body: any): { 
  isValid: boolean; 
  username?: string; 
  password?: string; 
  error?: string; 
} {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Datos de request inválidos' };
  }

  const { username, password } = body;

  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Nombre de usuario requerido' };
  }

  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Contraseña requerida' };
  }

  const cleanUsername = username.toLowerCase().trim();
  
  if (cleanUsername.length < 2 || cleanUsername.length > 50) {
    return { isValid: false, error: 'Nombre de usuario inválido' };
  }

  if (password.length < 3 || password.length > 128) {
    return { isValid: false, error: 'Contraseña inválida' };
  }

  // Validar caracteres permitidos en username
  if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
    return { isValid: false, error: 'Nombre de usuario contiene caracteres inválidos' };
  }

  return { isValid: true, username: cleanUsername, password };
}

/**
 * FUNCIÓN: Login con base de datos (tu SQL Server)
 */
async function loginWithDatabase(username: string, password: string, ip: string): Promise<{
  success: boolean;
  user?: { id: number; username: string; role: string };
  error?: string;
}> {
  return await withDatabase(
    async (prisma) => {
      // Buscar usuario activo
      const user = await prisma.user.findFirst({
        where: {
          username: username,
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          username: true,
          passwordHash: true,
          role: true,
          isActive: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          lastLoginAt: true,
        }
      });

      if (!user) {
        logSecurityEvent('login_user_not_found', { username, ip });
        return { success: false, error: 'Credenciales inválidas' };
      }

      // Verificar si cuenta está bloqueada
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const lockTime = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000);
        logSecurityEvent('login_account_locked', { 
          userId: user.id, 
          username: user.username, 
          ip,
          lockTime 
        });
        return { success: false, error: `Cuenta bloqueada por ${Math.ceil(lockTime / 60)} minutos` };
      }

      // Verificar password
      const passwordValid = await verifyPassword(password, user.passwordHash);
      
      if (!passwordValid) {
        // Incrementar intentos fallidos
        const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
        const shouldLock = newFailedAttempts >= SECURITY_CONFIG.maxLoginAttempts;
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + SECURITY_CONFIG.lockoutDurationMs) : null
          }
        });

        logSecurityEvent('login_invalid_password', { 
          userId: user.id, 
          username: user.username, 
          ip,
          failedAttempts: newFailedAttempts,
          locked: shouldLock
        });
        
        return { success: false, error: 'Credenciales inválidas' };
      }

      // Login exitoso - limpiar intentos y actualizar último login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date()
        }
      });

      logSecurityEvent('login_success_database', { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        ip 
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      };
    },
    // CORRECCIÓN: Fallback a usuarios demo si hay problemas con BD
    async () => {
      console.warn('⚠️ Base de datos no disponible, usando modo demo');
      return await loginWithDemo(username, password, ip);
    }
  );
}

/**
 * FUNCIÓN: Login con usuarios demo (fallback)
 */
async function loginWithDemo(username: string, password: string, ip: string): Promise<{
  success: boolean;
  user?: { id: number; username: string; role: string };
  error?: string;
}> {
  const user = DEMO_USERS.find(u => u.username === username && u.isActive);
  
  if (!user) {
    logSecurityEvent('demo_login_user_not_found', { username, ip });
    return { success: false, error: 'Credenciales inválidas' };
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  
  if (!passwordValid) {
    logSecurityEvent('demo_login_invalid_password', { username, ip });
    return { success: false, error: 'Credenciales inválidas' };
  }

  logSecurityEvent('demo_login_success', { 
    userId: user.id, 
    username: user.username, 
    role: user.role,
    ip 
  });

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}

/**
 * FUNCIÓN: Configurar cookie de autenticación
 */
async function setAuthenticationCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();

    cookieStore.set(SECURITY_CONFIG.cookieName, token, {
      httpOnly: true, // Solo HTTP, no JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS en producción
      sameSite: 'lax', // Protección CSRF
      maxAge: SECURITY_CONFIG.sessionDurationMs / 1000, // En segundos
      path: '/', // Disponible en toda la app
      domain: process.env.NODE_ENV === 'production' ? '.192.168.143.163' : undefined, // Tu IP
    });
  } catch (error) {
    console.error('Error configurando cookie de auth:', error);
    throw new Error('Error configurando cookie de autenticación');
  }
}

/**
 * RUTA POST PRINCIPAL - PRODUCCIÓN READY
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  console.log(`[Login ${requestId}] Iniciando login desde ${ip}`);

  try {
    // 1. CORRECCIÓN: Rate limiting mejorado
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      const remainingTime = rateLimitCheck.lockedUntil ? 
        Math.ceil((rateLimitCheck.lockedUntil - Date.now()) / 1000) : 0;
      
      logSecurityEvent('login_rate_limited', { ip, remainingTime });
      
      return NextResponse.json(
        { 
          error: "Demasiados intentos. Intenta nuevamente más tarde.", 
          code: "RATE_LIMITED",
          retryAfter: remainingTime
        },
        { 
          status: 429,
          headers: {
            'Retry-After': remainingTime.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitCheck.lockedUntil?.toString() || ''
          }
        }
      );
    }

    // 2. Parsear y validar body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      logSecurityEvent('login_invalid_json', { ip, error: String(parseError) });
      return NextResponse.json(
        { error: "Formato de datos inválido", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    // 3. Validar datos de entrada
    const validation = validateLoginData(body);
    if (!validation.isValid) {
      logSecurityEvent('login_validation_failed', { ip, error: validation.error });
      return NextResponse.json(
        { error: validation.error, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { username, password } = validation;
    console.log(`[Login ${requestId}] Procesando login para: ${username}`);

    // 4. CORRECCIÓN: Verificar disponibilidad de BD con timeout
    const dbCheckPromise = isDatabaseAvailable();
    const timeoutPromise = new Promise<boolean>(resolve => 
      setTimeout(() => resolve(false), 5000) // 5 segundos timeout
    );
    
    const dbAvailable = await Promise.race([dbCheckPromise, timeoutPromise]);
    console.log(`[Login ${requestId}] Base de datos disponible: ${dbAvailable}`);

    // 5. Procesar login
    let loginResult: { success: boolean; user?: any; error?: string };
    
    try {
      if (dbAvailable) {
        loginResult = await loginWithDatabase(username!, password!, ip);
      } else {
        console.warn(`[Login ${requestId}] BD no disponible, usando modo demo`);
        loginResult = await loginWithDemo(username!, password!, ip);
      }
    } catch (loginError) {
      console.error(`[Login ${requestId}] Error durante login:`, loginError);
      logSecurityEvent('login_processing_error', { 
        username, 
        ip, 
        error: String(loginError) 
      });
      
      return NextResponse.json(
        { error: "Error interno de autenticación", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    if (!loginResult.success) {
      // Incrementar rate limit en fallos
      const currentData = rateLimitMap.get(ip);
      if (currentData) {
        currentData.count += 2; // Penalizar fallos más
      }
      
      return NextResponse.json(
        { error: loginResult.error || "Error de autenticación", code: "AUTH_FAILED" },
        { status: 401 }
      );
    }

    // 6. Generar token JWT
    let token: string;
    try {
      token = signJwt({
        userId: loginResult.user!.id,
        username: loginResult.user!.username,
        role: loginResult.user!.role,
        loginTime: Date.now(),
        ip: ip
      });
    } catch (tokenError) {
      console.error(`[Login ${requestId}] Error generando token:`, tokenError);
      return NextResponse.json(
        { error: "Error generando token de autenticación", code: "TOKEN_ERROR" },
        { status: 500 }
      );
    }

    // 7. Configurar cookie
    try {
      await setAuthenticationCookie(token);
    } catch (cookieError) {
      console.error(`[Login ${requestId}] Error configurando cookie:`, cookieError);
      return NextResponse.json(
        { error: "Error configurando sesión", code: "COOKIE_ERROR" },
        { status: 500 }
      );
    }

    // 8. Login exitoso - limpiar rate limit
    rateLimitMap.delete(ip);
    
    const processingTime = Date.now() - startTime;
    console.log(`[Login ${requestId}] Login exitoso para ${username} en ${processingTime}ms`);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: loginResult.user!.id,
          username: loginResult.user!.username,
          role: loginResult.user!.role
        },
        message: "Login exitoso",
        timestamp: new Date().toISOString(),
        demoMode: !dbAvailable
      },
      { 
        status: 200,
        headers: {
          'X-Processing-Time': `${processingTime}ms`,
          'X-Request-ID': requestId,
          'X-RateLimit-Remaining': rateLimitCheck.remaining.toString()
        }
      }
    );

  } catch (error) {
    // Manejo de errores críticos
    const processingTime = Date.now() - startTime;
    console.error(`[Login ${requestId}] ERROR CRÍTICO después de ${processingTime}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip,
      userAgent,
      requestId
    });

    logSecurityEvent('login_critical_error', { 
      ip, 
      error: String(error),
      processingTime,
      requestId
    });

    return NextResponse.json(
      { 
        error: "Error interno del servidor", 
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Manejar OPTIONS para CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://192.168.143.163:4250', // Tu IP fija
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 horas
    },
  });
}

// CORRECCIÓN: Limpieza periódica de rate limits (cada 15 minutos)
setInterval(() => {
  cleanExpiredRateLimits();
  console.log(`🧹 Limpieza de rate limits completada. Activos: ${rateLimitMap.size}`);
}, 15 * 60 * 1000);