import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

let prismaInstance: PrismaClient | null = null;
let connectionError: string | null = null;
let isConnecting = false;

const prismaConfig = {
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn']
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
} as const;

export async function getPrisma(): Promise<PrismaClient> {
  if (prismaInstance) {
    try {
      await prismaInstance.$queryRaw`SELECT 1 as test`;
      return prismaInstance;
    } catch (error) {
      prismaInstance = null;
      connectionError = null;
    }
  }

  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (prismaInstance) return prismaInstance;
  }

  if (connectionError) {
    throw new Error(`Database connection failed: ${connectionError}`);
  }

  try {
    isConnecting = true;

    prismaInstance = global.prismaGlobal ?? new PrismaClient(prismaConfig);

    prismaInstance.$on('error', (e) => {
      console.error('Database error:', e);
    });

    const connectionTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );

    await Promise.race([
      prismaInstance.$connect(),
      connectionTimeout
    ]);

    await prismaInstance.$queryRaw`SELECT 1 as test`;
    
    if (process.env.NODE_ENV !== "production") {
      global.prismaGlobal = prismaInstance;
    }

    isConnecting = false;
    return prismaInstance;

  } catch (error) {
    isConnecting = false;
    connectionError = error instanceof Error ? error.message : 'Unknown database error';
    
    if (prismaInstance) {
      try {
        await prismaInstance.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
      prismaInstance = null;
    }
    
    throw new Error(`Database connection failed: ${connectionError}`);
  }
}

export async function isDatabaseAvailable(): Promise<boolean> {
  let testClient: PrismaClient | null = null;
  
  try {
    testClient = new PrismaClient({
      log: [],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    const testTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database test timeout')), 8000)
    );

    await Promise.race([
      testClient.$connect(),
      testTimeout
    ]);

    await Promise.race([
      testClient.$queryRaw`SELECT 1 as test`,
      testTimeout
    ]);

    return true;

  } catch (error) {
    return false;
  } finally {
    if (testClient) {
      try {
        await testClient.$disconnect();
      } catch (disconnectError) {
        // Ignore
      }
    }
  }
}

export async function withDatabase<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  fallback?: () => Promise<T>,
  options?: {
    retries?: number;
    retryDelay?: number;
    timeoutMs?: number;
  }
): Promise<T> {
  const {
    retries = 2,
    retryDelay = 1000,
    timeoutMs = 30000
  } = options || {};

  if (!operation || typeof operation !== 'function') {
    throw new Error('Operation must be a function');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const prisma = await getPrisma();
      
      const operationTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
      );

      const result = await Promise.race([
        operation(prisma),
        operationTimeout
      ]);

      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt > retries) {
        break;
      }

      if (prismaInstance) {
        try {
          await prismaInstance.$disconnect();
        } catch (disconnectError) {
          // Ignore
        }
        prismaInstance = null;
        connectionError = null;
      }

      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  if (fallback) {
    try {
      return await fallback();
    } catch (fallbackError) {
      throw lastError || new Error('Database operation and fallback both failed');
    }
  }

  throw lastError || new Error('Database operation failed');
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
    } catch (error) {
      // Ignore
    } finally {
      prismaInstance = null;
      connectionError = null;
      
      if (process.env.NODE_ENV !== "production") {
        global.prismaGlobal = undefined;
      }
    }
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined;
    }
    
    if (!prismaInstance) {
      throw new Error(
        'Database not initialized. Use getPrisma() or withDatabase() instead.'
      );
    }
    
    const value = (prismaInstance as any)[prop];
    
    if (typeof value === 'function') {
      return function(this: any, ...args: any[]) {
        try {
          return value.apply(prismaInstance, args);
        } catch (error) {
          throw error;
        }
      };
    }
    
    return value;
  }
});

if (typeof process !== 'undefined') {
  process.on('SIGTERM', disconnectPrisma);
  process.on('SIGINT', disconnectPrisma);
  process.on('beforeExit', disconnectPrisma);
}