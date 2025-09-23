/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  images: {
    domains: ['localhost', '192.168.143.163'],
    unoptimized: process.env.NODE_ENV !== 'production',
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    CUSTOM_KEY: 'sistema-it',
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production'
      ? 'http://192.168.143.163:4250'
      : 'http://192.168.143.163:4250'
  },

  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        stream: false,
        buffer: false,
      }
    }

    // Optimizaciones para producción (configuración mejorada)
    if (!dev) {
      config.optimization.minimize = true

      // Configuración de splitChunks mejorada para evitar errores de 'call'
      config.optimization.splitChunks = {
        chunks: 'async',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      }
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      'encoding': false,
    }

    return config
  },

  async headers() {
    return [
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? 'http://192.168.143.163:4250'
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ]
  },

  experimental: {
    optimizeCss: false,
  },

  distDir: '.build',  // Usar directorio que funciona
  cleanDistDir: true,
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',

  async rewrites() {
    return [];
  },
}

module.exports = nextConfig