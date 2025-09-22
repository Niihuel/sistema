import { NextRequest, NextResponse } from "next/server"
import { withDatabase, isDatabaseAvailable } from "@/lib/prisma"
import { verifyPassword, signJwt } from "@/lib/auth"
import { cookies } from "next/headers"

// Usuarios demo para cuando la base de datos no esté disponible
const DEMO_USERS = [
  {
    id: 1,
    username: 'admin',
    passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    role: 'ADMIN'
  },
  {
    id: 2,
    username: 'tech',
    passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    role: 'TECHNICIAN'
  }
];

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_JSON" },
        { status: 400 }
      )
    }

    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required", code: "MISSING_CREDENTIALS" },
        { status: 400 }
      )
    }

    // Sanitize username (prevent SQL injection)
    const sanitizedUsername = String(username).toLowerCase().trim()
    if (sanitizedUsername.length < 2 || sanitizedUsername.length > 50) {
      return NextResponse.json(
        { error: "Invalid username format", code: "INVALID_USERNAME" },
        { status: 400 }
      )
    }

    // Check database availability with timeout
    const dbAvailable = await Promise.race([
      isDatabaseAvailable(),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 5000))
    ])

    if (dbAvailable) {
      // Use real database
      return await withDatabase(
        async (prisma) => {
          // Find user with active status check
          const user = await prisma.user.findFirst({
            where: {
              username: sanitizedUsername,
              isActive: true
            },
            select: {
              id: true,
              username: true,
              passwordHash: true,
              role: true,
              isActive: true,
              failedLoginAttempts: true,
              lockedUntil: true,
              userRoles: {
                select: {
                  role: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          })

          // Check if user exists
          if (!user) {
            // Log failed attempt for security monitoring
            console.warn(`[Login] Failed login attempt for username: ${sanitizedUsername}`)
            return NextResponse.json(
              { error: "Invalid credentials", code: "INVALID_CREDENTIALS" },
              { status: 401 }
            )
          }

          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutesRemaining = Math.ceil(
              (user.lockedUntil.getTime() - Date.now()) / 60000
            )
            return NextResponse.json(
              {
                error: `Account locked. Try again in ${minutesRemaining} minutes`,
                code: "ACCOUNT_LOCKED",
                lockedUntil: user.lockedUntil
              },
              { status: 423 }
            )
          }

          // Verify password
          const passwordValid = await verifyPassword(password, user.passwordHash)

          if (!passwordValid) {
            // Increment failed login attempts
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1
            const lockAccount = newFailedAttempts >= 5

            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newFailedAttempts,
                lockedUntil: lockAccount
                  ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
                  : null
              }
            })

            console.warn(`[Login] Failed password for user: ${user.username} (${newFailedAttempts} attempts)`)

            if (lockAccount) {
              return NextResponse.json(
                {
                  error: "Too many failed attempts. Account locked for 30 minutes",
                  code: "TOO_MANY_ATTEMPTS"
                },
                { status: 423 }
              )
            }

            return NextResponse.json(
              {
                error: "Invalid credentials",
                code: "INVALID_CREDENTIALS",
                remainingAttempts: 5 - newFailedAttempts
              },
              { status: 401 }
            )
          }

          // Reset failed login attempts on successful login
          if (user.failedLoginAttempts > 0 || user.lockedUntil) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date()
              }
            })
          } else {
            // Update last login time
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() }
            })
          }

          // Generate JWT token
          const token = signJwt({
            userId: user.id,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
          })

          // Build response
          const response = NextResponse.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              roles: user.userRoles.map(ur => ur.role.name)
            },
            databaseMode: 'production',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })

          // Set secure cookie
          const cookieStore = await cookies()
          cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Changed from strict to lax for better compatibility
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: '/'
          })

          console.log(`[Login] Successful login for user: ${user.username}`)
          return response
        },
        // Fallback to demo mode if database fails
        async (error) => {
          console.error('[Login] Database error, falling back to demo mode:', error)
          return await loginWithDemo(sanitizedUsername, password)
        }
      )
    } else {
      // Use demo mode directly
      console.log('[Login] Database not available, using demo mode')
      return await loginWithDemo(sanitizedUsername, password)
    }
    
  } catch (error) {
    // Log error for monitoring
    console.error('[Login] Unexpected error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })

    // Return generic error for security (don't leak internal details)
    return NextResponse.json(
      {
        error: "Authentication service temporarily unavailable",
        code: "SERVICE_ERROR",
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}

async function loginWithDemo(username: string, password: string): Promise<NextResponse> {
  try {
    const user = DEMO_USERS.find(u => u.username === username.toLowerCase())

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      )
    }

    const passwordValid = await verifyPassword(password, user.passwordHash)

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid credentials", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      )
    }

    // Generate token for demo user
    const token = signJwt({
      userId: user.id,
      role: user.role as 'ADMIN' | 'TECHNICIAN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    })

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      databaseMode: 'demo',
      message: 'Demo mode active (database unavailable)',
      warning: 'Data will not be persisted',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

    // Set cookie using Next.js cookies API
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from strict to lax for better compatibility
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    console.log(`[Login] Demo mode login for user: ${user.username}`)
    return response
  } catch (error) {
    console.error('[Login] Demo mode error:', error)
    return NextResponse.json(
      { error: "Demo mode error", code: "DEMO_ERROR" },
      { status: 500 }
    )
  }
}


