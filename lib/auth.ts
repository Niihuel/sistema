import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production-2024";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "24h";

export async function hashPassword(plain: string): Promise<string> {
  if (!plain || typeof plain !== 'string') {
    throw new Error('Password is required and must be string');
  }

  if (plain.length < 3) {
    throw new Error('Password must have at least 3 characters');
  }

  if (plain.length > 72) {
    throw new Error('Password too long (maximum 72 characters)');
  }

  try {
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(plain, salt);
  } catch (error) {
    throw new Error('Error hashing password');
  }
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash || typeof plain !== 'string' || typeof hash !== 'string') {
    try {
      await bcrypt.compare('dummy', '$2b$10$N9qo8uLOickgx2ZMRZoMye.3g65c5u4yZfKgKg1uv8XOm6sFBQ.6m');
    } catch {
      // Ignore
    }
    return false;
  }

  try {
    return await bcrypt.compare(plain, hash);
  } catch (error) {
    try {
      await bcrypt.compare('dummy', '$2b$10$N9qo8uLOickgx2ZMRZoMye.3g65c5u4yZfKgKg1uv8XOm6sFBQ.6m');
    } catch {
      // Ignore
    }
    return false;
  }
}

export function signJwt(payload: Record<string, any>): string {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a valid object');
  }

  if ('userId' in payload && (typeof payload.userId !== 'number' || payload.userId <= 0)) {
    throw new Error('userId must be a positive number');
  }

  if ('username' in payload && (typeof payload.username !== 'string' || !payload.username.trim())) {
    throw new Error('username must be a non-empty string');
  }

  if ('role' in payload && (typeof payload.role !== 'string' || !payload.role.trim())) {
    throw new Error('role must be a non-empty string');
  }

  try {
    const hasExp = 'exp' in payload && typeof payload.exp === 'number';

    if (hasExp) {
      return jwt.sign(payload, JWT_SECRET, {
        issuer: 'sistema-it',
        audience: 'sistema-it-users',
      });
    } else {
      return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'sistema-it',
        audience: 'sistema-it-users',
      });
    }
  } catch (error) {
    throw new Error('Error generating JWT token');
  }
}

export function verifyJwt<T extends object = Record<string, unknown>>(token: string): T | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  
  if (cleanToken.length === 0) {
    return null;
  }

  try {
    const decoded = jwt.verify(cleanToken, JWT_SECRET, {
      issuer: 'sistema-it',
      audience: 'sistema-it-users',
      clockTolerance: 30,
    }) as T;

    if (!decoded || typeof decoded !== 'object') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

export function verifyJwtWithError<T extends object = Record<string, unknown>>(token: string): {
  payload: T | null,
  error: string | null,
  errorCode: string | null
} {
  if (!token || typeof token !== 'string') {
    return {
      payload: null,
      error: 'Token is required',
      errorCode: 'TOKEN_REQUIRED'
    };
  }

  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  
  if (cleanToken.length === 0) {
    return {
      payload: null,
      error: 'Empty token',
      errorCode: 'EMPTY_TOKEN'
    };
  }

  const tokenParts = cleanToken.split('.');
  if (tokenParts.length !== 3) {
    return {
      payload: null,
      error: 'Invalid token format',
      errorCode: 'INVALID_TOKEN_FORMAT'
    };
  }

  try {
    const payload = jwt.verify(cleanToken, JWT_SECRET, {
      issuer: 'sistema-it',
      audience: 'sistema-it-users',
      clockTolerance: 30,
    }) as T;

    if (!payload || typeof payload !== 'object') {
      return {
        payload: null,
        error: 'Invalid token payload',
        errorCode: 'INVALID_PAYLOAD'
      };
    }

    return { payload, error: null, errorCode: null };

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        payload: null,
        error: 'Your session has expired. Please login again.',
        errorCode: 'TOKEN_EXPIRED'
      };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return {
        payload: null,
        error: 'Invalid authentication token.',
        errorCode: 'INVALID_TOKEN'
      };
    } else if (error instanceof jwt.NotBeforeError) {
      return {
        payload: null,
        error: 'Token is not valid yet.',
        errorCode: 'TOKEN_NOT_ACTIVE'
      };
    } else {
      return {
        payload: null,
        error: 'Authentication error.',
        errorCode: 'AUTH_ERROR'
      };
    }
  }
}

export function getTokenFromAuthHeader(authorization?: string | null): string | null {
  if (!authorization || typeof authorization !== 'string') {
    return null;
  }

  const parts = authorization.trim().split(' ');
  if (parts.length !== 2) {
    return null;
  }

  const [type, token] = parts;
  if (type.toLowerCase() !== 'bearer' || !token || token.length === 0) {
    return null;
  }

  return token;
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'], score: 0 };
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  } else if (password.length >= 8) {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  const isValid = errors.length === 0 && password.length >= 6;
  
  return {
    isValid,
    errors,
    score: Math.max(0, Math.min(5, score))
  };
}

export function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result + '-' + Date.now().toString(36);
}

export function isTokenNearExpiry(token: string, thresholdMinutes: number = 5): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return false;
    
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const thresholdTime = thresholdMinutes * 60 * 1000;
    
    return (expirationTime - currentTime) < thresholdTime;
  } catch (error) {
    return true;
  }
}

export function logSecurityEvent(
  event: string,
  details: {
    userId?: number;
    username?: string;
    ip?: string;
    userAgent?: string;
    success?: boolean;
    error?: string;
  }
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
    requestId: Math.random().toString(36).substring(7)
  };

  console.log('[SECURITY]', JSON.stringify(logEntry));
}

export function decodeTokenPayload(token: string): any {
  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    return jwt.decode(cleanToken);
  } catch (error) {
    return null;
  }
}