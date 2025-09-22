import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me"
const JWT_EXPIRES_IN = "7d"

export async function hashPassword(plain: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(plain, saltRounds)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function signJwt(payload: object): string {
  // Check if payload already has exp property
  const hasExp = 'exp' in payload && typeof payload.exp === 'number'

  if (hasExp) {
    // Don't add expiresIn if exp is already in payload
    return jwt.sign(payload, JWT_SECRET)
  } else {
    // Add expiresIn if no exp in payload
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  }
}

export function verifyJwt<T extends object = Record<string, unknown>>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T
  } catch (error) {
    // Log the specific JWT error for debugging
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('[verifyJwt] Token expired:', error.message)
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('[verifyJwt] Invalid token:', error.message)
    } else {
      console.error('[verifyJwt] JWT verification error:', error)
    }
    return null
  }
}

// Enhanced version that returns error information
export function verifyJwtWithError<T extends object = Record<string, unknown>>(token: string): {
  payload: T | null,
  error: string | null,
  errorCode: string | null
} {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as T
    return { payload, error: null, errorCode: null }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        payload: null,
        error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        errorCode: 'TOKEN_EXPIRED'
      }
    } else if (error instanceof jwt.JsonWebTokenError) {
      return {
        payload: null,
        error: 'Token de autenticación inválido.',
        errorCode: 'INVALID_TOKEN'
      }
    } else {
      console.error('[verifyJwtWithError] Unexpected JWT error:', error)
      return {
        payload: null,
        error: 'Error de autenticación.',
        errorCode: 'AUTH_ERROR'
      }
    }
  }
}

export function getTokenFromAuthHeader(authorization?: string | null): string | null {
  if (!authorization) return null
  const [type, token] = authorization.split(" ")
  if (type !== "Bearer" || !token) return null
  return token
}


