'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '24px',
          maxWidth: '512px',
          width: '100%'
        }}>
          {/* Error Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg
                style={{ width: '40px', height: '40px', color: '#f87171' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '0 0 12px 0'
          }}>
            Ha ocurrido un error
          </h1>

          <p style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '0 0 32px 0',
            lineHeight: '1.5'
          }}>
            Error: {error.message || "Cannot access 'fetchPrinters' before initialization"}
          </p>

          {/* Buttons Container */}
          <div style={{
            marginBottom: '32px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={reset}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minWidth: '160px',
                  marginRight: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                Intentar de nuevo
              </button>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  minWidth: '160px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Recargar página
              </button>
            </div>

            <div>
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  width: '100%',
                  maxWidth: '332px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                }}
              >
                Tablero de instrumentos de IT Portal
              </button>
            </div>
          </div>

          {/* Error Details */}
          {error.message && (
            <details style={{
              marginBottom: '24px',
              textAlign: 'left',
              cursor: 'pointer'
            }}>
              <summary style={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Ver detalles del error
              </summary>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                marginTop: '8px'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#f87171',
                  margin: '0',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {error.message}
                </p>
                {error.digest && (
                  <p style={{
                    fontSize: '11px',
                    color: 'rgba(248, 113, 113, 0.6)',
                    marginTop: '8px',
                    fontFamily: 'monospace'
                  }}>
                    ID: {error.digest}
                  </p>
                )}
              </div>
            </details>
          )}

          {/* Additional Info */}
          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.4)',
            margin: '0'
          }}>
            Si el problema persiste, contacta con el equipo de soporte
          </p>
        </div>
      </body>
    </html>
  )
}