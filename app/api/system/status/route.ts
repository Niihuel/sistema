import { NextRequest } from "next/server";
import { isDatabaseAvailable } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Verificar estado de la base de datos sin bloquear la respuesta
    const databaseStatus = await Promise.race([
      isDatabaseAvailable(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)) // Timeout de 3 segundos
    ]);

    const status = {
      server: true, // Si llegamos aquí, el servidor está funcionando
      database: databaseStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '0.1.0',
      network: {
        host: process.env.HOSTNAME || 'localhost',
        port: process.env.PORT || '4250',
        ip: '192.168.143.163'
      }
    };

    return Response.json(status, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in system status check:', error);
    
    return Response.json({
      server: true,
      database: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '0.1.0',
      network: {
        host: process.env.HOSTNAME || 'localhost',
        port: process.env.PORT || '4250',
        ip: '192.168.143.163'
      }
    }, { 
      status: 200, // Devolvemos 200 porque el servidor funciona, solo la BD puede fallar
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.action === 'test-database') {
      const isAvailable = await isDatabaseAvailable();
      
      return Response.json({
        success: isAvailable,
        message: isAvailable 
          ? 'Conexión a base de datos exitosa' 
          : 'No se pudo conectar a la base de datos',
        timestamp: new Date().toISOString()
      });
    }
    
    return Response.json({ 
      success: false, 
      error: 'Acción no reconocida' 
    }, { status: 400 });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
