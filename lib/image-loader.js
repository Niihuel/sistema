// Custom image loader for Capacitor iOS builds
export default function imageLoader({ src, width, quality }) {
  // For Capacitor, use relative paths
  if (src.startsWith('/')) {
    return src
  }
  return `/${src}`
}