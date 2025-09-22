// Network Configuration for Dynamic IP Management
// This config handles both local development (Starlink DHCP) and production (Fixed IP)

export interface NetworkConfig {
  baseURL: string
  apiURL: string
  isDevelopment: boolean
  isLocal: boolean
}

// Detect current environment and network
const getNetworkConfig = (): NetworkConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.startsWith('192.168.') ||
     window.location.hostname.startsWith('10.') ||
     window.location.hostname.startsWith('172.'))

  // For development, use production IP for consistency
  if (isDevelopment) {
    const currentHost = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:4250`
      : 'http://192.168.0.219:4250'
    
    return {
      baseURL: currentHost,
      apiURL: `${currentHost}/api`,
      isDevelopment: true,
      isLocal
    }
  }

  // Production configuration
  // Using company's fixed IP: 192.168.0.219
  const productionHost = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.219:4250'
  
  return {
    baseURL: productionHost,
    apiURL: `${productionHost}/api`,
    isDevelopment: false,
    isLocal: false
  }
}

// Auto-detect local network IP for mobile development
export const getLocalNetworkIP = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null
  
  try {
    // This is a simple way to get local network IP in browser
    // For more robust detection, you might need a server endpoint
    const hostname = window.location.hostname
    
    // If already on local network IP, return it
    if (hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.')) {
      return hostname
    }
    
    return null
  } catch (error) {
    console.warn('Could not detect local network IP:', error)
    return null
  }
}

export const config = getNetworkConfig()

// Helper to get the correct API endpoint for mobile apps
export const getAPIEndpoint = (path: string = '') => {
  return `${config.apiURL}${path}`
}

// Environment variables for different deployment scenarios
export const ENV_CONFIG = {
  // Development con IP fija
  LOCAL_DEV: {
    WEB_URL: 'http://192.168.0.219:4250',
    API_URL: 'http://192.168.0.219:4250/api',
    MOBILE_DEV_URL: 'http://192.168.0.219:4250',
  },
  
  // Production with fixed IP
  PRODUCTION: {
    WEB_URL: 'http://192.168.0.219:4250',
    API_URL: 'http://192.168.0.219:4250/api',
    FIXED_IP: '192.168.0.219',
  }
}

export default config