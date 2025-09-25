/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de seguridad para producción
  poweredByHeader: false,

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ]
  },

  // Configuración de compilación optimizada
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },

  // Configuración experimental para mejor rendimiento
  experimental: {
    optimizeCss: true
  }
}

module.exports = nextConfig