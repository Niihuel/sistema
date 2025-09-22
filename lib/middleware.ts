import { getTokenFromAuthHeader, verifyJwt } from "./auth"
import { NextResponse } from "next/server"

export type AuthContext = {
  userId: number
  role: string // Updated to support any role string from new system
  iat?: number
  exp?: number
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export function requireAuth(req: Request): AuthContext {
  try {
    // Try multiple sources for token
    const cookieHeader = req.headers.get("cookie") || ""
    const authCookie = cookieHeader.split(/;\s*/).find((c) => c.startsWith("auth_token="))
    const tokenFromCookie = authCookie ? decodeURIComponent(authCookie.split("=")[1]) : null

    // Also check for token in authorization header
    const tokenFromHeader = getTokenFromAuthHeader(req.headers.get("authorization"))

    // Use cookie token first, then header token
    const token = tokenFromCookie || tokenFromHeader

    if (!token) {
      throw new AuthError("No authentication token provided", "NO_TOKEN")
    }

    // Verify JWT with proper error handling
    const payload = verifyJwt<AuthContext>(token)

    if (!payload) {
      throw new AuthError("Invalid or expired token", "INVALID_TOKEN")
    }

    // Validate payload structure
    if (!payload.userId || !payload.role) {
      throw new AuthError("Malformed token payload", "MALFORMED_TOKEN")
    }

    // Check token expiration if exp is present
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new AuthError(
        "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        "TOKEN_EXPIRED"
      )
    }

    // Check if token is about to expire (within 15 minutes)
    const now = Date.now()
    const expirationTime = (payload.exp || 0) * 1000
    const timeToExpiration = expirationTime - now
    const fifteenMinutes = 15 * 60 * 1000

    // Add warning header if token expires soon
    if (payload.exp && timeToExpiration > 0 && timeToExpiration < fifteenMinutes) {
      // This could be used by the client to show a warning or refresh the token
      req.headers.set('X-Token-Expires-Soon', 'true')
      req.headers.set('X-Token-Expires-At', expirationTime.toString())
    }

    return payload
  } catch (error) {
    // If error is already an AuthError, rethrow it
    if (error instanceof AuthError) {
      throw error
    }

    // Log unexpected errors
    console.error('[requireAuth] Unexpected error:', error)

    // Return generic unauthorized for unexpected errors
    throw new AuthError("Authentication failed", "AUTH_FAILED")
  }
}

export function requireRole(ctx: AuthContext, roles: string[]) {
  if (!roles.includes(ctx.role)) {
    throw new AuthError("Insufficient permissions", "FORBIDDEN", 403)
  }
}


