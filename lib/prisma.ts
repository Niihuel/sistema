import { PrismaClient } from "@prisma/client"

declare global {
  var prismaGlobal: PrismaClient | undefined
}

let prismaInstance: PrismaClient | null = null;
let connectionError: string | null = null;

// Función para obtener la instancia de Prisma de forma lazy
export async function getPrisma(): Promise<PrismaClient> {
  if (prismaInstance) {
    return prismaInstance;
  }

  if (connectionError) {
    throw new Error(`Database connection failed: ${connectionError}`);
  }

  try {
    prismaInstance = global.prismaGlobal ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Probar la conexión
    await prismaInstance.$connect();
    
    if (process.env.NODE_ENV !== "production") {
      global.prismaGlobal = prismaInstance;
    }

    console.log('✅ Database connection established successfully');
    return prismaInstance;
  } catch (error) {
    connectionError = error instanceof Error ? error.message : 'Unknown database error';
    console.error('❌ Database connection failed:', connectionError);
    throw error;
  }
}

// Función para verificar si la base de datos está disponible
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const prisma = await getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('Database not available:', error instanceof Error ? error.message : error);
    return false;
  }
}

// Función para usar Prisma con manejo de errores
export async function withDatabase<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  try {
    const prisma = await getPrisma();
    return await operation(prisma);
  } catch (error) {
    console.error('Database operation failed:', error);
    if (fallback) {
      console.log('Using fallback operation...');
      return await fallback();
    }
    throw error;
  }
}

// Mantener compatibilidad con código existente (pero deprecado)
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    console.warn('Direct prisma usage is deprecated. Use getPrisma() or withDatabase() instead.');
    if (prismaInstance) {
      return prismaInstance[prop as keyof PrismaClient];
    }
    throw new Error('Database not initialized. Use getPrisma() first.');
  }
});


