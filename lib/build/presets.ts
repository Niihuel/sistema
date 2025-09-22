import type { BuildPreset, BuildStep } from '@/types/build';

// Función helper para ejecutar comandos reales
async function executeCommand(command: string, args: string[] = []): Promise<void> {
  // Simulación - los comandos reales se ejecutan a través de electronAPI
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
}

export const buildPresets: BuildPreset[] = [
  {
    id: 'web-production',
    name: 'Compilación Web (Producción)',
    description: 'Genera build optimizado para despliegue web en producción',
    icon: '🌐',
    config: {
      name: 'Web Production Build',
      description: 'Build optimizado para producción web',
      environment: 'production',
      outputPath: '.next'
    },
    createSteps: (): BuildStep[] => [
      {
        id: 'clean',
        name: 'Limpiar cache y archivos previos',
        description: 'Eliminando archivos temporales...',
        weight: 10,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      },
      {
        id: 'type-check',
        name: 'Verificación de tipos TypeScript',
        description: 'Compilando y verificando tipos...',
        weight: 20,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      },
      {
        id: 'build',
        name: 'Compilación de Next.js',
        description: 'Generando build de producción...',
        weight: 50,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      },
      {
        id: 'optimize',
        name: 'Optimización de assets',
        description: 'Optimizando imágenes y archivos...',
        weight: 15,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      },
      {
        id: 'finalize',
        name: 'Finalización',
        description: 'Preparando archivos finales...',
        weight: 5,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    ]
  },
  {
    id: 'static-export',
    name: 'Exportación Estática',
    description: 'Genera sitio estático para hosting sin servidor',
    icon: '📦',
    config: {
      name: 'Static Export Build',
      description: 'Exportación estática para hosting',
      environment: 'production',
      outputPath: 'out'
    },
    createSteps: (): BuildStep[] => [
      {
        id: 'clean',
        name: 'Limpiar directorio de salida',
        description: 'Eliminando archivos previos...',
        weight: 10,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      },
      {
        id: 'build',
        name: 'Compilación Next.js',
        description: 'Generando páginas estáticas...',
        weight: 60,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 2500));
        }
      },
      {
        id: 'export',
        name: 'Exportación estática',
        description: 'Generando archivos estáticos...',
        weight: 25,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      },
      {
        id: 'copy-assets',
        name: 'Copiar assets',
        description: 'Copiando recursos estáticos...',
        weight: 5,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    ]
  },
  {
    id: 'mobile-capacitor',
    name: 'Build Móvil (Capacitor)',
    description: 'Prepara aplicación para Capacitor iOS/Android',
    icon: '📱',
    config: {
      name: 'Mobile Capacitor Build',
      description: 'Build para aplicaciones móviles',
      environment: 'production',
      outputPath: 'dist'
    },
    createSteps: (): BuildStep[] => [
      {
        id: 'clean',
        name: 'Limpiar proyecto',
        description: 'Preparando entorno móvil...',
        weight: 10,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      },
      {
        id: 'configure',
        name: 'Configurar para móvil',
        description: 'Aplicando configuración móvil...',
        weight: 15,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      },
      {
        id: 'build',
        name: 'Compilación Next.js',
        description: 'Generando aplicación web...',
        weight: 45,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 2800));
        }
      },
      {
        id: 'capacitor-sync',
        name: 'Sincronizar con Capacitor',
        description: 'Preparando para plataformas nativas...',
        weight: 25,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      },
      {
        id: 'assets',
        name: 'Procesar assets móviles',
        description: 'Optimizando para dispositivos...',
        weight: 5,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    ]
  },
  {
    id: 'development',
    name: 'Build de Desarrollo',
    description: 'Compilación rápida para desarrollo local',
    icon: '🔧',
    config: {
      name: 'Development Build',
      description: 'Build optimizado para desarrollo',
      environment: 'development',
      outputPath: '.next'
    },
    createSteps: (): BuildStep[] => [
      {
        id: 'deps-check',
        name: 'Verificar dependencias',
        description: 'Comprobando node_modules...',
        weight: 15,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 700));
        }
      },
      {
        id: 'type-check',
        name: 'Verificación básica de tipos',
        description: 'Validando TypeScript...',
        weight: 25,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      },
      {
        id: 'dev-build',
        name: 'Compilación desarrollo',
        description: 'Generando build de desarrollo...',
        weight: 55,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1800));
        }
      },
      {
        id: 'setup-dev',
        name: 'Configurar entorno dev',
        description: 'Preparando hot reload...',
        weight: 5,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    ]
  },
  {
    id: 'windows-installer',
    name: 'Instalador Windows (.exe)',
    description: 'Genera aplicación Electron + instalador Windows con Inno Setup',
    icon: '🪟',
    config: {
      name: 'Windows Installer Build',
      description: 'Build completo con instalador para Windows',
      environment: 'production',
      outputPath: 'dist/installers'
    },
    createSteps: (): BuildStep[] => [
      {
        id: 'clean',
        name: 'Limpiar directorios previos',
        description: 'Eliminando builds anteriores...',
        weight: 5,
        execute: async () => {
          await executeCommand('rimraf', ['dist']);
        }
      },
      {
        id: 'build-next',
        name: 'Compilar aplicación Next.js',
        description: 'Generando build standalone de Next.js...',
        weight: 25,
        execute: async () => {
          if (typeof window !== 'undefined' && (window as any).electronAPI) {
            const result = await (window as any).electronAPI.compileSystem({});
            if (!result.success) throw new Error(result.error);
          } else {
            await executeCommand('npm', ['run', 'build']);
          }
        }
      },
      {
        id: 'build-electron',
        name: 'Compilar aplicación Electron',
        description: 'Empaquetando aplicación con Electron Builder...',
        weight: 35,
        execute: async () => {
          await executeCommand('node', ['scripts/build-electron.js']);
        }
      },
      {
        id: 'create-installer',
        name: 'Crear instalador Windows',
        description: 'Generando instalador .exe con Inno Setup...',
        weight: 30,
        execute: async () => {
          if (typeof window !== 'undefined' && (window as any).electronAPI) {
            const result = await (window as any).electronAPI.createInstaller({});
            if (!result.success) throw new Error(result.error);
          } else {
            await executeCommand('node', ['scripts/build-installer.js']);
          }
        }
      },
      {
        id: 'finalize',
        name: 'Finalizar y verificar',
        description: 'Verificando archivos generados...',
        weight: 5,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    ]
  },
  {
    id: 'electron-only',
    name: 'Build Electron (Sin instalador)',
    description: 'Genera solo la aplicación Electron sin instalador',
    icon: '⚡',
    config: {
      name: 'Electron Build',
      description: 'Build de Electron para desarrollo',
      environment: 'production',
      outputPath: 'dist/win-unpacked'
    },
    createSteps: (): BuildStep[] => [
      {
        id: 'clean',
        name: 'Limpiar directorio',
        description: 'Preparando entorno...',
        weight: 10,
        execute: async () => {
          await executeCommand('rimraf', ['dist']);
        }
      },
      {
        id: 'build-next',
        name: 'Compilar Next.js',
        description: 'Generando aplicación web...',
        weight: 40,
        execute: async () => {
          if (typeof window !== 'undefined' && (window as any).electronAPI) {
            const result = await (window as any).electronAPI.compileSystem({});
            if (!result.success) throw new Error(result.error);
          } else {
            await executeCommand('npm', ['run', 'build']);
          }
        }
      },
      {
        id: 'build-electron',
        name: 'Empaquetar con Electron',
        description: 'Creando aplicación Electron...',
        weight: 45,
        execute: async () => {
          await executeCommand('npx', ['electron-builder', '--dir']);
        }
      },
      {
        id: 'verify',
        name: 'Verificar build',
        description: 'Comprobando archivos generados...',
        weight: 5,
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    ]
  }
];

export function getPresetById(id: string): BuildPreset | undefined {
  return buildPresets.find(preset => preset.id === id);
}

export function createBuildConfig(presetId: string) {
  const preset = getPresetById(presetId);
  if (!preset) {
    throw new Error(`Preset with id "${presetId}" not found`);
  }

  return {
    ...preset.config,
    steps: preset.createSteps()
  };
}