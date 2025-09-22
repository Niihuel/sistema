import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = Math.random().toString(36).substring(7)

  // Log for debugging
  if (process.env.NODE_ENV !== 'production' || pathname === '/') {
    console.log(`[Middleware ${requestId}] Path: ${pathname}`)
  }

  // Skip middleware for API routes and static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next()
  }

  // Verificar si hay token de autenticación
  const token = request.cookies.get('auth_token')?.value

  // Normalize pathname - remove trailing slash for comparison
  const normalizedPath = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname

  // Handle root path with safe redirect
  if (pathname === '/') {
    // Prevent redirect loops by checking referrer
    const referrer = request.headers.get('referer')
    const fromDashboard = referrer?.includes('/dashboard')
    const fromLogin = referrer?.includes('/login')

    if (token && !fromDashboard) {
      console.log(`[Middleware ${requestId}] Root -> Dashboard (authenticated)`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else if (!token && !fromLogin) {
      console.log(`[Middleware ${requestId}] Root -> Login (not authenticated)`)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If we're coming from dashboard or login, don't redirect again
    return NextResponse.next()
  }

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/auth-error', '/unauthorized']
  const isPublicRoute = publicRoutes.some(route => normalizedPath === route || normalizedPath.startsWith(route + '/'))

  // Rutas que requieren autenticación
  const protectedRoutes = [
    '/dashboard', '/admin', '/areas', '/backups', '/compiler', '/consumables',
    '/employees', '/equipment', '/inventory', '/printers', '/purchase-requests',
    '/purchases', '/replacements', '/roles', '/tickets', '/users'
  ]
  const isProtectedRoute = protectedRoutes.some(route => normalizedPath === route || normalizedPath.startsWith(route + '/'))

  // Si es una ruta protegida y no hay token, redirigir a login
  if (isProtectedRoute && !token) {
    console.log(`[Middleware ${requestId}] Protected route without token: ${pathname}`)
    // Guardar la URL de destino para redirigir después del login
    const url = new URL('/login', request.url)
    if (pathname !== '/dashboard') {
      url.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(url)
  }

  // Si está autenticado y trata de acceder a login, redirigir a dashboard
  if (token && (normalizedPath === '/login' || pathname === '/login')) {
    console.log(`[Middleware ${requestId}] Login with token -> Dashboard`)
    // Check if there's a redirect param
    const redirectTo = request.nextUrl.searchParams.get('redirect')
    if (redirectTo && redirectTo.startsWith('/') && !redirectTo.includes('login')) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add request ID to headers for tracking
  const response = NextResponse.next()
  response.headers.set('X-Request-ID', requestId)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}