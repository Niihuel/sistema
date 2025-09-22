'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SystemStatus {
  database: boolean;
  server: boolean;
  timestamp: string;
}

export default function HomePage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking system status:', error);
      setStatus({
        database: false,
        server: true,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Iniciando Sistema Interno IT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Sistema Interno IT
          </h1>
          <p className="text-gray-300 text-lg">
            Gestión de inventarios, equipos y personal de IT
          </p>
        </div>

        {/* System Status */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6" style={{ WebkitBackdropFilter: 'blur(4px)' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-3 animate-pulse"></span>
              Estado del Sistema
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Servidor Web</span>
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${status?.server ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={status?.server ? 'text-green-400' : 'text-red-400'}>
                    {status?.server ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Base de Datos</span>
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${status?.database ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <span className={status?.database ? 'text-green-400' : 'text-yellow-400'}>
                    {status?.database ? 'Conectada' : 'No disponible'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">IP del Servidor</span>
                <span className="text-blue-400 font-mono">192.168.0.219:4250</span>
              </div>
              
              {status?.timestamp && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Última actualización</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(status.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleLogin}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Iniciar Sesión
          </button>
          
          <button
            onClick={handleDashboard}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center"
            disabled={!status?.database}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
            {!status?.database && (
              <span className="ml-2 text-xs bg-yellow-600 px-2 py-1 rounded">
                BD requerida
              </span>
            )}
          </button>
        </div>

        {/* Database Warning */}
        {!status?.database && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-yellow-500 font-semibold mb-1">Base de Datos No Disponible</h3>
                  <p className="text-yellow-200 text-sm">
                    El servidor SQL Server en <code className="bg-yellow-800/30 px-1 rounded">192.168.0.219:1433</code> no está disponible. 
                    Algunas funcionalidades pueden estar limitadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}