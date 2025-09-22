import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const pathname = request.nextUrl?.pathname || '/';

    // Skip middleware for static assets and API routes
    const shouldSkip = (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico' ||
      pathname.startsWith('/public/') ||
      pathname.startsWith('/static/') ||
      pathname.startsWith('/images/') ||
      pathname.startsWith('/icons/') ||
      pathname.includes('__webpack') ||
      pathname.includes('hot-update') ||
      pathname.includes('.map') ||
      /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i.test(pathname)
    );

    if (shouldSkip) {
      return NextResponse.next();
    }

    // Get token (simplified verification for Edge Runtime)
    let token: string | undefined;
    let isValidToken = false;

    try {
      const authCookie = request.cookies?.get('auth_token');
      token = authCookie?.value;

      // Basic token format validation (Edge Runtime compatible)
      if (token && typeof token === 'string' && token.length > 0) {
        // Simple JWT format check (3 parts separated by dots)
        const parts = token.split('.');
        isValidToken = parts.length === 3 && parts.every(part => part.length > 0);
      }
    } catch (tokenError) {
      token = undefined;
      isValidToken = false;
    }

    const normalizedPath = pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;

    // Handle root path redirects
    if (pathname === '/') {
      try {
        const referrer = request.headers?.get('referer') || '';
        const fromDashboard = referrer.includes('/dashboard');
        const fromLogin = referrer.includes('/login');

        if (isValidToken && !fromDashboard) {
          const dashboardUrl = new URL('/dashboard', request.url);
          return NextResponse.redirect(dashboardUrl);
        } else if (!isValidToken && !fromLogin) {
          const loginUrl = new URL('/login', request.url);
          return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();
      } catch (redirectError) {
        return NextResponse.next();
      }
    }

    // Define public routes (accessible without authentication)
    const publicRoutes = ['/login', '/auth-error', '/unauthorized'];
    const isPublicRoute = publicRoutes.some(route => {
      try {
        return normalizedPath === route || normalizedPath.startsWith(route + '/');
      } catch (error) {
        return false;
      }
    });

    // Define protected routes (require authentication and permissions)
    const protectedRoutes = [
      '/dashboard', '/admin', '/areas', '/backups', '/compiler', '/consumables',
      '/employees', '/equipment', '/inventory', '/printers', '/purchase-requests',
      '/purchases', '/replacements', '/roles', '/tickets', '/users'
    ];

    const isProtectedRoute = protectedRoutes.some(route => {
      try {
        return normalizedPath === route || normalizedPath.startsWith(route + '/');
      } catch (error) {
        return false;
      }
    });

    // Redirect to login if accessing protected route without valid token
    if (isProtectedRoute && !isValidToken) {
      try {
        const loginUrl = new URL('/login', request.url);
        if (pathname !== '/dashboard') {
          loginUrl.searchParams.set('redirect', pathname);
        }
        return NextResponse.redirect(loginUrl);
      } catch (urlError) {
        return NextResponse.redirect('/login');
      }
    }

    // Redirect authenticated users away from login page
    if (isValidToken && (normalizedPath === '/login' || pathname === '/login')) {
      try {
        const redirectTo = request.nextUrl?.searchParams?.get('redirect');

        if (redirectTo &&
            redirectTo.startsWith('/') &&
            !redirectTo.includes('login') &&
            !redirectTo.includes('logout')) {
          const redirectUrl = new URL(redirectTo, request.url);
          return NextResponse.redirect(redirectUrl);
        }

        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);

      } catch (redirectError) {
        return NextResponse.redirect('/dashboard');
      }
    }

    // Set security headers and request metadata
    const response = NextResponse.next();

    try {
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`);
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Add CSP for production security
      if (process.env.NODE_ENV === 'production') {
        response.headers.set(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
        );
      }
    } catch (headerError) {
      // Continue without additional headers if there's an error
    }

    return response;

  } catch (error) {
    // Fail safely with minimal response
    const safeResponse = NextResponse.next();

    try {
      safeResponse.headers.set('X-Middleware-Error', 'true');
      safeResponse.headers.set('X-Request-ID', requestId);
    } catch (headerError) {
      // Ignore header errors in error handling
    }

    return safeResponse;
  }
}

export const config = {
  matcher: [
    '/((?!api/.*|_next/static|_next/image|favicon.ico|robots.txt|public/.*|.*\\.[a-zA-Z0-9]+$|__webpack.*|.*hot-update.*).*)',
  ],
};