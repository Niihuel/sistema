'use client';

import { useState } from 'react';
import { Play, Square, RotateCcw, Download } from 'lucide-react';
import { useBuildSystem } from '@/lib/hooks/use-build-system';
import { createBuildConfig } from '@/lib/build/presets';
import { PresetSelector } from './preset-selector';
import { BuildProgress } from './build-progress';
import { BuildConsole } from './build-console';
import Button from '@/components/button';
import type { BuildPreset } from '@/types/build';

export default function BuildSystem() {
  const [selectedPreset, setSelectedPreset] = useState<BuildPreset | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const {
    isBuilding,
    currentStep,
    progress,
    status,
    result,
    startBuild,
    cancelBuild,
    resetBuild
  } = useBuildSystem();

  const handleStartBuild = async () => {
    if (!selectedPreset) return;

    try {
      setLogs([`Iniciando build: ${selectedPreset.name}`]);
      
      const config = createBuildConfig(selectedPreset.id);
      
      // Agregar logs para cada paso
      const stepsWithLogging = config.steps.map(step => ({
        ...step,
        execute: async () => {
          setLogs(prev => [...prev, `Ejecutando: ${step.name}`]);
          await step.execute();
          setLogs(prev => [...prev, `✓ Completado: ${step.name}`]);
        }
      }));

      await startBuild({
        ...config,
        steps: stepsWithLogging
      });

    } catch (error) {
      setLogs(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const handleReset = () => {
    resetBuild();
    setLogs([]);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'running': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'completed': return '✅ Build completado exitosamente';
      case 'error': return '❌ Build falló con errores';
      case 'running': return '⚙️ Build en progreso...';
      case 'cancelled': return '⏹️ Build cancelado';
      default: return 'Listo para iniciar build';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Sistema de Compilación
        </h1>
        <p className="text-gray-400">
          Genera builds optimizados para diferentes plataformas y entornos
        </p>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6" style={{ WebkitBackdropFilter: 'blur(4px)' }}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Tipo de Build
            </label>
            <PresetSelector
              selectedPreset={selectedPreset}
              onSelectPreset={setSelectedPreset}
              disabled={isBuilding}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                status === 'running' ? 'bg-blue-500 animate-pulse' :
                status === 'completed' ? 'bg-green-500' :
                status === 'error' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusMessage()}
              </span>
            </div>
            
            {result && result.success && (
              <Button className="text-xs px-3 py-1" small>
                <Download className="h-3 w-3 mr-1" />
                Descargar
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleStartBuild}
              disabled={!selectedPreset || isBuilding}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {isBuilding ? 'Compilando...' : 'Iniciar Build'}
            </Button>

            {isBuilding && (
              <Button
                onClick={cancelBuild}
                variant="ghost"
                className="flex-shrink-0"
              >
                <Square className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}

            {(result || status === 'cancelled') && !isBuilding && (
              <Button
                onClick={handleReset}
                variant="ghost"
                className="flex-shrink-0"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            )}
          </div>
        </div>
      </div>

      {(isBuilding || currentStep || result) && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6" style={{ WebkitBackdropFilter: 'blur(4px)' }}>
          <BuildProgress
            currentStep={currentStep}
            progress={progress}
            status={status}
            allSteps={selectedPreset ? createBuildConfig(selectedPreset.id).steps : []}
          />
        </div>
      )}

      {(logs.length > 0 || isBuilding) && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6" style={{ WebkitBackdropFilter: 'blur(4px)' }}>
          <BuildConsole
            currentStep={currentStep}
            isBuilding={isBuilding}
            logs={logs}
          />
        </div>
      )}

      {result && !result.success && result.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-400 text-sm">!</span>
            </div>
            <div>
              <h3 className="text-red-400 font-medium mb-1">
                Error en el Build
              </h3>
              <p className="text-red-300 text-sm">
                {result.error}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}