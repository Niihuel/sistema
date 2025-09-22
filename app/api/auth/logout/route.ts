import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    // Get cookie store
    const cookieStore = cookies()

    // Clear auth token
    cookieStore.delete('auth_token')

    // Also clear any session storage indicators
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )

    // Set multiple cookies to clear to ensure complete logout
    const isProduction = process.env.NODE_ENV === 'production'
    const baseCookieOptions = [
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=0',
      `Expires=${new Date(0).toUTCString()}`,
      isProduction && 'Secure'
    ].filter(Boolean).join('; ')

    // Clear auth token and any related cookies
    response.headers.append('Set-Cookie', `auth_token=; ${baseCookieOptions}`)
    response.headers.append('Set-Cookie', `refresh_token=; ${baseCookieOptions}`)
    response.headers.append('Set-Cookie', `session_id=; ${baseCookieOptions}`)

    // Log logout for security monitoring
    console.log('[Logout] User logged out successfully at', new Date().toISOString())

    return response
  } catch (error) {
    console.error('[Logout] Error during logout:', error)

    // Even on error, try to clear cookies
    const response = NextResponse.json(
      {
        success: false,
        error: "Logout failed but session cleared",
        code: "LOGOUT_ERROR"
      },
      { status: 500 }
    )

    // Still clear cookies even if error occurred
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = [
      'auth_token=',
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=0',
      isProduction && 'Secure'
    ].filter(Boolean).join('; ')

    response.headers.set('Set-Cookie', cookieOptions)
    return response
  }
}

// Also support GET for convenience
export async function GET(req: NextRequest) {
  return POST(req)
}
